import postgres from 'postgres';
import { drizzle } from 'drizzle-orm/postgres-js';
import { sql } from 'drizzle-orm';
import * as schema from './schema';

const connectionString = process.env.DATABASE_URL;

if (!connectionString) {
  throw new Error('DATABASE_URL environment variable is required');
}

const queryClient = postgres(connectionString, {
  max: 20, // Maximum number of connections
  idle_timeout: 20, // Close idle connections after 20 seconds
  connect_timeout: 30, // Increased connection timeout to 30 seconds
  max_lifetime: 60 * 30, // Close connections after 30 minutes
  transform: {
    ...postgres.camel,
    undefined: null
  },
  onnotice: () => {}, // Suppress notices in development
  debug: process.env.NODE_ENV === 'development' ? console.log : false
});

export const db = drizzle(queryClient, { schema });

export type DB = typeof db;

/**
 * Test database connection with retry logic
 */
export async function testConnection(retries = 3) {
  for (let attempt = 1; attempt <= retries; attempt++) {
    try {
      console.log(`Testing database connection (attempt ${attempt}/${retries})...`);
      await db.execute(sql`SELECT 1`);
      console.log('✅ Database connection successful');
      return true;
    } catch (error: any) {
      console.error(`❌ Database connection failed (attempt ${attempt}/${retries}):`, {
        message: error.message,
        code: error.code,
        errno: error.errno,
        address: error.address,
        port: error.port
      });
      
      if (attempt < retries) {
        const delay = Math.min(1000 * attempt, 5000); // Exponential backoff, max 5s
        console.log(`⏳ Retrying in ${delay}ms...`);
        await new Promise(resolve => setTimeout(resolve, delay));
      }
    }
  }
  return false;
}

/**
 * Execute database query with connection retry
 */
export async function executeWithRetry<T>(
  operation: () => Promise<T>,
  retries = 2
): Promise<T> {
  for (let attempt = 1; attempt <= retries; attempt++) {
    try {
      return await operation();
    } catch (error: any) {
      if (attempt < retries && (error.code === 'CONNECT_TIMEOUT' || error.errno === 'CONNECT_TIMEOUT')) {
        console.warn(`Database operation failed (attempt ${attempt}/${retries}), retrying...`);
        const delay = Math.min(1000 * attempt, 3000);
        await new Promise(resolve => setTimeout(resolve, delay));
        continue;
      }
      throw error; // Re-throw if max retries reached or non-timeout error
    }
  }
  throw new Error('Max retries reached'); // Should never reach here
}