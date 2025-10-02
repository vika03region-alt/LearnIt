import { useEffect, useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/useAuth";
import { isUnauthorizedError } from "@/lib/authUtils";
import { apiRequest } from "@/lib/queryClient";
import Sidebar from "@/components/Sidebar";
import SocialAccountManager from "@/components/SocialAccountManager";
import TelegramTester from "@/components/TelegramTester";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Separator } from "@/components/ui/separator";
import { ArrowLeft, Settings as SettingsIcon, User, Shield, Trash2, Plus, LogOut } from "lucide-react";
import { Link } from "wouter";

export default function Settings() {
  const { toast } = useToast();
  const { isAuthenticated, isLoading, user } = useAuth();
  const queryClient = useQueryClient();

  const [showAddAccount, setShowAddAccount] = useState(false);
  const [newAccountData, setNewAccountData] = useState({
    platformId: '',
    accountHandle: '',
    accessToken: '',
  });

  // Redirect if not authenticated
  useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      toast({
        title: "Unauthorized",
        description: "You are logged out. Logging in again...",
        variant: "destructive",
      });
      setTimeout(() => {
        window.location.href = "/api/login";
      }, 500);
      return;
    }
  }, [isAuthenticated, isLoading, toast]);

  const { data: platforms } = useQuery({
    queryKey: ['/api/platforms'],
    retry: false,
  });

  const { data: userAccounts, isLoading: isAccountsLoading } = useQuery({
    queryKey: ['/api/user-accounts'],
    retry: false,
  });

  const addAccountMutation = useMutation({
    mutationFn: async (accountData: any) => {
      const response = await apiRequest('POST', '/api/user-accounts', accountData);
      return await response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/user-accounts'] });
      setShowAddAccount(false);
      setNewAccountData({ platformId: '', accountHandle: '', accessToken: '' });
      toast({
        title: "Account Connected",
        description: "Social media account has been successfully connected.",
      });
    },
    onError: (error) => {
      if (isUnauthorizedError(error)) {
        toast({
          title: "Unauthorized",
          description: "You are logged out. Logging in again...",
          variant: "destructive",
        });
        setTimeout(() => {
          window.location.href = "/api/login";
        }, 500);
        return;
      }
      toast({
        title: "Connection Failed",
        description: error.message || "Failed to connect social media account",
        variant: "destructive",
      });
    },
  });

  const handleAddAccount = () => {
    if (!newAccountData.platformId || !newAccountData.accountHandle) {
      toast({
        title: "Missing Information",
        description: "Please fill in all required fields.",
        variant: "destructive",
      });
      return;
    }

    addAccountMutation.mutate(newAccountData);
  };

  const getPlatformName = (platformId: number) => {
    const platform = platforms?.find((p: any) => p.id === platformId);
    return platform?.displayName || `Platform ${platformId}`;
  };

  const handleLogout = () => {
    window.location.href = "/api/logout";
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-muted-foreground">Loading...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <Sidebar />

      <main className="ml-64 transition-all duration-300">
        <header className="bg-card border-b border-border px-6 py-4">
          <div className="flex items-center gap-4">
            <Link href="/">
              <Button variant="ghost" size="sm" data-testid="button-back">
                <ArrowLeft className="w-4 h-4 mr-2" />
                Back to Dashboard
              </Button>
            </Link>
            <div>
              <h2 className="text-2xl font-bold text-foreground">Settings</h2>
              <p className="text-muted-foreground">
                Manage your account and platform connections
              </p>
            </div>
          </div>
        </header>

        <div className="p-6 space-y-6">
          {/* User Profile */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <User className="w-5 h-5" />
                User Profile
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center gap-4">
                <div className="w-16 h-16 bg-gradient-to-br from-primary to-chart-1 rounded-full flex items-center justify-center">
                  <User className="w-8 h-8 text-primary-foreground" />
                </div>
                <div>
                  <h3 className="text-lg font-semibold text-foreground">
                    {user?.firstName && user?.lastName 
                      ? `${user.firstName} ${user.lastName}`
                      : 'User'
                    }
                  </h3>
                  <p className="text-sm text-muted-foreground">{user?.email}</p>
                  <Badge variant="secondary" className="mt-1">Pro Plan</Badge>
                </div>
              </div>

              <Separator />

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="firstName">First Name</Label>
                  <Input 
                    id="firstName"
                    defaultValue={user?.firstName || ''}
                    disabled
                    className="mt-1"
                    data-testid="input-first-name"
                  />
                </div>
                <div>
                  <Label htmlFor="lastName">Last Name</Label>
                  <Input 
                    id="lastName"
                    defaultValue={user?.lastName || ''}
                    disabled
                    className="mt-1"
                    data-testid="input-last-name"
                  />
                </div>
                <div className="md:col-span-2">
                  <Label htmlFor="email">Email</Label>
                  <Input 
                    id="email"
                    type="email"
                    defaultValue={user?.email || ''}
                    disabled
                    className="mt-1"
                    data-testid="input-email"
                  />
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Connected Accounts */}
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle className="flex items-center gap-2">
                  <Shield className="w-5 h-5" />
                  Connected Accounts
                </CardTitle>
                <Button 
                  onClick={() => setShowAddAccount(!showAddAccount)}
                  data-testid="button-add-account"
                >
                  <Plus className="w-4 h-4 mr-2" />
                  Add Account
                </Button>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              {showAddAccount && (
                <div className="p-4 border border-border rounded-lg bg-muted">
                  <h4 className="font-medium text-foreground mb-3">Add New Account</h4>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div>
                      <Label htmlFor="platform">Platform</Label>
                      <select
                        id="platform"
                        className="w-full mt-1 px-3 py-2 border border-border rounded-md bg-background"
                        value={newAccountData.platformId}
                        onChange={(e) => setNewAccountData(prev => ({ ...prev, platformId: e.target.value }))}
                        data-testid="select-platform"
                      >
                        <option value="">Select Platform</option>
                        {platforms?.map((platform: any) => (
                          <option key={platform.id} value={platform.id}>
                            {platform.displayName}
                          </option>
                        ))}
                      </select>
                    </div>
                    <div>
                      <Label htmlFor="accountHandle">Account Handle</Label>
                      <Input
                        id="accountHandle"
                        placeholder="@username"
                        value={newAccountData.accountHandle}
                        onChange={(e) => setNewAccountData(prev => ({ ...prev, accountHandle: e.target.value }))}
                        className="mt-1"
                        data-testid="input-account-handle"
                      />
                    </div>
                    <div>
                      <Label htmlFor="accessToken">Access Token</Label>
                      <Input
                        id="accessToken"
                        type="password"
                        placeholder="Enter access token"
                        value={newAccountData.accessToken}
                        onChange={(e) => setNewAccountData(prev => ({ ...prev, accessToken: e.target.value }))}
                        className="mt-1"
                        data-testid="input-access-token"
                      />
                    </div>
                  </div>
                  <div className="flex gap-2 mt-4">
                    <Button 
                      onClick={handleAddAccount}
                      disabled={addAccountMutation.isPending}
                      data-testid="button-save-account"
                    >
                      {addAccountMutation.isPending ? 'Connecting...' : 'Connect Account'}
                    </Button>
                    <Button 
                      variant="outline" 
                      onClick={() => setShowAddAccount(false)}
                      data-testid="button-cancel-add"
                    >
                      Cancel
                    </Button>
                  </div>
                </div>
              )}

              {isAccountsLoading ? (
                <div className="flex items-center justify-center py-8">
                  <div className="w-6 h-6 border-2 border-primary border-t-transparent rounded-full animate-spin"></div>
                </div>
              ) : userAccounts && userAccounts.length > 0 ? (
                <div className="space-y-3">
                  {userAccounts.map((account: any) => (
                    <div 
                      key={account.id}
                      className="flex items-center justify-between p-3 border border-border rounded-lg"
                      data-testid={`account-${account.id}`}
                    >
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-muted rounded-lg flex items-center justify-center">
                          <SettingsIcon className="w-5 h-5 text-muted-foreground" />
                        </div>
                        <div>
                          <p className="font-medium text-foreground">
                            {getPlatformName(account.platformId)}
                          </p>
                          <p className="text-sm text-muted-foreground">
                            {account.accountHandle}
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <Badge variant={account.isActive ? "default" : "secondary"}>
                          {account.isActive ? "Active" : "Inactive"}
                        </Badge>
                        <Button 
                          size="sm" 
                          variant="ghost"
                          data-testid={`button-remove-${account.id}`}
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8">
                  <Shield className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
                  <p className="text-muted-foreground text-sm">No connected accounts</p>
                  <p className="text-muted-foreground text-xs mt-1">
                    Connect your social media accounts to enable automation
                  </p>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Telegram Tester */}
          <TelegramTester />

          {/* App Settings */}
          <Card>
            <CardHeader>
              <CardTitle>App Settings</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <Label className="text-sm font-medium">Email Notifications</Label>
                  <p className="text-xs text-muted-foreground">
                    Receive email alerts for safety warnings and completed actions
                  </p>
                </div>
                <Switch defaultChecked data-testid="switch-email-notifications" />
              </div>

              <Separator />

              <div className="flex items-center justify-between">
                <div>
                  <Label className="text-sm font-medium">Auto Safety Checks</Label>
                  <p className="text-xs text-muted-foreground">
                    Automatically run safety checks every hour
                  </p>
                </div>
                <Switch defaultChecked data-testid="switch-auto-safety" />
              </div>

              <Separator />

              <div className="flex items-center justify-between">
                <div>
                  <Label className="text-sm font-medium">Emergency Stop on Critical</Label>
                  <p className="text-xs text-muted-foreground">
                    Automatically stop all automation when critical rate limits are reached
                  </p>
                </div>
                <Switch defaultChecked data-testid="switch-emergency-stop" />
              </div>
            </CardContent>
          </Card>

          {/* Danger Zone */}
          <Card className="border-destructive">
            <CardHeader>
              <CardTitle className="text-destructive">Danger Zone</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="font-medium text-foreground">Sign Out</p>
                  <p className="text-xs text-muted-foreground">
                    Sign out of your account on this device
                  </p>
                </div>
                <Button 
                  variant="outline" 
                  onClick={handleLogout}
                  data-testid="button-logout"
                >
                  <LogOut className="w-4 h-4 mr-2" />
                  Sign Out
                </Button>
              </div>

              <Separator />

              <div className="flex items-center justify-between">
                <div>
                  <p className="font-medium text-destructive">Delete Account</p>
                  <p className="text-xs text-muted-foreground">
                    Permanently delete your account and all associated data
                  </p>
                </div>
                <Button 
                  variant="destructive"
                  data-testid="button-delete-account"
                >
                  <Trash2 className="w-4 h-4 mr-2" />
                  Delete Account
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </main>
    </div>
  );
}