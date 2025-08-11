import 'dotenv/config';
import { sql } from 'drizzle-orm';
import { db } from '../app/lib/db/connection';

async function testFreshDeploy() {
  console.log('🧪 Testing fresh deployment scenario...\n');
  
  try {
    // Step 1: Drop all existing tables to simulate fresh environment
    console.log('1. Dropping all existing tables...');
    await db.execute(sql`DROP TABLE IF EXISTS likes CASCADE`);
    await db.execute(sql`DROP TABLE IF EXISTS follows CASCADE`);
    await db.execute(sql`DROP TABLE IF EXISTS tweets CASCADE`);
    await db.execute(sql`DROP TABLE IF EXISTS users CASCADE`);
    console.log('   ✓ All tables dropped\n');
    
    // Step 2: The migration would be run with npm run db:migrate
    console.log('2. Run migrations with: npm run db:migrate');
    console.log('   (This would be done in the deployment script)\n');
    
    // Step 3: Check what tables exist
    console.log('3. Checking database after fresh start...');
    const tables = await db.execute(sql`
      SELECT tablename 
      FROM pg_tables 
      WHERE schemaname = 'public' 
      AND tablename IN ('users', 'tweets', 'follows', 'likes',
                        'tweeter_users', 'tweeter_tweets', 'tweeter_follows', 'tweeter_likes')
      ORDER BY tablename
    `);
    
    const tableRows = (tables as any) || [];
    if (!tableRows.length || tableRows.length === 0) {
      console.log('   ✓ Database is clean and ready for migrations');
    } else {
      console.log('   Existing tables:', tableRows.map((r: any) => r.tablename).join(', '));
    }
    
    console.log('\n✅ Fresh deployment test complete!');
    console.log('\nTo deploy to a new environment:');
    console.log('1. Set DATABASE_URL in .env');
    console.log('2. Run: npm run db:migrate');
    console.log('3. (Optional) Run: npm run db:seed');
    
  } catch (error) {
    console.error('❌ Error during deployment test:', error);
    process.exit(1);
  }
  
  process.exit(0);
}

testFreshDeploy();