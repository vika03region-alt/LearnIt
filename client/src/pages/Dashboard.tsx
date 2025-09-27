import { useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/useAuth";
import { isUnauthorizedError } from "@/lib/authUtils";
import { Platform, DashboardData, SafetyStatus as SafetyStatusType, Activity } from "@/types/api";
import Sidebar from "@/components/Sidebar";
import SafetyStatus from "@/components/SafetyStatus";
import PlatformCard from "@/components/PlatformCard";
import AIContentPanel from "@/components/AIContentPanel";
import ActivityFeed from "@/components/ActivityFeed";
import AnalyticsChart from "@/components/AnalyticsChart";
import QuickActions from "@/components/QuickActions";
import { Bell, User } from "lucide-react";
import { Badge } from "@/components/ui/badge";

export default function Dashboard() {
  const { toast } = useToast();
  const { isAuthenticated, isLoading, user } = useAuth();

  // Redirect to home if not authenticated
  useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      toast({
        title: "Нет доступа",
        description: "Вы не авторизованы. Выполняется вход...",
        variant: "destructive",
      });
      setTimeout(() => {
        window.location.href = "/api/login";
      }, 500);
      return;
    }
  }, [isAuthenticated, isLoading, toast]);

  const { data: dashboardData, isLoading: isDashboardLoading } = useQuery<DashboardData>({
    queryKey: ['/api/analytics/dashboard'],
    retry: false,
  });

  const { data: platforms, isLoading: isPlatformsLoading } = useQuery<Platform[]>({
    queryKey: ['/api/platforms'],
    retry: false,
  });

  const { data: safetyStatus } = useQuery<SafetyStatusType>({
    queryKey: ['/api/safety/status'],
    retry: false,
  });

  const { data: activities } = useQuery<Activity[]>({
    queryKey: ['/api/activity'],
    retry: false,
  });

  if (isLoading || isDashboardLoading || isPlatformsLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-muted-foreground">Загрузка панели управления...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <Sidebar />
      
      <main className="ml-64 transition-all duration-300">
        {/* Header */}
        <header className="bg-card border-b border-border px-6 py-4">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-2xl font-bold text-foreground" data-testid="text-dashboard-title">
                Главная панель
              </h2>
              <p className="text-muted-foreground">
                Мониторинг всех ваших социальных платформ в одном месте
              </p>
            </div>
            <div className="flex items-center gap-4">
              <div className="relative">
                <button 
                  className="relative p-2 text-muted-foreground hover:text-foreground"
                  data-testid="button-notifications"
                >
                  <Bell className="w-5 h-5" />
                  {activities && activities.length > 0 && (
                    <Badge 
                      className="absolute -top-1 -right-1 w-5 h-5 rounded-full p-0 flex items-center justify-center text-xs"
                      variant="destructive"
                    >
                      {Math.min(activities.length, 9)}
                    </Badge>
                  )}
                </button>
              </div>
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-gradient-to-br from-primary to-chart-1 rounded-full flex items-center justify-center">
                  <User className="w-5 h-5 text-primary-foreground" />
                </div>
                <div className="hidden sm:block">
                  <p className="text-sm font-medium text-foreground" data-testid="text-user-name">
                    {user?.firstName && user?.lastName 
                      ? `${user.firstName} ${user.lastName}`
                      : user?.email || 'Пользователь'
                    }
                  </p>
                  <p className="text-xs text-muted-foreground">Тариф Pro</p>
                </div>
              </div>
            </div>
          </div>
        </header>

        <div className="p-6 space-y-6">
          {/* Safety Status Banner */}
          {safetyStatus && <SafetyStatus status={safetyStatus} />}

          {/* Platform Statistics Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {platforms?.map((platform: any) => {
              const platformData = dashboardData?.platforms?.[platform.name];
              return (
                <PlatformCard 
                  key={platform.id}
                  platform={platform}
                  data={platformData}
                />
              );
            })}
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* AI Content Generation Panel */}
            <div className="lg:col-span-2">
              <AIContentPanel />
            </div>

            {/* Recent Activity Feed */}
            <div className="lg:col-span-1">
              <ActivityFeed activities={activities} />
            </div>
          </div>

          {/* Analytics and Performance Charts */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <AnalyticsChart data={dashboardData} />
            
            <div className="bg-card rounded-lg border border-border p-6">
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-lg font-semibold text-foreground">Безопасность и лимиты</h3>
                <div className="flex items-center gap-2">
                  <span className="w-2 h-2 bg-green-500 rounded-full"></span>
                  <span className="text-sm text-green-600 font-medium">Все безопасно</span>
                </div>
              </div>
              
              <div className="space-y-4">
                {platforms?.map((platform: any) => {
                  const platformData = dashboardData?.platforms?.[platform.name];
                  const usage = platformData?.rateLimitUsage || 0;
                  
                  return (
                    <div key={platform.id} className="space-y-2">
                      <div className="flex justify-between items-center">
                        <span className="text-sm font-medium text-foreground">
                          {platform.displayName} дневной лимит
                        </span>
                        <span className="text-sm text-muted-foreground">
                          {Math.round(usage)}/100
                        </span>
                      </div>
                      <div className="w-full bg-secondary rounded-full h-2">
                        <div 
                          className={`h-2 rounded-full progress-bar ${
                            usage > 90 ? 'bg-red-500' : 
                            usage > 80 ? 'bg-gradient-to-r from-green-500 to-yellow-500' : 
                            'bg-green-500'
                          }`}
                          style={{ width: `${Math.min(usage, 100)}%` }}
                        ></div>
                      </div>
                    </div>
                  );
                })}

                <div className="mt-4 p-3 bg-green-50 border border-green-200 rounded-lg">
                  <div className="flex items-center gap-2">
                    <i className="fas fa-shield-check text-green-600"></i>
                    <span className="text-sm font-medium text-green-900">
                      Состояние безопасности: {safetyStatus?.overall === 'safe' ? 'Безопасно' : safetyStatus?.overall === 'warning' ? 'Предупреждение' : safetyStatus?.overall === 'critical' ? 'Критично' : 'Оптимально'}
                    </span>
                  </div>
                  <p className="text-xs text-green-700 mt-1">
                    Все платформы работают в безопасных параметрах. Следующая проверка безопасности через 2 часа.
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Quick Actions Panel */}
          <QuickActions />
        </div>
      </main>
    </div>
  );
}
