import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { isUnauthorizedError } from "@/lib/authUtils";
import { 
  StopCircle, 
  Pause, 
  BarChart3, 
  Settings,
  AlertCircle
} from "lucide-react";

export default function QuickActions() {
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const emergencyStopMutation = useMutation({
    mutationFn: async () => {
      const response = await apiRequest('POST', '/api/scheduler/emergency-stop', {});
      return await response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/activity'] });
      queryClient.invalidateQueries({ queryKey: ['/api/scheduler/jobs'] });
      toast({
        title: "Emergency Stop Activated",
        description: "All automation has been stopped immediately.",
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

  const pauseAllMutation = useMutation({
    mutationFn: async () => {
      // This would need to be implemented in the backend
      const response = await apiRequest('POST', '/api/scheduler/pause-all', {});
      return await response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/activity'] });
      queryClient.invalidateQueries({ queryKey: ['/api/scheduler/jobs'] });
      toast({
        title: "Automation Paused",
        description: "All scheduled posts have been delayed by 1 hour.",
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
      // Handle non-critical error for pause (feature might not be implemented yet)
      toast({
        title: "Pause Function",
        description: "Pause feature is coming soon. Use emergency stop for immediate halt.",
      });
    },
  });

  const generateReportMutation = useMutation({
    mutationFn: async () => {
      // This would generate a report - placeholder for now
      await new Promise(resolve => setTimeout(resolve, 2000));
      return { message: "Report generated successfully" };
    },
    onSuccess: () => {
      toast({
        title: "Report Generated",
        description: "Your weekly automation report has been generated.",
      });
    },
    onError: () => {
      toast({
        title: "Report Generation Failed",
        description: "Failed to generate the weekly report. Please try again.",
        variant: "destructive",
      });
    },
  });

  const actions = [
    {
      id: 'emergency-stop',
      title: 'Emergency Stop',
      description: 'Stop all automation',
      icon: <StopCircle className="text-red-600 text-xl" />,
      bgClass: 'bg-red-100 group-hover:bg-red-200',
      action: () => emergencyStopMutation.mutate(),
      loading: emergencyStopMutation.isPending,
      variant: 'destructive' as const,
    },
    {
      id: 'pause-all',
      title: 'Pause All',
      description: 'Temporary pause',
      icon: <Pause className="text-yellow-600 text-xl" />,
      bgClass: 'bg-yellow-100 group-hover:bg-yellow-200',
      action: () => pauseAllMutation.mutate(),
      loading: pauseAllMutation.isPending,
      variant: 'secondary' as const,
    },
    {
      id: 'generate-report',
      title: 'Generate Report',
      description: 'Weekly summary',
      icon: <BarChart3 className="text-blue-600 text-xl" />,
      bgClass: 'bg-blue-100 group-hover:bg-blue-200',
      action: () => generateReportMutation.mutate(),
      loading: generateReportMutation.isPending,
      variant: 'default' as const,
    },
    {
      id: 'settings',
      title: 'Settings',
      description: 'Configure platform',
      icon: <Settings className="text-purple-600 text-xl" />,
      bgClass: 'bg-purple-100 group-hover:bg-purple-200',
      action: () => window.location.href = '/settings',
      loading: false,
      variant: 'outline' as const,
    },
  ];

  return (
    <Card className="bg-card border border-border" data-testid="quick-actions">
      <CardHeader>
        <CardTitle className="text-lg font-semibold text-foreground">Quick Actions</CardTitle>
      </CardHeader>
      
      <CardContent>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {actions.map((action) => (
            <Button
              key={action.id}
              variant="ghost"
              className="flex flex-col items-center gap-3 p-4 h-auto border border-border hover:bg-muted transition-colors group"
              onClick={action.action}
              disabled={action.loading}
              data-testid={`button-${action.id}`}
            >
              <div className={`w-12 h-12 rounded-full flex items-center justify-center ${action.bgClass}`}>
                {action.loading ? (
                  <div className="w-6 h-6 border-2 border-current border-t-transparent rounded-full animate-spin"></div>
                ) : (
                  action.icon
                )}
              </div>
              <div className="text-center">
                <div className="font-medium text-foreground">{action.title}</div>
                <div className="text-xs text-muted-foreground">{action.description}</div>
              </div>
            </Button>
          ))}
        </div>

        {/* Warning notice for emergency actions */}
        <div className="mt-6 p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
          <div className="flex items-start gap-2">
            <AlertCircle className="w-4 h-4 text-yellow-600 mt-0.5 flex-shrink-0" />
            <div className="text-sm">
              <p className="text-yellow-900 font-medium">Important Notice</p>
              <p className="text-yellow-700 text-xs mt-1">
                Emergency stop will immediately halt all automation and scheduled posts. Use this only when necessary to prevent account restrictions.
              </p>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
