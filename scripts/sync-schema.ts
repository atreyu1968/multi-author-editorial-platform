/**
 * sync-schema.ts — additive, idempotent schema synchroniser.
 *
 * Why this exists
 * ───────────────
 * `drizzle-kit push` is interactive: when it sees a column it doesn't
 * recognise it asks "is this new or renamed from <Y>?" and waits on stdin.
 * Piping `yes ""` selects whatever the cursor lands on, which on real
 * Ubuntu installs has occasionally turned brand-new columns (e.g. the
 * scheduling fields on `broadcasts`) into renames of unrelated columns —
 * so the migration silently "succeeds" while the new columns never get
 * created. Production then 500s the moment the cron tick or an admin
 * preview touches them.
 *
 * This script does the boring, safe thing instead:
 *
 *   1. Imports every `pgTable` declared in `shared/schema.ts`.
 *   2. Asks the live database what it already has via `information_schema`.
 *   3. Emits ONLY additive DDL:
 *        • `CREATE TABLE` for tables that don't exist yet.
 *        • `ALTER TABLE ... ADD COLUMN IF NOT EXISTS` for missing columns.
 *        • `ALTER TABLE ... ADD CONSTRAINT` for missing UNIQUE constraints.
 *        • `CREATE INDEX IF NOT EXISTS` for missing indexes.
 *
 * It NEVER drops, renames or alters existing columns — destructive changes
 * remain a manual job for the operator. That makes it safe to run on every
 * deploy without any prompts or surprises.
 */
import pg from "pg";
import { is, SQL } from "drizzle-orm";
import { getTableConfig, PgTable } from "drizzle-orm/pg-core";
import * as schema from "../shared/schema.js";

const DATABASE_URL = process.env.DATABASE_URL;
if (!DATABASE_URL) {
  console.error("[sync-schema] DATABASE_URL is not set");
  process.exit(1);
}

const pool = new pg.Pool({ connectionString: DATABASE_URL });

/** Render a Drizzle default value (literal or SQL expression) as raw SQL. */
function renderDefault(def: unknown): string | null {
  if (def === undefined || def === null) return null;
  if (is(def as any, SQL)) {
    // Reach into the SQL object's internal chunks. In every Drizzle version we
    // currently support these are either plain strings or `Param`-like objects
    // with a `.value` field; either way joining their string forms produces the
    // raw SQL fragment the user wrote.
    const chunks = (def as any).queryChunks ?? (def as any).chunks ?? [];
    if (Array.isArray(chunks) && chunks.length > 0) {
      return chunks
        .map((c: any) => {
          if (typeof c === "string") return c;
          if (c?.value !== undefined) return String(c.value);
          return String(c ?? "");
        })
        .join("");
    }
    return String(def);
  }
  if (typeof def === "string") return `'${def.replace(/'/g, "''")}'`;
  if (typeof def === "boolean") return def ? "true" : "false";
  if (typeof def === "number") return String(def);
  if (Array.isArray(def)) {
    if (def.length === 0) return "ARRAY[]::text[]";
    const items = def.map((x) =>
      typeof x === "string" ? `'${x.replace(/'/g, "''")}'` : String(x),
    );
    return `ARRAY[${items.join(", ")}]`;
  }
  return null;
}

/** Build the column fragment used inside CREATE TABLE / ADD COLUMN. */
function columnDefinition(col: any, opts: { forAddColumn: boolean }): string {
  const sqlType = col.getSQLType();
  const parts: string[] = [`"${col.name}"`, sqlType];

  // Inline UNIQUE on a single column. Multi-column uniques are emitted
  // separately as table constraints.
  if (col.isUnique && !opts.forAddColumn) {
    parts.push("UNIQUE");
  }

  // PRIMARY KEY on a single column. (Composite PKs use a table constraint.)
  if (col.primary && !opts.forAddColumn) {
    parts.push("PRIMARY KEY");
  }

  const defaultSQL = renderDefault(col.default);
  if (defaultSQL !== null) parts.push(`DEFAULT ${defaultSQL}`);

  if (col.notNull) {
    // ADD COLUMN NOT NULL on an existing non-empty table fails unless a
    // DEFAULT is present. If we have no default, downgrade to nullable —
    // operator can tighten manually after backfilling.
    if (opts.forAddColumn && defaultSQL === null) {
      // intentionally not adding NOT NULL
    } else {
      parts.push("NOT NULL");
    }
  }

  return parts.join(" ");
}

