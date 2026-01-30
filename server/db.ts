import { eq, and, desc, sql, like, or, isNull, inArray } from "drizzle-orm";
import { drizzle } from "drizzle-orm/mysql2";
import {
  users,
  webhookAccounts,
  agentAccounts,
  conversations,
  messages,
  webhookLogs,
  timeLogs,
  breaks,
  quickReplyTemplates,
  conversationNotes,
  conversationTags,
  settings,
  type User,
  type InsertUser,
  type WebhookAccount,
  type InsertWebhookAccount,
  type AgentAccount,
  type InsertAgentAccount,
  type Conversation,
  type InsertConversation,
  type Message,
  type InsertMessage,
  type WebhookLog,
  type InsertWebhookLog,
  type TimeLog,
  type InsertTimeLog,
  type Break,
  type InsertBreak,
  type QuickReplyTemplate,
  type InsertQuickReplyTemplate,
  type ConversationNote,
  type InsertConversationNote,
  type ConversationTag,
  type InsertConversationTag,
  type Setting,
  type InsertSetting,
} from "../drizzle/schema";

let _db: ReturnType<typeof drizzle> | null = null;

// Lazily create the drizzle instance
export async function getDb() {
  if (!_db && process.env.DATABASE_URL) {
    try {
      _db = drizzle(process.env.DATABASE_URL);
    } catch (error) {
      console.warn("[Database] Failed to connect:", error);
      _db = null;
    }
  }
  return _db;
}

// ============================================================================
// USER FUNCTIONS
// ============================================================================

export async function getUserByEmail(email: string): Promise<User | undefined> {
  const db = await getDb();
  if (!db) return undefined;
  const result = await db.select().from(users).where(eq(users.email, email)).limit(1);
  return result[0];
}

export async function getUserById(id: number): Promise<User | undefined> {
  const db = await getDb();
  if (!db) return undefined;
  const result = await db.select().from(users).where(eq(users.id, id)).limit(1);
  return result[0];
}

export async function createUser(user: InsertUser): Promise<number> {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  const result = await db.insert(users).values(user);
  return Number(result[0].insertId);
}

export async function updateUser(id: number, updates: Partial<InsertUser>): Promise<void> {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  await db.update(users).set(updates).where(eq(users.id, id));
}

export async function deleteUser(id: number): Promise<void> {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  await db.delete(users).where(eq(users.id, id));
}

export async function getAllAgents(): Promise<User[]> {
  const db = await getDb();
  if (!db) return [];
  return await db.select().from(users).where(eq(users.role, "agent"));
}

// ============================================================================
// WEBHOOK ACCOUNT FUNCTIONS
// ============================================================================

export async function getAllWebhookAccounts(): Promise<WebhookAccount[]> {
  const db = await getDb();
  if (!db) return [];
  return await db.select().from(webhookAccounts).orderBy(desc(webhookAccounts.createdAt));
}

export async function getWebhookAccountById(id: number): Promise<WebhookAccount | undefined> {
  const db = await getDb();
  if (!db) return undefined;
  const result = await db.select().from(webhookAccounts).where(eq(webhookAccounts.id, id)).limit(1);
  return result[0];
}

export async function getWebhookAccountByApiKey(apiKey: string): Promise<WebhookAccount | undefined> {
  const db = await getDb();
  if (!db) return undefined;
  const result = await db.select().from(webhookAccounts).where(eq(webhookAccounts.apiKey, apiKey)).limit(1);
  return result[0];
}

export async function createWebhookAccount(account: InsertWebhookAccount): Promise<number> {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  const result = await db.insert(webhookAccounts).values(account);
  return Number(result[0].insertId);
}

export async function updateWebhookAccount(id: number, updates: Partial<InsertWebhookAccount>): Promise<void> {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  await db.update(webhookAccounts).set(updates).where(eq(webhookAccounts.id, id));
}

export async function deleteWebhookAccount(id: number): Promise<void> {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  await db.delete(webhookAccounts).where(eq(webhookAccounts.id, id));
}

export async function incrementAccountMessagesSent(accountId: number): Promise<void> {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  await db
    .update(webhookAccounts)
    .set({ messagesSent: sql`${webhookAccounts.messagesSent} + 1` })
    .where(eq(webhookAccounts.id, accountId));
}

