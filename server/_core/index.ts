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

      // Parse WaSender webhook payload (Updated structure)
      // Payload: { event: "messages.received", data: { messages: { key: {...}, messageBody: "...", message: {...} } } }
      const messageData = req.body.data?.messages;
      
      if (!messageData) {
        res.status(400).json({ error: "Invalid payload structure" });
        return;
      }

      // Extract fields from the new payload structure
      const messageId = messageData.key?.id; // Unique message ID from WASender
      const from = messageData.key?.cleanedSenderPn || messageData.key?.remoteJid;
      const messageBody = messageData.messageBody || '';
      const timestamp = req.body.timestamp ? new Date(req.body.timestamp) : new Date();

      if (!messageId) {
        console.log("[Webhook] No message ID found, skipping");
        return res.status(200).json({ success: true, message: "No message ID" });
      }
      
      // Determine message type, media URL, and additional data
      let messageType = 'text';
      let mediaUrl = null;
      let locationData = null;
      let contactData = null;
      let pollData = null;
      let isViewOnce = false;
      let quotedMessageId = null;
      
      if (messageData.message) {
        const msg = messageData.message;
        
        // Image message
        if (msg.imageMessage) {
          messageType = 'image';
          mediaUrl = msg.imageMessage.url;
          isViewOnce = msg.imageMessage.viewOnce || false;
        }
        // Video message
        else if (msg.videoMessage) {
          messageType = 'video';
          mediaUrl = msg.videoMessage.url;
          isViewOnce = msg.videoMessage.viewOnce || false;
        }
        // Audio message
        else if (msg.audioMessage) {
          messageType = 'audio';
          mediaUrl = msg.audioMessage.url;
        }
        // Document message
        else if (msg.documentMessage) {
          messageType = 'document';
          mediaUrl = msg.documentMessage.url;
        }
        // Sticker message
        else if (msg.stickerMessage) {
          messageType = 'sticker';
          mediaUrl = msg.stickerMessage.url;
        }
        // Location message
        else if (msg.locationMessage) {
          messageType = 'location';
          locationData = {
            latitude: msg.locationMessage.degreesLatitude,
            longitude: msg.locationMessage.degreesLongitude,
            name: msg.locationMessage.name,
            address: msg.locationMessage.address,
          };
        }
        // Contact message
        else if (msg.contactMessage || msg.contactsArrayMessage) {
          messageType = 'contact';
          const contact = msg.contactMessage || msg.contactsArrayMessage?.contacts?.[0];
          if (contact) {
            contactData = {
              name: contact.displayName || contact.vcard?.split('FN:')[1]?.split('\n')[0],
              phone: contact.vcard?.split('TEL:')[1]?.split('\n')[0],
            };
          }
        }
        // Poll message
        else if (msg.pollCreationMessage) {
          messageType = 'poll';
          pollData = {
            question: msg.pollCreationMessage.name,
            options: msg.pollCreationMessage.options?.map((opt: any) => opt.optionName) || [],
          };
        }
        
        // Check for quoted/reply message
        if (msg.extendedTextMessage?.contextInfo?.quotedMessage) {
          quotedMessageId = msg.extendedTextMessage.contextInfo.stanzaId;
        }
      }

      // Log the webhook
      await createWebhookLog({
        accountId: account.id,
        direction: "inbound",
        fromNumber: from,
        toNumber: account.phoneNumber || '',
        message: messageBody,
        metadata: JSON.stringify(req.body),
        status: "received",
        timestamp: timestamp,
      });

      // Create or get conversation
      const conversation = await getOrCreateConversation({
        accountId: account.id,
        customerPhone: from,
        customerName: from, // Will be updated later
      });

      // Check for duplicate message using external_id (WASender message ID)
      const { getMessageByExternalId } = await import("../db.js");
      const existingMessage = await getMessageByExternalId(messageId);
      
      if (existingMessage) {
        console.log(`[Webhook] Duplicate message detected (ID: ${messageId}), skipping`);
        return res.status(200).json({ success: true, message: "Duplicate message ignored" });
      }

      // Prepare message content based on type
      let finalContent = messageBody;
      if (messageType === 'location' && locationData) {
        finalContent = `Location: ${locationData.latitude}, ${locationData.longitude}${locationData.name ? ` (${locationData.name})` : ''}`;
      } else if (messageType === 'contact' && contactData) {
        finalContent = `Contact: ${contactData.name} (${contactData.phone})`;
      } else if (messageType === 'poll' && pollData) {
        finalContent = `Poll: ${pollData.question}`;
      }

      // Save message to database with external_id
      await createMessage({
        conversationId: conversation.id,
        direction: "inbound",
        content: finalContent,
        mediaUrl: mediaUrl,
        mediaType: messageType === 'text' ? undefined : messageType as any,
        timestamp: timestamp,
        externalId: messageId, // Store WASender message ID for deduplication
      });

      // Broadcast message via Socket.IO to all agents linked to this account
      const { getIO } = await import("./socket");
      const { getAgentsByAccountId } = await import("../db.js");
      const io = getIO();
      if (io) {
        // Get all agents linked to this account
        const agents = await getAgentsByAccountId(account.id);
        
        // Broadcast to each agent's room
        agents.forEach((agent) => {
          io.to(`agent:${agent.id}`).emit("new_message", {
            conversationId: conversation.id,
            message: {
              sender: "customer",
              content: messageBody,
              messageType: messageType,
              mediaUrl: mediaUrl,
              timestamp: timestamp,
            },
          });
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
