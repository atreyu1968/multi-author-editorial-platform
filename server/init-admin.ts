import { scrypt, randomBytes } from "crypto";
import { promisify } from "util";
import { db } from "./db";
import { users } from "@shared/schema";
import { eq } from "drizzle-orm";

const scryptAsync = promisify(scrypt);

async function hashPassword(password: string) {
  const salt = randomBytes(16).toString("hex");
  const buf = (await scryptAsync(password, salt, 64)) as Buffer;
  return `${buf.toString("hex")}.${salt}`;
}

/**
 * Initialize default admin user if none exists
 * This runs automatically on server startup
 */
export async function initializeAdminUser() {
  try {
    // Check if any admin user exists
    const existingUsers = await db.select().from(users).limit(1);
    
    if (existingUsers.length > 0) {
      console.log("✓ Admin user already exists");
      return;
    }
    
    // Create default admin user
    const defaultUsername = process.env.ADMIN_USERNAME || "admin";
    const defaultPassword = process.env.ADMIN_PASSWORD || "admin123";
    
    const passwordHash = await hashPassword(defaultPassword);
    
    await db.insert(users).values({
      username: defaultUsername,
      password: passwordHash,
    });
    
    console.log("=".repeat(70));
    console.log("✅ DEFAULT ADMIN USER CREATED");
    console.log("=".repeat(70));
    console.log(`Username: ${defaultUsername}`);
    console.log(`Password: ${defaultPassword}`);
    console.log("");
    console.log("⚠️  IMPORTANT: Please change this password immediately!");
    console.log("   Go to /admin and update your credentials.");
    console.log("=".repeat(70));
    
  } catch (error) {
    console.error("❌ Error initializing admin user:", error);
    // Don't throw - let the app continue even if this fails
  }
}
