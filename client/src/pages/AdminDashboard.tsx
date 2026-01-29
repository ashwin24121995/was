import { useEffect, useState } from "react";
import { useLocation } from "wouter";
import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";
import { Copy, Plus, Trash2, Edit, RefreshCw, LogOut, LinkIcon, Unlink } from "lucide-react";

export default function AdminDashboard() {
  const [, setLocation] = useLocation();
  const [activeTab, setActiveTab] = useState("accounts");

  // Check authentication
  const { data: user, isLoading: userLoading } = trpc.auth.me.useQuery();

  useEffect(() => {
    if (!userLoading && (!user || user.role !== "admin")) {
      setLocation("/login");
    }
  }, [user, userLoading, setLocation]);

  const logoutMutation = trpc.auth.logout.useMutation({
    onSuccess: () => {
      toast.success("Logged out successfully");
      setLocation("/login");
    },
  });

  if (userLoading) {
    return <div className="min-h-screen flex items-center justify-center">Loading...</div>;
  }

  if (!user || user.role !== "admin") {
    return null;
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white border-b border-gray-200 sticky top-0 z-10">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">WASender Admin Portal</h1>
            <p className="text-sm text-gray-600">Welcome, {user.name}</p>
          </div>
          <Button variant="outline" onClick={() => logoutMutation.mutate()}>
            <LogOut className="mr-2 h-4 w-4" />
            Logout
          </Button>
        </div>
      </header>

      <main className="container mx-auto px-4 py-8">
        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="grid w-full grid-cols-5">
            <TabsTrigger value="accounts">Webhook Accounts</TabsTrigger>
            <TabsTrigger value="agents">Agents</TabsTrigger>
            <TabsTrigger value="linking">Account Linking</TabsTrigger>
            <TabsTrigger value="logs">Webhook Logs</TabsTrigger>
            <TabsTrigger value="settings">Settings</TabsTrigger>
          </TabsList>

          <TabsContent value="accounts">
            <WebhookAccountsTab />
          </TabsContent>

          <TabsContent value="agents">
            <AgentsTab />
          </TabsContent>

          <TabsContent value="linking">
            <AccountLinkingTab />
          </TabsContent>

          <TabsContent value="logs">
            <WebhookLogsTab />
          </TabsContent>

          <TabsContent value="settings">
            <SettingsTab />
          </TabsContent>
        </Tabs>
      </main>
    </div>
  );
}

// ============================================================================
// WEBHOOK ACCOUNTS TAB
// ============================================================================

