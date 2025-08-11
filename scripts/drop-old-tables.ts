import 'dotenv/config';
import { sql } from 'drizzle-orm';
import { db } from '../app/lib/db/connection';

async function dropOldTables() {
  console.log('Dropping old tables with tweeter_ prefix...');
  
  try {
    // Drop tables in correct order to handle foreign keys
    await db.execute(sql`DROP TABLE IF EXISTS tweeter_likes CASCADE`);
    console.log('Dropped tweeter_likes');
    
    await db.execute(sql`DROP TABLE IF EXISTS tweeter_follows CASCADE`);
    console.log('Dropped tweeter_follows');
    
    await db.execute(sql`DROP TABLE IF EXISTS tweeter_tweets CASCADE`);
    console.log('Dropped tweeter_tweets');
    
    await db.execute(sql`DROP TABLE IF EXISTS tweeter_users CASCADE`);
    console.log('Dropped tweeter_users');
    
    console.log('✅ All old tables dropped successfully');
  } catch (error) {
    console.error('Error dropping tables:', error);
    process.exit(1);
  }
  
  process.exit(0);
}

dropOldTables();