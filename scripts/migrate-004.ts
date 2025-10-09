import 'dotenv/config';
import { readFile } from 'fs/promises';
import { sql } from '../src/services/db.service.js';

async function migrate004() {
  try {
    console.log('Running migration 004_create_likes...');

    const migration4 = await readFile(
      './src/db/migrations/004_create_likes.sql',
      'utf-8'
    );

    await sql.unsafe(migration4);
    console.log('✓ Migration 004_create_likes.sql executed');

    console.log('Migration completed successfully!');
    process.exit(0);
  } catch (error) {
    console.error('Migration failed:', error);
    process.exit(1);
  }
}

migrate004();
