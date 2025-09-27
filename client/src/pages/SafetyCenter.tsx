import { useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/useAuth";
import { isUnauthorizedError } from "@/lib/authUtils";
import { apiRequest } from "@/lib/queryClient";
import Sidebar from "@/components/Sidebar";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ArrowLeft, Shield, ShieldCheck, AlertTriangle, RefreshCw } from "lucide-react";
import { Link } from "wouter";

export default function SafetyCenter() {
  const { toast } = useToast();
  const { isAuthenticated, isLoading } = useAuth();
  const queryClient = useQueryClient();

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

  const { data: safetyStatus, isLoading: isStatusLoading } = useQuery({
    queryKey: ['/api/safety/status'],
    retry: false,
  });

  const { data: safetyLogs, isLoading: isLogsLoading } = useQuery({
    queryKey: ['/api/safety/logs'],
    retry: false,
  });

  const { data: platforms } = useQuery({
    queryKey: ['/api/platforms'],
    retry: false,
  });

  const safetyCheckMutation = useMutation({
    mutationFn: async () => {
      const response = await apiRequest('POST', '/api/safety/check', {});
      return await response.json();
    },
    onSuccess: (result) => {
      queryClient.invalidateQueries({ queryKey: ['/api/safety/status'] });
      queryClient.invalidateQueries({ queryKey: ['/api/safety/logs'] });
      queryClient.invalidateQueries({ queryKey: ['/api/activity'] });
      toast({
        title: "Safety Check Complete",
        description: result.message || "Safety check completed successfully.",
        variant: result.issues?.length > 0 ? "destructive" : "default",
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
        title: "Safety Check Failed",
        description: error.message || "Failed to perform safety check",
        variant: "destructive",
      });
    },
  });

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'safe':
        return <ShieldCheck className="w-6 h-6 text-green-600" />;
      case 'warning':
        return <AlertTriangle className="w-6 h-6 text-yellow-600" />;
      case 'critical':
        return <Shield className="w-6 h-6 text-red-600" />;
      default:
        return <Shield className="w-6 h-6 text-gray-600" />;
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'safe':
        return <Badge className="bg-green-100 text-green-800">SAFE</Badge>;
      case 'warning':
        return <Badge className="bg-yellow-100 text-yellow-800">WARNING</Badge>;
      case 'critical':
        return <Badge className="bg-red-100 text-red-800">CRITICAL</Badge>;
      default:
        return <Badge variant="secondary">UNKNOWN</Badge>;
    }
  };

  const getPlatformName = (platformId: number) => {
    const platform = platforms?.find((p: any) => p.id === platformId);
    return platform?.displayName || `Platform ${platformId}`;
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
              <h2 className="text-2xl font-bold text-foreground">Safety Center</h2>
              <p className="text-muted-foreground">
                Monitor rate limits and safety status across all platforms
              </p>
            </div>
          </div>
        </header>

        <div className="p-6 space-y-6">
          {/* Overall Safety Status */}
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle className="flex items-center gap-3">
                  {safetyStatus && getStatusIcon(safetyStatus.overall)}
                  Overall Safety Status
                </CardTitle>
                <div className="flex items-center gap-3">
                  {safetyStatus && getStatusBadge(safetyStatus.overall)}
                  <Button
                    onClick={() => safetyCheckMutation.mutate()}
                    disabled={safetyCheckMutation.isPending}
                    data-testid="button-safety-check"
                  >
                    {safetyCheckMutation.isPending ? (
                      <>
                        <div className="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin mr-2"></div>
                        Checking...
                      </>
                    ) : (
                      <>
                        <RefreshCw className="w-4 h-4 mr-2" />
                        Run Safety Check
                      </>
                    )}
                  </Button>
                </div>
              </div>
            </CardHeader>

            <CardContent>
              {isStatusLoading ? (
                <div className="flex items-center justify-center py-8">
                  <div className="w-6 h-6 border-2 border-primary border-t-transparent rounded-full animate-spin"></div>
                </div>
              ) : safetyStatus ? (
                <div className="space-y-4">
                  {safetyStatus.recommendations?.length > 0 && (
                    <div className="p-4 bg-muted rounded-lg">
                      <h4 className="font-medium text-foreground mb-2">Recommendations:</h4>
                      <ul className="space-y-1">
                        {safetyStatus.recommendations.map((rec: string, index: number) => (
                          <li key={index} className="text-sm text-muted-foreground">
                            • {rec}
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}
                </div>
              ) : (
                <p className="text-muted-foreground">Unable to load safety status</p>
              )}
            </CardContent>
          </Card>

          {/* Platform Rate Limits */}
          <Card>
            <CardHeader>
              <CardTitle>Platform Rate Limits</CardTitle>
            </CardHeader>
            <CardContent>
              {isStatusLoading ? (
                <div className="flex items-center justify-center py-8">
                  <div className="w-6 h-6 border-2 border-primary border-t-transparent rounded-full animate-spin"></div>
                </div>
              ) : safetyStatus?.platforms ? (
                <div className="space-y-6">
                  {Object.entries(safetyStatus.platforms).map(([platformId, data]: [string, any]) => (
                    <div key={platformId} className="space-y-3">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          {getStatusIcon(data.status)}
                          <h3 className="font-medium text-foreground">
                            {getPlatformName(parseInt(platformId))}
                          </h3>
                          {getStatusBadge(data.status)}
                        </div>
                        <div className="text-sm text-muted-foreground">
                          {data.rateLimitUsage.toFixed(0)}/{data.maxLimit} actions
                        </div>
                      </div>
                      
                      <div className="space-y-2">
                        <div className="flex justify-between text-sm">
                          <span className="text-muted-foreground">Daily Usage</span>
                          <span className="font-medium">
                            {data.percentage.toFixed(1)}%
                          </span>
                        </div>
                        <div className="w-full bg-secondary rounded-full h-3">
                          <div 
                            className={`h-3 rounded-full progress-bar ${
                              data.percentage > 90 ? 'bg-red-500' :
                              data.percentage > 80 ? 'bg-yellow-500' :
                              'bg-green-500'
                            }`}
                            style={{ width: `${Math.min(data.percentage, 100)}%` }}
                          ></div>
                        </div>
                        {data.lastAction && (
                          <p className="text-xs text-muted-foreground">
                            Last action: {new Date(data.lastAction).toLocaleString()}
                          </p>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-muted-foreground">No platform data available</p>
              )}
            </CardContent>
          </Card>

          {/* Recent Safety Logs */}
          <Card>
            <CardHeader>
              <CardTitle>Recent Safety Events</CardTitle>
            </CardHeader>
            <CardContent>
              {isLogsLoading ? (
                <div className="flex items-center justify-center py-8">
                  <div className="w-6 h-6 border-2 border-primary border-t-transparent rounded-full animate-spin"></div>
                </div>
              ) : safetyLogs && safetyLogs.length > 0 ? (
                <div className="space-y-4">
                  {safetyLogs.slice(0, 10).map((log: any) => (
                    <div 
                      key={log.id}
                      className="flex items-center justify-between p-3 border border-border rounded-lg"
                      data-testid={`safety-log-${log.id}`}
                    >
                      <div className="flex items-center gap-3">
                        {getStatusIcon(log.status)}
                        <div>
                          <p className="text-sm font-medium text-foreground">
                            {getPlatformName(log.platformId)} - {log.actionType}
                          </p>
                          <p className="text-xs text-muted-foreground">
                            {log.actionCount} action(s) • {log.rateLimitUsed}/{log.rateLimitMax} daily limit
                          </p>
                        </div>
                      </div>
                      <div className="text-right">
                        {getStatusBadge(log.status)}
                        <p className="text-xs text-muted-foreground mt-1">
                          {new Date(log.checkTime).toLocaleString()}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8">
                  <Shield className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
                  <p className="text-muted-foreground text-sm">No safety events recorded</p>
                  <p className="text-muted-foreground text-xs mt-1">
                    Safety events will appear here when actions are monitored
                  </p>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </main>
    </div>
  );
}
