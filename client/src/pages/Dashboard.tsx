import { useEffect, useState } from "react";
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
import DeepAnalytics from "@/components/DeepAnalytics";
import SocialAccountManager from "@/components/SocialAccountManager";
import AIContentGenerator from "@/components/AIContentGenerator";
import PromotionDashboard from "@/components/PromotionDashboard";
import PromotionStrategyManager from "@/components/PromotionStrategyManager";
import { AILearningDashboard } from '../components/AILearningDashboard';
import { ViralGrowthDashboard } from '../components/ViralGrowthDashboard';
import { DominationControlCenter } from '../components/DominationControlCenter';
import MasterAutomationControl from '../components/MasterAutomationControl';
import { 
  Bell, 
  User, 
  BarChart3, 
  Brain, 
  Settings, 
  Sparkles, 
  TrendingUp, 
  Users, 
  Eye, 
  Heart,
  Calendar,
  Shield,
  Target,
  Zap,
  DollarSign,
  Globe,
  Clock,
  Activity as ActivityIcon,
  Rocket,
  Award,
  Crown,
  Gem,
  Star
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";

export default function Dashboard() {
  const { toast } = useToast();
  const { isAuthenticated, isLoading, user } = useAuth();
  const [activeTab, setActiveTab] = useState("control");

  // Redirect if not authenticated
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
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-50 to-blue-50">
        <div className="text-center">
          <div className="w-12 h-12 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-slate-600 font-medium">Загружается командный пульт...</p>
          <p className="text-slate-500 text-sm mt-2">Готовим все инструменты продвижения</p>
        </div>
      </div>
    );
  }

  const getOverallStats = () => {
    const totalFollowers = Object.values(dashboardData?.platforms || {}).reduce((sum, platform) => 
      sum + (platform.todayStats?.engagement || 0), 0
    );
    const totalPosts = Object.values(dashboardData?.platforms || {}).reduce((sum, platform) => 
      sum + (platform.todayStats?.posts || 0), 0
    );
    const avgEngagement = totalFollowers > 0 ? (totalPosts / Object.keys(dashboardData?.platforms || {}).length) : 0;

    return { totalFollowers, totalPosts, avgEngagement };
  };

  const stats = getOverallStats();

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50/30 to-purple-50/30">
      <Sidebar />

      <main className="ml-64 transition-all duration-300">
        {/* Продвинутый хедер */}
        <header className="bg-white/80 backdrop-blur-sm border-b border-slate-200 px-6 py-4 sticky top-0 z-40">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 bg-gradient-to-br from-blue-600 via-purple-600 to-pink-600 rounded-xl flex items-center justify-center shadow-lg">
                  <Rocket className="w-7 h-7 text-white" />
                </div>
                <div>
                  <h1 className="text-2xl font-bold bg-gradient-to-r from-blue-800 via-purple-700 to-pink-600 bg-clip-text text-transparent">
                    Командный Пульт Продвижения
                  </h1>
                  <p className="text-slate-600 text-sm">
                    Полный контроль над вашим продвижением в социальных сетях
                  </p>
                </div>
              </div>

              {/* Индикаторы статуса */}
              <div className="hidden lg:flex items-center gap-3 ml-6">
                <div className="flex items-center gap-2 px-3 py-1 bg-green-100 rounded-full">
                  <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
                  <span className="text-xs font-medium text-green-800">AI Активен</span>
                </div>
                <div className="flex items-center gap-2 px-3 py-1 bg-blue-100 rounded-full">
                  <Shield className="w-3 h-3 text-blue-600" />
                  <span className="text-xs font-medium text-blue-800">
                    {safetyStatus?.overall === 'safe' ? 'Безопасно' : 
                     safetyStatus?.overall === 'warning' ? 'Внимание' : 'Критично'}
                  </span>
                </div>
              </div>
            </div>

            <div className="flex items-center gap-4">
              {/* Быстрая статистика */}
              <div className="hidden md:flex items-center gap-6 text-sm">
                <div className="text-center">
                  <div className="text-lg font-bold text-slate-800">{stats.totalPosts}</div>
                  <div className="text-xs text-slate-600">Постов сегодня</div>
                </div>
                <div className="text-center">
                  <div className="text-lg font-bold text-blue-600">{Math.round(stats.totalFollowers)}</div>
                  <div className="text-xs text-slate-600">Охват сегодня</div>
                </div>
                <div className="text-center">
                  <div className="text-lg font-bold text-purple-600">{stats.avgEngagement.toFixed(1)}%</div>
                  <div className="text-xs text-slate-600">Ср. вовлечение</div>
                </div>
              </div>

              <div className="flex items-center gap-3">
                {/* Уведомления */}
                <button className="relative p-2 text-slate-600 hover:text-slate-800 transition-colors">
                  <Bell className="w-5 h-5" />
                  {activities && activities.length > 0 && (
                    <Badge 
                      className="absolute -top-1 -right-1 w-5 h-5 rounded-full p-0 flex items-center justify-center text-xs bg-red-500"
                    >
                      {Math.min(activities.length, 9)}
                    </Badge>
                  )}
                </button>

                {/* Профиль пользователя */}
                <div className="flex items-center gap-3 pl-3 border-l border-slate-200">
                  <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center">
                    <User className="w-5 h-5 text-white" />
                  </div>
                  <div className="hidden sm:block">
                    <p className="text-sm font-semibold text-slate-800">
                      {user?.firstName && user?.lastName 
                        ? `${user.firstName} ${user.lastName}`
                        : user?.email || 'Пользователь'
                      }
                    </p>
                    <div className="flex items-center gap-1">
                      <Crown className="w-3 h-3 text-amber-500" />
                      <p className="text-xs text-slate-600">PRO Подписка</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </header>

        <div className="p-6 space-y-6">
          {/* Баннер безопасности */}
          {safetyStatus && <SafetyStatus status={safetyStatus} />}

          {/* Главные табы управления */}
          <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
            <TabsList className="grid w-full grid-cols-9 h-12 p-1 bg-white/60 backdrop-blur-sm">
              <TabsTrigger value="control" className="flex items-center gap-2 data-[state=active]:bg-white data-[state=active]:shadow-sm">
                <Rocket className="w-4 h-4" />
                <span className="hidden sm:inline">Пульт</span>
                <span className="sm:hidden">🚀</span>
              </TabsTrigger>
              <TabsTrigger value="viral-growth" className="flex items-center gap-2 data-[state=active]:bg-white data-[state=active]:shadow-sm">
                <Sparkles className="w-4 h-4" />
                <span className="hidden sm:inline">Вирусный Рост</span>
                <span className="sm:hidden">🔥</span>
              </TabsTrigger>
              <TabsTrigger value="domination" className="flex items-center gap-2 data-[state=active]:bg-white data-[state=active]:shadow-sm">
                <Crown className="w-4 h-4" />
                <span className="hidden sm:inline">Доминирование</span>
                <span className="sm:hidden">👑</span>
              </TabsTrigger>
              <TabsTrigger value="lucifer-promotion" className="flex items-center gap-2 data-[state=active]:bg-white data-[state=active]:shadow-sm">
                <Star className="w-4 h-4" />
                <span className="hidden sm:inline">Lucifer</span>
                <span className="sm:hidden">⭐</span>
              </TabsTrigger>
              <TabsTrigger value="ai-strategies" className="flex items-center gap-2 data-[state=active]:bg-white data-[state=active]:shadow-sm">
                <Gem className="w-4 h-4" />
                <span className="hidden sm:inline">AI Стратегии</span>
                <span className="sm:hidden">💎</span>
              </TabsTrigger>
              <TabsTrigger value="ai-tools" className="flex items-center gap-2 data-[state=active]:bg-white data-[state=active]:shadow-sm">
                <Brain className="w-4 h-4" />
                <span className="hidden sm:inline">AI</span>
                <span className="sm:hidden">🧠</span>
              </TabsTrigger>
              <TabsTrigger value="analytics" className="flex items-center gap-2 data-[state=active]:bg-white data-[state=active]:shadow-sm">
                <BarChart3 className="w-4 h-4" />
                <span className="hidden sm:inline">Аналитика</span>
                <span className="sm:hidden">📊</span>
              </TabsTrigger>
              <TabsTrigger value="accounts" className="flex items-center gap-2 data-[state=active]:bg-white data-[state=active]:shadow-sm">
                <Settings className="w-4 h-4" />
                <span className="hidden sm:inline">Аккаунты</span>
                <span className="sm:hidden">⚙️</span>
              </TabsTrigger>
              <TabsTrigger value="ai-learning" className="flex items-center gap-2 data-[state=active]:bg-white data-[state=active]:shadow-sm">
                <DollarSign className="w-4 h-4" />
                <span className="hidden sm:inline">AI Обучение</span>
                <span className="sm:hidden">🎓</span>
              </TabsTrigger>
            </TabsList>

            {/* Вирусный рост */}
            <TabsContent value="viral-growth" className="mt-6">
              <ViralGrowthDashboard />
            </TabsContent>

            {/* Доминирование */}
            <TabsContent value="domination" className="mt-6">
              <DominationControlCenter />
            </TabsContent>

            {/* Пульт управления - главная вкладка */}
            <TabsContent value="control" className="space-y-6 mt-6">
              {/* Мастер-Автоматизация (10 шагов бизнес-процесса) */}
              <MasterAutomationControl />

              {/* Инициализация клиента Lucifer */}
              <Card className="bg-gradient-to-r from-amber-50 to-orange-50 border-amber-200">
                <CardContent className="p-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 bg-amber-500 rounded-xl flex items-center justify-center">
                        <Star className="w-6 h-6 text-white" />
                      </div>
                      <div>
                        <h3 className="font-semibold text-amber-900">Клиент: Lucifer Tradera</h3>
                        <p className="text-sm text-amber-700">
                          Нажмите для инициализации полного анализа и настройки продвижения
                        </p>
                      </div>
                    </div>
                    <Button 
                      className="bg-amber-600 hover:bg-amber-700 text-white"
                      onClick={async () => {
                        try {
                          const response = await fetch('/api/client/init-lucifer', { method: 'POST' });
                          const result = await response.json();
                          toast({
                            title: "Клиент инициализирован!",
                            description: result.message,
                          });
                        } catch (error) {
                          toast({
                            title: "Ошибка",
                            description: "Не удалось инициализировать клиента",
                            variant: "destructive",
                          });
                        }
                      }}
                    >
                      <Rocket className="w-4 h-4 mr-2" />
                      Запустить Анализ
                    </Button>
                  </div>
                </CardContent>
              </Card>

              {/* Pro Activation Banner */}
              <Card className="mt-4 bg-gradient-to-r from-amber-500 to-orange-600 border-amber-300">
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-4">
                      <div className="w-16 h-16 bg-white rounded-full flex items-center justify-center">
                        <Crown className="w-10 h-10 text-amber-600" />
                      </div>
                      <div className="text-white">
                        <h3 className="text-2xl font-bold mb-1">🎉 Спасибо за оплату $50!</h3>
                        <p className="text-amber-100">Активируйте Pro план прямо сейчас</p>
                      </div>
                    </div>
                    <Button 
                      size="lg"
                      className="bg-white text-amber-600 hover:bg-amber-50 font-bold"
                      onClick={async () => {
                        try {
                          const response = await fetch('/api/subscription/activate-pro', {
                            method: 'POST',
                            credentials: 'include'
                          });
                          const data = await response.json();
                          alert(data.message + '\n\n' + data.unlocked.join('\n'));
                          window.location.reload();
                        } catch (error) {
                          alert('Ошибка активации');
                        }
                      }}
                    >
                      Активировать Pro
                    </Button>
                  </div>
                </CardContent>
              </Card>

              {/* KPI Карточки */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                <Card className="bg-gradient-to-br from-blue-50 to-blue-100 border-blue-200 hover:shadow-lg transition-all">
                  <CardContent className="p-6">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm font-medium text-blue-800 mb-1">Общий Охват</p>
                        <p className="text-3xl font-bold text-blue-900">{Math.round(stats.totalFollowers).toLocaleString()}</p>
                        <p className="text-xs text-blue-700 mt-1">+12.5% за неделю</p>
                      </div>
                      <div className="w-12 h-12 bg-blue-500 rounded-xl flex items-center justify-center">
                        <Eye className="w-6 h-6 text-white" />
                      </div>
                    </div>
                  </CardContent>
                </Card>

                <Card className="bg-gradient-to-br from-green-50 to-green-100 border-green-200 hover:shadow-lg transition-all">
                  <CardContent className="p-6">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm font-medium text-green-800 mb-1">Вовлечение</p>
                        <p className="text-3xl font-bold text-green-900">{stats.avgEngagement.toFixed(1)}%</p>
                        <p className="text-xs text-green-700 mt-1">+8.3% за неделю</p>
                      </div>
                      <div className="w-12 h-12 bg-green-500 rounded-xl flex items-center justify-center">
                        <Heart className="w-6 h-6 text-white" />
                      </div>
                    </div>
                  </CardContent>
                </Card>

                <Card className="bg-gradient-to-br from-purple-50 to-purple-100 border-purple-200 hover:shadow-lg transition-all">
                  <CardContent className="p-6">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm font-medium text-purple-800 mb-1">Активность</p>
                        <p className="text-3xl font-bold text-purple-900">{stats.totalPosts}</p>
                        <p className="text-xs text-purple-700 mt-1">постов сегодня</p>
                      </div>
                      <div className="w-12 h-12 bg-purple-500 rounded-xl flex items-center justify-center">
                        <ActivityIcon className="w-6 h-6 text-white" />
                      </div>
                    </div>
                  </CardContent>
                </Card>

                <Card className="bg-gradient-to-br from-amber-50 to-amber-100 border-amber-200 hover:shadow-lg transition-all">
                  <CardContent className="p-6">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm font-medium text-amber-800 mb-1">AI Кредиты</p>
                        <p className="text-3xl font-bold text-amber-900">847</p>
                        <p className="text-xs text-amber-700 mt-1">из 1000 использовано</p>
                      </div>
                      <div className="w-12 h-12 bg-amber-500 rounded-xl flex items-center justify-center">
                        <Zap className="w-6 h-6 text-white" />
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>

              {/* Платформы */}
              <div>
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-lg font-semibold text-slate-800">Подключенные Платформы</h3>
                  <Badge variant="secondary" className="text-xs">
                    {platforms?.length || 0} платформ активно
                  </Badge>
                </div>
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
              </div>

              {/* Основной контент пульта */}
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* AI Генератор контента */}
                <div className="lg:col-span-2">
                  <AIContentPanel />
                </div>

                {/* Лента активности */}
                <div className="lg:col-span-1">
                  <ActivityFeed activities={activities} />
                </div>
              </div>

              {/* Быстрые действия */}
              <QuickActions />
            </TabsContent>

            {/* Продвижение Lucifer Tradera */}
            <TabsContent value="lucifer-promotion" className="mt-6">
              <PromotionDashboard />
            </TabsContent>

            {/* AI Стратегии продвижения */}
            <TabsContent value="ai-strategies" className="mt-6">
              <PromotionStrategyManager />
            </TabsContent>

            {/* AI Инструменты */}
            <TabsContent value="ai-tools" className="space-y-6 mt-6">
              <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
                {/* Быстрые AI инструменты */}
                <Card className="bg-gradient-to-br from-violet-50 to-purple-100 border-violet-200">
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2 text-violet-800">
                      <Sparkles className="w-5 h-5" />
                      Быстрая Генерация
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    <Button size="sm" className="w-full justify-start bg-violet-600 hover:bg-violet-700">
                      <Brain className="w-4 h-4 mr-2" />
                      Торговый Сигнал
                    </Button>
                    <Button size="sm" variant="outline" className="w-full justify-start">
                      <TrendingUp className="w-4 h-4 mr-2" />
                      Рыночный Анализ
                    </Button>
                    <Button size="sm" variant="outline" className="w-full justify-start">
                      <Star className="w-4 h-4 mr-2" />
                      Вирусный Контент
                    </Button>
                  </CardContent>
                </Card>

                {/* AI Статистика */}
                <Card className="lg:col-span-3">
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Brain className="w-5 h-5 text-purple-600" />
                      AI Использование
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="grid grid-cols-3 gap-6">
                      <div className="text-center">
                        <div className="text-2xl font-bold text-purple-600 mb-1">847</div>
                        <div className="text-sm text-slate-600">Токенов использовано</div>
                        <Progress value={84.7} className="mt-2 h-2" />
                      </div>
                      <div className="text-center">
                        <div className="text-2xl font-bold text-blue-600 mb-1">23</div>
                        <div className="text-sm text-slate-600">Контента создано</div>
                        <Progress value={76} className="mt-2 h-2" />
                      </div>
                      <div className="text-center">
                        <div className="text-2xl font-bold text-green-600 mb-1">$12.4</div>
                        <div className="text-sm text-slate-600">Потрачено в месяц</div>
                        <Progress value={62} className="mt-2 h-2" />
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>

              <AIContentGenerator />
            </TabsContent>

            {/* Аналитика */}
            <TabsContent value="analytics" className="space-y-6 mt-6">
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <AnalyticsChart data={dashboardData} />

                {/* Детальная аналитика */}
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <BarChart3 className="w-5 h-5 text-blue-600" />
                      Сравнительная Аналитика
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      {platforms?.map((platform: any) => {
                        const platformData = dashboardData?.platforms?.[platform.name];
                        const usage = platformData?.rateLimitUsage || 0;
                        const engagement = platformData?.todayStats?.engagement || 0;

                        return (
                          <div key={platform.id} className="space-y-2">
                            <div className="flex justify-between items-center">
                              <span className="text-sm font-medium text-slate-700">
                                {platform.displayName}
                              </span>
                              <div className="flex items-center gap-2">
                                <Badge variant="secondary" className="text-xs">
                                  {Math.round(engagement)} охват
                                </Badge>
                                <span className="text-xs text-slate-500">
                                  {Math.round(usage)}% лимита
                                </span>
                              </div>
                            </div>
                            <div className="flex gap-2">
                              <div className="flex-1">
                                <Progress 
                                  value={Math.min((engagement / 1000) * 100, 100)} 
                                  className="h-2"
                                />
                              </div>
                              <div className="flex-1">
                                <Progress 
                                  value={Math.min(usage, 100)} 
                                  className="h-2"
                                />
                              </div>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </CardContent>
                </Card>
              </div>

              <DeepAnalytics 
                userId={user?.id || 'demo-user'} 
                platformId={platforms?.[0]?.id || 1} 
              />
            </TabsContent>

            {/* Управление аккаунтами */}
            <TabsContent value="accounts" className="mt-6">
              <SocialAccountManager platforms={platforms} />
            </TabsContent>

            {/* Инструменты продвижения */}
            <TabsContent value="promotion" className="space-y-6 mt-6">
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {/* Бесплатные инструменты */}
                <Card className="bg-gradient-to-br from-green-50 to-emerald-100 border-green-200">
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2 text-green-800">
                      <Award className="w-5 h-5" />
                      Бесплатные Инструменты
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    <div className="space-y-2">
                      <Button size="sm" variant="outline" className="w-full justify-start">
                        <Target className="w-4 h-4 mr-2" />
                        Планировщик постов
                      </Button>
                      <Button size="sm" variant="outline" className="w-full justify-start">
                        <BarChart3 className="w-4 h-4 mr-2" />
                        Базовая аналитика
                      </Button>
                      <Button size="sm" variant="outline" className="w-full justify-start">
                        <Clock className="w-4 h-4 mr-2" />
                        Лучшее время постинга
                      </Button>
                      <Button size="sm" variant="outline" className="w-full justify-start">
                        <Users className="w-4 h-4 mr-2" />
                        Анализ аудитории
                      </Button>
                    </div>
                    <div className="text-xs text-green-700 mt-3">
                      ✅ Безлимитное использование
                    </div>
                  </CardContent>
                </Card>

                {/* Платные инструменты */}
                <Card className="bg-gradient-to-br from-amber-50 to-yellow-100 border-amber-200">
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2 text-amber-800">
                      <Crown className="w-5 h-5" />
                      PRO Инструменты
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    <div className="space-y-2">
                      <Button size="sm" className="w-full justify-start bg-amber-600 hover:bg-amber-700">
                        <Brain className="w-4 h-4 mr-2" />
                        AI Генерация контента
                      </Button>
                      <Button size="sm" variant="outline" className="w-full justify-start">
                        <TrendingUp className="w-4 h-4 mr-2" />
                        Продвинутая аналитика
                      </Button>
                      <Button size="sm" variant="outline" className="w-full justify-start">
                        <Globe className="w-4 h-4 mr-2" />
                        Анализ конкурентов
                      </Button>
                      <Button size="sm" variant="outline" className="w-full justify-start">
                        <Zap className="w-4 h-4 mr-2" />
                        Автоматизация
                      </Button>
                    </div>
                    <div className="text-xs text-amber-700 mt-3">
                      💎 847/1000 кредитов осталось
                    </div>
                  </CardContent>
                </Card>

                {/* Премиум инструменты */}
                <Card className="bg-gradient-to-br from-purple-50 to-violet-100 border-purple-200">
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2 text-purple-800">
                      <Gem className="w-5 h-5" />
                      Премиум Функции
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    <div className="space-y-2">
                      <Button size="sm" className="w-full justify-start bg-purple-600 hover:bg-purple-700">
                        <Rocket className="w-4 h-4 mr-2" />
                        Вирусный контент AI
                      </Button>
                      <Button size="sm" variant="outline" className="w-full justify-start">
                        <Shield className="w-4 h-4 mr-2" />
                        Защита от банов
                      </Button>
                      <Button size="sm" variant="outline" className="w-full justify-start">
                        <DollarSign className="w-4 h-4 mr-2" />
                        ROI трекинг
                      </Button>
                      <Button size="sm" variant="outline" className="w-full justify-start">
                        <Calendar className="w-4 h-4 mr-2" />
                        Массовое планирование
                      </Button>
                    </div>
                    <div className="text-xs text-purple-700 mt-3">
                      🚀 Максимальный результат
                    </div>
                  </CardContent>
                </Card>
              </div>

              {/* Статистика продвижения */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <TrendingUp className="w-5 h-5 text-blue-600" />
                      Эффективность Продвижения
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      <div className="flex justify-between items-center">
                        <span className="text-sm text-slate-600">Охват за месяц</span>
                        <span className="font-bold text-blue-600">+24.5%</span>
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="text-sm text-slate-600">Новые подписчики</span>
                        <span className="font-bold text-green-600">+1,234</span>
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="text-sm text-slate-600">Средняя вовлеченность</span>
                        <span className="font-bold text-purple-600">8.7%</span>
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="text-sm text-slate-600">Конверсия в клики</span>
                        <span className="font-bold text-amber-600">3.2%</span>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <DollarSign className="w-5 h-5 text-green-600" />
                      ROI & Затраты
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      <div className="flex justify-between items-center">
                        <span className="text-sm text-slate-600">Затраты на AI</span>
                        <span className="font-bold">$12.40</span>
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="text-sm text-slate-600">Стоимость лида</span>
                        <span className="font-bold text-green-600">$0.85</span>
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="text-sm text-slate-600">ROI за месяц</span>
                        <span className="font-bold text-blue-600">+340%</span>
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="text-sm text-slate-600">Экономия времени</span>
                        <span className="font-bold text-purple-600">15 часов</span>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>

              {/* Рекомендации по улучшению */}
              <Card className="border-blue-200 bg-gradient-to-r from-blue-50 to-indigo-50">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2 text-blue-800">
                    <Target className="w-5 h-5" />
                    Рекомендации для Улучшения Продвижения
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <h4 className="font-medium text-blue-800">Следующие шаги:</h4>
                      <ul className="space-y-1 text-sm text-blue-700">
                        <li>• Увеличить постинг в Instagram на 25%</li>
                        <li>• Создать больше видео-контента для TikTok</li>
                        <li>• Оптимизировать время публикаций</li>
                        <li>• Добавить интерактивные элементы</li>
                      </ul>
                    </div>
                    <div className="space-y-2">
                      <h4 className="font-medium text-blue-800">Потенциал роста:</h4>
                      <ul className="space-y-1 text-sm text-blue-700">
                        <li>• +50% охвата при оптимизации</li>
                        <li>• +30% вовлечения с AI контентом</li>
                        <li>• +15% конверсии с A/B тестами</li>
                        <li>• Экономия 8 часов в неделю</li>
                      </ul>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            {/* AI Обучение */}
            <TabsContent value="ai-learning" className="mt-6">
              <AILearningDashboard />
            </TabsContent>

          </Tabs>
        </div>
      </main>
    </div>
  );
}