import { eq } from "drizzle-orm";
import { drizzle } from "drizzle-orm/mysql2";
import { InsertUser, User, users, webhookAccounts, webhookLogs } from "../drizzle/schema";

let _db: ReturnType<typeof drizzle> | null = null;

// Lazily create the drizzle instance so local tooling can run without a DB.
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

/**
 * Get user by email (for authentication)
 */
export async function getUserByEmail(email: string) {
  const db = await getDb();
  if (!db) {
    console.warn("[Database] Cannot get user: database not available");
    return undefined;
  }

  const result = await db.select().from(users).where(eq(users.email, email)).limit(1);
  return result.length > 0 ? result[0] : undefined;
}

/**
 * Get user by ID
 */
export async function getUserById(id: number) {
  const db = await getDb();
  if (!db) {
    console.warn("[Database] Cannot get user: database not available");
    return undefined;
  }

  const result = await db.select().from(users).where(eq(users.id, id)).limit(1);
  return result.length > 0 ? result[0] : undefined;
}

/**
 * Create a new user
 */
export async function createUser(user: InsertUser) {
  const db = await getDb();
  if (!db) {
    throw new Error("Database not available");
  }

  const result = await db.insert(users).values(user);
  return result;
}

/**
 * Get all webhook accounts
 */
export async function getWebhookAccounts() {
  const db = await getDb();
  if (!db) {
    return [];
  }

  return await db.select().from(webhookAccounts);
}

/**
 * Get webhook account by ID
 */
export async function getWebhookAccountById(id: number) {
  const db = await getDb();
  if (!db) {
    return undefined;
  }

  const result = await db.select().from(webhookAccounts).where(eq(webhookAccounts.id, id)).limit(1);
  return result.length > 0 ? result[0] : undefined;
}

/**
 * Get webhook account by API key
 */
export async function getWebhookAccountByApiKey(apiKey: string) {
  const db = await getDb();
  if (!db) {
    return undefined;
  }

  const result = await db.select().from(webhookAccounts).where(eq(webhookAccounts.apiKey, apiKey)).limit(1);
  return result.length > 0 ? result[0] : undefined;
}

/**
 * Get webhook logs with pagination
 */
export async function getWebhookLogs(limit: number = 100, offset: number = 0) {
  const db = await getDb();
  if (!db) {
    return [];
  }

  return await db.select().from(webhookLogs).limit(limit).offset(offset).orderBy(webhookLogs.timestamp);
}

/**
 * Get webhook logs by account ID
 */
export async function getWebhookLogsByAccountId(accountId: number, limit: number = 100) {
  const db = await getDb();
  if (!db) {
    return [];
  }

  return await db.select().from(webhookLogs).where(eq(webhookLogs.accountId, accountId)).limit(limit).orderBy(webhookLogs.timestamp);
}

/**
 * Get webhook logs by agent ID (for agent dashboard)
 */
export async function getWebhookLogsByAgentId(agentId: number, limit: number = 100) {
  const db = await getDb();
  if (!db) {
    return [];
  }

  return await db.select().from(webhookLogs).where(eq(webhookLogs.agentId, agentId)).limit(limit).orderBy(webhookLogs.timestamp);
}

/**
 * Legacy OAuth functions (kept for compatibility with sdk.ts)
 * These are not used in custom auth flow
 */
export async function getUserByOpenId(openId: string): Promise<User | undefined> {
  // Stub function for OAuth compatibility - not used in custom auth
  return undefined;
}

export async function upsertUser(user: any): Promise<void> {
  // Stub function for OAuth compatibility - not used in custom auth
  console.warn('[DB] upsertUser called but OAuth is disabled');
  return Promise.resolve();
}
