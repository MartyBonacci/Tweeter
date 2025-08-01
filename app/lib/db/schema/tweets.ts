import { pgTable, uuid, varchar, timestamp } from 'drizzle-orm/pg-core';
import { relations } from 'drizzle-orm';
import { users } from './users';
import { likes } from './likes';

export const tweets = pgTable('tweeter_tweets', {
  id: uuid('id').primaryKey().defaultRandom(),
  userId: uuid('user_id').notNull().references(() => users.id, { onDelete: 'cascade' }),
  content: varchar('content', { length: 140 }).notNull(),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
});

export const tweetsRelations = relations(tweets, ({ one, many }) => ({
  user: one(users, {
    fields: [tweets.userId],
    references: [users.id],
  }),
  likes: many(likes),
}));

export type Tweet = typeof tweets.$inferSelect;
export type NewTweet = typeof tweets.$inferInsert;