import { int, mysqlEnum, mysqlTable, serial, text, timestamp, varchar, boolean } from "drizzle-orm/mysql-core";
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
  password: text("password").notNull(), // argon2 hashed password
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
  webhookSecret: varchar("webhook_secret", { length: 64 }).notNull(), // WaSender webhook secret for validation
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
 * Agent-Account linking table (many-to-many)
 * Links agents to the webhook accounts they can access
 */
export const agentAccounts = mysqlTable("agent_accounts", {
  id: serial("id").primaryKey(),
  agentId: int("agent_id").notNull(),
  accountId: int("account_id").notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export type AgentAccount = typeof agentAccounts.$inferSelect;
export type InsertAgentAccount = typeof agentAccounts.$inferInsert;

/**
 * Conversations table - stores customer conversations
 * Each conversation belongs to a webhook account and can be claimed by an agent
 */
export const conversations = mysqlTable("conversations", {
  id: serial("id").primaryKey(),
  accountId: int("account_id").notNull(),
  customerPhone: varchar("customer_phone", { length: 20 }).notNull(),
  customerName: text("customer_name"), // Editable display name
  lastMessageAt: timestamp("last_message_at").defaultNow().notNull(),
  unreadCount: int("unread_count").default(0).notNull(),
  isNew: boolean("is_new").default(true).notNull(), // NEW badge for never-viewed conversations
  activeResponderId: int("active_responder_id"), // Agent who claimed this conversation
  claimedAt: timestamp("claimed_at"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export type Conversation = typeof conversations.$inferSelect;
export type InsertConversation = typeof conversations.$inferInsert;

/**
 * Messages table - stores all chat messages
 * Links to conversations and optionally to agents (for outbound messages)
 * Last deployment: 2026-01-30 02:08 UTC
 */
export const messages = mysqlTable("messages", {
  id: serial("id").primaryKey(),
  conversationId: int("conversation_id").notNull(),
  direction: mysqlEnum("direction", ["inbound", "outbound"]).notNull(),
  content: text("content"),
  fromNumber: varchar("from_number", { length: 20 }),
  toNumber: varchar("to_number", { length: 20 }),
  agentId: int("agent_id"), // For outbound messages
  mediaUrl: text("media_url"),
  mediaType: mysqlEnum("media_type", ["image", "video", "audio", "document", "sticker"]),
  status: mysqlEnum("status", ["pending", "sent", "delivered", "failed"]).default("pending").notNull(),
  externalId: varchar("external_id", { length: 255 }).unique(), // WASender message ID for deduplication
  timestamp: timestamp("timestamp").defaultNow().notNull(),
});

export type Message = typeof messages.$inferSelect;
export type InsertMessage = typeof messages.$inferInsert;

/**
 * Webhook logs table - stores all incoming/outgoing webhook events for audit
 */
export const webhookLogs = mysqlTable("webhook_logs", {
  id: serial("id").primaryKey(),
  accountId: int("account_id").notNull(),
  direction: mysqlEnum("direction", ["inbound", "outbound"]).notNull(),
  fromNumber: varchar("from_number", { length: 20 }),
  toNumber: varchar("to_number", { length: 20 }),
  message: text("message"),
  status: mysqlEnum("status", ["received", "sent", "failed"]).default("received").notNull(),
  metadata: text("metadata"), // JSON string for additional data
  timestamp: timestamp("timestamp").defaultNow().notNull(),
});

export type WebhookLog = typeof webhookLogs.$inferSelect;
export type InsertWebhookLog = typeof webhookLogs.$inferInsert;

/**
 * Time logs table - tracks agent login/logout times
 */
export const timeLogs = mysqlTable("time_logs", {
  id: serial("id").primaryKey(),
  agentId: int("agent_id").notNull(),
  loginAt: timestamp("login_at").notNull(),
  logoutAt: timestamp("logout_at"),
  totalDuration: int("total_duration").default(0), // in seconds
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export type TimeLog = typeof timeLogs.$inferSelect;
export type InsertTimeLog = typeof timeLogs.$inferInsert;

/**
 * Breaks table - tracks agent break times (lunch, short breaks, etc.)
 */
export const breaks = mysqlTable("breaks", {
  id: serial("id").primaryKey(),
  timeLogId: int("time_log_id").notNull(),
  breakType: mysqlEnum("break_type", ["lunch", "short", "other"]).notNull(),
  startAt: timestamp("start_at").notNull(),
  endAt: timestamp("end_at"),
  duration: int("duration").default(0), // in seconds
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export type Break = typeof breaks.$inferSelect;
export type InsertBreak = typeof breaks.$inferInsert;

/**
 * Quick reply templates table - stores agent's saved quick replies
 */
export const quickReplyTemplates = mysqlTable("quick_reply_templates", {
  id: serial("id").primaryKey(),
  agentId: int("agent_id").notNull(),
  name: varchar("name", { length: 255 }).notNull(),
  message: text("message").notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().onUpdateNow().notNull(),
});

export type QuickReplyTemplate = typeof quickReplyTemplates.$inferSelect;
export type InsertQuickReplyTemplate = typeof quickReplyTemplates.$inferInsert;

/**
 * Conversation notes table - internal notes visible only to agents
 */
export const conversationNotes = mysqlTable("conversation_notes", {
  id: serial("id").primaryKey(),
  conversationId: int("conversation_id").notNull(),
  agentId: int("agent_id").notNull(),
  content: text("content").notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().onUpdateNow().notNull(),
});

export type ConversationNote = typeof conversationNotes.$inferSelect;
export type InsertConversationNote = typeof conversationNotes.$inferInsert;

/**
 * Conversation tags table - custom tags for organizing conversations
 */
export const conversationTags = mysqlTable("conversation_tags", {
  id: serial("id").primaryKey(),
  conversationId: int("conversation_id").notNull(),
  tagName: varchar("tag_name", { length: 50 }).notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export type ConversationTag = typeof conversationTags.$inferSelect;
export type InsertConversationTag = typeof conversationTags.$inferInsert;

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
export const usersRelations = relations(users, ({ many }) => ({
  agentAccounts: many(agentAccounts),
  timeLogs: many(timeLogs),
  quickReplyTemplates: many(quickReplyTemplates),
  conversationNotes: many(conversationNotes),
  sentMessages: many(messages),
}));

export const webhookAccountsRelations = relations(webhookAccounts, ({ many }) => ({
  agentAccounts: many(agentAccounts),
  conversations: many(conversations),
  webhookLogs: many(webhookLogs),
}));

export const agentAccountsRelations = relations(agentAccounts, ({ one }) => ({
  agent: one(users, {
    fields: [agentAccounts.agentId],
    references: [users.id],
  }),
  account: one(webhookAccounts, {
    fields: [agentAccounts.accountId],
    references: [webhookAccounts.id],
  }),
}));

export const conversationsRelations = relations(conversations, ({ one, many }) => ({
  account: one(webhookAccounts, {
    fields: [conversations.accountId],
    references: [webhookAccounts.id],
  }),
  activeResponder: one(users, {
    fields: [conversations.activeResponderId],
    references: [users.id],
  }),
  messages: many(messages),
  notes: many(conversationNotes),
  tags: many(conversationTags),
}));

export const messagesRelations = relations(messages, ({ one }) => ({
  conversation: one(conversations, {
    fields: [messages.conversationId],
    references: [conversations.id],
  }),
  agent: one(users, {
    fields: [messages.agentId],
    references: [users.id],
  }),
}));

export const webhookLogsRelations = relations(webhookLogs, ({ one }) => ({
  account: one(webhookAccounts, {
    fields: [webhookLogs.accountId],
    references: [webhookAccounts.id],
  }),
}));

export const timeLogsRelations = relations(timeLogs, ({ one, many }) => ({
  agent: one(users, {
    fields: [timeLogs.agentId],
    references: [users.id],
  }),
  breaks: many(breaks),
}));

export const breaksRelations = relations(breaks, ({ one }) => ({
  timeLog: one(timeLogs, {
    fields: [breaks.timeLogId],
    references: [timeLogs.id],
  }),
}));

export const quickReplyTemplatesRelations = relations(quickReplyTemplates, ({ one }) => ({
  agent: one(users, {
    fields: [quickReplyTemplates.agentId],
    references: [users.id],
  }),
}));

export const conversationNotesRelations = relations(conversationNotes, ({ one }) => ({
  conversation: one(conversations, {
    fields: [conversationNotes.conversationId],
    references: [conversations.id],
  }),
  agent: one(users, {
    fields: [conversationNotes.agentId],
    references: [users.id],
  }),
}));

export const conversationTagsRelations = relations(conversationTags, ({ one }) => ({
  conversation: one(conversations, {
    fields: [conversationTags.conversationId],
    references: [conversations.id],
  }),
}));
