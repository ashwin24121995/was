import { useEffect, useState } from "react";
import { io, Socket } from "socket.io-client";

export function useSocket(agentId?: number, agentEmail?: string) {
  const [socket, setSocket] = useState<Socket | null>(null);
  const [isConnected, setIsConnected] = useState(false);

  useEffect(() => {
    if (!agentId || !agentEmail) return;

    // Get JWT token from localStorage
    const token = localStorage.getItem("agent_jwt");
    if (!token) {
      console.error("[Socket.IO] No JWT token found");
      return;
    }

    // Smart transport detection: polling for production, websocket for dev
    const isDevelopment = 
      window.location.hostname === "localhost" ||
      window.location.hostname === "127.0.0.1" ||
      window.location.hostname.includes("manus.computer");

    const transports = isDevelopment ? ["polling", "websocket"] : ["polling"];

    console.log("[Socket.IO] Connecting with transports:", transports);

    // Create Socket.IO connection
    const socketInstance = io(window.location.origin, {
      auth: { token },
      transports,
      upgrade: isDevelopment,
      reconnection: true,
      reconnectionAttempts: 5,
      reconnectionDelay: 1000,
      timeout: 20000,
    });

    socketInstance.on("connect", () => {
      console.log("[Socket.IO] Connected");
      setIsConnected(true);
    });

    socketInstance.on("disconnect", (reason) => {
      console.log("[Socket.IO] Disconnected:", reason);
      setIsConnected(false);
    });

    socketInstance.on("connect_error", (error) => {
      console.error("[Socket.IO] Connection error:", error);
      setIsConnected(false);
    });

    setSocket(socketInstance);

    return () => {
      console.log("[Socket.IO] Cleaning up connection");
      socketInstance.disconnect();
    };
  }, [agentId, agentEmail]);

  return { socket, isConnected };
}