function WebhookAccountsTab() {
  const utils = trpc.useUtils();
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [isEditOpen, setIsEditOpen] = useState(false);
  const [selectedAccount, setSelectedAccount] = useState<any>(null);

  const { data: accounts, isLoading } = trpc.webhookAccounts.list.useQuery();

  const createMutation = trpc.webhookAccounts.create.useMutation({
    onSuccess: (data) => {
      toast.success("Account created");
      toast.info(`API Key: ${data.apiKey}`, { duration: 10000 });
      utils.webhookAccounts.list.invalidate();
      setIsCreateOpen(false);
    },
    onError: (error) => {
      toast.error(error.message);
    },
  });

  const updateMutation = trpc.webhookAccounts.update.useMutation({
    onSuccess: () => {
      toast.success("Account updated");
      utils.webhookAccounts.list.invalidate();
      setIsEditOpen(false);
    },
  });

  const deleteMutation = trpc.webhookAccounts.delete.useMutation({
    onSuccess: () => {
      toast.success("Account deleted");
      utils.webhookAccounts.list.invalidate();
    },
  });

  const regenerateKeyMutation = trpc.webhookAccounts.regenerateApiKey.useMutation({
    onSuccess: (data) => {
      toast.success("API Key regenerated");
      toast.info(`New key: ${data.apiKey}`, { duration: 10000 });
      utils.webhookAccounts.list.invalidate();
    },
  });

  const testConnectionMutation = trpc.webhookAccounts.testConnection.useMutation({
    onSuccess: (data) => {
      if (data.connected) {
        toast.success(data.message);
      } else {
        toast.warning(data.message);
      }
    },
    onError: (error) => {
      toast.error(error.message);
    },
  });

  const handleCreate = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    createMutation.mutate({
      name: formData.get("name") as string,
      apiKey: formData.get("apiKey") as string,
      webhookSecret: formData.get("webhookSecret") as string,
      webhookUrl: formData.get("webhookUrl") as string || undefined,
      phoneNumber: formData.get("phoneNumber") as string || undefined,
    });
  };

  const handleUpdate = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    updateMutation.mutate({
      id: selectedAccount.id,
      name: formData.get("name") as string,
      webhookUrl: formData.get("webhookUrl") as string || undefined,
      phoneNumber: formData.get("phoneNumber") as string || undefined,
      status: formData.get("status") as "active" | "inactive",
    });
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    toast.success("Copied to clipboard");
  };

  if (isLoading) {
    return <div className="text-center py-8">Loading accounts...</div>;
  }

  return (
    <Card className="mt-4">
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle>Webhook Accounts</CardTitle>
            <CardDescription>Manage WhatsApp webhook integrations</CardDescription>
          </div>
          <Dialog open={isCreateOpen} onOpenChange={setIsCreateOpen}>
            <DialogTrigger asChild>
              <Button>
                <Plus className="w-4 h-4 mr-2" />
                Create Account
              </Button>
            </DialogTrigger>
            <DialogContent>
              <form onSubmit={handleCreate}>
                <DialogHeader>
                  <DialogTitle>Create Webhook Account</DialogTitle>
                  <DialogDescription>Add a new WhatsApp webhook integration</DialogDescription>
                </DialogHeader>
                <div className="space-y-4 py-4">
                  <div>
                    <Label htmlFor="name">Account Name *</Label>
                    <Input id="name" name="name" required />
                  </div>
                  <div>
                    <Label htmlFor="apiKey">WASender API Key *</Label>
                    <Input id="apiKey" name="apiKey" placeholder="Enter your WASender API key" required />
                  </div>
                  <div>
                    <Label htmlFor="webhookSecret">Webhook Secret *</Label>
                    <Input id="webhookSecret" name="webhookSecret" placeholder="Enter webhook secret" required />
                    <p className="text-xs text-muted-foreground mt-1">
                      Used to validate incoming webhook requests from WaSender
                    </p>
                  </div>
                  <div>
                    <Label htmlFor="webhookUrl">Webhook URL (Optional)</Label>
                    <Input id="webhookUrl" name="webhookUrl" type="url" placeholder="https://..." />
                  </div>
                  <div>
                    <Label htmlFor="phoneNumber">Phone Number (Optional)</Label>
                    <Input id="phoneNumber" name="phoneNumber" placeholder="+1234567890" />
                  </div>
                </div>
                <DialogFooter>
                  <Button type="submit" disabled={createMutation.isPending}>
                    {createMutation.isPending ? "Creating..." : "Create Account"}
                  </Button>
                </DialogFooter>
              </form>
            </DialogContent>
          </Dialog>
        </div>
      </CardHeader>
      <CardContent>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Name</TableHead>
              <TableHead>API Key</TableHead>
              <TableHead>Phone Number</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Messages</TableHead>
              <TableHead>Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {accounts?.map((account) => (
              <TableRow key={account.id}>
                <TableCell className="font-medium">{account.name}</TableCell>
                <TableCell>
                  <div className="flex items-center gap-2">
                    <code className="text-xs bg-gray-100 px-2 py-1 rounded">
                      {account.apiKey.substring(0, 8)}...
                    </code>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => copyToClipboard(account.apiKey)}
                    >
                      <Copy className="w-3 h-3" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => {
                        if (confirm("Regenerate API key? This will invalidate the old key.")) {
                          regenerateKeyMutation.mutate({ id: account.id });
                        }
                      }}
                      title="Regenerate API Key"
                    >
                      <RefreshCw className="w-3 h-3" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => testConnectionMutation.mutate({ id: account.id })}
                      disabled={testConnectionMutation.isPending}
                      title="Test WaSender Connection"
                    >
                      {testConnectionMutation.isPending ? (
                        <RefreshCw className="w-3 h-3 animate-spin" />
                      ) : (
                        <span className="text-xs">🔌 Test</span>
                      )}
                    </Button>
                  </div>
                </TableCell>
                <TableCell>{account.phoneNumber || "—"}</TableCell>
                <TableCell>
                  <Badge variant={account.status === "active" ? "default" : "secondary"}>
                    {account.status}
                  </Badge>
                </TableCell>
                <TableCell>
                  <div className="text-sm">
                    <div>Sent: {account.messagesSent}</div>
                    <div>Received: {account.messagesReceived}</div>
                  </div>
                </TableCell>
                <TableCell>
                  <div className="flex gap-2">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => {
                        setSelectedAccount(account);
                        setIsEditOpen(true);
                      }}
                    >
                      <Edit className="w-4 h-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => {
                        if (confirm("Delete this account?")) {
                          deleteMutation.mutate({ id: account.id });
                        }
                      }}
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>

        {/* Edit Dialog */}
        <Dialog open={isEditOpen} onOpenChange={setIsEditOpen}>
          <DialogContent>
            {selectedAccount && (
              <form onSubmit={handleUpdate}>
                <DialogHeader>
                  <DialogTitle>Edit Account</DialogTitle>
                </DialogHeader>
                <div className="space-y-4 py-4">
                  <div>
                    <Label htmlFor="edit-name">Account Name</Label>
                    <Input id="edit-name" name="name" defaultValue={selectedAccount.name} required />
                  </div>
                  <div>
                    <Label htmlFor="edit-webhookUrl">Webhook URL</Label>
                    <Input id="edit-webhookUrl" name="webhookUrl" defaultValue={selectedAccount.webhookUrl || ""} />
                  </div>
                  <div>
                    <Label htmlFor="edit-phoneNumber">Phone Number</Label>
                    <Input id="edit-phoneNumber" name="phoneNumber" defaultValue={selectedAccount.phoneNumber || ""} />
                  </div>
                  <div>
                    <Label htmlFor="edit-status">Status</Label>
                    <Select name="status" defaultValue={selectedAccount.status}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="active">Active</SelectItem>
                        <SelectItem value="inactive">Inactive</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                <DialogFooter>
                  <Button type="submit" disabled={updateMutation.isPending}>
                    {updateMutation.isPending ? "Saving..." : "Save Changes"}
                  </Button>
                </DialogFooter>
              </form>
            )}
          </DialogContent>
        </Dialog>
      </CardContent>
    </Card>
  );
}