export async function incrementAccountMessagesReceived(accountId: number): Promise<void> {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  await db
    .update(webhookAccounts)
    .set({ messagesReceived: sql`${webhookAccounts.messagesReceived} + 1` })
    .where(eq(webhookAccounts.id, accountId));
}

// ============================================================================
// AGENT-ACCOUNT LINKING FUNCTIONS
// ============================================================================

export async function linkAgentToAccount(agentId: number, accountId: number): Promise<number> {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  const result = await db.insert(agentAccounts).values({ agentId, accountId });
  return Number(result[0].insertId);
}

export async function unlinkAgentFromAccount(agentId: number, accountId: number): Promise<void> {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  await db.delete(agentAccounts).where(and(eq(agentAccounts.agentId, agentId), eq(agentAccounts.accountId, accountId)));
}

export async function getAgentAccounts(agentId: number): Promise<WebhookAccount[]> {
  const db = await getDb();
  if (!db) return [];
  const result = await db
    .select({ account: webhookAccounts })
    .from(agentAccounts)
    .innerJoin(webhookAccounts, eq(agentAccounts.accountId, webhookAccounts.id))
    .where(eq(agentAccounts.agentId, agentId));
  return result.map((r) => r.account);
}

export async function getAccountAgents(accountId: number): Promise<User[]> {
  const db = await getDb();
  if (!db) return [];
  const result = await db
    .select({ agent: users })
    .from(agentAccounts)
    .innerJoin(users, eq(agentAccounts.agentId, users.id))
    .where(eq(agentAccounts.accountId, accountId));
  return result.map((r) => r.agent);
}

// ============================================================================
// CONVERSATION FUNCTIONS
// ============================================================================

export async function getConversationsByAccountIds(accountIds: number[], searchQuery?: string): Promise<Conversation[]> {
  const db = await getDb();
  if (!db) return [];
  
  const conditions = [inArray(conversations.accountId, accountIds)];
  
  if (searchQuery) {
    conditions.push(
      or(
        like(conversations.customerName, `%${searchQuery}%`),
        like(conversations.customerPhone, `%${searchQuery}%`)
      )!
    );
  }
  
  return await db
    .select()
    .from(conversations)
    .where(and(...conditions))
    .orderBy(desc(conversations.lastMessageAt));
}
export async function getConversationById(id: number): Promise<Conversation | undefined> {
  const db = await getDb();
  if (!db) return undefined;
  const result = await db.select().from(conversations).where(eq(conversations.id, id)).limit(1);
  return result[0];
}

// Normalize phone number by removing all non-numeric characters
export function normalizePhoneNumber(phone: string): string {
  return phone.replace(/\D/g, '');
}

export async function getConversationByPhone(customerPhone: string, accountId: number): Promise<Conversation | undefined> {
  const db = await getDb();
  if (!db) return undefined;
  
  // Normalize the input phone number
  const normalizedPhone = normalizePhoneNumber(customerPhone);
  
  // Get all conversations for this account
  const allConversations = await db
    .select()
    .from(conversations)
    .where(eq(conversations.accountId, accountId));
  
  // Find conversation with matching normalized phone number
  const match = allConversations.find(conv => 
    normalizePhoneNumber(conv.customerPhone) === normalizedPhone
  );
  
  return match;
}

export async function createConversation(conversation: InsertConversation): Promise<number> {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  const result = await db.insert(conversations).values(conversation);
  return Number(result[0].insertId);
}
export async function getOrCreateConversation(params: {
  accountId: number;
  customerPhone: string;
  customerName?: string;
}): Promise<Conversation> {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  
  // Try to find existing conversation
  const existing = await getConversationByPhone(params.customerPhone, params.accountId);
  if (existing) {
    return existing;
  }
  
  // Create new conversation
  const conversationId = await createConversation({
    accountId: params.accountId,
    customerPhone: params.customerPhone,
    customerName: params.customerName || params.customerPhone,
    lastMessageAt: new Date(),
    unreadCount: 0,
    isNew: true,
  });
  
  // Fetch and return the newly created conversation
  const newConversation = await getConversationById(conversationId);
  if (!newConversation) {
    throw new Error("Failed to create conversation");
  }
  
  return newConversation;
}
export async function updateConversation(id: number, updates: Partial<InsertConversation>): Promise<void> {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  await db.update(conversations).set(updates).where(eq(conversations.id, id));
}

