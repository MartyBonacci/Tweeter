import 'dotenv/config';
import { readFile } from 'fs/promises';
import { sql } from '../src/services/db.service.js';

async function runSingleMigration() {
  try {
    const migrationFile = process.argv[2];

    if (!migrationFile) {
      console.error('Usage: tsx scripts/run-single-migration.ts <migration-file>');
      process.exit(1);
    }

    console.log(`Running migration: ${migrationFile}...`);

    const migration = await readFile(migrationFile, 'utf-8');
    await sql.unsafe(migration);

    console.log(`✓ Migration ${migrationFile} executed successfully!`);
    process.exit(0);
  } catch (error) {
    console.error('Migration failed:', error);
    process.exit(1);
  }
}

runSingleMigration();
