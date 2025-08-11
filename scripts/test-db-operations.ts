import 'dotenv/config';
import { db } from '../app/lib/db/connection';
import { users, tweets, follows, likes } from '../app/lib/db/schema';

async function testDbOperations() {
  console.log('Testing database operations with new table names...\n');
  
  try {
    // Test 1: Query users table
    console.log('1. Testing users table...');
    const userList = await db.select().from(users).limit(2);
    console.log(`   ✓ Found ${userList.length} users`);
    console.log(`   ✓ Sample user: ${userList[0]?.username}`);
    
    // Test 2: Query tweets table
    console.log('\n2. Testing tweets table...');
    const tweetList = await db.select().from(tweets).limit(2);
    console.log(`   ✓ Found ${tweetList.length} tweets`);
    console.log(`   ✓ Sample tweet: "${tweetList[0]?.content?.substring(0, 50)}..."`);
    
    // Test 3: Query follows table
    console.log('\n3. Testing follows table...');
    const followList = await db.select().from(follows).limit(2);
    console.log(`   ✓ Found ${followList.length} follow relationships`);
    
    // Test 4: Query likes table
    console.log('\n4. Testing likes table...');
    const likeList = await db.select().from(likes).limit(2);
    console.log(`   ✓ Found ${likeList.length} likes`);
    
    // Test 5: Join query (tweets with users)
    console.log('\n5. Testing join operations...');
    const tweetsWithUsers = await db
      .select({
        tweet: tweets.content,
        author: users.username
      })
      .from(tweets)
      .innerJoin(users, eq(tweets.userId, users.id))
      .limit(2);
    console.log(`   ✓ Join query successful`);
    console.log(`   ✓ Sample: @${tweetsWithUsers[0]?.author}: "${tweetsWithUsers[0]?.tweet?.substring(0, 40)}..."`);
    
    console.log('\n✅ All database operations working correctly with new table names!');
    
  } catch (error) {
    console.error('❌ Error during database operations:', error);
    process.exit(1);
  }
  
  process.exit(0);
}

// Import eq for join operations
import { eq } from 'drizzle-orm';

testDbOperations();