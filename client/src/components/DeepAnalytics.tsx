import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Progress } from "@/components/ui/progress";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { useQuery } from "@tanstack/react-query";
import { 
  TrendingUp, 
  TrendingDown, 
  Brain, 
  Target, 
  Users, 
  Eye,
  Calendar,
  Award,
  Activity,
  Hash,
  Clock,
  Zap,
  BarChart3,
  PieChart,
  LineChart,
  PlayCircle,
  Camera,
  MessageCircle,
  Heart,
  Share2,
  Bookmark,
  ChevronUp,
  ChevronDown,
  Sparkles,
  Crown,
  Gem
} from "lucide-react";
import { SiInstagram, SiYoutube, SiTiktok, SiTelegram } from "react-icons/si";
import { Platform } from "@/types/api";

interface DeepAnalyticsProps {
  userId: string;
  platformId: number;
}

interface PlatformMetrics {
  followers: number;
  following: number;
  posts: number;
  likes: number;
  comments: number;
  shares: number;
  views: number;
  impressions: number;
  reach: number;
  engagement_rate: number;
  growth_rate: number;
  // Platform-specific metrics
  platform_specific: {
    // Instagram
    stories_views?: number;
    reels_plays?: number;
    saves?: number;
    profile_visits?: number;
    website_clicks?: number;
    // YouTube 
    watch_time_minutes?: number;
    average_view_duration?: number;
    subscribers_gained?: number;
    clicks?: number;
    // TikTok
    video_views?: number;
    profile_views?: number;
    likes_per_video?: number;
    shares_per_video?: number;
    // Telegram
    message_views?: number;
    forwards?: number;
    reactions?: number;
    member_growth?: number;
  };
  // Growth trends (7-day data)
  growth_trend: Array<{ date: string; followers: number; engagement: number }>;
  // Content performance by type
  content_performance: {
    photos?: { count: number; avg_engagement: number };
    videos?: { count: number; avg_engagement: number };
    stories?: { count: number; avg_views: number };
    reels?: { count: number; avg_plays: number };
  };
}

interface AIInsight {
  id: number;
  type: string;
  title: string;
  description: string;
  data: {
    insights: string[];
    recommendations: string[];
    confidence: number;
    impact: 'low' | 'medium' | 'high';
  };
  status: string;
  createdAt: string;
}

interface ContentAnalysis {
  sentiment: 'positive' | 'negative' | 'neutral';
  topics: string[];
  trends: string[];
  optimization_suggestions: string[];
  predicted_performance: number;
}

interface CompetitorData {
  handle: string;
  name: string;
  metrics: {
    followers: number;
    engagement_rate: number;
    posting_frequency: number;
  };
  insights: string[];
}

interface TrendData {
  name: string;
  volume: number;
  growth_rate: number;
  confidence: number;
  category: string;
}

