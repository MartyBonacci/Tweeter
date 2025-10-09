import 'dotenv/config';
import { readFile } from 'fs/promises';
import { sql } from '../src/services/db.service.js';

async function migrate003() {
  try {
    console.log('Running migration 003_create_tweets...');

    const migration3 = await readFile(
      './src/db/migrations/003_create_tweets.sql',
      'utf-8'
    );

    await sql.unsafe(migration3);
    console.log('✓ Migration 003_create_tweets.sql executed');

    console.log('Migration completed successfully!');
    process.exit(0);
  } catch (error) {
    console.error('Migration failed:', error);
    process.exit(1);
  }
}

migrate003();