export async function deleteConversation(id: number): Promise<void> {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  await db.delete(conversations).where(eq(conversations.id, id));
}

export async function markConversationAsViewed(id: number): Promise<void> {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  await db.update(conversations).set({ isNew: false }).where(eq(conversations.id, id));
}

export async function markConversationAsRead(id: number): Promise<void> {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  await db.update(conversations).set({ unreadCount: 0 }).where(eq(conversations.id, id));
}

export async function claimConversation(conversationId: number, agentId: number): Promise<void> {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  await db
    .update(conversations)
    .set({ activeResponderId: agentId, claimedAt: new Date() })
    .where(eq(conversations.id, conversationId));
}

export async function releaseConversation(conversationId: number): Promise<void> {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  await db
    .update(conversations)
    .set({ activeResponderId: null, claimedAt: null })
    .where(eq(conversations.id, conversationId));
}

export async function updateCustomerName(conversationId: number, customerName: string): Promise<void> {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  await db.update(conversations).set({ customerName }).where(eq(conversations.id, conversationId));
}

// ============================================================================
// MESSAGE FUNCTIONS
// ============================================================================

export async function getMessagesByConversationId(conversationId: number): Promise<Message[]> {
  const db = await getDb();
  if (!db) return [];
  return await db.select().from(messages).where(eq(messages.conversationId, conversationId)).orderBy(messages.timestamp);
}

export async function getMessageByExternalId(externalId: string): Promise<Message | undefined> {
  const db = await getDb();
  if (!db) return undefined;
  const result = await db.select().from(messages).where(eq(messages.externalId, externalId)).limit(1);
  return result[0];
}

export async function createMessage(message: InsertMessage): Promise<number> {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  const result = await db.insert(messages).values(message);
  
  // Update conversation last_message_at and unread_count
  if (message.direction === "inbound") {
    await db
      .update(conversations)
      .set({
        lastMessageAt: new Date(),
        unreadCount: sql`${conversations.unreadCount} + 1`,
      })
      .where(eq(conversations.id, message.conversationId));
  } else {
    await db
      .update(conversations)
      .set({ lastMessageAt: new Date() })
      .where(eq(conversations.id, message.conversationId));
  }
  
  return Number(result[0].insertId);
}

// ============================================================================
// WEBHOOK LOG FUNCTIONS
// ============================================================================

export async function createWebhookLog(log: InsertWebhookLog): Promise<number> {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  const result = await db.insert(webhookLogs).values(log);
  return Number(result[0].insertId);
}

export async function getWebhookLogsByAccountId(accountId: number, limit: number = 100): Promise<WebhookLog[]> {
  const db = await getDb();
  if (!db) return [];
  return await db
    .select()
    .from(webhookLogs)
    .where(eq(webhookLogs.accountId, accountId))
    .orderBy(desc(webhookLogs.timestamp))
    .limit(limit);
}

// ============================================================================
// TIME LOG FUNCTIONS
// ============================================================================

export async function createTimeLog(log: InsertTimeLog): Promise<number> {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  const result = await db.insert(timeLogs).values(log);
  return Number(result[0].insertId);
}

export async function getActiveTimeLog(agentId: number): Promise<TimeLog | undefined> {
  const db = await getDb();
  if (!db) return undefined;
  const result = await db
    .select()
    .from(timeLogs)
    .where(and(eq(timeLogs.agentId, agentId), isNull(timeLogs.logoutAt)))
    .limit(1);
  return result[0];
}

export async function updateTimeLog(id: number, updates: Partial<InsertTimeLog>): Promise<void> {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  await db.update(timeLogs).set(updates).where(eq(timeLogs.id, id));
}

export async function getAgentTimeLogs(agentId: number, limit: number = 30): Promise<TimeLog[]> {
  const db = await getDb();
  if (!db) return [];
  return await db
    .select()
    .from(timeLogs)
    .where(eq(timeLogs.agentId, agentId))
    .orderBy(desc(timeLogs.loginAt))
    .limit(limit);
}

