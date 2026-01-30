import { useEffect, useState, useRef } from "react";
import { useLocation } from "wouter";
import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { 
  Send, 
  Search, 
  Clock, 
  Coffee, 
  LogOut, 
  Edit,
  Plus,
  X,
  StickyNote,
  Tag,
  Trash2,
  MessageSquarePlus
} from "lucide-react";
import { io, Socket } from "socket.io-client";

export default function AgentDashboard() {
  const [, setLocation] = useLocation();
  const [selectedConversationId, setSelectedConversationId] = useState<number | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [socket, setSocket] = useState<Socket | null>(null);

  // Check authentication
  const { data: user, isLoading: userLoading } = trpc.auth.me.useQuery();
  const utils = trpc.useUtils();

  useEffect(() => {
    if (!userLoading && (!user || user.role !== "agent")) {
      setLocation("/agent-login");
    }
  }, [user, userLoading, setLocation]);

  // Initialize Socket.IO
  useEffect(() => {
    if (user && user.role === "agent") {
      const token = document.cookie
        .split("; ")
        .find((row) => row.startsWith("agent_session="))
        ?.split("=")[1];

      if (token) {
        // Connect to the same origin (works for both dev and production)
        const socketInstance = io(window.location.origin, {
          auth: { token },
          transports: ["websocket", "polling"],
          path: "/socket.io",
        });

        socketInstance.on("connect", () => {
          console.log("[Socket.IO] Connected");
        });

        socketInstance.on("new_message", (data) => {
          console.log("[Socket.IO] New message:", data);
          toast.info("New message received");
          utils.conversations.list.invalidate();
          if (selectedConversationId) {
            utils.messages.getByConversationId.invalidate();
          }
        });

        setSocket(socketInstance);

        return () => {
          socketInstance.disconnect();
        };
      }
    }
  }, [user]);

  const logoutMutation = trpc.auth.logout.useMutation({
    onSuccess: () => {
      toast.success("Logged out successfully");
      setLocation("/agent-login");
    },
  });

  if (userLoading) {
    return <div className="min-h-screen flex items-center justify-center">Loading...</div>;
  }

  if (!user || user.role !== "agent") {
    return null;
  }

  return (
    <div className="h-screen flex flex-col bg-gray-50">
      {/* Header */}
      <header className="bg-white border-b border-gray-200 flex-shrink-0">
        <div className="px-4 py-3 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <h1 className="text-xl font-bold text-gray-900">Agent Dashboard</h1>
            <TimeTrackingWidget />
          </div>
          <div className="flex items-center gap-4">
            <span className="text-sm text-gray-600">{user.name}</span>
            <Button variant="outline" size="sm" onClick={() => logoutMutation.mutate()}>
              <LogOut className="w-4 h-4 mr-2" />
              Logout
            </Button>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <div className="flex-1 flex overflow-hidden">
        {/* Conversation List */}
        <div className="w-80 bg-white border-r border-gray-200 flex flex-col">
          <div className="p-4 border-b border-gray-200 space-y-3">
            <StartNewChatDialog />
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
              <Input
                placeholder="Search conversations..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10"
              />
            </div>
          </div>
          <ConversationList
            searchQuery={searchQuery}
            selectedId={selectedConversationId}
            onSelect={setSelectedConversationId}
          />
        </div>

        {/* Chat Area */}
        {selectedConversationId ? (
          <ChatArea conversationId={selectedConversationId} socket={socket} />
        ) : (
          <div className="flex-1 flex items-center justify-center text-gray-500">
            <p>Select a conversation to start chatting</p>
          </div>
        )}
      </div>
    </div>
  );
}

// ============================================================================
// TIME TRACKING WIDGET
// ============================================================================

