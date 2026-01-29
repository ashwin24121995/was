import { Server as HTTPServer } from "http";
import { Server as SocketIOServer } from "socket.io";
import * as jose from "jose";
import cookie from "cookie";

export function initializeSocketIO(server: HTTPServer) {
  const io = new SocketIOServer(server, {
    cors: {
      origin: "*",
      credentials: true,
    },
    transports: ["polling", "websocket"],
    allowUpgrades: true,
    pingTimeout: 60000,
    pingInterval: 25000,
  });

  console.log("[Socket.IO] Server initialized");

  // Authentication middleware
  io.use(async (socket, next) => {
    try {
      // Try to get token from auth parameter (primary method)
      let token = socket.handshake.auth.token;

      // Fallback to cookie if auth token not provided
      if (!token) {
        const cookies = cookie.parse(socket.handshake.headers.cookie || "");
        token = cookies.agent_session;
      }

      if (!token) {
        console.error("[Socket.IO] No authentication token provided");
        return next(new Error("Authentication token required"));
      }

      // Verify JWT
      const secret = new TextEncoder().encode(
        process.env.JWT_SECRET || "default-secret-change-in-production"
      );
      const { payload } = await jose.jwtVerify(token, secret);

      // Attach user to socket
      socket.data.user = payload;
      console.log("[Socket.IO] User authenticated:", payload.userId);
      next();
    } catch (error) {
      console.error("[Socket.IO] Authentication failed:", error);
      next(new Error("Authentication failed"));
    }
  });

  // Connection handler
  io.on("connection", (socket) => {
    const agentId = socket.data.user.userId;
    const agentEmail = socket.data.user.email;
    
    console.log(`[Socket.IO] Agent connected: ${agentEmail} (ID: ${agentId})`);

    // Join agent-specific room
    socket.join(`agent:${agentId}`);

    // Handle send_message event
    socket.on("send_message", (data) => {
      console.log("[Socket.IO] Message from agent:", data);
      
      // Broadcast to the agent's room
      io.to(`agent:${data.agentId}`).emit("new_message", {
        from: data.agentId,
        to: data.to,
        message: data.message,
        timestamp: new Date(),
      });
    });

    // Handle disconnect
    socket.on("disconnect", (reason) => {
      console.log(`[Socket.IO] Agent disconnected: ${agentEmail} (${reason})`);
    });
  });

  return io;
}
