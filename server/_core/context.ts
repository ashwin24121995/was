import type { CreateExpressContextOptions } from "@trpc/server/adapters/express";
import type { User } from "../../drizzle/schema";
import jwt from "jsonwebtoken";
import cookie from "cookie";
import { getUserById } from "../db";

export type TrpcContext = {
  req: CreateExpressContextOptions["req"];
  res: CreateExpressContextOptions["res"];
  user: User | null;
};

export async function createContext(
  opts: CreateExpressContextOptions
): Promise<TrpcContext> {
  let user: User | null = null;

  const cookies = cookie.parse(opts.req.headers.cookie || "");
  const adminToken = cookies.admin_session;
  const agentToken = cookies.agent_session;
  const token = adminToken || agentToken;

  if (token) {
    try {
      const secret = process.env.JWT_SECRET || "default-secret-change-in-production";
      const payload = jwt.verify(token, secret) as { userId: number };

      // Get user from database
      const dbUser = await getUserById(payload.userId as number);
      if (dbUser) {
        user = dbUser;
      }
    } catch (error) {
      console.error("[Auth] JWT verification failed:", error);
    }
  }

  return {
    req: opts.req,
    res: opts.res,
    user,
  };
}
