import { pgTable, uuid, timestamp, primaryKey } from 'drizzle-orm/pg-core';
import { relations } from 'drizzle-orm';
import { users } from './users';

export const follows = pgTable('follows', {
  follower_id: uuid('follower_id').notNull().references(() => users.id, { onDelete: 'cascade' }),
  following_id: uuid('following_id').notNull().references(() => users.id, { onDelete: 'cascade' }),
  created_at: timestamp('created_at').defaultNow().notNull(),
}, (table) => ({
  pk: primaryKey({ columns: [table.follower_id, table.following_id] }),
}));

export const followsRelations = relations(follows, ({ one }) => ({
  follower: one(users, {
    fields: [follows.follower_id],
    references: [users.id],
    relationName: 'follower',
  }),
  following: one(users, {
    fields: [follows.following_id],
    references: [users.id],
    relationName: 'following',
  }),
}));

export type Follow = typeof follows.$inferSelect;
export type NewFollow = typeof follows.$inferInsert;