async function tableExists(client: pg.PoolClient, name: string): Promise<boolean> {
  const r = await client.query(
    `SELECT 1 FROM information_schema.tables
     WHERE table_schema = 'public' AND table_name = $1
     LIMIT 1`,
    [name],
  );
  return r.rowCount! > 0;
}

async function existingColumns(
  client: pg.PoolClient,
  table: string,
): Promise<Set<string>> {
  const r = await client.query(
    `SELECT column_name FROM information_schema.columns
     WHERE table_schema = 'public' AND table_name = $1`,
    [table],
  );
  return new Set(r.rows.map((row: any) => row.column_name));
}

async function existingConstraints(
  client: pg.PoolClient,
  table: string,
): Promise<Set<string>> {
  const r = await client.query(
    `SELECT constraint_name FROM information_schema.table_constraints
     WHERE table_schema = 'public' AND table_name = $1`,
    [table],
  );
  return new Set(r.rows.map((row: any) => row.constraint_name));
}

async function existingIndexes(
  client: pg.PoolClient,
  table: string,
): Promise<Set<string>> {
  const r = await client.query(
    `SELECT indexname FROM pg_indexes
     WHERE schemaname = 'public' AND tablename = $1`,
    [table],
  );
  return new Set(r.rows.map((row: any) => row.indexname));
}

interface SyncStats {
  createdTables: string[];
  addedColumns: { table: string; column: string }[];
  addedConstraints: { table: string; name: string }[];
  addedIndexes: { table: string; name: string }[];
  errors: { context: string; message: string }[];
}

