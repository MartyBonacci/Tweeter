import { db } from '../connection';
import { users, tweets, follows, likes } from '../schema';
import { hashPassword } from '../../auth/password';
import { createId } from 'uuidv7';

const sampleUsers = [
  {
    username: 'alice_dev',
    email: 'alice@example.com',
    name: 'Alice Developer',
    bio: 'Full-stack developer passionate about React and TypeScript',
  },
  {
    username: 'bob_tech',
    email: 'bob@example.com',
    name: 'Bob Tech',
    bio: 'Frontend wizard | Building beautiful UIs',
  },
  {
    username: 'charlie_code',
    email: 'charlie@example.com',
    name: 'Charlie Code',
    bio: 'Backend engineer | Scaling systems and databases',
  },
  {
    username: 'diana_design',
    email: 'diana@example.com',
    name: 'Diana Design',
    bio: 'UX designer | Making interfaces intuitive',
  },
];

const sampleTweets = [
  "Just shipped a new feature using React Router 7! The new framework mode is incredible 🚀",
  "TypeScript + Drizzle ORM = 👌 Perfect combo for type-safe database operations",
  "Working on optimizing our database queries. PostgreSQL indexes are amazing!",
  "Just learned about UUIDv7 - time-sortable unique identifiers are genius",
  "Building a Twitter clone has been such a fun learning experience",
  "Argon2 password hashing is so much better than bcrypt. Highly recommend!",
  "Tailwind CSS makes styling so much faster. Can't imagine going back",
  "The new React Server Components are changing how we think about SSR",
];

async function seedUsers() {
  console.log('Seeding users...');
  const createdUsers = [];

  for (const userData of sampleUsers) {
    const user = await db.insert(users).values({
      id: createId(),
      username: userData.username,
      email: userData.email,
      name: userData.name,
      bio: userData.bio,
      password: await hashPassword('password123'),
      createdAt: new Date(),
      updatedAt: new Date(),
    }).returning();
    
    createdUsers.push(user[0]);
  }

  console.log(`Created ${createdUsers.length} users`);
  return createdUsers;
}

async function seedTweets(createdUsers: any[]) {
  console.log('Seeding tweets...');
  
  for (let i = 0; i < sampleTweets.length; i++) {
    const user = createdUsers[i % createdUsers.length];
    
    await db.insert(tweets).values({
      id: createId(),
      userId: user.id,
      content: sampleTweets[i],
      createdAt: new Date(Date.now() - (i * 3600000)), // Stagger creation times
      updatedAt: new Date(),
    });
  }
  
  console.log(`Created ${sampleTweets.length} tweets`);
}

async function seedFollows(createdUsers: any[]) {
  console.log('Seeding follows...');
  
  // Create a follow network: each user follows the next user
  for (let i = 0; i < createdUsers.length; i++) {
    const follower = createdUsers[i];
    const followee = createdUsers[(i + 1) % createdUsers.length];
    
    await db.insert(follows).values({
      id: createId(),
      followerId: follower.id,
      followeeId: followee.id,
      createdAt: new Date(),
    });
  }
  
  console.log('Created follow relationships');
}

async function seedLikes(createdUsers: any[], tweets: any[]) {
  console.log('Seeding likes...');
  
  // Get all tweets
  const allTweets = await db.select().from(tweets);
  
  // Create some likes
  for (let i = 0; i < Math.min(5, allTweets.length); i++) {
    const tweet = allTweets[i];
    const user = createdUsers[i % createdUsers.length];
    
    await db.insert(likes).values({
      id: createId(),
      userId: user.id,
      tweetId: tweet.id,
      createdAt: new Date(),
    });
  }
  
  console.log('Created like relationships');
}

export async function seedDatabase() {
  try {
    console.log('Starting database seeding...');
    
    // Clear existing data
    await db.delete(likes);
    await db.delete(follows);
    await db.delete(tweets);
    await db.delete(users);
    
    // Seed data
    const createdUsers = await seedUsers();
    await seedTweets(createdUsers);
    await seedFollows(createdUsers);
    await seedLikes(createdUsers, []);
    
    console.log('Database seeding completed successfully!');
  } catch (error) {
    console.error('Error seeding database:', error);
    throw error;
  }
}

// Run seeding if this file is executed directly
if (require.main === module) {
  seedDatabase()
    .then(() => process.exit(0))
    .catch(() => process.exit(1));
}