import { int, mysqlEnum, mysqlTable, serial, text, timestamp, varchar } from "drizzle-orm/mysql-core";
import { relations } from "drizzle-orm";

/**
 * Users table - stores both admin and agent accounts
 * Supports custom email/password authentication with role-based access control
 */
export const users = mysqlTable("users", {
  id: serial("id").primaryKey(),
  openId: varchar("open_id", { length: 64 }).unique(), // Optional: for OAuth compatibility
  name: text("name").notNull(),
  email: varchar("email", { length: 320 }).notNull().unique(),
  password: text("password"), // bcryptjs hashed password
  role: mysqlEnum("role", ["admin", "agent"]).default("agent").notNull(),
  loginMethod: mysqlEnum("login_method", ["password"]).default("password").notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().onUpdateNow().notNull(),
  lastSignedIn: timestamp("last_signed_in").defaultNow().notNull(),
});

export type User = typeof users.$inferSelect;
export type InsertUser = typeof users.$inferInsert;

/**
 * Webhook accounts table - stores WhatsApp webhook configurations
 * Each account has a unique API key for authentication
 */
export const webhookAccounts = mysqlTable("webhook_accounts", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  apiKey: varchar("api_key", { length: 64 }).notNull().unique(),
  webhookUrl: text("webhook_url"),
  phoneNumber: varchar("phone_number", { length: 20 }),
  status: mysqlEnum("status", ["active", "inactive"]).default("active").notNull(),
  messagesSent: int("messages_sent").default(0).notNull(),
  messagesReceived: int("messages_received").default(0).notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().onUpdateNow().notNull(),
});

export type WebhookAccount = typeof webhookAccounts.$inferSelect;
export type InsertWebhookAccount = typeof webhookAccounts.$inferInsert;

/**
 * Webhook logs table - stores all incoming/outgoing WhatsApp messages
 * Links to webhook accounts and optionally to assigned agents
 */
export const webhookLogs = mysqlTable("webhook_logs", {
  id: serial("id").primaryKey(),
  accountId: int("account_id").notNull(),
  agentId: int("agent_id"), // Optional: assigned agent
  direction: mysqlEnum("direction", ["inbound", "outbound"]).notNull(),
  fromNumber: varchar("from_number", { length: 20 }),
  toNumber: varchar("to_number", { length: 20 }),
  message: text("message"),
  status: mysqlEnum("status", ["pending", "delivered", "failed"]).default("pending").notNull(),
  metadata: text("metadata"), // JSON string for additional data
  timestamp: timestamp("timestamp").defaultNow().notNull(),
});

export type WebhookLog = typeof webhookLogs.$inferSelect;
export type InsertWebhookLog = typeof webhookLogs.$inferInsert;

/**
 * Settings table - stores system-wide configuration
 */
export const settings = mysqlTable("settings", {
  id: serial("id").primaryKey(),
  key: varchar("key", { length: 255 }).notNull().unique(),
  value: text("value"),
  updatedAt: timestamp("updated_at").defaultNow().onUpdateNow().notNull(),
});

export type Setting = typeof settings.$inferSelect;
export type InsertSetting = typeof settings.$inferInsert;

/**
 * Relations
 */
export const webhookLogsRelations = relations(webhookLogs, ({ one }) => ({
  account: one(webhookAccounts, {
    fields: [webhookLogs.accountId],
    references: [webhookAccounts.id],
  }),
  agent: one(users, {
    fields: [webhookLogs.agentId],
    references: [users.id],
  }),
}));

export const webhookAccountsRelations = relations(webhookAccounts, ({ many }) => ({
  logs: many(webhookLogs),
}));

export const usersRelations = relations(users, ({ many }) => ({
  assignedMessages: many(webhookLogs),
}));
