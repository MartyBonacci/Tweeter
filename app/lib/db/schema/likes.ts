import { pgTable, uuid, timestamp, primaryKey } from 'drizzle-orm/pg-core';
import { relations } from 'drizzle-orm';
import { users } from './users';
import { tweets } from './tweets';

export const likes = pgTable('likes', {
  userId: uuid('user_id').notNull().references(() => users.id, { onDelete: 'cascade' }),
  tweetId: uuid('tweet_id').notNull().references(() => tweets.id, { onDelete: 'cascade' }),
  createdAt: timestamp('created_at').defaultNow().notNull(),
}, (table) => ({
  pk: primaryKey({ columns: [table.userId, table.tweetId] }),
}));

export const likesRelations = relations(likes, ({ one }) => ({
  user: one(users, {
    fields: [likes.userId],
    references: [users.id],
  }),
  tweet: one(tweets, {
    fields: [likes.tweetId],
    references: [tweets.id],
  }),
}));

export type Like = typeof likes.$inferSelect;
export type NewLike = typeof likes.$inferInsert;