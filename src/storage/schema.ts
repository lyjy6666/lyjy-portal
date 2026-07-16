import { pgTable, serial, timestamp, varchar, boolean } from "drizzle-orm/pg-core"
import { sql } from "drizzle-orm"
import { index } from "drizzle-orm/pg-core"



export const healthCheck = pgTable("health_check", {
	id: serial().notNull(),
	updatedAt: timestamp("updated_at", { withTimezone: true, mode: 'string' }).defaultNow(),
});

// 用户表
export const users = pgTable(
	"users",
	{
		id: serial("id").primaryKey().notNull(),
		username: varchar("username", { length: 50 }).notNull().unique(),
		password: varchar("password", { length: 255 }).notNull(),
		is_vip: boolean("is_vip").default(false).notNull(),
		created_at: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
	},
	(table) => [
		index("users_username_idx").on(table.username)
	]
);

export type User = typeof users.$inferSelect;
export type InsertUser = typeof users.$inferInsert;
