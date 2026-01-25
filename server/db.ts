// Reference: blueprint:javascript_database integration
import { Pool as NeonPool, neonConfig } from '@neondatabase/serverless';
import { drizzle as drizzleNeon } from 'drizzle-orm/neon-serverless';
import { Pool as PgPool } from 'pg';
import { drizzle as drizzlePg } from 'drizzle-orm/node-postgres';
import ws from "ws";
import * as schema from "@shared/schema";

if (!process.env.DATABASE_URL) {
  throw new Error(
    "DATABASE_URL must be set. Did you forget to provision a database?",
  );
}

const databaseUrl = process.env.DATABASE_URL;

// Detect if using Neon (WebSocket) or local PostgreSQL
const isNeonDatabase = databaseUrl.includes('neon.tech') || 
                       databaseUrl.includes('neon.fl0.io') ||
                       databaseUrl.includes('ep-');

let pool: NeonPool | PgPool;
let db: ReturnType<typeof drizzleNeon> | ReturnType<typeof drizzlePg>;

if (isNeonDatabase) {
  // Use Neon serverless driver with WebSocket
  neonConfig.webSocketConstructor = ws;
  pool = new NeonPool({ connectionString: databaseUrl });
  db = drizzleNeon({ client: pool as NeonPool, schema });
  console.log('📡 Database: Using Neon serverless driver (WebSocket)');
} else {
  // Use standard pg driver for local PostgreSQL
  pool = new PgPool({ connectionString: databaseUrl });
  db = drizzlePg({ client: pool as PgPool, schema });
  console.log('🐘 Database: Using standard PostgreSQL driver');
}

export { pool, db };
