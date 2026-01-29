import { useEffect, useState, useRef } from "react";
import { useLocation } from "wouter";
import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { Loader2, Send, LogOut, Circle } from "lucide-react";
import { useSocket } from "@/hooks/useSocket";

export default function AgentDashboard() {
  const [, setLocation] = useLocation();
  const [selectedConversation, setSelectedConversation] = useState<string | null>(null);
  const [messageInput, setMessageInput] = useState("");
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Check authentication
  const { data: user, isLoading: userLoading } = trpc.auth.me.useQuery();

  useEffect(() => {
    if (!userLoading && (!user || user.role !== "agent")) {
      setLocation("/agent/login");
    }
  }, [user, userLoading, setLocation]);

  // Fetch messages
  const { data: messages, isLoading: messagesLoading, refetch: refetchMessages } = trpc.webhookLogs.list.useQuery(
    { limit: 100, offset: 0 },
    { enabled: !!user }
  );

  // Socket.IO connection
  const { socket, isConnected } = useSocket(user?.id, user?.email);

  // Listen for new messages
  useEffect(() => {
    if (!socket) return;

    socket.on("new_message", (data) => {
      toast.info("New message received");
      refetchMessages();
    });

    return () => {
      socket.off("new_message");
    };
  }, [socket, refetchMessages]);

  // Auto-scroll to bottom when messages change
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, selectedConversation]);

  const logoutMutation = trpc.auth.logout.useMutation({
    onSuccess: () => {
      localStorage.removeItem("agent_jwt");
      toast.success("Logged out successfully");
      setLocation("/agent/login");
    },
  });

  const handleSendMessage = (e: React.FormEvent) => {
    e.preventDefault();
    if (!messageInput.trim() || !selectedConversation) return;

    // Emit message via Socket.IO
    if (socket) {
      socket.emit("send_message", {
        agentId: user?.id,
        to: selectedConversation,
        message: messageInput,
      });
      setMessageInput("");
      toast.success("Message sent");
    } else {
      toast.error("Not connected to server");
    }
  };

  if (userLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    );
  }

  if (!user || user.role !== "agent") {
    return null;
  }

  // Group messages by conversation (phone number)
  const conversations = messages?.reduce((acc, msg) => {
    const key = msg.fromNumber || msg.toNumber || "unknown";
    if (!acc[key]) {
      acc[key] = [];
    }
    acc[key].push(msg);
    return {};
  }, {} as Record<string, typeof messages>) || {};

  return (
    <div className="min-h-screen bg-slate-50">
      {/* Header */}
      <header className="bg-white border-b border-slate-200 sticky top-0 z-10">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-slate-900">Agent Dashboard</h1>
            <p className="text-sm text-slate-600">Welcome, {user.name}</p>
          </div>
          <div className="flex items-center gap-4">
            <Badge variant={isConnected ? "default" : "secondary"} className="flex items-center gap-2">
              <Circle className={`h-2 w-2 ${isConnected ? "fill-green-500 text-green-500" : "fill-gray-400 text-gray-400"}`} />
              {isConnected ? "Live" : "Offline"}
            </Badge>
            <Button variant="outline" onClick={() => logoutMutation.mutate()}>
              <LogOut className="mr-2 h-4 w-4" />
              Logout
            </Button>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 h-[calc(100vh-200px)]">
          {/* Conversations List */}
          <Card className="lg:col-span-1">
            <CardHeader>
              <CardTitle>Conversations</CardTitle>
            </CardHeader>
            <CardContent className="p-0">
              <ScrollArea className="h-[calc(100vh-300px)]">
                {messagesLoading ? (
                  <div className="flex justify-center py-8">
                    <Loader2 className="h-6 w-6 animate-spin" />
                  </div>
                ) : Object.keys(conversations).length > 0 ? (
                  <div className="divide-y">
                    {Object.keys(conversations).map((phoneNumber) => (
                      <button
                        key={phoneNumber}
                        onClick={() => setSelectedConversation(phoneNumber)}
                        className={`w-full text-left px-4 py-3 hover:bg-slate-50 transition-colors ${
                          selectedConversation === phoneNumber ? "bg-slate-100" : ""
                        }`}
                      >
                        <div className="font-medium text-sm">{phoneNumber}</div>
                        <div className="text-xs text-muted-foreground truncate">
                          {conversations[phoneNumber]?.[conversations[phoneNumber].length - 1]?.message}
                        </div>
                      </button>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-8 text-muted-foreground text-sm">
                    No conversations yet
                  </div>
                )}
              </ScrollArea>
            </CardContent>
          </Card>

          {/* Message Thread */}
          <Card className="lg:col-span-2 flex flex-col">
            <CardHeader>
              <CardTitle>
                {selectedConversation ? `Chat with ${selectedConversation}` : "Select a conversation"}
              </CardTitle>
            </CardHeader>
            <CardContent className="flex-1 flex flex-col p-0">
              {selectedConversation ? (
                <>
                  {/* Messages */}
                  <ScrollArea className="flex-1 p-4">
                    <div className="space-y-4">
                      {conversations[selectedConversation]?.map((msg) => (
                        <div
                          key={msg.id}
                          className={`flex ${msg.direction === "outbound" ? "justify-end" : "justify-start"}`}
                        >
                          <div
                            className={`max-w-[70%] rounded-lg px-4 py-2 ${
                              msg.direction === "outbound"
                                ? "bg-blue-500 text-white"
                                : "bg-slate-200 text-slate-900"
                            }`}
                          >
                            <p className="text-sm">{msg.message}</p>
                            <p className="text-xs opacity-70 mt-1">
                              {new Date(msg.timestamp).toLocaleTimeString()}
                            </p>
                          </div>
                        </div>
                      ))}
                      <div ref={messagesEndRef} />
                    </div>
                  </ScrollArea>

                  {/* Message Input */}
                  <div className="border-t p-4">
                    <form onSubmit={handleSendMessage} className="flex gap-2">
                      <Input
                        placeholder="Type your message..."
                        value={messageInput}
                        onChange={(e) => setMessageInput(e.target.value)}
                        disabled={!isConnected}
                      />
                      <Button type="submit" disabled={!isConnected || !messageInput.trim()}>
                        <Send className="h-4 w-4" />
                      </Button>
                    </form>
                  </div>
                </>
              ) : (
                <div className="flex-1 flex items-center justify-center text-muted-foreground">
                  Select a conversation to start messaging
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </main>
    </div>
  );
}
