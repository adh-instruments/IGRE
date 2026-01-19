import { boolean, pgTable, text, timestamp, uuid } from 'drizzle-orm/pg-core';

export const users = pgTable('users', {
	id: uuid('id').primaryKey().defaultRandom(),
	email: text('email').notNull().unique(),
	passwordHash: text('password_hash').notNull(),
	isAdmin: boolean('is_admin').notNull().default(false),
	createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow()
});

export const sessions = pgTable('sessions', {
	id: text('id').primaryKey(),
	userId: uuid('user_id')
		.notNull()
		.references(() => users.id, { onDelete: 'cascade' }),
	expiresAt: timestamp('expires_at', { withTimezone: true }).notNull()
});

export const researches = pgTable('researches', {
	id: uuid('id').primaryKey().defaultRandom(),
	author: text('author').notNull(),
	title: text('title').notNull(),
	method: text('method').notNull(),
	coordinates: text('coordinates'),
	summary: text('summary'),
	image: text('image'),
	link: text('link'),
	lat: text('lat'),
	lon: text('lon'),
	location: text('location'),
	year: text('year'),
	createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow()
});

export type ResearchInsert = typeof researches.$inferInsert;
export type ResearchSelect = typeof researches.$inferSelect;