// ============================================================================
// AGENTS TAB
// ============================================================================

function AgentsTab() {
  const utils = trpc.useUtils();
  const [isCreateOpen, setIsCreateOpen] = useState(false);

  const { data: agents, isLoading } = trpc.agents.list.useQuery();

  const createMutation = trpc.agents.create.useMutation({
    onSuccess: () => {
      toast.success("Agent created successfully");
      utils.agents.list.invalidate();
      setIsCreateOpen(false);
    },
    onError: (error) => {
      toast.error(error.message);
    },
  });

  const deleteMutation = trpc.agents.delete.useMutation({
    onSuccess: () => {
      toast.success("Agent deleted");
      utils.agents.list.invalidate();
    },
  });

  const handleCreate = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    createMutation.mutate({
      name: formData.get("name") as string,
      email: formData.get("email") as string,
      password: formData.get("password") as string,
    });
  };

  if (isLoading) {
    return <div className="text-center py-8">Loading agents...</div>;
  }

  return (
    <Card className="mt-4">
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle>Agent Management</CardTitle>
            <CardDescription>Manage customer service agents</CardDescription>
          </div>
          <Dialog open={isCreateOpen} onOpenChange={setIsCreateOpen}>
            <DialogTrigger asChild>
              <Button>
                <Plus className="w-4 h-4 mr-2" />
                Create Agent
              </Button>
            </DialogTrigger>
            <DialogContent>
              <form onSubmit={handleCreate}>
                <DialogHeader>
                  <DialogTitle>Create Agent Account</DialogTitle>
                  <DialogDescription>Add a new customer service agent</DialogDescription>
                </DialogHeader>
                <div className="space-y-4 py-4">
                  <div>
                    <Label htmlFor="agent-name">Name *</Label>
                    <Input id="agent-name" name="name" required />
                  </div>
                  <div>
                    <Label htmlFor="agent-email">Email *</Label>
                    <Input id="agent-email" name="email" type="email" required />
                  </div>
                  <div>
                    <Label htmlFor="agent-password">Password *</Label>
                    <Input id="agent-password" name="password" type="password" minLength={6} required />
                  </div>
                </div>
                <DialogFooter>
                  <Button type="submit" disabled={createMutation.isPending}>
                    {createMutation.isPending ? "Creating..." : "Create Agent"}
                  </Button>
                </DialogFooter>
              </form>
            </DialogContent>
          </Dialog>
        </div>
      </CardHeader>
      <CardContent>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Name</TableHead>
              <TableHead>Email</TableHead>
              <TableHead>Last Signed In</TableHead>
              <TableHead>Created</TableHead>
              <TableHead>Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {agents?.map((agent) => (
              <TableRow key={agent.id}>
                <TableCell className="font-medium">{agent.name}</TableCell>
                <TableCell>{agent.email}</TableCell>
                <TableCell>{new Date(agent.lastSignedIn).toLocaleString()}</TableCell>
                <TableCell>{new Date(agent.createdAt).toLocaleDateString()}</TableCell>
                <TableCell>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => {
                      if (confirm(`Delete agent ${agent.name}?`)) {
                        deleteMutation.mutate({ id: agent.id });
                      }
                    }}
                  >
                    <Trash2 className="w-4 h-4" />
                  </Button>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  );
}

// ============================================================================
// ACCOUNT LINKING TAB
// ============================================================================

function AccountLinkingTab() {
  const utils = trpc.useUtils();
  const [selectedAgent, setSelectedAgent] = useState<number | null>(null);
  const [selectedAccount, setSelectedAccount] = useState<number | null>(null);

  const { data: agents } = trpc.agents.list.useQuery();
  const { data: accounts } = trpc.webhookAccounts.list.useQuery();
  const { data: linkedAccounts } = trpc.agents.getLinkedAccounts.useQuery(
    { agentId: selectedAgent! },
    { enabled: !!selectedAgent }
  );

  const linkMutation = trpc.agents.linkToAccount.useMutation({
    onSuccess: () => {
      toast.success("Agent linked to account");
      utils.agents.getLinkedAccounts.invalidate();
    },
  });

  const unlinkMutation = trpc.agents.unlinkFromAccount.useMutation({
    onSuccess: () => {
      toast.success("Agent unlinked from account");
      utils.agents.getLinkedAccounts.invalidate();
    },
  });

  const handleLink = () => {
    if (!selectedAgent || !selectedAccount) {
      toast.error("Please select both agent and account");
      return;
    }
    linkMutation.mutate({ agentId: selectedAgent, accountId: selectedAccount });
  };

  return (
    <Card className="mt-4">
      <CardHeader>
        <CardTitle>Agent-Account Linking</CardTitle>
        <CardDescription>Link agents to webhook accounts they can access</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-6">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label>Select Agent</Label>
              <Select value={selectedAgent?.toString()} onValueChange={(v) => setSelectedAgent(Number(v))}>
                <SelectTrigger>
                  <SelectValue placeholder="Choose an agent" />
                </SelectTrigger>
                <SelectContent>
                  {agents?.map((agent) => (
                    <SelectItem key={agent.id} value={agent.id.toString()}>
                      {agent.name} ({agent.email})
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label>Select Account</Label>
              <Select value={selectedAccount?.toString()} onValueChange={(v) => setSelectedAccount(Number(v))}>
                <SelectTrigger>
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
          </div>

          <Button onClick={handleLink} disabled={!selectedAgent || !selectedAccount || linkMutation.isPending}>
            <LinkIcon className="w-4 h-4 mr-2" />
            Link Agent to Account
          </Button>

          {selectedAgent && linkedAccounts && (
            <div className="mt-8">
              <h3 className="text-lg font-semibold mb-4">Linked Accounts</h3>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Account Name</TableHead>
                    <TableHead>Phone Number</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {linkedAccounts.map((account) => (
                    <TableRow key={account.id}>
                      <TableCell>{account.name}</TableCell>
                      <TableCell>{account.phoneNumber || "—"}</TableCell>
                      <TableCell>
                        <Badge variant={account.status === "active" ? "default" : "secondary"}>
                          {account.status}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => {
                            if (confirm("Unlink this account?")) {
                              unlinkMutation.mutate({ agentId: selectedAgent, accountId: account.id });
                            }
                          }}
                        >
                          <Unlink className="w-4 h-4" />
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}

// ============================================================================
// WEBHOOK LOGS TAB
// ============================================================================

function WebhookLogsTab() {
  const [selectedAccountId, setSelectedAccountId] = useState<number | null>(null);

  const { data: accounts } = trpc.webhookAccounts.list.useQuery();
  const { data: logs } = trpc.webhookLogs.getByAccountId.useQuery(
    { accountId: selectedAccountId!, limit: 100 },
    { enabled: !!selectedAccountId }
  );

  return (
    <Card className="mt-4">
      <CardHeader>
        <CardTitle>Webhook Logs</CardTitle>
        <CardDescription>View webhook activity and debugging information</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          <div>
            <Label>Select Account</Label>
            <Select value={selectedAccountId?.toString()} onValueChange={(v) => setSelectedAccountId(Number(v))}>
              <SelectTrigger>
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

          {logs && (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Timestamp</TableHead>
                  <TableHead>Direction</TableHead>
                  <TableHead>From</TableHead>
                  <TableHead>To</TableHead>
                  <TableHead>Message</TableHead>
                  <TableHead>Status</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {logs.map((log) => (
                  <TableRow key={log.id}>
                    <TableCell>{new Date(log.timestamp).toLocaleString()}</TableCell>
                    <TableCell>
                      <Badge variant={log.direction === "inbound" ? "default" : "secondary"}>
                        {log.direction}
                      </Badge>
                    </TableCell>
                    <TableCell>{log.fromNumber || "—"}</TableCell>
                    <TableCell>{log.toNumber || "—"}</TableCell>
                    <TableCell className="max-w-xs truncate">{log.message || "—"}</TableCell>
                    <TableCell>
                      <Badge variant={log.status === "received" ? "default" : log.status === "sent" ? "secondary" : "destructive"}>
                        {log.status}
                      </Badge>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </div>
      </CardContent>
    </Card>
  );
}

// ============================================================================
// SETTINGS TAB
// ============================================================================

function SettingsTab() {
  const utils = trpc.useUtils();
  const { data: settings } = trpc.settings.getAll.useQuery();
  const [webhookBaseUrl, setWebhookBaseUrl] = useState("");
  const [wasenderApiUrl, setWasenderApiUrl] = useState("https://www.wasenderapi.com");

  useEffect(() => {
    if (settings) {
      setWebhookBaseUrl(settings.find((s) => s.key === "webhook_base_url")?.value || "");
      setWasenderApiUrl(settings.find((s) => s.key === "wasender_api_url")?.value || "https://www.wasenderapi.com");
    }
  }, [settings]);

  const setSettingMutation = trpc.settings.set.useMutation({
    onSuccess: () => {
      toast.success("Setting saved");
      utils.settings.getAll.invalidate();
    },
  });

  const handleSaveWebhookUrl = () => {
    if (!webhookBaseUrl) {
      toast.error("Webhook Base URL is required");
      return;
    }
    setSettingMutation.mutate({ key: "webhook_base_url", value: webhookBaseUrl });
  };

  const handleSaveWasenderUrl = () => {
    setSettingMutation.mutate({ key: "wasender_api_url", value: wasenderApiUrl });
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    toast.success("Copied to clipboard");
  };

  return (
    <div className="space-y-6 mt-4">
      {/* Webhook Base URL Configuration */}
      <Card>
        <CardHeader>
          <CardTitle>Webhook Base URL</CardTitle>
          <CardDescription>
            Configure the base URL for your webhook endpoint (e.g., your domain with HTTPS)
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <Label htmlFor="webhook-base-url">Base URL</Label>
            <div className="flex gap-2 mt-2">
              <Input
                id="webhook-base-url"
                placeholder="https://your-domain.com"
                value={webhookBaseUrl}
                onChange={(e) => setWebhookBaseUrl(e.target.value)}
              />
              <Button onClick={handleSaveWebhookUrl}>Save</Button>
            </div>
            <p className="text-sm text-muted-foreground mt-2">
              Use HTTPS for production. For development, use the dev server URL. For production, deploy the app and use your Railway URL.
            </p>
          </div>

          {webhookBaseUrl && (
            <div className="space-y-3 p-4 bg-muted rounded-lg">
              <h4 className="font-semibold text-sm">Generated Endpoints</h4>
              
              <div>
                <Label className="text-xs">Webhook Endpoint</Label>
                <div className="flex items-center gap-2 mt-1">
                  <code className="flex-1 text-xs bg-background p-2 rounded border">
                    {webhookBaseUrl}/api/webhook/incoming?apiKey=YOUR_API_KEY
                  </code>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => copyToClipboard(`${webhookBaseUrl}/api/webhook/incoming?apiKey=YOUR_API_KEY`)}
                  >
                    <Copy className="h-4 w-4" />
                  </Button>
                </div>
                <p className="text-xs text-muted-foreground mt-1">
                  Configure this in WaSender. Replace YOUR_API_KEY with your webhook account's API key.
                </p>
              </div>

              <div>
                <Label className="text-xs">API Endpoint</Label>
                <div className="flex items-center gap-2 mt-1">
                  <code className="flex-1 text-xs bg-background p-2 rounded border">
                    {webhookBaseUrl}/api/trpc
                  </code>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => copyToClipboard(`${webhookBaseUrl}/api/trpc`)}
                  >
                    <Copy className="h-4 w-4" />
                  </Button>
                </div>
                <p className="text-xs text-muted-foreground mt-1">
                  tRPC API endpoint for client-server communication
                </p>
              </div>

              <div>
                <Label className="text-xs">Health Check Endpoint</Label>
                <div className="flex items-center gap-2 mt-1">
                  <code className="flex-1 text-xs bg-background p-2 rounded border">
                    {webhookBaseUrl}/api/health
                  </code>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => copyToClipboard(`${webhookBaseUrl}/api/health`)}
                  >
                    <Copy className="h-4 w-4" />
                  </Button>
                </div>
                <p className="text-xs text-muted-foreground mt-1">
                  Use this to monitor server health and uptime
                </p>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* WaSender API Configuration */}
      <Card>
        <CardHeader>
          <CardTitle>WaSender API Configuration</CardTitle>
          <CardDescription>
            Configure the WaSender API base URL for sending messages, images, and other operations
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <Label htmlFor="wasender-api-url">WaSender API Base URL</Label>
            <div className="flex gap-2 mt-2">
              <Input
                id="wasender-api-url"
                value={wasenderApiUrl}
                onChange={(e) => setWasenderApiUrl(e.target.value)}
              />
              <Button onClick={handleSaveWasenderUrl}>Save</Button>
            </div>
            <p className="text-sm text-muted-foreground mt-2">
              Default: https://www.wasenderapi.com
            </p>
          </div>

          {wasenderApiUrl && (
            <div className="space-y-3 p-4 bg-muted rounded-lg">
              <h4 className="font-semibold text-sm">Generated WaSender API Endpoints</h4>
              
              {[
                { label: "Send Message", path: "/api/send-message" },
                { label: "Send Image", path: "/api/send-image" },
                { label: "Send File", path: "/api/send-file" },
                { label: "Send Audio", path: "/api/send-audio" },
                { label: "Send Video", path: "/api/send-video" },
                { label: "Get Message Info", path: "/api/get-message-info" },
                { label: "Get Session Info", path: "/api/get-session-info" },
              ].map((endpoint) => (
                <div key={endpoint.path}>
                  <Label className="text-xs">{endpoint.label}</Label>
                  <div className="flex items-center gap-2 mt-1">
                    <code className="flex-1 text-xs bg-background p-2 rounded border">
                      {wasenderApiUrl}{endpoint.path}
                    </code>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => copyToClipboard(`${wasenderApiUrl}${endpoint.path}`)}
                    >
                      <Copy className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Quick Setup Guide */}
      <Card>
        <CardHeader>
          <CardTitle>Quick Setup Guide</CardTitle>
        </CardHeader>
        <CardContent>
          <ol className="list-decimal list-inside space-y-2 text-sm">
            <li>Set your base URL above (development or production)</li>
            <li>All endpoints are automatically generated</li>
            <li>Copy the webhook endpoint and configure it in WaSender</li>
            <li>Replace YOUR_API_KEY with your actual API key</li>
            <li>Use agent authentication for secure access</li>
          </ol>
        </CardContent>
      </Card>

      {/* About */}
      <Card>
        <CardHeader>
          <CardTitle>About</CardTitle>
          <CardDescription>Application information</CardDescription>
        </CardHeader>
        <CardContent className="space-y-2 text-sm">
          <div className="flex justify-between">
            <span className="text-muted-foreground">Application:</span>
            <span className="font-medium">WaSender Admin Portal</span>
          </div>
          <div className="flex justify-between">
            <span className="text-muted-foreground">Version:</span>
            <span className="font-medium">1.0.0</span>
          </div>
          <div className="flex justify-between">
            <span className="text-muted-foreground">Environment:</span>
            <span className="font-medium">{import.meta.env.MODE}</span>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

// Placeholder component for Settings Tab (old version removed