function TimeTrackingWidget() {
  const utils = trpc.useUtils();
  const { data: status } = trpc.timeTracking.getStatus.useQuery(undefined, {
    refetchInterval: 30000,
  });

  const clockInMutation = trpc.timeTracking.clockIn.useMutation({
    onSuccess: () => {
      toast.success("Clocked in");
      utils.timeTracking.getStatus.invalidate();
    },
  });

  const clockOutMutation = trpc.timeTracking.clockOut.useMutation({
    onSuccess: () => {
      toast.success("Clocked out");
      utils.timeTracking.getStatus.invalidate();
    },
  });

  const startBreakMutation = trpc.timeTracking.startBreak.useMutation({
    onSuccess: () => {
      toast.success("Break started");
      utils.timeTracking.getStatus.invalidate();
    },
  });

  const endBreakMutation = trpc.timeTracking.endBreak.useMutation({
    onSuccess: () => {
      toast.success("Break ended");
      utils.timeTracking.getStatus.invalidate();
    },
  });

  if (!status) return null;

  return (
    <div className="flex items-center gap-2">
      {!status.isClockedIn ? (
        <Button size="sm" onClick={() => clockInMutation.mutate()}>
          <Clock className="w-4 h-4 mr-2" />
          Clock In
        </Button>
      ) : (
        <>
          {!status.isOnBreak ? (
            <>
              <Badge variant="default">Active</Badge>
              <Dialog>
                <DialogTrigger asChild>
                  <Button size="sm" variant="outline">
                    <Coffee className="w-4 h-4 mr-2" />
                    Break
                  </Button>
                </DialogTrigger>
                <DialogContent>
                  <DialogHeader>
                    <DialogTitle>Start Break</DialogTitle>
                  </DialogHeader>
                  <div className="space-y-4 py-4">
                    <Label>Break Type</Label>
                    <Select
                      onValueChange={(value) => {
                        startBreakMutation.mutate({ breakType: value as "lunch" | "short" | "other" });
                      }}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select break type" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="short">Short Break</SelectItem>
                        <SelectItem value="lunch">Lunch Break</SelectItem>
                        <SelectItem value="other">Other</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </DialogContent>
              </Dialog>
              <Button size="sm" variant="outline" onClick={() => clockOutMutation.mutate()}>
                Clock Out
              </Button>
            </>
          ) : (
            <>
              <Badge variant="secondary">On Break</Badge>
              <Button size="sm" onClick={() => endBreakMutation.mutate()}>
                End Break
              </Button>
            </>
          )}
        </>
      )}
    </div>
  );
}

// ============================================================================
// CONVERSATION LIST
// ============================================================================

function ConversationList({
  searchQuery,
  selectedId,
  onSelect,
}: {
  searchQuery: string;
  selectedId: number | null;
  onSelect: (id: number) => void;
}) {
  const utils = trpc.useUtils();
  const { data: conversations, isLoading } = trpc.conversations.list.useQuery({
    searchQuery: searchQuery || undefined,
  });

  const deleteConversationMutation = trpc.conversations.delete.useMutation({
    onSuccess: () => {
      toast.success("Conversation deleted");
      utils.conversations.list.invalidate();
    },
    onError: (error) => {
      toast.error(`Failed to delete conversation: ${error.message}`);
    },
  });

  const deleteConversation = (conversationId: number) => {
    deleteConversationMutation.mutate({ conversationId });
  };

  if (isLoading) {
    return <div className="p-4 text-center text-gray-500">Loading...</div>;
  }

  if (!conversations || conversations.length === 0) {
    return <div className="p-4 text-center text-gray-500">No conversations</div>;
  }

  return (
    <ScrollArea className="flex-1">
      <div className="divide-y divide-gray-200">
        {conversations.map((conversation) => (
          <div
            key={conversation.id}
            className={`relative group w-full p-4 hover:bg-gray-50 ${
              selectedId === conversation.id ? "bg-blue-50" : ""
            }`}
          >
            <button
              onClick={() => onSelect(conversation.id)}
              className="w-full text-left"
            >
              <div className="flex items-start justify-between mb-1">
                <div className="flex items-center gap-2">
                  <span className="font-medium">{conversation.customerName}</span>
                  {conversation.isNew && <Badge variant="destructive">NEW</Badge>}
                </div>
                <span className="text-xs text-gray-500">
                  {new Date(conversation.lastMessageAt).toLocaleTimeString([], {
                    hour: "2-digit",
                    minute: "2-digit",
                  })}
                </span>
              </div>
              <div className="text-sm text-gray-600 truncate">{conversation.customerPhone}</div>
              {conversation.unreadCount > 0 && (
                <Badge variant="default" className="mt-2">
                  {conversation.unreadCount} unread
                </Badge>
              )}
            </button>
            <button
              onClick={(e) => {
                e.stopPropagation();
                if (confirm("Are you sure you want to delete this conversation? This action cannot be undone.")) {
                  deleteConversation(conversation.id);
                }
              }}
              className="absolute top-4 right-4 opacity-0 group-hover:opacity-100 transition-opacity p-1 hover:bg-red-100 rounded"
              title="Delete conversation"
            >
              <Trash2 className="h-4 w-4 text-red-600" />
            </button>
          </div>
        ))}
      </div>
    </ScrollArea>
  );
}