// ============================================================================
// BREAK FUNCTIONS
// ============================================================================

export async function createBreak(breakRecord: InsertBreak): Promise<number> {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  const result = await db.insert(breaks).values(breakRecord);
  return Number(result[0].insertId);
}

export async function getActiveBreak(timeLogId: number): Promise<Break | undefined> {
  const db = await getDb();
  if (!db) return undefined;
  const result = await db
    .select()
    .from(breaks)
    .where(and(eq(breaks.timeLogId, timeLogId), isNull(breaks.endAt)))
    .limit(1);
  return result[0];
}

export async function updateBreak(id: number, updates: Partial<InsertBreak>): Promise<void> {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  await db.update(breaks).set(updates).where(eq(breaks.id, id));
}

// ============================================================================
// QUICK REPLY TEMPLATE FUNCTIONS
// ============================================================================

export async function getQuickReplyTemplates(agentId: number): Promise<QuickReplyTemplate[]> {
  const db = await getDb();
  if (!db) return [];
  return await db.select().from(quickReplyTemplates).where(eq(quickReplyTemplates.agentId, agentId));
}

export async function createQuickReplyTemplate(template: InsertQuickReplyTemplate): Promise<number> {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  const result = await db.insert(quickReplyTemplates).values(template);
  return Number(result[0].insertId);
}

export async function updateQuickReplyTemplate(id: number, updates: Partial<InsertQuickReplyTemplate>): Promise<void> {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  await db.update(quickReplyTemplates).set(updates).where(eq(quickReplyTemplates.id, id));
}

export async function deleteQuickReplyTemplate(id: number): Promise<void> {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  await db.delete(quickReplyTemplates).where(eq(quickReplyTemplates.id, id));
}

// ============================================================================
// CONVERSATION NOTE FUNCTIONS
// ============================================================================

export async function getConversationNotes(conversationId: number): Promise<ConversationNote[]> {
  const db = await getDb();
  if (!db) return [];
  return await db
    .select()
    .from(conversationNotes)
    .where(eq(conversationNotes.conversationId, conversationId))
    .orderBy(conversationNotes.createdAt);
}

export async function createConversationNote(note: InsertConversationNote): Promise<number> {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  const result = await db.insert(conversationNotes).values(note);
  return Number(result[0].insertId);
}

export async function updateConversationNote(id: number, content: string): Promise<void> {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  await db.update(conversationNotes).set({ content, updatedAt: new Date() }).where(eq(conversationNotes.id, id));
}

export async function deleteConversationNote(id: number): Promise<void> {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  await db.delete(conversationNotes).where(eq(conversationNotes.id, id));
}

// ============================================================================
// CONVERSATION TAG FUNCTIONS
// ============================================================================

export async function getConversationTags(conversationId: number): Promise<ConversationTag[]> {
  const db = await getDb();
  if (!db) return [];
  return await db.select().from(conversationTags).where(eq(conversationTags.conversationId, conversationId));
}

export async function addConversationTag(conversationId: number, tagName: string): Promise<number> {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  const result = await db.insert(conversationTags).values({ conversationId, tagName });
  return Number(result[0].insertId);
}

export async function removeConversationTag(conversationId: number, tagName: string): Promise<void> {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  await db
    .delete(conversationTags)
    .where(and(eq(conversationTags.conversationId, conversationId), eq(conversationTags.tagName, tagName)));
}

// ============================================================================
// SETTINGS FUNCTIONS
// ============================================================================

export async function getSetting(key: string): Promise<string | undefined> {
  const db = await getDb();
  if (!db) return undefined;
  const result = await db.select().from(settings).where(eq(settings.key, key)).limit(1);
  return result[0]?.value || undefined;
}

export async function setSetting(key: string, value: string): Promise<void> {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  
  const existing = await getSetting(key);
  if (existing) {
    await db.update(settings).set({ value, updatedAt: new Date() }).where(eq(settings.key, key));
  } else {
    await db.insert(settings).values({ key, value });
  }
}

export async function getAllSettings(): Promise<Setting[]> {
  const db = await getDb();
  if (!db) return [];
  return await db.select().from(settings);
}
