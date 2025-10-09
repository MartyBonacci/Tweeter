import postgres from 'postgres';

// Get database URL from environment
const databaseUrl = process.env.DATABASE_URL;

if (!databaseUrl) {
  throw new Error('DATABASE_URL environment variable is not set');
}

// Create PostgreSQL connection with automatic camelCase ↔ snake_case mapping
export const sql = postgres(databaseUrl, {
  transform: postgres.camel,
});

// Type-safe query helper for transactions
export async function transaction<T>(
  callback: (sql: typeof postgres) => Promise<T>
): Promise<T> {
  return sql.begin(callback);
}