// ============================================================================
// CHAT AREA
// ============================================================================

function ChatArea({ conversationId, socket }: { conversationId: number; socket: Socket | null }) {
  const utils = trpc.useUtils();
  const [messageText, setMessageText] = useState("");
  const [showNotes, setShowNotes] = useState(false);
  const [showTags, setShowTags] = useState(false);
  const [isEditingName, setIsEditingName] = useState(false);
  const [newName, setNewName] = useState("");
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const { data: conversation } = trpc.conversations.getById.useQuery({ id: conversationId });
  const { data: messages } = trpc.messages.getByConversationId.useQuery({ conversationId });

  const sendMessageMutation = trpc.messages.send.useMutation({
    onSuccess: () => {
      setMessageText("");
      utils.messages.getByConversationId.invalidate({ conversationId });
      utils.conversations.list.invalidate();
    },
  });

  const claimMutation = trpc.conversations.claim.useMutation({
    onSuccess: () => {
      toast.success("Conversation claimed");
      utils.conversations.getById.invalidate();
    },
  });

  const releaseMutation = trpc.conversations.release.useMutation({
    onSuccess: () => {
      toast.success("Conversation released");
      utils.conversations.getById.invalidate();
    },
  });

  const updateNameMutation = trpc.conversations.updateCustomerName.useMutation({
    onSuccess: () => {
      toast.success("Name updated");
      utils.conversations.getById.invalidate();
      utils.conversations.list.invalidate();
      setIsEditingName(false);
    },
  });

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const handleSendMessage = (e: React.FormEvent) => {
    e.preventDefault();
    if (!messageText.trim()) return;

    sendMessageMutation.mutate({
      conversationId,
      content: messageText,
      messageType: "text",
    });
  };

  if (!conversation) {
    return <div className="flex-1 flex items-center justify-center">Loading...</div>;
  }

  return (
    <div className="flex-1 flex flex-col relative">
      {/* Chat Header */}
      <div className="bg-white border-b border-gray-200 p-4 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-blue-500 rounded-full flex items-center justify-center text-white font-semibold">
            {conversation.customerName.charAt(0).toUpperCase()}
          </div>
          <div>
            {isEditingName ? (
              <div className="flex items-center gap-2">
                <Input
                  value={newName}
                  onChange={(e) => setNewName(e.target.value)}
                  className="w-48"
                  autoFocus
                />
                <Button
                  size="sm"
                  onClick={() => {
                    if (newName.trim()) {
                      updateNameMutation.mutate({
                        conversationId,
                        customerName: newName,
                      });
                    }
                  }}
                >
                  Save
                </Button>
                <Button size="sm" variant="ghost" onClick={() => setIsEditingName(false)}>
                  Cancel
                </Button>
              </div>
            ) : (
              <div className="flex items-center gap-2">
                <h2 className="font-semibold">{conversation.customerName}</h2>
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={() => {
                    setNewName(conversation.customerName);
                    setIsEditingName(true);
                  }}
                >
                  <Edit className="w-3 h-3" />
                </Button>
              </div>
            )}
            <p className="text-sm text-gray-600">{conversation.customerPhone}</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Button size="sm" variant="outline" onClick={() => setShowNotes(!showNotes)}>
            <StickyNote className="w-4 h-4 mr-2" />
            Notes
          </Button>
          <Button size="sm" variant="outline" onClick={() => setShowTags(!showTags)}>
            <Tag className="w-4 h-4 mr-2" />
            Tags
          </Button>
          {!conversation.activeResponderId ? (
            <Button size="sm" onClick={() => claimMutation.mutate({ conversationId })}>
              Claim
            </Button>
          ) : (
            <Button size="sm" variant="outline" onClick={() => releaseMutation.mutate({ conversationId })}>
              Release
            </Button>
          )}
        </div>
      </div>

      {/* Messages Area */}
      <ScrollArea className="flex-1 p-4 bg-gray-50">
        <div className="space-y-4">
          {messages?.map((message) => (
            <div
              key={message.id}
              className={`flex ${message.direction === "outbound" ? "justify-end" : "justify-start"}`}
            >
              <div
                className={`max-w-md px-4 py-2 rounded-lg ${
                  message.direction === "outbound"
                    ? "bg-blue-500 text-white"
                    : "bg-white text-gray-900 border border-gray-200"
                }`}
              >
                <p>{message.content}</p>
                <p className="text-xs mt-1 opacity-70">
                  {new Date(message.timestamp).toLocaleTimeString()}
                </p>
              </div>
            </div>
          ))}
          <div ref={messagesEndRef} />
        </div>
      </ScrollArea>

      {/* Message Input */}
      <div className="bg-white border-t border-gray-200 p-4">
        <form onSubmit={handleSendMessage} className="flex gap-2">
          <Input
            value={messageText}
            onChange={(e) => setMessageText(e.target.value)}
            placeholder="Type a message..."
            className="flex-1"
          />
          <Button type="submit" disabled={!messageText.trim()}>
            <Send className="w-4 h-4" />
          </Button>
        </form>
      </div>

      {/* Notes Sidebar */}
      {showNotes && (
        <NotesSidebar conversationId={conversationId} onClose={() => setShowNotes(false)} />
      )}

      {/* Tags Sidebar */}
      {showTags && (
        <TagsSidebar conversationId={conversationId} onClose={() => setShowTags(false)} />
      )}
    </div>
  );
}