export default function DeepAnalytics({ userId, platformId }: DeepAnalyticsProps) {
  // Запросы данных аналитики
  const { data: platformMetrics, isLoading: metricsLoading } = useQuery<PlatformMetrics>({
    queryKey: ['/api/analytics/platform', userId, platformId],
  });

  const { data: aiInsights, isLoading: insightsLoading } = useQuery<AIInsight[]>({
    queryKey: ['/api/analytics/insights', userId],
  });

  const { data: competitorData, isLoading: competitorsLoading } = useQuery<CompetitorData[]>({
    queryKey: ['/api/analytics/competitors', userId, platformId],
  });

  const { data: trendData, isLoading: trendsLoading } = useQuery<TrendData[]>({
    queryKey: ['/api/analytics/trends', platformId],
  });

  // Get platform details for customized analytics
  const { data: platforms } = useQuery<Platform[]>({
    queryKey: ['/api/platforms'],
  });
  
  const currentPlatform = platforms?.find((p) => p.id === platformId);

  const getImpactColor = (impact: string) => {
    switch (impact) {
      case 'high': return 'bg-red-100 text-red-800';
      case 'medium': return 'bg-yellow-100 text-yellow-800';
      case 'low': return 'bg-green-100 text-green-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const formatNumber = (num: number): string => {
    if (num >= 1000000) return `${(num / 1000000).toFixed(1)}M`;
    if (num >= 1000) return `${(num / 1000).toFixed(1)}K`;
    return num.toString();
  };

  const getPlatformIcon = (platformName?: string) => {
    const iconClass = "w-6 h-6";
    switch (platformName) {
      case 'instagram': return <SiInstagram className={`${iconClass} text-pink-600`} />;
      case 'youtube': return <SiYoutube className={`${iconClass} text-red-600`} />;
      case 'tiktok': return <SiTiktok className={`${iconClass} text-black`} />;
      case 'telegram': return <SiTelegram className={`${iconClass} text-blue-600`} />;
      default: return <BarChart3 className={iconClass} />;
    }
  };

  const getGrowthIcon = (change: number) => {
    if (change > 0) return <ChevronUp className="w-4 h-4 text-green-500" />;
    if (change < 0) return <ChevronDown className="w-4 h-4 text-red-500" />;
    return <span className="w-4 h-4 text-gray-400">—</span>;
  };

  if (metricsLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="text-center">
          <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-muted-foreground">Составляется изысканный анализ Ваших светских достижений...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6" data-testid="deep-analytics">
      {/* Заголовок с платформой */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-4">
          {getPlatformIcon(currentPlatform?.name)}
          <div>
            <h1 className="text-3xl font-bold bg-gradient-to-r from-primary via-purple-600 to-pink-600 bg-clip-text text-transparent">
              Изысканная Аналитика {currentPlatform?.displayName}
            </h1>
            <p className="text-muted-foreground">
              Утончённый взгляд на Ваши светские достижения в мире {currentPlatform?.displayName}
            </p>
          </div>
        </div>
        <Badge variant="outline" className="px-4 py-2 bg-gradient-to-r from-amber-50 to-yellow-50 border-amber-200">
          <Crown className="w-4 h-4 mr-2 text-amber-600" />
          Аристократическая Панель
        </Badge>
      </div>

      {/* Основные метрики платформы */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
        {/* Левый столбец - Главные метрики */}
        <Card className="bg-gradient-to-br from-slate-50 via-blue-50/50 to-indigo-50 dark:from-slate-900 dark:via-blue-950/50 dark:to-indigo-950 border-blue-200/50">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Gem className="w-5 h-5 text-blue-600" />
              Основные Достижения
            </CardTitle>
          </CardHeader>
          <CardContent>
            {platformMetrics ? (
              <div className="grid grid-cols-2 gap-4">
                <div className="text-center p-4 bg-white/60 dark:bg-slate-800/60 rounded-lg border border-white/50">
                  <Users className="w-8 h-8 mx-auto mb-2 text-blue-600" />
                  <div className="text-2xl font-bold text-blue-900 dark:text-blue-100">{formatNumber(platformMetrics.followers)}</div>
                  <div className="text-sm text-blue-700 dark:text-blue-300">
                    {currentPlatform?.name === 'telegram' ? 'Участники канала' : 'Почтенные подписчики'}
                  </div>
                  <div className="flex items-center justify-center mt-1">
                    {getGrowthIcon(platformMetrics.growth_rate)}
                    <span className={`text-sm ml-1 font-medium ${platformMetrics.growth_rate > 0 ? 'text-green-600' : platformMetrics.growth_rate < 0 ? 'text-red-600' : 'text-gray-600'}`}>
                      {platformMetrics.growth_rate > 0 ? '+' : ''}{platformMetrics.growth_rate.toFixed(1)}%
                    </span>
                  </div>
                </div>
                
                <div className="text-center p-4 bg-white/60 dark:bg-slate-800/60 rounded-lg border border-white/50">
                  <Target className="w-8 h-8 mx-auto mb-2 text-green-600" />
                  <div className="text-2xl font-bold text-green-900 dark:text-green-100">{platformMetrics.engagement_rate.toFixed(1)}%</div>
                  <div className="text-sm text-green-700 dark:text-green-300">Степень Вовлечения</div>
                  <div className="text-xs text-green-600 dark:text-green-400 mt-1">
                    {formatNumber(platformMetrics.likes + platformMetrics.comments)} взаимодействий
                  </div>
                </div>
                
                <div className="text-center p-4 bg-white/60 dark:bg-slate-800/60 rounded-lg border border-white/50">
                  <Eye className="w-8 h-8 mx-auto mb-2 text-purple-600" />
                  <div className="text-2xl font-bold text-purple-900 dark:text-purple-100">{formatNumber(platformMetrics.reach)}</div>
                  <div className="text-sm text-purple-700 dark:text-purple-300">Широта Влияния</div>
                  <div className="text-xs text-purple-600 dark:text-purple-400 mt-1">
                    {formatNumber(platformMetrics.impressions)} показов
                  </div>
                </div>
                
                <div className="text-center p-4 bg-white/60 dark:bg-slate-800/60 rounded-lg border border-white/50">
                  <Award className="w-8 h-8 mx-auto mb-2 text-orange-600" />
                  <div className="text-2xl font-bold text-orange-900 dark:text-orange-100">{formatNumber(platformMetrics.posts)}</div>
                  <div className="text-sm text-orange-700 dark:text-orange-300">
                    {currentPlatform?.name === 'youtube' ? 'Видео опубликовано' : 
                     currentPlatform?.name === 'telegram' ? 'Сообщений отправлено' : 'Публикации'}
                  </div>
                  <div className="text-xs text-orange-600 dark:text-orange-400 mt-1">
                    {formatNumber(platformMetrics.views)} просмотров
                  </div>
                </div>
              </div>
            ) : (
              <div className="text-center py-8">
                <div className="animate-pulse">
                  <div className="w-16 h-16 bg-gray-200 rounded-full mx-auto mb-4"></div>
                  <div className="h-4 bg-gray-200 rounded w-3/4 mx-auto"></div>
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Правый столбец - Платформо-специфичные метрики */}
        <Card className="bg-gradient-to-br from-rose-50 via-pink-50/50 to-purple-50 dark:from-rose-950 dark:via-pink-950/50 dark:to-purple-950 border-pink-200/50">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Sparkles className="w-5 h-5 text-pink-600" />
              {currentPlatform?.name === 'instagram' && 'Instagram Особенности'}
              {currentPlatform?.name === 'youtube' && 'YouTube Показатели'}
              {currentPlatform?.name === 'tiktok' && 'TikTok Вирусность'}
              {currentPlatform?.name === 'telegram' && 'Telegram Метрики'}
              {!currentPlatform?.name && 'Специальные Метрики'}
            </CardTitle>
          </CardHeader>
          <CardContent>
            {platformMetrics?.platform_specific ? (
              <div className="space-y-4">
                {/* Instagram специфичные метрики */}
                {currentPlatform?.name === 'instagram' && (
                  <div className="grid grid-cols-2 gap-3">
                    <div className="flex items-center gap-3 p-3 bg-white/60 dark:bg-slate-800/60 rounded-lg">
                      <Camera className="w-6 h-6 text-pink-600" />
                      <div>
                        <div className="font-semibold text-pink-900 dark:text-pink-100">
                          {formatNumber(platformMetrics.platform_specific.stories_views || 0)}
                        </div>
                        <div className="text-xs text-pink-700 dark:text-pink-300">Stories Просмотров</div>
                      </div>
                    </div>
                    <div className="flex items-center gap-3 p-3 bg-white/60 dark:bg-slate-800/60 rounded-lg">
                      <PlayCircle className="w-6 h-6 text-pink-600" />
                      <div>
                        <div className="font-semibold text-pink-900 dark:text-pink-100">
                          {formatNumber(platformMetrics.platform_specific.reels_plays || 0)}
                        </div>
                        <div className="text-xs text-pink-700 dark:text-pink-300">Reels Воспроизведений</div>
                      </div>
                    </div>
                    <div className="flex items-center gap-3 p-3 bg-white/60 dark:bg-slate-800/60 rounded-lg">
                      <Bookmark className="w-6 h-6 text-pink-600" />
                      <div>
                        <div className="font-semibold text-pink-900 dark:text-pink-100">
                          {formatNumber(platformMetrics.platform_specific.saves || 0)}
                        </div>
                        <div className="text-xs text-pink-700 dark:text-pink-300">Сохранений</div>
                      </div>
                    </div>
                    <div className="flex items-center gap-3 p-3 bg-white/60 dark:bg-slate-800/60 rounded-lg">
                      <Users className="w-6 h-6 text-pink-600" />
                      <div>
                        <div className="font-semibold text-pink-900 dark:text-pink-100">
                          {formatNumber(platformMetrics.platform_specific.profile_visits || 0)}
                        </div>
                        <div className="text-xs text-pink-700 dark:text-pink-300">Посещений Профиля</div>
                      </div>
                    </div>
                  </div>
                )}

                {/* YouTube специфичные метрики */}
                {currentPlatform?.name === 'youtube' && (
                  <div className="grid grid-cols-1 gap-3">
                    <div className="flex items-center justify-between p-4 bg-white/60 dark:bg-slate-800/60 rounded-lg">
                      <div className="flex items-center gap-3">
                        <Clock className="w-6 h-6 text-red-600" />
                        <div>
                          <div className="font-semibold text-red-900 dark:text-red-100">Время просмотра</div>
                          <div className="text-sm text-red-700 dark:text-red-300">
                            {Math.round((platformMetrics.platform_specific.watch_time_minutes || 0) / 60)} часов
                          </div>
                        </div>
                      </div>
                      <Badge className="bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-200">
                        Средняя: {platformMetrics.platform_specific.average_view_duration || 0}мин
                      </Badge>
                    </div>
                    <div className="flex items-center justify-between p-4 bg-white/60 dark:bg-slate-800/60 rounded-lg">
                      <div className="flex items-center gap-3">
                        <Users className="w-6 h-6 text-red-600" />
                        <div>
                          <div className="font-semibold text-red-900 dark:text-red-100">Подписчики</div>
                          <div className="text-sm text-red-700 dark:text-red-300">
                            +{formatNumber(platformMetrics.platform_specific.subscribers_gained || 0)} за месяц
                          </div>
                        </div>
                      </div>
                      <Badge className="bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-200">
                        {platformMetrics.followers > 0 ? ((platformMetrics.platform_specific.subscribers_gained || 0) / platformMetrics.followers * 100).toFixed(1) : '0'}% роста
                      </Badge>
                    </div>
                  </div>
                )}

                {/* TikTok специфичные метрики */}
                {currentPlatform?.name === 'tiktok' && (
                  <div className="grid grid-cols-2 gap-3">
                    <div className="flex items-center gap-3 p-3 bg-white/60 dark:bg-slate-800/60 rounded-lg">
                      <PlayCircle className="w-6 h-6 text-black" />
                      <div>
                        <div className="font-semibold text-black dark:text-white">
                          {formatNumber(platformMetrics.platform_specific.video_views || 0)}
                        </div>
                        <div className="text-xs text-gray-700 dark:text-gray-300">Просмотров видео</div>
                      </div>
                    </div>
                    <div className="flex items-center gap-3 p-3 bg-white/60 dark:bg-slate-800/60 rounded-lg">
                      <Share2 className="w-6 h-6 text-black" />
                      <div>
                        <div className="font-semibold text-black dark:text-white">
                          {(platformMetrics.platform_specific.shares_per_video || 0).toFixed(1)}
                        </div>
                        <div className="text-xs text-gray-700 dark:text-gray-300">Репостов на видео</div>
                      </div>
                    </div>
                    <div className="flex items-center gap-3 p-3 bg-white/60 dark:bg-slate-800/60 rounded-lg">
                      <Heart className="w-6 h-6 text-black" />
                      <div>
                        <div className="font-semibold text-black dark:text-white">
                          {(platformMetrics.platform_specific.likes_per_video || 0).toFixed(1)}
                        </div>
                        <div className="text-xs text-gray-700 dark:text-gray-300">Лайков на видео</div>
                      </div>
                    </div>
                    <div className="flex items-center gap-3 p-3 bg-white/60 dark:bg-slate-800/60 rounded-lg">
                      <Eye className="w-6 h-6 text-black" />
                      <div>
                        <div className="font-semibold text-black dark:text-white">
                          {formatNumber(platformMetrics.platform_specific.profile_views || 0)}
                        </div>
                        <div className="text-xs text-gray-700 dark:text-gray-300">Просмотров профиля</div>
                      </div>
                    </div>
                  </div>
                )}

                {/* Telegram специфичные метрики */}
                {currentPlatform?.name === 'telegram' && (
                  <div className="grid grid-cols-1 gap-3">
                    <div className="flex items-center justify-between p-4 bg-white/60 dark:bg-slate-800/60 rounded-lg">
                      <div className="flex items-center gap-3">
                        <MessageCircle className="w-6 h-6 text-blue-600" />
                        <div>
                          <div className="font-semibold text-blue-900 dark:text-blue-100">Охват сообщений</div>
                          <div className="text-sm text-blue-700 dark:text-blue-300">
                            {formatNumber(platformMetrics.platform_specific.message_views || 0)} просмотров
                          </div>
                        </div>
                      </div>
                      <Badge className="bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-200">
                        {formatNumber(platformMetrics.platform_specific.forwards || 0)} пересылок
                      </Badge>
                    </div>
                    <div className="grid grid-cols-2 gap-3">
                      <div className="flex items-center gap-3 p-3 bg-white/60 dark:bg-slate-800/60 rounded-lg">
                        <Heart className="w-6 h-6 text-blue-600" />
                        <div>
                          <div className="font-semibold text-blue-900 dark:text-blue-100">
                            {formatNumber(platformMetrics.platform_specific.reactions || 0)}
                          </div>
                          <div className="text-xs text-blue-700 dark:text-blue-300">Реакций</div>
                        </div>
                      </div>
                      <div className="flex items-center gap-3 p-3 bg-white/60 dark:bg-slate-800/60 rounded-lg">
                        <TrendingUp className="w-6 h-6 text-blue-600" />
                        <div>
                          <div className="font-semibold text-blue-900 dark:text-blue-100">
                            +{formatNumber(platformMetrics.platform_specific.member_growth || 0)}
                          </div>
                          <div className="text-xs text-blue-700 dark:text-blue-300">Новых участников</div>
                        </div>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            ) : (
              <div className="text-center py-8 text-muted-foreground">
                <Target className="w-12 h-12 mx-auto mb-2 opacity-50" />
                <p>Специальные метрики будут доступны после накопления данных</p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* График роста */}
      {platformMetrics?.growth_trend && platformMetrics.growth_trend.length > 0 && (
        <Card className="mb-8">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <LineChart className="w-5 h-5 text-primary" />
              Динамика Развития (7 дней)
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-64 flex items-end justify-between gap-2 p-4 bg-gradient-to-t from-primary/5 to-transparent rounded-lg">
              {(() => {
                const maxFollowers = Math.max(...platformMetrics.growth_trend.map(p => p.followers));
                const maxEngagement = Math.max(...platformMetrics.growth_trend.map(p => p.engagement));
                
                return platformMetrics.growth_trend.map((point, index) => {
                  const followerHeight = maxFollowers > 0 ? (point.followers / maxFollowers) * 200 : 0;
                  const engagementHeight = maxEngagement > 0 ? (point.engagement / maxEngagement) * 180 : 0;
                
                  return (
                    <div key={index} className="flex-1 flex flex-col items-center gap-2">
                      <div className="relative w-full flex items-end justify-center gap-1" style={{ height: '200px' }}>
                        <div 
                          className="bg-blue-500 rounded-t w-3 opacity-80 hover:opacity-100 transition-opacity"
                          style={{ height: `${followerHeight}px` }}
                          title={`Подписчики: ${formatNumber(point.followers)}`}
                        />
                        <div 
                          className="bg-green-500 rounded-t w-3 opacity-80 hover:opacity-100 transition-opacity"
                          style={{ height: `${engagementHeight}px` }}
                          title={`Вовлечение: ${formatNumber(point.engagement)}`}
                        />
                      </div>
                      <div className="text-xs text-muted-foreground">
                        {new Date(point.date).toLocaleDateString('ru-RU', { weekday: 'short' })}
                      </div>
                    </div>
                  );
                });
              })()}
            </div>
            <div className="flex items-center justify-center gap-6 mt-4">
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 bg-blue-500 rounded"></div>
                <span className="text-sm text-muted-foreground">Подписчики</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 bg-green-500 rounded"></div>
                <span className="text-sm text-muted-foreground">Вовлечение</span>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Табы для разных видов аналитики */}
      <Tabs defaultValue="insights" className="w-full">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="insights">AI Инсайты</TabsTrigger>
          <TabsTrigger value="competitors">Конкуренты</TabsTrigger>
          <TabsTrigger value="trends">Тренды</TabsTrigger>
          <TabsTrigger value="optimization">Оптимизация</TabsTrigger>
        </TabsList>

        {/* AI Инсайты */}
        <TabsContent value="insights" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Brain className="w-5 h-5" />
                AI Анализ и рекомендации
              </CardTitle>
            </CardHeader>
            <CardContent>
              {aiInsights && aiInsights.length > 0 ? (
                <div className="space-y-4">
                  {aiInsights.slice(0, 3).map((insight) => (
                    <div key={insight.id} className="border rounded-lg p-4">
                      <div className="flex items-start justify-between mb-2">
                        <h3 className="font-semibold text-lg">{insight.title}</h3>
                        <Badge className={getImpactColor(insight.data.impact)}>
                          {insight.data.impact === 'high' && 'Высокий эффект'}
                          {insight.data.impact === 'medium' && 'Средний эффект'}
                          {insight.data.impact === 'low' && 'Низкий эффект'}
                        </Badge>
                      </div>
                      <p className="text-gray-600 mb-3">{insight.description}</p>
                      
                      <div className="grid md:grid-cols-2 gap-4">
                        <div>
                          <h4 className="font-medium mb-2 text-sm">🔍 Ключевые инсайты:</h4>
                          <ul className="text-sm space-y-1">
                            {insight.data.insights.map((item, index) => (
                              <li key={index} className="flex items-start gap-2">
                                <span className="text-blue-500 mt-1">•</span>
                                <span>{item}</span>
                              </li>
                            ))}
                          </ul>
                        </div>
                        
                        <div>
                          <h4 className="font-medium mb-2 text-sm">💡 Рекомендации:</h4>
                          <ul className="text-sm space-y-1">
                            {insight.data.recommendations.map((item, index) => (
                              <li key={index} className="flex items-start gap-2">
                                <span className="text-green-500 mt-1">•</span>
                                <span>{item}</span>
                              </li>
                            ))}
                          </ul>
                        </div>
                      </div>
                      
                      <div className="flex items-center justify-between mt-3 pt-3 border-t">
                        <div className="flex items-center gap-2">
                          <span className="text-sm text-gray-500">Уверенность AI:</span>
                          <Progress value={insight.data.confidence} className="w-24" />
                          <span className="text-sm font-medium">{insight.data.confidence}%</span>
                        </div>
                        <Button variant="outline" size="sm">
                          Применить
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8 text-gray-500">
                  <Brain className="w-12 h-12 mx-auto mb-2 opacity-50" />
                  <p>AI инсайты будут доступны после накопления данных</p>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Анализ конкурентов */}
        <TabsContent value="competitors" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Target className="w-5 h-5" />
                Конкурентный анализ
              </CardTitle>
            </CardHeader>
            <CardContent>
              {competitorData && competitorData.length > 0 ? (
                <div className="grid md:grid-cols-2 gap-4">
                  {competitorData.map((competitor, index) => (
                    <div key={index} className="border rounded-lg p-4">
                      <div className="flex items-center justify-between mb-3">
                        <div>
                          <h3 className="font-semibold">@{competitor.handle}</h3>
                          <p className="text-sm text-gray-600">{competitor.name}</p>
                        </div>
                        <Badge variant="secondary">Конкурент</Badge>
                      </div>
                      
                      <div className="space-y-2 mb-3">
                        <div className="flex justify-between text-sm">
                          <span>Подписчики:</span>
                          <span className="font-medium">{formatNumber(competitor.metrics.followers)}</span>
                        </div>
                        <div className="flex justify-between text-sm">
                          <span>Вовлеченность:</span>
                          <span className="font-medium">{competitor.metrics.engagement_rate.toFixed(1)}%</span>
                        </div>
                        <div className="flex justify-between text-sm">
                          <span>Частота публикаций:</span>
                          <span className="font-medium">{competitor.metrics.posting_frequency.toFixed(1)}/день</span>
                        </div>
                      </div>
                      
                      <div className="pt-3 border-t">
                        <h4 className="text-sm font-medium mb-2">Ключевые особенности:</h4>
                        <ul className="text-xs space-y-1">
                          {competitor.insights.slice(0, 3).map((insight, i) => (
                            <li key={i} className="flex items-start gap-2">
                              <span className="text-purple-500 mt-0.5">•</span>
                              <span>{insight}</span>
                            </li>
                          ))}
                        </ul>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8 text-gray-500">
                  <Target className="w-12 h-12 mx-auto mb-2 opacity-50" />
                  <p>Добавьте конкурентов для анализа</p>
                  <Button className="mt-3" size="sm">
                    Добавить конкурента
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Анализ трендов */}
        <TabsContent value="trends" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <TrendingUp className="w-5 h-5" />
                Актуальные тренды
              </CardTitle>
            </CardHeader>
            <CardContent>
              {trendData && trendData.length > 0 ? (
                <div className="space-y-3">
                  {trendData.slice(0, 10).map((trend, index) => (
                    <div key={index} className="flex items-center justify-between p-3 border rounded-lg hover:bg-gray-50">
                      <div className="flex-1">
                        <div className="flex items-center gap-3">
                          <span className="font-medium text-gray-900">#{trend.name}</span>
                          <Badge variant="outline" className="text-xs">
                            {trend.category}
                          </Badge>
                        </div>
                        <div className="flex items-center gap-4 mt-1">
                          <span className="text-sm text-gray-500">
                            📊 {formatNumber(trend.volume)} упоминаний
                          </span>
                          <div className="flex items-center gap-1">
                            {trend.growth_rate > 0 ? (
                              <TrendingUp className="w-3 h-3 text-green-500" />
                            ) : (
                              <TrendingDown className="w-3 h-3 text-red-500" />
                            )}
                            <span className={`text-xs ${trend.growth_rate > 0 ? 'text-green-600' : 'text-red-600'}`}>
                              {trend.growth_rate > 0 ? '+' : ''}{trend.growth_rate}%
                            </span>
                          </div>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <div className="text-right">
                          <div className="text-xs text-gray-500">Уверенность</div>
                          <div className="font-medium text-sm">{trend.confidence}%</div>
                        </div>
                        <Button variant="ghost" size="sm">
                          <Hash className="w-4 h-4" />
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8 text-gray-500">
                  <TrendingUp className="w-12 h-12 mx-auto mb-2 opacity-50" />
                  <p>Анализируем актуальные тренды...</p>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Инструменты оптимизации */}
        <TabsContent value="optimization" className="space-y-4">
          <div className="grid md:grid-cols-2 gap-4">
            {/* Оптимизация времени публикации */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-base">
                  <Clock className="w-4 h-4" />
                  Лучшее время для публикаций
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  <div className="flex justify-between items-center p-2 bg-green-50 rounded">
                    <span className="text-sm font-medium">Четверг, 16:00</span>
                    <Badge className="bg-green-100 text-green-800">85% вовлеченность</Badge>
                  </div>
                  <div className="flex justify-between items-center p-2 bg-blue-50 rounded">
                    <span className="text-sm font-medium">Вторник, 14:00</span>
                    <Badge className="bg-blue-100 text-blue-800">82% вовлеченность</Badge>
                  </div>
                  <div className="flex justify-between items-center p-2 bg-purple-50 rounded">
                    <span className="text-sm font-medium">Среда, 11:00</span>
                    <Badge className="bg-purple-100 text-purple-800">78% вовлеченность</Badge>
                  </div>
                </div>
                <Button className="w-full mt-3" size="sm" variant="outline">
                  Запланировать посты
                </Button>
              </CardContent>
            </Card>

            {/* Оптимизация хештегов */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-base">
                  <Hash className="w-4 h-4" />
                  Рекомендуемые хештеги
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  <div className="flex flex-wrap gap-1">
                    {['#трейдинг', '#криптовалюты', '#ai', '#финтех', '#блогер'].map((tag) => (
                      <Badge key={tag} variant="secondary" className="text-xs cursor-pointer hover:bg-blue-100">
                        {tag}
                      </Badge>
                    ))}
                  </div>
                  <div className="pt-2">
                    <p className="text-xs text-gray-600 mb-2">Потенциальный охват:</p>
                    <div className="flex items-center gap-2">
                      <Progress value={75} className="flex-1" />
                      <span className="text-xs font-medium">250K</span>
                    </div>
                  </div>
                </div>
                <Button className="w-full mt-3" size="sm" variant="outline">
                  <Zap className="w-3 h-3 mr-1" />
                  Оптимизировать хештеги
                </Button>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}