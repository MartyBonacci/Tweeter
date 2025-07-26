import type { Config } from 'drizzle-kit';

export default {
  schema: './app/db/schema/index.ts',
  out: './app/db/migrations',
  dialect: 'postgresql',
  dbCredentials: {
    url: process.env.DATABASE_URL!,
  },
} satisfies Config;