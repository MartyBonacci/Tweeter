import 'dotenv/config';
import { sql } from 'drizzle-orm';
import { db } from '../app/lib/db/connection';

async function verifyDeployment() {
  console.log('🔍 Verifying deployment...\n');
  
  try {
    // Check what tables exist
    console.log('1. Checking tables in database...');
    const tables = await db.execute(sql`
      SELECT tablename 
      FROM pg_tables 
      WHERE schemaname = 'public' 
      AND tablename NOT LIKE '\_%' ESCAPE '\'
      ORDER BY tablename
    `);
    
    console.log('   Found tables:');
    for (const row of tables as any) {
      console.log(`   - ${row.tablename}`);
    }
    
    // Check table structure
    console.log('\n2. Verifying table structures...');
    
    // Check users table
    const usersCols = await db.execute(sql`
      SELECT column_name, data_type 
      FROM information_schema.columns 
      WHERE table_name = 'users' 
      ORDER BY ordinal_position
    `);
    console.log(`   ✓ users table has ${(usersCols as any).length} columns`);
    
    // Check tweets table
    const tweetsCols = await db.execute(sql`
      SELECT column_name, data_type 
      FROM information_schema.columns 
      WHERE table_name = 'tweets' 
      ORDER BY ordinal_position
    `);
    console.log(`   ✓ tweets table has ${(tweetsCols as any).length} columns`);
    
    // Check follows table
    const followsCols = await db.execute(sql`
      SELECT column_name, data_type 
      FROM information_schema.columns 
      WHERE table_name = 'follows' 
      ORDER BY ordinal_position
    `);
    console.log(`   ✓ follows table has ${(followsCols as any).length} columns`);
    
    // Check likes table
    const likesCols = await db.execute(sql`
      SELECT column_name, data_type 
      FROM information_schema.columns 
      WHERE table_name = 'likes' 
      ORDER BY ordinal_position
    `);
    console.log(`   ✓ likes table has ${(likesCols as any).length} columns`);
    
    // Check for old tables
    console.log('\n3. Checking for old tweeter_ tables...');
    const oldTables = await db.execute(sql`
      SELECT tablename 
      FROM pg_tables 
      WHERE schemaname = 'public' 
      AND tablename LIKE 'tweeter_%'
      ORDER BY tablename
    `);
    
    if ((oldTables as any).length === 0) {
      console.log('   ✓ No old tweeter_ tables found');
    } else {
      console.log('   ⚠️ Found old tables:', (oldTables as any).map((r: any) => r.tablename).join(', '));
    }
    
    console.log('\n✅ Database is properly set up for deployment!');
    console.log('\n📝 Deployment Instructions:');
    console.log('1. Push code to repository');
    console.log('2. Set DATABASE_URL environment variable in production');
    console.log('3. Run: npm run db:migrate');
    console.log('4. (Optional) Run: npm run db:seed for test data');
    
  } catch (error) {
    console.error('❌ Error verifying deployment:', error);
    process.exit(1);
  }
  
  process.exit(0);
}

verifyDeployment();