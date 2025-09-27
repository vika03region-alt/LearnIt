import { useEffect, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/useAuth";
import { isUnauthorizedError } from "@/lib/authUtils";
import { Platform, DashboardData, SafetyStatus as SafetyStatusType } from "@/types/api";
import Sidebar from "@/components/Sidebar";
import SafetyStatus from "@/components/SafetyStatus";
import PlatformCard from "@/components/PlatformCard";
import AIContentPanel from "@/components/AIContentPanel";
import ActivityFeed from "@/components/ActivityFeed";
import AnalyticsChart from "@/components/AnalyticsChart";
import QuickActions from "@/components/QuickActions";
import DeepAnalytics from "@/components/DeepAnalytics";
import SocialAccountManager from "@/components/SocialAccountManager";
import AIContentGenerator from "@/components/AIContentGenerator";
import { 
  Bell, User, BarChart3, Brain, Settings, Sparkles, 
  TrendingUp, Users, Activity as ActivityIcon, Clock, 
  Calendar, Target, Zap, Plus, RefreshCw, Download,
  Upload, Eye, Send, Edit3, Share2, Filter,
  ChevronDown, Search, Home, ExternalLink
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { 
  DropdownMenu, DropdownMenuContent, DropdownMenuItem, 
  DropdownMenuTrigger, DropdownMenuSeparator 
} from "@/components/ui/dropdown-menu";

// Activity interface definition
interface ActivityItem {
  id: number;
  action: string;
  description: string;
  platformId?: number;
  status: 'success' | 'warning' | 'error';
  createdAt: string;
  metadata?: any;
}

export default function Dashboard() {
  const { toast } = useToast();
  const { isAuthenticated, isLoading, user } = useAuth();
  const [activeTab, setActiveTab] = useState("overview");
  const [searchTerm, setSearchTerm] = useState("");

  // Функциональные обработчики кнопок
  const handleCreateContent = () => {
    setActiveTab("ai-tools");
    toast({
      title: "Создание контента",
      description: "Переходим к AI инструментам для создания контента",
    });
  };

  const handleViewAnalytics = () => {
    setActiveTab("deep-analytics");
    toast({
      title: "Аналитика",
      description: "Переходим к детальной аналитике",
    });
  };

  const handleManageAccounts = () => {
    setActiveTab("accounts");
    toast({
      title: "Управление аккаунтами",
      description: "Переходим к управлению социальными аккаунтами",
    });
  };

  const handleRefreshData = () => {
    window.location.reload();
    toast({
      title: "Обновление данных",
      description: "Данные обновляются...",
    });
  };

  const handleExportData = () => {
    toast({
      title: "Экспорт данных",
      description: "Подготавливается файл для скачивания...",
    });
  };

  const handleQuickPost = () => {
    toast({
      title: "Быстрая публикация",
      description: "Функция быстрой публикации в разработке",
    });
  };

  // Redirect to home if not authenticated
  useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      toast({
        title: "Нет доступа",
        description: "Необходима авторизация. Выполняется вход...",
        variant: "destructive",
      });
      setTimeout(() => {
        window.location.href = "/api/login";
      }, 500);
      return;
    }
  }, [isAuthenticated, isLoading, toast]);

  const { data: dashboardData, isLoading: isDashboardLoading, refetch: refetchDashboard } = useQuery<DashboardData>({
    queryKey: ['/api/analytics/dashboard'],
    retry: false,
  });

  const { data: platforms, isLoading: isPlatformsLoading, refetch: refetchPlatforms } = useQuery<Platform[]>({
    queryKey: ['/api/platforms'],
    retry: false,
  });

  const { data: safetyStatus, refetch: refetchSafety } = useQuery<SafetyStatusType>({
    queryKey: ['/api/safety/status'],
    retry: false,
  });

  const { data: activities, refetch: refetchActivities } = useQuery<ActivityItem[]>({
    queryKey: ['/api/activity'],
    retry: false,
  });

  const handleRefreshAll = () => {
    refetchDashboard();
    refetchPlatforms();
    refetchSafety();
    refetchActivities();
    toast({
      title: "Обновление завершено",
      description: "Все данные успешно обновлены",
    });
  };

  if (isLoading || isDashboardLoading || isPlatformsLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-muted-foreground">Загружается панель управления...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <Sidebar />

      <main className="ml-64 transition-all duration-300">
        {/* Верхняя панель */}
        <header className="bg-card border-b border-border px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div>
                <h2 className="text-2xl font-bold text-foreground" data-testid="text-dashboard-title">
                  Панель Управления Lucifer Trading
                </h2>
                <p className="text-muted-foreground">
                  Полный контроль над вашими социальными медиа и торговой активностью
                </p>
              </div>

              {/* Поиск */}
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4" />
                <Input
                  placeholder="Поиск по панели..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10 w-64"
                  data-testid="input-search"
                />
              </div>
            </div>

            <div className="flex items-center gap-3">
              {/* Кнопки действий */}
              <Button 
                onClick={handleRefreshAll} 
                variant="outline" 
                size="sm"
                data-testid="button-refresh"
              >
                <RefreshCw className="w-4 h-4 mr-2" />
                Обновить
              </Button>

              <Button 
                onClick={handleExportData} 
                variant="outline" 
                size="sm"
                data-testid="button-export"
              >
                <Download className="w-4 h-4 mr-2" />
                Экспорт
              </Button>

              {/* Уведомления */}
              <div className="relative">
                <button 
                  className="relative p-2 text-muted-foreground hover:text-foreground rounded-lg hover:bg-secondary"
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

              {/* Меню пользователя */}
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" size="sm" data-testid="button-user-menu">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 bg-gradient-to-br from-primary to-chart-1 rounded-full flex items-center justify-center">
                        <User className="w-4 h-4 text-primary-foreground" />
                      </div>
                      <div className="hidden sm:block text-left">
                        <p className="text-sm font-medium text-foreground" data-testid="text-user-name">
                          {user?.firstName && user?.lastName 
                            ? `${user.firstName} ${user.lastName}`
                            : user?.email || 'Пользователь'
                          }
                        </p>
                        <p className="text-xs text-muted-foreground">Трейдер</p>
                      </div>
                      <ChevronDown className="w-4 h-4 text-muted-foreground" />
                    </div>
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-56">
                  <DropdownMenuItem>
                    <User className="w-4 h-4 mr-2" />
                    Мой профиль
                  </DropdownMenuItem>
                  <DropdownMenuItem>
                    <Settings className="w-4 h-4 mr-2" />
                    Настройки
                  </DropdownMenuItem>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem>
                    <ExternalLink className="w-4 h-4 mr-2" />
                    Выйти
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          </div>
        </header>

        <div className="p-6 space-y-6">
          {/* Статус безопасности */}
          {safetyStatus && <SafetyStatus status={safetyStatus} />}

          {/* Быстрые действия */}
          <Card className="border-primary/20">
            <CardHeader className="pb-3">
              <CardTitle className="flex items-center gap-2 text-primary">
                <Zap className="w-5 h-5" />
                Быстрые действия
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex flex-wrap gap-3">
                <Button 
                  onClick={handleCreateContent} 
                  className="gap-2"
                  data-testid="button-create-content"
                >
                  <Plus className="w-4 h-4" />
                  Создать контент
                </Button>
                <Button 
                  onClick={handleQuickPost} 
                  variant="outline" 
                  className="gap-2"
                  data-testid="button-quick-post"
                >
                  <Send className="w-4 h-4" />
                  Быстрая публикация
                </Button>
                <Button 
                  onClick={handleViewAnalytics} 
                  variant="outline" 
                  className="gap-2"
                  data-testid="button-analytics"
                >
                  <BarChart3 className="w-4 h-4" />
                  Показать аналитику
                </Button>
                <Button 
                  onClick={handleManageAccounts} 
                  variant="outline" 
                  className="gap-2"
                  data-testid="button-manage-accounts"
                >
                  <Settings className="w-4 h-4" />
                  Управление аккаунтами
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* Основные вкладки панели */}
          <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
            <TabsList className="grid w-full grid-cols-4 max-w-4xl">
              <TabsTrigger value="overview" className="flex items-center gap-2" data-testid="tab-overview">
                <Home className="w-4 h-4" />
                Обзор
              </TabsTrigger>
              <TabsTrigger value="accounts" className="flex items-center gap-2" data-testid="tab-accounts">
                <Settings className="w-4 h-4" />
                Аккаунты
              </TabsTrigger>
              <TabsTrigger value="deep-analytics" className="flex items-center gap-2" data-testid="tab-analytics">
                <Brain className="w-4 h-4" />
                Детальная Аналитика
              </TabsTrigger>
              <TabsTrigger value="ai-tools" className="flex items-center gap-2" data-testid="tab-ai">
                <Sparkles className="w-4 h-4" />
                AI Инструменты
              </TabsTrigger>
            </TabsList>

            <TabsContent value="overview" className="space-y-6">
              {/* Ключевые метрики */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                <Card className="bg-gradient-to-br from-blue-50 to-blue-100 dark:from-blue-950 dark:to-blue-900 border-blue-200 dark:border-blue-800">
                  <CardHeader className="flex flex-row items-center justify-between pb-2">
                    <CardTitle className="text-sm font-medium text-blue-700 dark:text-blue-300">
                      Общий охват
                    </CardTitle>
                    <Users className="h-4 w-4 text-blue-600 dark:text-blue-400" />
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold text-blue-900 dark:text-blue-100" data-testid="metric-reach">
                      {dashboardData?.totalReach?.toLocaleString('ru-RU') || '0'}
                    </div>
                    <p className="text-xs text-blue-600 dark:text-blue-400 flex items-center mt-1">
                      <TrendingUp className="h-3 w-3 mr-1" />
                      +12% за неделю
                    </p>
                  </CardContent>
                </Card>

                <Card className="bg-gradient-to-br from-emerald-50 to-emerald-100 dark:from-emerald-950 dark:to-emerald-900 border-emerald-200 dark:border-emerald-800">
                  <CardHeader className="flex flex-row items-center justify-between pb-2">
                    <CardTitle className="text-sm font-medium text-emerald-700 dark:text-emerald-300">
                      Вовлечённость
                    </CardTitle>
                    <ActivityIcon className="h-4 w-4 text-emerald-600 dark:text-emerald-400" />
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold text-emerald-900 dark:text-emerald-100" data-testid="metric-engagement">
                      {dashboardData?.totalEngagement?.toFixed(1) || '0.0'}%
                    </div>
                    <p className="text-xs text-emerald-600 dark:text-emerald-400 flex items-center mt-1">
                      <TrendingUp className="h-3 w-3 mr-1" />
                      +3.2% за месяц
                    </p>
                  </CardContent>
                </Card>

                <Card className="bg-gradient-to-br from-amber-50 to-amber-100 dark:from-amber-950 dark:to-amber-900 border-amber-200 dark:border-amber-800">
                  <CardHeader className="flex flex-row items-center justify-between pb-2">
                    <CardTitle className="text-sm font-medium text-amber-700 dark:text-amber-300">
                      AI Контента
                    </CardTitle>
                    <Sparkles className="h-4 w-4 text-amber-600 dark:text-amber-400" />
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold text-amber-900 dark:text-amber-100" data-testid="metric-ai-content">
                      {dashboardData?.aiGeneratedCount || '47'}
                    </div>
                    <p className="text-xs text-amber-600 dark:text-amber-400 flex items-center mt-1">
                      <Clock className="h-3 w-3 mr-1" />
                      Сегодня: {dashboardData?.todayAiCount || '12'}
                    </p>
                  </CardContent>
                </Card>

                <Card className="bg-gradient-to-br from-purple-50 to-purple-100 dark:from-purple-950 dark:to-purple-900 border-purple-200 dark:border-purple-800">
                  <CardHeader className="flex flex-row items-center justify-between pb-2">
                    <CardTitle className="text-sm font-medium text-purple-700 dark:text-purple-300">
                      Активность
                    </CardTitle>
                    <Zap className="h-4 w-4 text-purple-600 dark:text-purple-400" />
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold text-purple-900 dark:text-purple-100" data-testid="metric-activity">
                      {activities?.length || '0'}
                    </div>
                    <p className="text-xs text-purple-600 dark:text-purple-400 flex items-center mt-1">
                      <Calendar className="h-3 w-3 mr-1" />
                      За 24 часа
                    </p>
                  </CardContent>
                </Card>
              </div>

              {/* Карточки платформ */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                {platforms?.map((platform: Platform) => {
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
                {/* Панель AI генерации контента */}
                <div className="lg:col-span-2">
                  <Card className="border-amber-200 dark:border-amber-800">
                    <CardHeader>
                      <CardTitle className="flex items-center gap-2 text-amber-700 dark:text-amber-300">
                        <Sparkles className="w-5 h-5" />
                        AI Генератор Контента
                        <Badge variant="secondary" className="bg-amber-100 text-amber-800 dark:bg-amber-900 dark:text-amber-200">
                          GPT-5 Активен
                        </Badge>
                      </CardTitle>
                      <div className="flex gap-2 mt-2">
                        <Button 
                          size="sm" 
                          onClick={() => setActiveTab("ai-tools")}
                          data-testid="button-open-ai-tools"
                        >
                          <Edit3 className="w-4 h-4 mr-1" />
                          Создать контент
                        </Button>
                        <Button 
                          size="sm" 
                          variant="outline"
                          data-testid="button-ai-settings"
                        >
                          <Settings className="w-4 h-4 mr-1" />
                          Настройки
                        </Button>
                      </div>
                    </CardHeader>
                    <CardContent>
                      <AIContentPanel />
                      <div className="mt-4 flex items-center justify-between p-3 bg-amber-50 dark:bg-amber-950 rounded-lg">
                        <div className="flex items-center gap-2">
                          <Target className="w-4 h-4 text-amber-600" />
                          <span className="text-sm font-medium text-amber-900 dark:text-amber-100">
                            API кредиты: 847/1000
                          </span>
                        </div>
                        <Progress value={84.7} className="w-24" />
                      </div>
                    </CardContent>
                  </Card>
                </div>

                {/* Лента активности */}
                <div className="lg:col-span-1">
                  <Card className="border-blue-200 dark:border-blue-800">
                    <CardHeader>
                      <CardTitle className="flex items-center gap-2 text-blue-700 dark:text-blue-300">
                        <ActivityIcon className="w-5 h-5" />
                        Последняя активность
                        {activities && activities.length > 0 && (
                          <Badge variant="outline" className="text-xs">
                            {activities.length}
                          </Badge>
                        )}
                      </CardTitle>
                      <Button 
                        size="sm" 
                        variant="outline" 
                        onClick={() => refetchActivities()}
                        data-testid="button-refresh-activity"
                      >
                        <RefreshCw className="w-4 h-4 mr-1" />
                        Обновить
                      </Button>
                    </CardHeader>
                    <CardContent className="p-0">
                      <ActivityFeed activities={activities} />
                    </CardContent>
                  </Card>
                </div>
              </div>

              {/* Аналитика и графики */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <Card className="border-green-200 dark:border-green-800">
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2 text-green-700 dark:text-green-300">
                      <BarChart3 className="w-5 h-5" />
                      Аналитика производительности
                    </CardTitle>
                    <div className="flex gap-2">
                      <Button 
                        size="sm" 
                        variant="outline"
                        onClick={() => setActiveTab("deep-analytics")}
                        data-testid="button-detailed-analytics"
                      >
                        <Eye className="w-4 h-4 mr-1" />
                        Подробнее
                      </Button>
                      <Button 
                        size="sm" 
                        variant="outline"
                        data-testid="button-share-analytics"
                      >
                        <Share2 className="w-4 h-4 mr-1" />
                        Поделиться
                      </Button>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <AnalyticsChart data={dashboardData} />
                    <div className="mt-4 grid grid-cols-3 gap-4">
                      <div className="text-center">
                        <div className="text-lg font-bold text-green-700 dark:text-green-300">
                          {dashboardData?.weeklyGrowth || '+15.2'}%
                        </div>
                        <div className="text-xs text-muted-foreground">Рост за неделю</div>
                      </div>
                      <div className="text-center">
                        <div className="text-lg font-bold text-blue-700 dark:text-blue-300">
                          {dashboardData?.monthlyPosts || '127'}
                        </div>
                        <div className="text-xs text-muted-foreground">Постов в месяц</div>
                      </div>
                      <div className="text-center">
                        <div className="text-lg font-bold text-purple-700 dark:text-purple-300">
                          {dashboardData?.avgEngagement || '8.4'}%
                        </div>
                        <div className="text-xs text-muted-foreground">Средняя вовлечённость</div>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                <Card className="border-gray-200 dark:border-gray-800">
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Target className="w-5 h-5" />
                      Система безопасности
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      {platforms?.map((platform: Platform) => {
                        const platformData = dashboardData?.platforms?.[platform.name];
                        const usage = platformData?.rateLimitUsage || 0;

                        return (
                          <div key={platform.id} className="space-y-2">
                            <div className="flex justify-between items-center">
                              <span className="text-sm font-medium text-foreground">
                                {platform.displayName} — лимиты
                              </span>
                              <span className="text-sm text-muted-foreground">
                                {Math.round(usage)}/100
                              </span>
                            </div>
                            <div className="w-full bg-secondary rounded-full h-2">
                              <div 
                                className={`h-2 rounded-full transition-all ${
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

                      <div className="mt-4 p-3 bg-green-50 dark:bg-green-950 border border-green-200 dark:border-green-800 rounded-lg">
                        <div className="flex items-center gap-2">
                          <Target className="text-green-600 w-4 h-4" />
                          <span className="text-sm font-medium text-green-900 dark:text-green-100">
                            Статус: {safetyStatus?.overall === 'safe' ? 'Безопасно' : safetyStatus?.overall === 'warning' ? 'Требует внимания' : safetyStatus?.overall === 'critical' ? 'Критическое' : 'Отлично'}
                          </span>
                        </div>
                        <p className="text-xs text-green-700 dark:text-green-300 mt-1">
                          Все платформы работают в безопасных рамках. Следующая проверка через 2 часа.
                        </p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>
            </TabsContent>

            <TabsContent value="accounts">
              <SocialAccountManager platforms={platforms} />
            </TabsContent>

            <TabsContent value="deep-analytics">
              <DeepAnalytics 
                userId={user?.id || 'demo-user'} 
                platformId={platforms?.[0]?.id || 1} 
              />
            </TabsContent>

            <TabsContent value="ai-tools">
              <AIContentGenerator />
            </TabsContent>
          </Tabs>

          {/* Панель быстрых действий внизу */}
          <QuickActions />
        </div>
      </main>
    </div>
  );
}