import { pgTable, uuid, text, timestamp, varchar } from 'drizzle-orm/pg-core';
import { uuidv7 } from 'uuidv7';
import { relations } from 'drizzle-orm';
import { users } from './users';
import { likes } from './likes';

export const tweets = pgTable('tweets', {
  id: uuid('id').primaryKey().$defaultFn(() => uuidv7()),
  user_id: uuid('user_id').notNull().references(() => users.id, { onDelete: 'cascade' }),
  content: varchar('content', { length: 140 }).notNull(),
  created_at: timestamp('created_at').defaultNow().notNull(),
  updated_at: timestamp('updated_at').defaultNow().notNull(),
});

export const tweetsRelations = relations(tweets, ({ one, many }) => ({
  user: one(users, {
    fields: [tweets.user_id],
    references: [users.id],
  }),
  likes: many(likes),
}));

export type Tweet = typeof tweets.$inferSelect;
export type NewTweet = typeof tweets.$inferInsert;