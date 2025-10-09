import 'dotenv/config';
import { readFile } from 'fs/promises';
import { sql } from '../src/services/db.service.js';

async function runMigrations() {
  try {
    console.log('Running migrations...');

    // Read and execute migration files
    const migration1 = await readFile(
      './src/db/migrations/001_create_users.sql',
      'utf-8'
    );
    const migration2 = await readFile(
      './src/db/migrations/002_create_profiles.sql',
      'utf-8'
    );
    const migration3 = await readFile(
      './src/db/migrations/003_create_tweets.sql',
      'utf-8'
    );
    const migration4 = await readFile(
      './src/db/migrations/004_create_likes.sql',
      'utf-8'
    );
    const migration5 = await readFile(
      './src/db/migrations/005_add_email_to_users.sql',
      'utf-8'
    );

    await sql.unsafe(migration1);
    console.log('✓ Migration 001_create_users.sql executed');

    await sql.unsafe(migration2);
    console.log('✓ Migration 002_create_profiles.sql executed');

    await sql.unsafe(migration3);
    console.log('✓ Migration 003_create_tweets.sql executed');

    await sql.unsafe(migration4);
    console.log('✓ Migration 004_create_likes.sql executed');

    await sql.unsafe(migration5);
    console.log('✓ Migration 005_add_email_to_users.sql executed');

    console.log('All migrations completed successfully!');
    process.exit(0);
  } catch (error) {
    console.error('Migration failed:', error);
    process.exit(1);
  }
}

runMigrations();
