import { scrypt, randomBytes } from "crypto";
import { promisify } from "util";

const scryptAsync = promisify(scrypt);

async function hashPassword(password: string) {
  const salt = randomBytes(16).toString("hex");
  const buf = (await scryptAsync(password, salt, 64)) as Buffer;
  return `${buf.toString("hex")}.${salt}`;
}

async function createAdmin() {
  const databaseUrl = process.env.DATABASE_URL;
  
  if (!databaseUrl) {
    console.error("❌ DATABASE_URL not set");
    process.exit(1);
  }
  
  const username = process.env.ADMIN_USERNAME || "admin";
  const password = process.env.ADMIN_PASSWORD || "admin123";
  
  console.log("🔧 Creating admin user...");
  
  try {
    const passwordHash = await hashPassword(password);
    
    const isNeonDatabase = databaseUrl.includes('neon.tech') || 
                           databaseUrl.includes('neon.fl0.io') ||
                           databaseUrl.includes('ep-');
    
    if (isNeonDatabase) {
      const { neon } = await import("@neondatabase/serverless");
      const sql = neon(databaseUrl);
      await sql`
        INSERT INTO users (id, username, password)
        VALUES (gen_random_uuid(), ${username}, ${passwordHash})
        ON CONFLICT (username) DO UPDATE SET password = ${passwordHash}
      `;
    } else {
      const { default: pg } = await import("pg");
      const Pool = pg.Pool || (pg as any);
      const pool = new Pool({ connectionString: databaseUrl });
      await pool.query(
        `INSERT INTO users (id, username, password)
         VALUES (gen_random_uuid(), $1, $2)
         ON CONFLICT (username) DO UPDATE SET password = $2`,
        [username, passwordHash]
      );
      await pool.end();
    }
    
    console.log("=".repeat(50));
    console.log("✅ ADMIN USER CREATED/UPDATED");
    console.log("=".repeat(50));
    console.log(`Username: ${username}`);
    console.log(`Password: ${password}`);
    console.log("");
    console.log("⚠️  Change this password after first login!");
    console.log("=".repeat(50));
    
  } catch (err: any) {
    console.error("❌ Error creating admin:", err.message);
    process.exit(1);
  }
}

createAdmin();
