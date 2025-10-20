import { scrypt, randomBytes } from "crypto";
import { promisify } from "util";
import { db } from "./db";
import { users, authors } from "@shared/schema";

const scryptAsync = promisify(scrypt);

async function hashPassword(password: string) {
  const salt = randomBytes(16).toString("hex");
  const buf = (await scryptAsync(password, salt, 64)) as Buffer;
  return `${buf.toString("hex")}.${salt}`;
}

/**
 * Initialize default admin user and author if none exists
 * This runs automatically on server startup with timeout protection
 */
export async function initializeAdminUser() {
  // Timeout wrapper to prevent hanging
  const timeoutPromise = new Promise((_, reject) => 
    setTimeout(() => reject(new Error('Admin initialization timeout')), 30000)
  );
  
  const initPromise = (async () => {
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
    
    // Check if any author exists
    const existingAuthors = await db.select().from(authors).limit(1);
    
    if (existingAuthors.length === 0) {
      // Create default author
      await db.insert(authors).values({
        name: "Autor Ejemplo",
        slug: "autor-ejemplo",
        email: "autor@example.com",
        heroTitle: "Bienvenido a Mi Página de Autor",
        heroSubtitle: "Descubre mis obras y mi trayectoria literaria",
        bioParagraph1: "Este es un autor de ejemplo. Edita esta información desde el panel de administración.",
        bioParagraph2: "Puedes personalizar completamente esta biografía con tu propia historia y logros.",
        bioParagraph3: "No olvides actualizar todos los campos desde el panel de administración.",
        isActive: true,
      });
      
      console.log("=".repeat(70));
      console.log("✅ DEFAULT ADMIN USER AND AUTHOR CREATED");
      console.log("=".repeat(70));
      console.log(`Admin Username: ${defaultUsername}`);
      console.log(`Admin Password: ${defaultPassword}`);
      console.log("");
      console.log(`Default Author: Autor Ejemplo`);
      console.log(`Author Slug: autor-ejemplo`);
      console.log("");
      console.log("⚠️  IMPORTANT: Please change these defaults immediately!");
      console.log("   1. Go to /admin and update your admin credentials");
      console.log("   2. Edit or delete the default author");
      console.log("=".repeat(70));
    } else {
      console.log("=".repeat(70));
      console.log("✅ DEFAULT ADMIN USER CREATED");
      console.log("=".repeat(70));
      console.log(`Username: ${defaultUsername}`);
      console.log(`Password: ${defaultPassword}`);
      console.log("");
      console.log("⚠️  IMPORTANT: Please change this password immediately!");
      console.log("   Go to /admin and update your credentials.");
      console.log("=".repeat(70));
    }
  })();
  
  try {
    await Promise.race([initPromise, timeoutPromise]);
  } catch (error) {
    console.error("❌ Error initializing admin user:", error);
    // Don't throw - let the app continue even if this fails
  }
}
