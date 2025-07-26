import { pgTable, uuid, timestamp, primaryKey } from 'drizzle-orm/pg-core';
import { relations } from 'drizzle-orm';
import { users } from './users';
import { tweets } from './tweets';

export const likes = pgTable('likes', {
  user_id: uuid('user_id').notNull().references(() => users.id, { onDelete: 'cascade' }),
  tweet_id: uuid('tweet_id').notNull().references(() => tweets.id, { onDelete: 'cascade' }),
  created_at: timestamp('created_at').defaultNow().notNull(),
}, (table) => ({
  pk: primaryKey({ columns: [table.user_id, table.tweet_id] }),
}));

export const likesRelations = relations(likes, ({ one }) => ({
  user: one(users, {
    fields: [likes.user_id],
    references: [users.id],
  }),
  tweet: one(tweets, {
    fields: [likes.tweet_id],
    references: [tweets.id],
  }),
}));

export type Like = typeof likes.$inferSelect;
export type NewLike = typeof likes.$inferInsert;