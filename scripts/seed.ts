import { drizzle } from 'drizzle-orm/node-postgres';
import { Pool } from 'pg';
import { users, tweets, follows, likes } from '../app/db/schema';
import bcrypt from 'bcrypt';
import { v4 as uuidv4 } from 'uuid';
import * as schema from '../app/db/schema';

// Load environment variables
import { config } from 'dotenv';
config();

const pool = new Pool({
  connectionString: process.env.DATABASE_URL || 'postgresql://localhost:5432/tweeter',
});

export const db = drizzle(pool, { schema });

const seedUsers = [
  {
    username: 'johndoe',
    email: 'john@example.com',
    displayName: 'John Doe',
    bio: 'Software developer and coffee enthusiast ☕',
    avatarUrl: 'https://via.placeholder.com/400x400/3B82F6/FFFFFF?text=JD',
  },
  {
    username: 'janedoe',
    email: 'jane@example.com',
    displayName: 'Jane Doe',
    bio: 'Designer | Creative thinker | Nature lover 🌱',
    avatarUrl: 'https://via.placeholder.com/400x400/EC4899/FFFFFF?text=JD',
  },
  {
    username: 'techguru',
    email: 'guru@example.com',
    displayName: 'Tech Guru',
    bio: 'Sharing the latest in tech and innovation 🔧',
    avatarUrl: 'https://via.placeholder.com/400x400/10B981/FFFFFF?text=TG',
  },
  {
    username: 'foodie',
    email: 'food@example.com',
    displayName: 'Food Explorer',
    bio: 'Exploring flavors from around the world 🍕',
    avatarUrl: 'https://via.placeholder.com/400x400/F59E0B/FFFFFF?text=FE',
  },
  {
    username: 'travelbug',
    email: 'travel@example.com',
    displayName: 'Travel Bug',
    bio: 'Wandering the globe one adventure at a time ✈️',
    avatarUrl: 'https://via.placeholder.com/400x400/8B5CF6/FFFFFF?text=TB',
  },
];

const sampleTweets = [
  "Just launched my new app! Check it out and let me know what you think 🚀",
  "Morning coffee is the best fuel for coding sessions ☕",
  "Beautiful sunrise this morning! Sometimes you just need to pause and appreciate nature 🌅",
  "Working on something exciting. Can't wait to share more details soon! 👀",
  "The best debugging tool is a good night's sleep 💤",
  "Just discovered a new framework that's changing how I think about development",
  "Reminder: Take breaks, stay hydrated, and don't forget to stretch! 🧘‍♂️",
  "Collaboration makes the dream work. Shoutout to my amazing team! 🤝",
  "Learning never stops in tech. Currently diving deep into TypeScript patterns",
  "Simple code is better than clever code. Always optimize for readability 📖",
  "Debugging is like being a detective in your own code 🕵️‍♂️",
  "The satisfaction when all tests pass is unmatched ✅",
  "Coffee count: 3. Productivity level: maximum ☕⚡",
  "Just fixed a bug that's been haunting me for days. Best feeling ever! 🎉",
  "Remember: Every expert was once a beginner. Keep learning! 💪",
];

async function seed() {
  console.log('🌱 Starting database seed...');

  try {
    console.log('👤 Creating users...');
    const createdUsers = [];
    for (const userData of seedUsers) {
      const hashedPassword = await bcrypt.hash('password123', 10);
      const [user] = await db.insert(users).values({
        username: userData.username,
        email: userData.email,
        password_hash: hashedPassword,
        display_name: userData.displayName,
        bio: userData.bio,
        avatar_url: userData.avatarUrl,
      }).returning();
      createdUsers.push(user);
      console.log(`✅ Created user: ${user.username}`);
    }

    console.log('🐦 Creating tweets...');
    for (let i = 0; i < 30; i++) {
      const randomUser = createdUsers[Math.floor(Math.random() * createdUsers.length)];
      const randomTweet = sampleTweets[Math.floor(Math.random() * sampleTweets.length)];
      
      const [tweet] = await db.insert(tweets).values({
        user_id: randomUser.id,
        content: randomTweet,
      }).returning();
      
      if (i < 5) {
        console.log(`✅ Created tweet: ${tweet.content.substring(0, 50)}...`);
      }
    }

    console.log('👥 Creating follow relationships...');
    for (let i = 0; i < 10; i++) {
      const follower = createdUsers[Math.floor(Math.random() * createdUsers.length)];
      const following = createdUsers[Math.floor(Math.random() * createdUsers.length)];
      
      if (follower.id !== following.id) {
        try {
          await db.insert(follows).values({
            follower_id: follower.id,
            following_id: following.id,
          });
          console.log(`✅ ${follower.username} is now following ${following.username}`);
        } catch (error) {
          // Ignore duplicate follows
        }
      }
    }

    console.log('❤️ Creating likes...');
    const allTweets = await db.select().from(tweets);
    
    for (let i = 0; i < 50; i++) {
      const randomUser = createdUsers[Math.floor(Math.random() * createdUsers.length)];
      const randomTweet = allTweets[Math.floor(Math.random() * allTweets.length)];
      
      try {
        await db.insert(likes).values({
          user_id: randomUser.id,
          tweet_id: randomTweet.id,
        });
        
        if (i < 5) {
          console.log(`✅ ${randomUser.username} liked a tweet`);
        }
      } catch (error) {
        // Ignore duplicate likes
      }
    }

    console.log('✨ Database seeding completed successfully!');
    console.log('\n📋 Seed Summary:');
    console.log(`   Users: ${seedUsers.length}`);
    console.log(`   Tweets: ${allTweets.length}`);
    console.log('\n🔑 Login Credentials:');
    console.log('   All users use password: password123');
    console.log('   Example: johndoe / password123');
    
  } catch (error) {
    console.error('❌ Error during seeding:', error);
    process.exit(1);
  }
}

async function resetDatabase() {
  console.log('🗑️  Resetting database...');
  
  try {
    await db.delete(follows);
    await db.delete(likes);
    await db.delete(tweets);
    await db.delete(users);
    
    console.log('✅ Database reset complete');
  } catch (error) {
    console.error('❌ Error resetting database:', error);
    process.exit(1);
  }
}

const command = process.argv[2];

if (command === 'reset') {
  resetDatabase().then(() => process.exit(0));
} else {
  seed().then(() => process.exit(0));
}