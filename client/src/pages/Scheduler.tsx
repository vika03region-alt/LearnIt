import { useEffect, useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/useAuth";
import { isUnauthorizedError } from "@/lib/authUtils";
import { apiRequest } from "@/lib/queryClient";
import Sidebar from "@/components/Sidebar";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ArrowLeft, Calendar, Clock, Play, Pause, Trash2, StopCircle } from "lucide-react";
import { Link } from "wouter";

export default function Scheduler() {
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

  const { data: scheduledJobs, isLoading: isJobsLoading } = useQuery<any[]>({
    queryKey: ['/api/scheduler/jobs'],
    retry: false,
  });

  const { data: platforms } = useQuery<any[]>({
    queryKey: ['/api/platforms'],
    retry: false,
  });

  const emergencyStopMutation = useMutation({
    mutationFn: async () => {
      const response = await apiRequest('POST', '/api/scheduler/emergency-stop', {});
      return await response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/scheduler/jobs'] });
      queryClient.invalidateQueries({ queryKey: ['/api/activity'] });
      toast({
        title: "Emergency Stop Activated",
        description: "All scheduled jobs have been stopped.",
        variant: "destructive",
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
        title: "Emergency Stop Failed",
        description: error.message || "Failed to activate emergency stop",
        variant: "destructive",
      });
    },
  });

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'pending':
        return <Badge className="bg-blue-100 text-blue-800">Pending</Badge>;
      case 'running':
        return <Badge className="bg-yellow-100 text-yellow-800">Running</Badge>;
      case 'completed':
        return <Badge className="bg-green-100 text-green-800">Completed</Badge>;
      case 'failed':
        return <Badge className="bg-red-100 text-red-800">Failed</Badge>;
      case 'cancelled':
        return <Badge variant="secondary">Cancelled</Badge>;
      default:
        return <Badge variant="secondary">{status}</Badge>;
    }
  };

  const getPlatformName = (platformName: string) => {
    const platform = platforms?.find((p: any) => p.name === platformName);
    return platform?.displayName || platformName;
  };

  const formatDateTime = (dateString: string) => {
    return new Date(dateString).toLocaleString('en-US', {
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const getJobStats = () => {
    if (!scheduledJobs) return { pending: 0, completed: 0, failed: 0 };
    
    return scheduledJobs.reduce((acc: any, job: any) => {
      acc[job.status] = (acc[job.status] || 0) + 1;
      return acc;
    }, {});
  };

  const stats = getJobStats();

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
              <h2 className="text-2xl font-bold text-foreground">Scheduler</h2>
              <p className="text-muted-foreground">
                Manage scheduled posts and automation tasks
              </p>
            </div>
          </div>
        </header>

        <div className="p-6 space-y-6">
          {/* Scheduler Stats */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <Card>
              <CardContent className="p-4">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
                    <Clock className="w-5 h-5 text-blue-600" />
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Pending</p>
                    <p className="text-2xl font-bold text-foreground" data-testid="stat-pending">
                      {stats.pending || 0}
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-4">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center">
                    <Play className="w-5 h-5 text-green-600" />
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Completed</p>
                    <p className="text-2xl font-bold text-foreground" data-testid="stat-completed">
                      {stats.completed || 0}
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-4">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-red-100 rounded-lg flex items-center justify-center">
                    <Pause className="w-5 h-5 text-red-600" />
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Failed</p>
                    <p className="text-2xl font-bold text-foreground" data-testid="stat-failed">
                      {stats.failed || 0}
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-4">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-purple-100 rounded-lg flex items-center justify-center">
                    <Calendar className="w-5 h-5 text-purple-600" />
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Total Jobs</p>
                    <p className="text-2xl font-bold text-foreground" data-testid="stat-total">
                      {scheduledJobs?.length || 0}
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Emergency Controls */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center justify-between">
                Emergency Controls
                <Button
                  variant="destructive"
                  onClick={() => emergencyStopMutation.mutate()}
                  disabled={emergencyStopMutation.isPending}
                  data-testid="button-emergency-stop"
                >
                  {emergencyStopMutation.isPending ? (
                    <>
                      <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2"></div>
                      Stopping...
                    </>
                  ) : (
                    <>
                      <StopCircle className="w-4 h-4 mr-2" />
                      Emergency Stop All
                    </>
                  )}
                </Button>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="p-4 bg-red-50 border border-red-200 rounded-lg">
                <p className="text-sm text-red-900">
                  <strong>Warning:</strong> Emergency stop will immediately cancel all pending scheduled posts 
                  and prevent new automation from running. Use this only when necessary to prevent account restrictions.
                </p>
              </div>
            </CardContent>
          </Card>

          {/* Scheduled Jobs */}
          <Card>
            <CardHeader>
              <CardTitle>Scheduled Jobs</CardTitle>
            </CardHeader>
            <CardContent>
              {isJobsLoading ? (
                <div className="flex items-center justify-center py-8">
                  <div className="w-6 h-6 border-2 border-primary border-t-transparent rounded-full animate-spin"></div>
                </div>
              ) : scheduledJobs && scheduledJobs.length > 0 ? (
                <div className="space-y-4">
                  {scheduledJobs.map((job: any) => (
                    <div 
                      key={job.id}
                      className="flex items-center justify-between p-4 border border-border rounded-lg hover:bg-muted transition-colors"
                      data-testid={`job-${job.id}`}
                    >
                      <div className="flex-1">
                        <div className="flex items-center gap-3 mb-2">
                          <h3 className="font-medium text-foreground">
                            {getPlatformName(job.platform)} Post
                          </h3>
                          {getStatusBadge(job.status)}
                        </div>
                        <p className="text-sm text-muted-foreground line-clamp-2 mb-2">
                          {job.content}
                        </p>
                        <div className="flex items-center gap-4 text-xs text-muted-foreground">
                          <span>Job ID: {job.id}</span>
                          <span>Scheduled: {formatDateTime(job.scheduledTime)}</span>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        {job.status === 'pending' && (
                          <>
                            <Button 
                              size="sm" 
                              variant="outline"
                              data-testid={`button-cancel-${job.id}`}
                            >
                              <Trash2 className="w-4 h-4" />
                            </Button>
                          </>
                        )}
                        <Button 
                          size="sm" 
                          variant="ghost"
                          data-testid={`button-details-${job.id}`}
                        >
                          Details
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8">
                  <Calendar className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
                  <p className="text-muted-foreground text-sm">No scheduled jobs</p>
                  <p className="text-muted-foreground text-xs mt-1">
                    Scheduled posts will appear here when created
                  </p>
                  <Button className="mt-4" data-testid="button-create-schedule">
                    Schedule New Post
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </main>
    </div>
  );
}
