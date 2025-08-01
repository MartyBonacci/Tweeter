import type { Config } from 'drizzle-kit';

export default {
  schema: './app/lib/db/schema/*',
  out: './drizzle',
  dialect: 'postgresql',
  dbCredentials: {
    url: process.env.DATABASE_URL!,
  },
  tablesFilter: ['tweeter_*'],
} satisfies Config;