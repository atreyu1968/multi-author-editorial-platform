import { scrypt, randomBytes } from "crypto";
import { promisify } from "util";
import { neon } from "@neondatabase/serverless";

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
  
  const sql = neon(databaseUrl);
  const username = process.env.ADMIN_USERNAME || "admin";
  const password = process.env.ADMIN_PASSWORD || "admin123";
  
  console.log("🔧 Creating admin user...");
  
  try {
    const passwordHash = await hashPassword(password);
    
    await sql`
      INSERT INTO users (id, username, password)
      VALUES (gen_random_uuid(), ${username}, ${passwordHash})
      ON CONFLICT (username) DO UPDATE SET password = ${passwordHash}
    `;
    
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
