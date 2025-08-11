import 'dotenv/config';
import { sql } from 'drizzle-orm';
import { db } from '../app/lib/db/connection';
import * as fs from 'fs';
import * as path from 'path';

async function applySchema() {
  console.log('Applying new schema to database...');
  
  try {
    // Read the migration file
    const migrationPath = path.join(process.cwd(), 'drizzle', '0001_spooky_chameleon.sql');
    const migrationSQL = fs.readFileSync(migrationPath, 'utf-8');
    
    // Split by statement-breakpoint and execute each statement
    const statements = migrationSQL.split('--> statement-breakpoint');
    
    for (const statement of statements) {
      const trimmed = statement.trim();
      if (trimmed) {
        console.log(`Executing: ${trimmed.substring(0, 50)}...`);
        await db.execute(sql.raw(trimmed));
      }
    }
    
    console.log('✅ Schema applied successfully');
  } catch (error) {
    console.error('Error applying schema:', error);
    process.exit(1);
  }
  
  process.exit(0);
}

applySchema();