async function sync(): Promise<SyncStats> {
  const stats: SyncStats = {
    createdTables: [],
    addedColumns: [],
    addedConstraints: [],
    addedIndexes: [],
    errors: [],
  };
  const client = await pool.connect();
  try {
    const allTables = Object.values(schema).filter(
      (v): v is PgTable => v != null && typeof v === "object" && (v as any)[Symbol.for("drizzle:IsDrizzleTable")] === true,
    );

    for (const table of allTables) {
      const cfg = getTableConfig(table);
      const tname = cfg.name;
      const exists = await tableExists(client, tname);

      if (!exists) {
        // ── CREATE TABLE ─────────────────────────────────────────────
        const colDefs = cfg.columns.map((c: any) =>
          columnDefinition(c, { forAddColumn: false }),
        );

        // Composite primary keys → table-level constraint
        for (const pk of cfg.primaryKeys) {
          const cols = (pk as any).columns
            .map((c: any) => `"${c.name}"`)
            .join(", ");
          colDefs.push(`PRIMARY KEY (${cols})`);
        }

        // Multi-column unique constraints
        for (const uc of cfg.uniqueConstraints) {
          const ucName = (uc as any).name;
          const cols = (uc as any).columns
            .map((c: any) => `"${c.name}"`)
            .join(", ");
          const namePart = ucName ? `CONSTRAINT "${ucName}" ` : "";
          colDefs.push(`${namePart}UNIQUE (${cols})`);
        }

        const ddl = `CREATE TABLE IF NOT EXISTS "${tname}" (\n  ${colDefs.join(",\n  ")}\n)`;
        try {
          await client.query(ddl);
          stats.createdTables.push(tname);
          console.log(`[sync-schema] CREATE TABLE ${tname}`);
        } catch (e: any) {
          stats.errors.push({ context: `create ${tname}`, message: e.message });
          console.error(`[sync-schema] failed to create ${tname}: ${e.message}`);
          continue;
        }
      } else {
        // ── Add missing columns ──────────────────────────────────────
        const haveCols = await existingColumns(client, tname);
        for (const col of cfg.columns) {
          const cname = (col as any).name;
          if (haveCols.has(cname)) continue;
          const def = columnDefinition(col, { forAddColumn: true });
          const ddl = `ALTER TABLE "${tname}" ADD COLUMN IF NOT EXISTS ${def}`;
          try {
            await client.query(ddl);
            stats.addedColumns.push({ table: tname, column: cname });
            console.log(`[sync-schema] ${tname} + column ${cname}`);
          } catch (e: any) {
            stats.errors.push({
              context: `add column ${tname}.${cname}`,
              message: e.message,
            });
            console.error(
              `[sync-schema] failed to add ${tname}.${cname}: ${e.message}`,
            );
          }
        }

        // ── Add missing UNIQUE constraints ───────────────────────────
        const haveCons = await existingConstraints(client, tname);
        for (const uc of cfg.uniqueConstraints) {
          const ucName = (uc as any).name;
          if (!ucName || haveCons.has(ucName)) continue;
          const cols = (uc as any).columns
            .map((c: any) => `"${c.name}"`)
            .join(", ");
          const ddl = `ALTER TABLE "${tname}" ADD CONSTRAINT "${ucName}" UNIQUE (${cols})`;
          try {
            await client.query(ddl);
            stats.addedConstraints.push({ table: tname, name: ucName });
            console.log(`[sync-schema] ${tname} + constraint ${ucName}`);
          } catch (e: any) {
            // "already exists" can happen if the name was registered as a
            // unique INDEX rather than a CONSTRAINT (older drizzle-kit pushes
            // sometimes did that). The semantic invariant — uniqueness on
            // those columns — is already enforced, so this is a benign skip.
            if (/already exists/i.test(e.message)) continue;
            stats.errors.push({
              context: `add constraint ${tname}.${ucName}`,
              message: e.message,
            });
            console.error(
              `[sync-schema] failed to add constraint ${tname}.${ucName}: ${e.message}`,
            );
          }
        }
      }

      // ── Add missing indexes (whether the table is new or existing) ──
      const haveIdx = await existingIndexes(client, tname);
      for (const idx of cfg.indexes) {
        const idxBuilt: any = (idx as any).config ?? idx;
        const idxName: string = idxBuilt.name;
        if (!idxName || haveIdx.has(idxName)) continue;
        const cols = (idxBuilt.columns ?? [])
          .map((c: any) => `"${c.name ?? c}"`)
          .join(", ");
        if (!cols) continue;
        const unique = idxBuilt.unique ? "UNIQUE " : "";
        const ddl = `CREATE ${unique}INDEX IF NOT EXISTS "${idxName}" ON "${tname}" (${cols})`;
        try {
          await client.query(ddl);
          stats.addedIndexes.push({ table: tname, name: idxName });
          console.log(`[sync-schema] ${tname} + index ${idxName}`);
        } catch (e: any) {
          stats.errors.push({
            context: `create index ${idxName}`,
            message: e.message,
          });
          console.error(
            `[sync-schema] failed to create index ${idxName}: ${e.message}`,
          );
        }
      }
    }
  } finally {
    client.release();
  }
  return stats;
}

(async () => {
  console.log("[sync-schema] starting additive schema sync");
  const stats = await sync();
  await pool.end();

  console.log("");
  console.log("[sync-schema] summary:");
  console.log(`  tables created : ${stats.createdTables.length}`);
  console.log(`  columns added  : ${stats.addedColumns.length}`);
  console.log(`  uniques added  : ${stats.addedConstraints.length}`);
  console.log(`  indexes added  : ${stats.addedIndexes.length}`);
  console.log(`  errors         : ${stats.errors.length}`);
  if (stats.createdTables.length) {
    console.log("  → " + stats.createdTables.join(", "));
  }
  if (stats.addedColumns.length) {
    for (const c of stats.addedColumns) console.log(`  → ${c.table}.${c.column}`);
  }
  if (stats.errors.length) {
    console.log("");
    console.log("[sync-schema] non-fatal errors:");
    for (const e of stats.errors) console.log(`  [${e.context}] ${e.message}`);
  }
  // We deliberately exit 0 even on per-statement errors — the operator can
  // still see what was tried, and a partial sync is better than blocking
  // the whole deploy. Hard failures (no DB connection, schema import) throw
  // before reaching this point and exit non-zero naturally.
  process.exit(0);
})().catch((err) => {
  console.error("[sync-schema] fatal:", err);
  process.exit(1);
});
