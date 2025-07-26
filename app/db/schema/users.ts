import { pgTable, uuid, text, timestamp, varchar } from 'drizzle-orm/pg-core';
import { uuidv7 } from 'uuidv7';

import { relations } from 'drizzle-orm';
import { tweets } from './tweets';
import { follows } from './follows';
import { likes } from './likes';

export const users = pgTable('users', {
  id: uuid('id').primaryKey().$defaultFn(() => uuidv7()),
  username: varchar('username', { length: 50 }).notNull().unique(),
  email: varchar('email', { length: 255 }).notNull().unique(),
  password_hash: text('password_hash').notNull(),
  display_name: varchar('display_name', { length: 100 }),
  bio: text('bio'),
  avatar_url: text('avatar_url'),
  created_at: timestamp('created_at').defaultNow().notNull(),
  updated_at: timestamp('updated_at').defaultNow().notNull(),
});

export const usersRelations = relations(users, ({ many }) => ({
  tweets: many(tweets),
  followers: many(follows, {
    relationName: 'following',
  }),
  following: many(follows, {
    relationName: 'follower',
  }),
  likes: many(likes),
}));

export type User = typeof users.$inferSelect;
export type NewUser = typeof users.$inferInsert;