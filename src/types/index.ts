// Database entity types
export interface User {
  id: string;
  username: string;
  email?: string | null;
  passwordHash: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface Profile {
  id: string;
  userId: string;
  displayName: string;
  bio: string;
  avatarUrl: string | null;
  createdAt: Date;
  updatedAt: Date;
}

export interface Tweet {
  id: string;
  userId: string;
  content: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface Like {
  id: string;
  userId: string;
  tweetId: string;
  createdAt: Date;
}

export interface LikeData {
  tweetId: string;
  count: number;
  userLiked: boolean;
}

// Session types
export interface SessionData {
  userId: string;
  expires: Date;
}

// Exported types from Zod schemas (will be defined later)
export type { RegisterInput, LoginInput } from '../schemas/auth.schema.js';
export type { ProfileInput } from '../schemas/profile.schema.js';
export type { TweetInput } from '../schemas/tweet.schema.js';
export type { LikeInput } from '../schemas/like.schema.js';
