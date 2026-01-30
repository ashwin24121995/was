import { z } from "zod";
import { TRPCError } from "@trpc/server";
import { createWASenderClient } from "./wasender-api";
import { eq, desc } from "drizzle-orm";
import argon2 from "argon2";
import jwt from "jsonwebtoken";

// Custom random string generator (no crypto dependency)
function generateRandomString(length: number): string {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
  let result = '';
  for (let i = 0; i < length; i++) {
    result += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return result;
}

import { COOKIE_NAME } from "@shared/const";
import { getSessionCookieOptions } from "./_core/cookies";
import { systemRouter } from "./_core/systemRouter";
import { publicProcedure, protectedProcedure, router } from "./_core/trpc";
import { 
  getUserByEmail, 
  getUserById, 
  createUser,
  updateUser,
  deleteUser,
  getAllAgents,
  getAllWebhookAccounts,
  getWebhookAccountById,
  getWebhookAccountByApiKey,
  createWebhookAccount,
  updateWebhookAccount,
  deleteWebhookAccount,
  linkAgentToAccount,
  unlinkAgentFromAccount,
  getAgentAccounts,
  getAccountAgents,
  getConversationsByAccountIds,
  getConversationById,
  getConversationByPhone,
  createConversation,
  getOrCreateConversation,
  updateConversation,
  deleteConversation,
  deleteMessagesByConversationId,
  markConversationAsViewed,
  markConversationAsRead,
  claimConversation,
  releaseConversation,
  updateCustomerName,
  getMessagesByConversationId,
  createMessage,
  createWebhookLog,
  getWebhookLogsByAccountId,
  createTimeLog,
  getActiveTimeLog,
  updateTimeLog,
  getAgentTimeLogs,
  createBreak,
  getActiveBreak,
  updateBreak,
  getQuickReplyTemplates,
  createQuickReplyTemplate,
  updateQuickReplyTemplate,
  deleteQuickReplyTemplate,
  getConversationNotes,
  createConversationNote,
  updateConversationNote,
  deleteConversationNote,
  getConversationTags,
  addConversationTag,
  removeConversationTag,
  getSetting,
  setSetting,
  getAllSettings,
  getDb
} from "./db";
import { users } from "../drizzle/schema";

// Helper to generate JWT token
function generateJWT(user: { id: number; name: string; email: string; role: string }) {
  const secret = process.env.JWT_SECRET || "default-secret-change-in-production";
  const token = jwt.sign({
    userId: user.id,
    name: user.name,
    email: user.email,
    role: user.role,
    loginMethod: "password",
  }, secret, {
    expiresIn: "7d",
  });
  
  return token;
}

// Admin-only procedure
const adminProcedure = protectedProcedure.use(({ ctx, next }) => {
  if (ctx.user.role !== "admin") {
    throw new TRPCError({ code: "FORBIDDEN", message: "Admin access required" });
  }
  return next({ ctx });
});

// Agent-only procedure
const agentProcedure = protectedProcedure.use(({ ctx, next }) => {
  if (ctx.user.role !== "agent") {
    throw new TRPCError({ code: "FORBIDDEN", message: "Agent access required" });
  }
  return next({ ctx });
});

export const appRouter = router({
  system: systemRouter,
  
  // ============================================================================
  // AUTHENTICATION
  // ============================================================================
  auth: router({
    // Get current user
    me: publicProcedure.query(opts => opts.ctx.user),
    
    // Admin registration
    register: publicProcedure
      .input(
        z.object({
          name: z.string().min(1, "Name is required"),
          email: z.string().email("Invalid email address"),
          password: z.string().min(6, "Password must be at least 6 characters"),
        })
      )
      .mutation(async ({ input, ctx }) => {
        const existingUser = await getUserByEmail(input.email);
        if (existingUser) {
          throw new TRPCError({
            code: "CONFLICT",
            message: "Email already registered",
          });
        }

        const hashedPassword = await argon2.hash(input.password);

        await createUser({
          name: input.name,
          email: input.email,
          password: hashedPassword,
          role: "admin",
          loginMethod: "password",
        });

        const user = await getUserByEmail(input.email);
        if (!user) {
          throw new TRPCError({
            code: "INTERNAL_SERVER_ERROR",
            message: "Failed to create user",
          });
        }

        const token = generateJWT(user);

        const cookieOptions = getSessionCookieOptions(ctx.req);
        ctx.res.cookie("admin_session", token, {
          ...cookieOptions,
          maxAge: 7 * 24 * 60 * 60 * 1000,
        });

        return {
          success: true,
          user: {
            id: user.id,
            name: user.name,
            email: user.email,
            role: user.role,
          },
        };
      }),

    // Admin login
    adminLogin: publicProcedure
      .input(
        z.object({
          email: z.string().email("Invalid email address"),
          password: z.string().min(1, "Password is required"),
        })
      )
      .mutation(async ({ input, ctx }) => {
        const user = await getUserByEmail(input.email);

        if (!user || !user.password) {
          throw new TRPCError({
            code: "UNAUTHORIZED",
            message: "Invalid email or password",
          });
        }

        const isValid = await argon2.verify(user.password, input.password);

        if (!isValid) {
          throw new TRPCError({
            code: "UNAUTHORIZED",
            message: "Invalid email or password",
          });
        }

        if (user.role !== "admin") {
          throw new TRPCError({
            code: "FORBIDDEN",
            message: "Admin access required",
          });
        }

        const token = generateJWT(user);

        const cookieOptions = getSessionCookieOptions(ctx.req);
        ctx.res.cookie("admin_session", token, {
          ...cookieOptions,
          maxAge: 7 * 24 * 60 * 60 * 1000,
        });

        const db = await getDb();
        if (db) {
          await db.update(users).set({ lastSignedIn: new Date() }).where(eq(users.id, user.id));
        }

        return {
          success: true,
          user: {
            id: user.id,
            name: user.name,
            email: user.email,
            role: user.role,
          },
        };
      }),

    // Agent login
    agentLogin: publicProcedure
      .input(
        z.object({
          email: z.string().email("Invalid email address"),
          password: z.string().min(1, "Password is required"),
        })
      )
      .mutation(async ({ input, ctx }) => {
        const user = await getUserByEmail(input.email);

        if (!user || !user.password) {
          throw new TRPCError({
            code: "UNAUTHORIZED",
            message: "Invalid email or password",
          });
        }

        const isValid = await argon2.verify(user.password, input.password);

        if (!isValid) {
          throw new TRPCError({
            code: "UNAUTHORIZED",
            message: "Invalid email or password",
          });
        }

        if (user.role !== "agent") {
          throw new TRPCError({
            code: "FORBIDDEN",
            message: "Agent access required",
          });
        }

        const token = generateJWT(user);

        const cookieOptions = getSessionCookieOptions(ctx.req);
        ctx.res.cookie("agent_session", token, {
          ...cookieOptions,
          maxAge: 7 * 24 * 60 * 60 * 1000,
        });

        const db = await getDb();
        if (db) {
          await db.update(users).set({ lastSignedIn: new Date() }).where(eq(users.id, user.id));
        }

        return {
          success: true,
          user: {
            id: user.id,
            name: user.name,
            email: user.email,
            role: user.role,
          },
          token, // Return token for Socket.IO authentication
        };
      }),

    // Logout
    logout: publicProcedure.mutation(({ ctx }) => {
      const cookieOptions = getSessionCookieOptions(ctx.req);
      ctx.res.clearCookie(COOKIE_NAME, { ...cookieOptions, maxAge: -1 });
      ctx.res.clearCookie("admin_session", { ...cookieOptions, maxAge: -1 });
      ctx.res.clearCookie("agent_session", { ...cookieOptions, maxAge: -1 });
      return { success: true };
    }),
  }),

  // ============================================================================
  // WEBHOOK ACCOUNT MANAGEMENT (Admin Only)
  // ============================================================================
  webhookAccounts: router({
    list: adminProcedure.query(async () => {
      return await getAllWebhookAccounts();
    }),

    getById: adminProcedure
      .input(z.object({ id: z.number() }))
      .query(async ({ input }) => {
        return await getWebhookAccountById(input.id);
      }),

    create: adminProcedure
      .input(
        z.object({
          name: z.string().min(1, "Name is required"),
          apiKey: z.string().min(1, "API Key is required"),
          webhookSecret: z.string().min(1, "Webhook Secret is required"),
          webhookUrl: z.string().url().optional(),
          phoneNumber: z.string().optional(),
        })
      )
      .mutation(async ({ input }) => {
        const accountId = await createWebhookAccount({
          name: input.name,
          apiKey: input.apiKey,
          webhookSecret: input.webhookSecret,
          webhookUrl: input.webhookUrl,
          phoneNumber: input.phoneNumber,
          status: "active",
        });

        return {
          success: true,
          apiKey: input.apiKey,
          accountId,
        };
      }),

    update: adminProcedure
      .input(
        z.object({
          id: z.number(),
          name: z.string().optional(),
          webhookUrl: z.string().url().optional(),
          phoneNumber: z.string().optional(),
          status: z.enum(["active", "inactive"]).optional(),
        })
      )
      .mutation(async ({ input }) => {
        const { id, ...updates } = input;
        await updateWebhookAccount(id, updates);
        return { success: true };
      }),

    delete: adminProcedure
      .input(z.object({ id: z.number() }))
      .mutation(async ({ input }) => {
        await deleteWebhookAccount(input.id);
        return { success: true };
      }),

    regenerateApiKey: adminProcedure
      .input(z.object({ id: z.number() }))
      .mutation(async ({ input }) => {
        const newApiKey = generateRandomString(32);
        await updateWebhookAccount(input.id, { apiKey: newApiKey });
        return { success: true, apiKey: newApiKey };
      }),

    testConnection: adminProcedure
      .input(z.object({ id: z.number() }))
      .mutation(async ({ input }) => {
        const account = await getWebhookAccountById(input.id);
        if (!account) {
          throw new TRPCError({
            code: "NOT_FOUND",
            message: "Webhook account not found",
          });
        }

        const wasenderClient = createWASenderClient(account.apiKey);
        const status = await wasenderClient.getSessionStatus();

        if (!status) {
          return {
            success: false,
            connected: false,
            message: "Failed to connect to WaSender API. Please check your API key.",
          };
        }

        return {
          success: true,
          connected: status.status === "connected",
          status: status.status,
          message:
            status.status === "connected"
              ? "✅ Connected successfully!"
              : status.status === "qr"
              ? "⚠️ Waiting for QR code scan"
              : "❌ Not connected. Please scan QR code in WaSender.",
          user: status.user,
        };
      }),
  }),

  // ============================================================================
  // AGENT MANAGEMENT (Admin Only)
  // ============================================================================
  agents: router({
    list: adminProcedure.query(async () => {
      return await getAllAgents();
    }),

    create: adminProcedure
      .input(
        z.object({
          name: z.string().min(1, "Name is required"),
          email: z.string().email("Invalid email address"),
          password: z.string().min(6, "Password must be at least 6 characters"),
        })
      )
      .mutation(async ({ input }) => {
        const existingUser = await getUserByEmail(input.email);
        if (existingUser) {
          throw new TRPCError({
            code: "CONFLICT",
            message: "Email already registered",
          });
        }

        const hashedPassword = await argon2.hash(input.password);

        const agentId = await createUser({
          name: input.name,
          email: input.email,
          password: hashedPassword,
          role: "agent",
          loginMethod: "password",
        });

        return { success: true, agentId };
      }),

    update: adminProcedure
      .input(
        z.object({
          id: z.number(),
          name: z.string().optional(),
          email: z.string().email().optional(),
        })
      )
      .mutation(async ({ input }) => {
        const { id, ...updates } = input;
        
        if (updates.email) {
          const existing = await getUserByEmail(updates.email);
          if (existing && existing.id !== id) {
            throw new TRPCError({
              code: "CONFLICT",
              message: "Email already in use",
            });
          }
        }
        
        await updateUser(id, updates);
        return { success: true };
      }),

    delete: adminProcedure
      .input(z.object({ id: z.number() }))
      .mutation(async ({ input }) => {
        await deleteUser(input.id);
        return { success: true };
      }),

    linkToAccount: adminProcedure
      .input(
        z.object({
          agentId: z.number(),
          accountId: z.number(),
        })
      )
      .mutation(async ({ input }) => {
        await linkAgentToAccount(input.agentId, input.accountId);
        return { success: true };
      }),

    unlinkFromAccount: adminProcedure
      .input(
        z.object({
          agentId: z.number(),
          accountId: z.number(),
        })
      )
      .mutation(async ({ input }) => {
        await unlinkAgentFromAccount(input.agentId, input.accountId);
        return { success: true };
      }),

    getLinkedAccounts: adminProcedure
      .input(z.object({ agentId: z.number() }))
      .query(async ({ input }) => {
        return await getAgentAccounts(input.agentId);
      }),

    getAccountAgents: adminProcedure
      .input(z.object({ accountId: z.number() }))
      .query(async ({ input }) => {
        return await getAccountAgents(input.accountId);
      }),

    // Agent-accessible endpoint to get their own linked accounts
    getMyLinkedAccounts: agentProcedure
      .query(async ({ ctx }) => {
        return await getAgentAccounts(ctx.user.id);
      }),
  }),

  // ============================================================================
  // WEBHOOK LOGS (Admin Only)
  // ============================================================================
  webhookLogs: router({
    getByAccountId: adminProcedure
      .input(
        z.object({
          accountId: z.number(),
          limit: z.number().default(100),
        })
      )
      .query(async ({ input }) => {
        return await getWebhookLogsByAccountId(input.accountId, input.limit);
      }),
  }),

  // ============================================================================
  // CONVERSATIONS (Agent)
  // ============================================================================
  conversations: router({
    list: agentProcedure
      .input(
        z.object({
          searchQuery: z.string().optional(),
        })
      )
      .query(async ({ ctx, input }) => {
        // Get accounts linked to this agent
        const accounts = await getAgentAccounts(ctx.user.id);
        const accountIds = accounts.map(a => a.id);
        
        if (accountIds.length === 0) {
          return [];
        }
        
        return await getConversationsByAccountIds(accountIds, input.searchQuery);
      }),

    getById: agentProcedure
      .input(z.object({ id: z.number() }))
      .query(async ({ input, ctx }) => {
        const conversation = await getConversationById(input.id);
        
        if (!conversation) {
          throw new TRPCError({
            code: "NOT_FOUND",
            message: "Conversation not found",
          });
        }
        
        // Verify agent has access to this conversation's account
        const accounts = await getAgentAccounts(ctx.user.id);
        const hasAccess = accounts.some(a => a.id === conversation.accountId);
        
        if (!hasAccess) {
          throw new TRPCError({
            code: "FORBIDDEN",
            message: "Access denied",
          });
        }
        
        return conversation;
      }),

    claim: agentProcedure
      .input(z.object({ conversationId: z.number() }))
      .mutation(async ({ input, ctx }) => {
        await claimConversation(input.conversationId, ctx.user.id);
        return { success: true };
      }),

    release: agentProcedure
      .input(z.object({ conversationId: z.number() }))
      .mutation(async ({ input }) => {
        await releaseConversation(input.conversationId);
        return { success: true };
      }),

    markAsViewed: agentProcedure
      .input(z.object({ conversationId: z.number() }))
      .mutation(async ({ input }) => {
        await markConversationAsViewed(input.conversationId);
        return { success: true };
      }),

    markAsRead: agentProcedure
      .input(z.object({ conversationId: z.number() }))
      .mutation(async ({ input }) => {
        await markConversationAsRead(input.conversationId);
        return { success: true };
      }),

    delete: agentProcedure
      .input(z.object({ conversationId: z.number() }))
      .mutation(async ({ input, ctx }) => {
        const conversation = await getConversationById(input.conversationId);
        
        if (!conversation) {
          throw new TRPCError({
            code: "NOT_FOUND",
            message: "Conversation not found",
          });
        }
        
        // Verify agent has access to this conversation's account
        const accounts = await getAgentAccounts(ctx.user.id);
        const hasAccess = accounts.some(a => a.id === conversation.accountId);
        
        if (!hasAccess) {
          throw new TRPCError({
            code: "FORBIDDEN",
            message: "Access denied",
          });
        }
        
        // Delete all messages in this conversation first
        await deleteMessagesByConversationId(input.conversationId);
        
        // Delete the conversation
        await deleteConversation(input.conversationId);
        
        return { success: true };
      }),

    updateCustomerName: agentProcedure
      .input(
        z.object({
          conversationId: z.number(),
          customerName: z.string(),
        })
      )
      .mutation(async ({ input }) => {
        await updateCustomerName(input.conversationId, input.customerName);
        return { success: true };
      }),

    startNewChat: agentProcedure
      .input(
        z.object({
          accountId: z.number(),
          phoneNumber: z.string().min(1, "Phone number is required"),
          initialMessage: z.string().min(1, "Initial message is required"),
        })
      )
      .mutation(async ({ input, ctx }) => {
        // Verify agent has access to this account
        const accounts = await getAgentAccounts(ctx.user.id);
        const hasAccess = accounts.some(a => a.id === input.accountId);
        
        if (!hasAccess) {
          throw new TRPCError({
            code: "FORBIDDEN",
            message: "Access denied to this account",
          });
        }

        // Get webhook account to get API key
        const account = await getWebhookAccountById(input.accountId);
        if (!account) {
          throw new TRPCError({
            code: "NOT_FOUND",
            message: "Webhook account not found",
          });
        }

        // Create or get conversation
        const conversation = await getOrCreateConversation({
          accountId: input.accountId,
          customerPhone: input.phoneNumber,
          customerName: input.phoneNumber,
        });

        // Send message via WASender API
        const { createWASenderClient } = await import("./wasender-api.js");
        const wasenderClient = createWASenderClient(account.apiKey);

        const apiResponse = await wasenderClient.sendTextMessage({
          to: input.phoneNumber,
          message: input.initialMessage,
        });

        if (!apiResponse?.success) {
          throw new TRPCError({
            code: "INTERNAL_SERVER_ERROR",
            message: apiResponse?.error || "Failed to send message",
          });
        }

        // Save message to database
        await createMessage({
          conversationId: conversation.id,
          direction: "outbound",
          content: input.initialMessage,
          agentId: ctx.user.id,
          timestamp: new Date(),
        });

        // Update conversation last message time and claim it
        await updateConversation(conversation.id, {
          lastMessageAt: new Date(),
        });
        await claimConversation(conversation.id, ctx.user.id);

        return { 
          success: true, 
          conversationId: conversation.id,
          conversation,
        };
      }),
  }),

  // ============================================================================
  // MESSAGES (Agent)
  // ============================================================================
  messages: router({
    getByConversationId: agentProcedure
      .input(z.object({ conversationId: z.number() }))
      .query(async ({ input }) => {
        return await getMessagesByConversationId(input.conversationId);
      }),

    send: agentProcedure
      .input(
        z.object({
          conversationId: z.number(),
          content: z.string(),
          messageType: z.enum(["text", "image", "document"]).default("text"),
          mediaUrl: z.string().optional(),
        })
      )
      .mutation(async ({ input, ctx }) => {
        // Get conversation details
        const conversation = await getConversationById(input.conversationId);
        if (!conversation) {
          throw new TRPCError({
            code: "NOT_FOUND",
            message: "Conversation not found",
          });
        }

        // Get webhook account to get API key
        const account = await getWebhookAccountById(conversation.accountId);
        if (!account) {
          throw new TRPCError({
            code: "NOT_FOUND",
            message: "Webhook account not found",
          });
        }

        // Send message via WASender API
        const { createWASenderClient } = await import("./wasender-api.js");
        const wasenderClient = createWASenderClient(account.apiKey);

        let apiResponse;
        if (input.messageType === "text") {
          apiResponse = await wasenderClient.sendTextMessage({
            to: conversation.customerPhone,
            message: input.content,
          });
        } else if (input.messageType === "image" && input.mediaUrl) {
          apiResponse = await wasenderClient.sendImageMessage({
            to: conversation.customerPhone,
            media_url: input.mediaUrl,
            caption: input.content,
          });
        } else if (input.messageType === "document" && input.mediaUrl) {
          apiResponse = await wasenderClient.sendDocumentMessage({
            to: conversation.customerPhone,
            media_url: input.mediaUrl,
            caption: input.content,
          });
        }

        if (!apiResponse?.success) {
          throw new TRPCError({
            code: "INTERNAL_SERVER_ERROR",
            message: apiResponse?.error || "Failed to send message",
          });
        }

        // Save message to database
        const messageId = await createMessage({
          conversationId: input.conversationId,
          direction: "outbound",
          content: input.content,
          agentId: ctx.user.id,
          mediaUrl: input.mediaUrl,
          mediaType: input.messageType === "text" ? undefined : input.messageType as "image" | "document",
          timestamp: new Date(),
        });

        // Update conversation last message time
        await updateConversation(input.conversationId, {
          lastMessageAt: new Date(),
        });

        return { success: true, messageId };
      }),
  }),

  // ============================================================================
  // TIME TRACKING (Agent)
  // ============================================================================
  timeTracking: router({
    clockIn: agentProcedure.mutation(async ({ ctx }) => {
      const existing = await getActiveTimeLog(ctx.user.id);
      if (existing) {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: "Already clocked in",
        });
      }

      const timeLogId = await createTimeLog({
        agentId: ctx.user.id,
        loginAt: new Date(),
      });

      return { success: true, timeLogId };
    }),

    clockOut: agentProcedure.mutation(async ({ ctx }) => {
      const activeLog = await getActiveTimeLog(ctx.user.id);
      if (!activeLog) {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: "Not clocked in",
        });
      }

      await updateTimeLog(activeLog.id, {
        logoutAt: new Date(),
      });

      return { success: true };
    }),

    startBreak: agentProcedure
      .input(z.object({ breakType: z.enum(["lunch", "short", "other"]).default("short") }))
      .mutation(async ({ ctx, input }) => {
        const activeLog = await getActiveTimeLog(ctx.user.id);
        if (!activeLog) {
          throw new TRPCError({
            code: "BAD_REQUEST",
            message: "Not clocked in",
          });
        }

        const existingBreak = await getActiveBreak(activeLog.id);
        if (existingBreak) {
          throw new TRPCError({
            code: "BAD_REQUEST",
            message: "Already on break",
          });
        }

        const breakId = await createBreak({
          timeLogId: activeLog.id,
          startAt: new Date(),
          breakType: input.breakType,
        });

        return { success: true, breakId };
      }),

    endBreak: agentProcedure.mutation(async ({ ctx }) => {
      const activeLog = await getActiveTimeLog(ctx.user.id);
      if (!activeLog) {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: "Not clocked in",
        });
      }

      const activeBreak = await getActiveBreak(activeLog.id);
      if (!activeBreak) {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: "Not on break",
        });
      }

      await updateBreak(activeBreak.id, {
        endAt: new Date(),
      });

      return { success: true };
    }),

    getStatus: agentProcedure.query(async ({ ctx }) => {
      const activeLog = await getActiveTimeLog(ctx.user.id);
      if (!activeLog) {
        return { isClockedIn: false };
      }

      const activeBreak = await getActiveBreak(activeLog.id);

      return {
        isClockedIn: true,
        isOnBreak: !!activeBreak,
        loginAt: activeLog.loginAt,
        breakStartAt: activeBreak?.startAt,
      };
    }),

    getHistory: agentProcedure
      .input(z.object({ limit: z.number().default(30) }))
      .query(async ({ ctx, input }) => {
        return await getAgentTimeLogs(ctx.user.id, input.limit);
      }),
  }),

  // ============================================================================
  // QUICK REPLY TEMPLATES (Agent)
  // ============================================================================
  quickReplies: router({
    list: agentProcedure.query(async ({ ctx }) => {
      return await getQuickReplyTemplates(ctx.user.id);
    }),

    create: agentProcedure
      .input(
        z.object({
          shortcut: z.string(),
          content: z.string(),
        })
      )
      .mutation(async ({ ctx, input }) => {
        const templateId = await createQuickReplyTemplate({
          agentId: ctx.user.id,
          name: input.shortcut,
          message: input.content,
        });

        return { success: true, templateId };
      }),

    update: agentProcedure
      .input(
        z.object({
          id: z.number(),
          shortcut: z.string().optional(),
          content: z.string().optional(),
        })
      )
      .mutation(async ({ input }) => {
        const { id, shortcut, content } = input;
        const updates: any = {};
        if (shortcut) updates.name = shortcut;
        if (content) updates.message = content;
        await updateQuickReplyTemplate(id, updates);
        return { success: true };
      }),

    delete: agentProcedure
      .input(z.object({ id: z.number() }))
      .mutation(async ({ input }) => {
        await deleteQuickReplyTemplate(input.id);
        return { success: true };
      }),
  }),

  // ============================================================================
  // CONVERSATION NOTES (Agent)
  // ============================================================================
  conversationNotes: router({
    list: agentProcedure
      .input(z.object({ conversationId: z.number() }))
      .query(async ({ input }) => {
        return await getConversationNotes(input.conversationId);
      }),

    create: agentProcedure
      .input(
        z.object({
          conversationId: z.number(),
          content: z.string(),
        })
      )
      .mutation(async ({ ctx, input }) => {
        const noteId = await createConversationNote({
          conversationId: input.conversationId,
          agentId: ctx.user.id,
          content: input.content,
        });

        return { success: true, noteId };
      }),

    update: agentProcedure
      .input(
        z.object({
          id: z.number(),
          content: z.string(),
        })
      )
      .mutation(async ({ input }) => {
        await updateConversationNote(input.id, input.content);
        return { success: true };
      }),

    delete: agentProcedure
      .input(z.object({ id: z.number() }))
      .mutation(async ({ input }) => {
        await deleteConversationNote(input.id);
        return { success: true };
      }),
  }),

  // ============================================================================
  // CONVERSATION TAGS (Agent)
  // ============================================================================
  conversationTags: router({
    list: agentProcedure
      .input(z.object({ conversationId: z.number() }))
      .query(async ({ input }) => {
        return await getConversationTags(input.conversationId);
      }),

    add: agentProcedure
      .input(
        z.object({
          conversationId: z.number(),
          tagName: z.string(),
        })
      )
      .mutation(async ({ input }) => {
        const tagId = await addConversationTag(input.conversationId, input.tagName);
        return { success: true, tagId };
      }),

    remove: agentProcedure
      .input(
        z.object({
          conversationId: z.number(),
          tagName: z.string(),
        })
      )
      .mutation(async ({ input }) => {
        await removeConversationTag(input.conversationId, input.tagName);
        return { success: true };
      }),
  }),

  // ============================================================================
  // SETTINGS (Admin Only)
  // ============================================================================
  settings: router({
    get: adminProcedure
      .input(z.object({ key: z.string() }))
      .query(async ({ input }) => {
        return await getSetting(input.key);
      }),

    set: adminProcedure
      .input(
        z.object({
          key: z.string(),
          value: z.string(),
        })
      )
      .mutation(async ({ input }) => {
        await setSetting(input.key, input.value);
        return { success: true };
      }),

    getAll: adminProcedure.query(async () => {
      return await getAllSettings();
    }),
  }),

  // ============================================================================
  // WEBHOOK RECEIVER (Public - for external systems)
  // ============================================================================
  webhook: router({
    receive: publicProcedure
      .input(
        z.object({
          apiKey: z.string(),
          webhookSecret: z.string(),
          from: z.string(),
          message: z.string(),
          messageType: z.enum(["text", "image", "document"]).default("text"),
          mediaUrl: z.string().optional(),
          timestamp: z.string().optional(),
        })
      )
      .mutation(async ({ input }) => {
        // Verify API key
        const account = await getWebhookAccountByApiKey(input.apiKey);
        if (!account) {
          throw new TRPCError({
            code: "UNAUTHORIZED",
            message: "Invalid API key",
          });
        }

        // Verify webhook secret
        if (account.webhookSecret !== input.webhookSecret) {
          throw new TRPCError({
            code: "UNAUTHORIZED",
            message: "Invalid webhook secret",
          });
        }

        if (account.status !== "active") {
          throw new TRPCError({
            code: "FORBIDDEN",
            message: "Account is inactive",
          });
        }

        // Log the webhook
        await createWebhookLog({
          accountId: account.id,
          direction: "inbound",
          fromNumber: input.from,
          message: input.message,
          status: "received",
          metadata: JSON.stringify(input),
          timestamp: new Date(),
        });

        // Find or create conversation
        let conversation = await getConversationByPhone(input.from, account.id);
        
        if (!conversation) {
          const conversationId = await createConversation({
            accountId: account.id,
            customerPhone: input.from,
            customerName: input.from,
            isNew: true,
            unreadCount: 1,
            lastMessageAt: new Date(),
          });
          
          conversation = await getConversationById(conversationId);
        }

        if (!conversation) {
          throw new TRPCError({
            code: "INTERNAL_SERVER_ERROR",
            message: "Failed to create conversation",
          });
        }

        // Create message
        await createMessage({
          conversationId: conversation.id,
          direction: "inbound",
          content: input.message,
          fromNumber: input.from,
          mediaUrl: input.mediaUrl,
          mediaType: input.messageType === "text" ? undefined : input.messageType as "image" | "document",
          timestamp: input.timestamp ? new Date(input.timestamp) : new Date(),
        });

        return { success: true, conversationId: conversation.id };
      }),
  }),
});

export type AppRouter = typeof appRouter;
