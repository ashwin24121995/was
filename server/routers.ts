import { z } from "zod";
import { TRPCError } from "@trpc/server";
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
  getWebhookAccounts,
  getWebhookAccountById,
  getWebhookAccountByApiKey,
  getWebhookLogs,
  getWebhookLogsByAccountId,
  getWebhookLogsByAgentId,
  getDb
} from "./db";
import { users, webhookAccounts, webhookLogs, InsertWebhookAccount, InsertWebhookLog } from "../drizzle/schema";

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
        // Check if user already exists
        const existingUser = await getUserByEmail(input.email);
        if (existingUser) {
          throw new TRPCError({
            code: "CONFLICT",
            message: "Email already registered",
          });
        }

        // Hash password
        const hashedPassword = await argon2.hash(input.password);

        // Create admin user
        await createUser({
          name: input.name,
          email: input.email,
          password: hashedPassword,
          role: "admin",
          loginMethod: "password",
        });

        // Get the created user
        const user = await getUserByEmail(input.email);
        if (!user) {
          throw new TRPCError({
            code: "INTERNAL_SERVER_ERROR",
            message: "Failed to create user",
          });
        }

        // Generate JWT token
        const token = await generateJWT(user);

        // Set cookie
        const cookieOptions = getSessionCookieOptions(ctx.req);
        ctx.res.cookie("admin_session", token, {
          ...cookieOptions,
          maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
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
        // Find user by email
        const user = await getUserByEmail(input.email);

        if (!user || !user.password) {
          throw new TRPCError({
            code: "UNAUTHORIZED",
            message: "Invalid email or password",
          });
        }

        // Verify password
        const isValid = await argon2.verify(user.password, input.password);

        if (!isValid) {
          throw new TRPCError({
            code: "UNAUTHORIZED",
            message: "Invalid email or password",
          });
        }

        // Check if user is admin
        if (user.role !== "admin") {
          throw new TRPCError({
            code: "FORBIDDEN",
            message: "Admin access required",
          });
        }

        // Generate JWT token
        const token = await generateJWT(user);

        // Set cookie
        const cookieOptions = getSessionCookieOptions(ctx.req);
        ctx.res.cookie("admin_session", token, {
          ...cookieOptions,
          maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
        });

        // Update last signed in
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
        // Find user by email
        const user = await getUserByEmail(input.email);

        if (!user || !user.password) {
          throw new TRPCError({
            code: "UNAUTHORIZED",
            message: "Invalid email or password",
          });
        }

        // Verify password
        const isValid = await argon2.verify(user.password, input.password);

        if (!isValid) {
          throw new TRPCError({
            code: "UNAUTHORIZED",
            message: "Invalid email or password",
          });
        }

        // Check if user is agent
        if (user.role !== "agent") {
          throw new TRPCError({
            code: "FORBIDDEN",
            message: "Agent access required",
          });
        }

        // Generate JWT token
        const token = await generateJWT(user);

        // Set cookie
        const cookieOptions = getSessionCookieOptions(ctx.req);
        ctx.res.cookie("agent_session", token, {
          ...cookieOptions,
          maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
        });

        // Update last signed in
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

  // Webhook account management (admin only)
  webhookAccounts: router({
    list: adminProcedure.query(async () => {
      return await getWebhookAccounts();
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
          webhookUrl: z.string().url().optional(),
          phoneNumber: z.string().optional(),
        })
      )
      .mutation(async ({ input }) => {
        const db = await getDb();
        if (!db) {
          throw new TRPCError({
            code: "INTERNAL_SERVER_ERROR",
            message: "Database not available",
          });
        }

        // Generate unique API key
        const apiKey = generateRandomString(32);

        const account: InsertWebhookAccount = {
          name: input.name,
          apiKey,
          webhookUrl: input.webhookUrl,
          phoneNumber: input.phoneNumber,
          status: "active",
        };

        await db.insert(webhookAccounts).values(account);

        return {
          success: true,
          apiKey,
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
        const db = await getDb();
        if (!db) {
          throw new TRPCError({
            code: "INTERNAL_SERVER_ERROR",
            message: "Database not available",
          });
        }

        const { id, ...updates } = input;
        await db.update(webhookAccounts).set(updates).where(eq(webhookAccounts.id, id));

        return { success: true };
      }),

    delete: adminProcedure
      .input(z.object({ id: z.number() }))
      .mutation(async ({ input }) => {
        const db = await getDb();
        if (!db) {
          throw new TRPCError({
            code: "INTERNAL_SERVER_ERROR",
            message: "Database not available",
          });
        }

        await db.delete(webhookAccounts).where(eq(webhookAccounts.id, input.id));

        return { success: true };
      }),
  }),

  // Webhook logs (admin can see all, agents see only their assigned messages)
  webhookLogs: router({
    list: protectedProcedure
      .input(
        z.object({
          limit: z.number().default(100),
          offset: z.number().default(0),
        })
      )
      .query(async ({ input, ctx }) => {
        if (ctx.user.role === "admin") {
          return await getWebhookLogs(input.limit, input.offset);
        } else {
          return await getWebhookLogsByAgentId(ctx.user.id, input.limit);
        }
      }),

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

  // Agent management (admin only)
  agents: router({
    list: adminProcedure.query(async () => {
      const db = await getDb();
      if (!db) return [];

      return await db.select().from(users).where(eq(users.role, "agent"));
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
        // Check if user already exists
        const existingUser = await getUserByEmail(input.email);
        if (existingUser) {
          throw new TRPCError({
            code: "CONFLICT",
            message: "Email already registered",
          });
        }

        // Hash password
        const hashedPassword = await argon2.hash(input.password);

        // Create agent user
        await createUser({
          name: input.name,
          email: input.email,
          password: hashedPassword,
          role: "agent",
          loginMethod: "password",
        });

        return { success: true };
      }),
  }),
});

export type AppRouter = typeof appRouter;
