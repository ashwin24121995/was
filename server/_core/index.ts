#!/usr/bin/env node
import express from "express";
import { createServer } from "http";
import net from "net";
import { createExpressMiddleware } from "@trpc/server/adapters/express";
// import { registerOAuthRoutes } from "./oauth"; // Disabled - using custom JWT auth
import { appRouter } from "../routers";
import { createContext } from "./context";
import { serveStatic, setupVite } from "./vite";
import { initializeSocketIO } from "./socket";

function isPortAvailable(port: number): Promise<boolean> {
  return new Promise(resolve => {
    const server = net.createServer();
    server.listen(port, () => {
      server.close(() => resolve(true));
    });
    server.on("error", () => resolve(false));
  });
}

async function findAvailablePort(startPort: number = 3000): Promise<number> {
  for (let port = startPort; port < startPort + 20; port++) {
    if (await isPortAvailable(port)) {
      return port;
    }
  }
  throw new Error(`No available port found starting from ${startPort}`);
}

async function startServer() {
  const app = express();
  const server = createServer(app);
  // Configure body parser with larger size limit for file uploads
  app.use(express.json({ limit: "50mb" }));
  app.use(express.urlencoded({ limit: "50mb", extended: true }));
  // OAuth callback disabled - using custom JWT authentication
  // registerOAuthRoutes(app);
  
  // Webhook endpoint for receiving WhatsApp messages from WaSender
  app.post("/api/webhook/incoming", async (req, res) => {
    try {
      // Get API key from query parameter
      const apiKey = req.query.apiKey as string;
      if (!apiKey) {
        res.status(401).json({ error: "API key is required" });
        return;
      }

      // Get webhook signature from header
      const webhookSignature = req.headers['x-webhook-signature'] as string;
      if (!webhookSignature) {
        res.status(401).json({ error: "Webhook signature is required" });
        return;
      }

      const { getWebhookAccountByApiKey, createWebhookLog, createMessage, getOrCreateConversation, getDb } = await import("../db");
      
      // Verify API key
      const account = await getWebhookAccountByApiKey(apiKey);
      if (!account) {
        res.status(401).json({ error: "Invalid API key" });
        return;
      }

      // Verify webhook signature
      if (account.webhookSecret !== webhookSignature) {
        res.status(401).json({ error: "Invalid webhook signature" });
        return;
      }

      if (account.status !== "active") {
        res.status(403).json({ error: "Account is not active" });
        return;
      }

      // Parse WaSender webhook payload
      const { from, to, message, type, media_url, timestamp } = req.body;

      // Log the webhook
      await createWebhookLog({
        accountId: account.id,
        direction: "inbound",
        fromNumber: from,
        toNumber: to,
        message: message || '',
        metadata: JSON.stringify(req.body),
        status: "received",
        timestamp: timestamp ? new Date(timestamp) : new Date(),
      });

      // Create or get conversation
      const conversation = await getOrCreateConversation({
        accountId: account.id,
        customerPhone: from,
        customerName: from, // Will be updated later
      });

      // Save message to database
      await createMessage({
        conversationId: conversation.id,
        sender: "customer",
        content: message || '',
        messageType: type || "text",
        mediaUrl: media_url,
        status: "delivered",
      });

      // Broadcast message via Socket.IO
      const { getIO } = await import("./socket");
      const io = getIO();
      if (io) {
        io.to(`account:${account.id}`).emit("new_message", {
          conversationId: conversation.id,
          message: {
            sender: "customer",
            content: message || '',
            messageType: type || "text",
            mediaUrl: media_url,
            timestamp: new Date(),
          },
        });
      }

      // Update message count
      const { eq } = await import("drizzle-orm");
      const { webhookAccounts } = await import("../../drizzle/schema");
      const db = await getDb();
      if (db) {
        await db.update(webhookAccounts)
          .set({ messagesReceived: account.messagesReceived + 1 })
          .where(eq(webhookAccounts.id, account.id));
      }

      res.json({ success: true });
    } catch (error) {
      console.error("[Webhook] Error:", error);
      res.status(500).json({ error: "Internal server error" });
    }
  });
  // tRPC API
  app.use(
    "/api/trpc",
    createExpressMiddleware({
      router: appRouter,
      createContext,
    })
  );
  // development mode uses Vite, production mode uses static files
  if (process.env.NODE_ENV === "development") {
    await setupVite(app, server);
  } else {
    serveStatic(app);
  }

  const preferredPort = parseInt(process.env.PORT || "3000");
  const port = await findAvailablePort(preferredPort);

  if (port !== preferredPort) {
    console.log(`Port ${preferredPort} is busy, using port ${port} instead`);
  }

  // Initialize Socket.IO
  initializeSocketIO(server);

  server.listen(port, () => {
    console.log(`Server running on http://localhost:${port}/`);
  });
}

startServer().catch(console.error);