// ============================================================================
// NOTES SIDEBAR
// ============================================================================

function NotesSidebar({ conversationId, onClose }: { conversationId: number; onClose: () => void }) {
  const utils = trpc.useUtils();
  const [newNote, setNewNote] = useState("");

  const { data: notes } = trpc.conversationNotes.list.useQuery({ conversationId });

  const createNoteMutation = trpc.conversationNotes.create.useMutation({
    onSuccess: () => {
      toast.success("Note added");
      setNewNote("");
      utils.conversationNotes.list.invalidate();
    },
  });

  const deleteNoteMutation = trpc.conversationNotes.delete.useMutation({
    onSuccess: () => {
      toast.success("Note deleted");
      utils.conversationNotes.list.invalidate();
    },
  });

  return (
    <div className="absolute top-0 right-0 w-80 h-full bg-white border-l border-gray-200 shadow-lg z-10">
      <div className="p-4 border-b border-gray-200 flex items-center justify-between">
        <h3 className="font-semibold">Notes</h3>
        <Button size="sm" variant="ghost" onClick={onClose}>
          <X className="w-4 h-4" />
        </Button>
      </div>
      <ScrollArea className="h-[calc(100%-200px)] p-4">
        <div className="space-y-4">
          {notes?.map((note) => (
            <Card key={note.id}>
              <CardContent className="p-3">
                <p className="text-sm">{note.content}</p>
                <div className="flex items-center justify-between mt-2">
                  <span className="text-xs text-gray-500">
                    {new Date(note.createdAt).toLocaleString()}
                  </span>
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={() => deleteNoteMutation.mutate({ id: note.id })}
                  >
                    <Trash2 className="w-3 h-3" />
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </ScrollArea>
      <div className="absolute bottom-0 left-0 right-0 p-4 border-t border-gray-200 bg-white">
        <Textarea
          value={newNote}
          onChange={(e) => setNewNote(e.target.value)}
          placeholder="Add a note..."
          rows={3}
          className="mb-2"
        />
        <Button
          onClick={() => {
            if (newNote.trim()) {
              createNoteMutation.mutate({
                conversationId,
                content: newNote,
              });
            }
          }}
          className="w-full"
          disabled={!newNote.trim()}
        >
          <Plus className="w-4 h-4 mr-2" />
          Add Note
        </Button>
      </div>
    </div>
  );
}

// ============================================================================
// TAGS SIDEBAR
// ============================================================================

function TagsSidebar({ conversationId, onClose }: { conversationId: number; onClose: () => void }) {
  const utils = trpc.useUtils();
  const [newTag, setNewTag] = useState("");

  const { data: tags } = trpc.conversationTags.list.useQuery({ conversationId });

  const addTagMutation = trpc.conversationTags.add.useMutation({
    onSuccess: () => {
      toast.success("Tag added");
      setNewTag("");
      utils.conversationTags.list.invalidate();
    },
  });

  const removeTagMutation = trpc.conversationTags.remove.useMutation({
    onSuccess: () => {
      toast.success("Tag removed");
      utils.conversationTags.list.invalidate();
    },
  });

  return (
    <div className="absolute top-0 right-0 w-80 h-full bg-white border-l border-gray-200 shadow-lg z-10">
      <div className="p-4 border-b border-gray-200 flex items-center justify-between">
        <h3 className="font-semibold">Tags</h3>
        <Button size="sm" variant="ghost" onClick={onClose}>
          <X className="w-4 h-4" />
        </Button>
      </div>
      <div className="p-4">
        <div className="flex gap-2 mb-4">
          <Input
            value={newTag}
            onChange={(e) => setNewTag(e.target.value)}
            placeholder="Add tag..."
            onKeyPress={(e) => {
              if (e.key === "Enter" && newTag.trim()) {
                addTagMutation.mutate({
                  conversationId,
                  tagName: newTag,
                });
              }
            }}
          />
          <Button
            onClick={() => {
              if (newTag.trim()) {
                addTagMutation.mutate({
                  conversationId,
                  tagName: newTag,
                });
              }
            }}
            disabled={!newTag.trim()}
          >
            <Plus className="w-4 h-4" />
          </Button>
        </div>
        <div className="flex flex-wrap gap-2">
          {tags?.map((tag) => (
            <Badge key={tag.id} variant="secondary" className="flex items-center gap-1">
              {tag.tagName}
              <button
                onClick={() =>
                  removeTagMutation.mutate({
                    conversationId,
                    tagName: tag.tagName,
                  })
                }
                className="ml-1 hover:text-red-500"
              >
                <X className="w-3 h-3" />
              </button>
            </Badge>
          ))}
        </div>
      </div>
    </div>
  );
}

// ============================================================================
// START NEW CHAT DIALOG
// ============================================================================
function StartNewChatDialog() {
  const [open, setOpen] = useState(false);
  const [phoneNumber, setPhoneNumber] = useState("");
  const [initialMessage, setInitialMessage] = useState("");
  const [selectedAccountId, setSelectedAccountId] = useState<number | null>(null);
  const utils = trpc.useUtils();

  // Get agent's linked accounts
  const { data: accounts } = trpc.agents.getMyLinkedAccounts.useQuery();

  const startChatMutation = trpc.conversations.startNewChat.useMutation({
    onSuccess: (data) => {
      toast.success("Chat started successfully!");
      setOpen(false);
      setPhoneNumber("");
      setInitialMessage("");
      setSelectedAccountId(null);
      // Refresh conversation list
      utils.conversations.list.invalidate();
    },
    onError: (error) => {
      toast.error(error.message || "Failed to start chat");
    },
  });

  const handleStartChat = () => {
    if (!selectedAccountId) {
      toast.error("Please select an account");
      return;
    }
    if (!phoneNumber.trim()) {
      toast.error("Please enter a phone number");
      return;
    }
    if (!initialMessage.trim()) {
      toast.error("Please enter an initial message");
      return;
    }

    startChatMutation.mutate({
      accountId: selectedAccountId,
      phoneNumber: phoneNumber.trim(),
      initialMessage: initialMessage.trim(),
    });
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button className="w-full" variant="default">
          <MessageSquarePlus className="w-4 h-4 mr-2" />
          Start New Chat
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Start New Conversation</DialogTitle>
        </DialogHeader>
        <div className="space-y-4 py-4">
          <div className="space-y-2">
            <Label htmlFor="account">Select Account</Label>
            <Select
              value={selectedAccountId?.toString() || ""}
              onValueChange={(value) => setSelectedAccountId(Number(value))}
            >
              <SelectTrigger id="account">
                <SelectValue placeholder="Choose an account" />
              </SelectTrigger>
              <SelectContent>
                {accounts?.map((account) => (
                  <SelectItem key={account.id} value={account.id.toString()}>
                    {account.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <Label htmlFor="phone">Phone Number</Label>
            <Input
              id="phone"
              placeholder="+1234567890"
              value={phoneNumber}
              onChange={(e) => setPhoneNumber(e.target.value)}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="message">Initial Message</Label>
            <Textarea
              id="message"
              placeholder="Type your first message..."
              value={initialMessage}
              onChange={(e) => setInitialMessage(e.target.value)}
              rows={4}
            />
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => setOpen(false)}>
            Cancel
          </Button>
          <Button onClick={handleStartChat} disabled={startChatMutation.isPending}>
            {startChatMutation.isPending ? "Starting..." : "Start Chat"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
