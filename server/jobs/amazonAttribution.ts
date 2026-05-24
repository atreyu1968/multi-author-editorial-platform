// Background workers for the Amazon Attribution integration.
//
// Three independent jobs scheduled on a single 1-minute tick:
//   - syncReports          — daily at 03:00 server time.
//   - updateConversionFlags — daily at 04:00 server time, flips
//                            `attributionLinks.purchaseDetected` for tags
//                            that have at least one purchase reported.
//   - cleanExpiredLinks    — weekly (Sunday) at 05:00 server time.
//
// "Server time" here means whatever timezone the Node.js process is
// running in — on the self-hosted Ubuntu deployment this is Europe/Madrid,
// which matches the editorial's working hours. We keep a per-job
// "last successful day" marker in-memory so the tick doesn't re-run a
// job multiple times per day after a restart.

import { storage } from "../storage";
import { amazonAttributionService, AmazonAttributionDisabledError } from "../services/amazonAttribution";

let tickStarted = false;

interface JobMarker {
  lastRunDay: string; // YYYY-MM-DD
}

const markers = {
  syncReports: { lastRunDay: "" } as JobMarker,
  conversionFlags: { lastRunDay: "" } as JobMarker,
  cleanup: { lastRunDay: "" } as JobMarker,
};

function todayKey(): string {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}

// Pulls the last `daysBack` days of reports from Amazon and upserts each
// (tagId, date) row. Idempotent — re-running for the same day refreshes
// the metrics with whatever Amazon now considers final.
export async function syncReports(daysBack = 30): Promise<{ rowsUpserted: number } | null> {
  if (!(await amazonAttributionService.isEnabled())) return null;

  const end = new Date();
  const start = new Date(end.getTime() - daysBack * 24 * 60 * 60 * 1000);
  const fmt = (d: Date) => d.toISOString().slice(0, 10);

  try {
    const rows = await amazonAttributionService.getReports(fmt(start), fmt(end));
    let rowsUpserted = 0;
    for (const r of rows) {
      await storage.upsertAttributionReport({
        attributionTagId: r.tagId,
        reportDate: r.date,
        clicks: r.clicks,
        detailPageViews: r.detailPageViews,
        addToCart: r.addToCart,
        purchases: r.purchases,
        salesAmount: r.salesAmount,
      });
      rowsUpserted++;
    }
    await storage.updateAmazonAttributionSettings({
      lastSyncAt: new Date().toISOString(),
      lastSyncStatus: "ok",
    });
    return { rowsUpserted };
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    if (!(err instanceof AmazonAttributionDisabledError)) {
      console.error("Amazon Attribution syncReports error:", msg);
      await storage.updateAmazonAttributionSettings({
        lastSyncAt: new Date().toISOString(),
        lastSyncStatus: `error: ${msg}`,
      }).catch(() => {});
    }
    return null;
  }
}

// Flips `purchaseDetected = true` on every link whose tag has at least
// one purchase recorded in the reports table. Run after `syncReports` so
// the reports table is up-to-date.
export async function updateConversionFlags(): Promise<{ flagged: number } | null> {
  if (!(await amazonAttributionService.isEnabled())) return null;
  try {
    // Pull tags with purchases > 0 over the last 90 days (matches link TTL).
    const end = new Date();
    const start = new Date(end.getTime() - 90 * 24 * 60 * 60 * 1000);
    const fmt = (d: Date) => d.toISOString().slice(0, 10);
    const reports = await storage.getAttributionReportsRange(fmt(start), fmt(end));
    const purchasingTags = Array.from(new Set(reports.filter((r) => (r.purchases ?? 0) > 0).map((r) => r.attributionTagId)));
    const flagged = await storage.markAttributionLinksPurchased(purchasingTags);
    return { flagged };
  } catch (err) {
    console.error("Amazon Attribution updateConversionFlags error:", err);
    return null;
  }
}

// Drops attribution links older than 90 days. Reports are kept (they're
// the source of truth for the dashboard's historical view).
export async function cleanExpiredLinks(): Promise<{ deleted: number }> {
  const cutoff = new Date(Date.now() - 90 * 24 * 60 * 60 * 1000).toISOString();
  const deleted = await storage.deleteExpiredAttributionLinks(cutoff);
  return { deleted };
}

export function startAmazonAttributionTick(): void {
  if (tickStarted) return;
  tickStarted = true;

  const TICK_MS = 60_000;

  const tick = async () => {
    const now = new Date();
    const hh = now.getHours();
    const dow = now.getDay(); // 0 = Sunday
    const day = todayKey();

    try {
      if (hh === 3 && markers.syncReports.lastRunDay !== day) {
        markers.syncReports.lastRunDay = day;
        const res = await syncReports();
        if (res) console.log(`[amazonAttribution] syncReports upserted ${res.rowsUpserted} rows`);
      }

      if (hh === 4 && markers.conversionFlags.lastRunDay !== day) {
        markers.conversionFlags.lastRunDay = day;
        const res = await updateConversionFlags();
        if (res) console.log(`[amazonAttribution] updateConversionFlags flagged ${res.flagged} links`);
      }

      if (dow === 0 && hh === 5 && markers.cleanup.lastRunDay !== day) {
        markers.cleanup.lastRunDay = day;
        const res = await cleanExpiredLinks();
        console.log(`[amazonAttribution] cleanExpiredLinks removed ${res.deleted} rows`);
      }
    } catch (err) {
      console.error("[amazonAttribution] tick error:", err);
    }
  };

  setInterval(tick, TICK_MS);
}
