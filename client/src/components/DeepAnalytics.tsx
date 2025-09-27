import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Progress } from "@/components/ui/progress";
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
  Zap
} from "lucide-react";

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
  const { data: platformMetrics } = useQuery<PlatformMetrics>({
    queryKey: ['/api/analytics/platform', userId, platformId],
  });

  const { data: aiInsights } = useQuery<AIInsight[]>({
    queryKey: ['/api/analytics/insights', userId],
  });

  const { data: competitorData } = useQuery<CompetitorData[]>({
    queryKey: ['/api/analytics/competitors', userId, platformId],
  });

  const { data: trendData } = useQuery<TrendData[]>({
    queryKey: ['/api/analytics/trends', platformId],
  });

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

  return (
    <div className="space-y-6" data-testid="deep-analytics">
      {/* Основные метрики платформы */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Activity className="w-5 h-5" />
            Глубокая аналитика платформы
          </CardTitle>
        </CardHeader>
        <CardContent>
          {platformMetrics ? (
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="text-center p-4 bg-gradient-to-br from-blue-50 to-indigo-50 rounded-lg">
                <Users className="w-8 h-8 mx-auto mb-2 text-blue-600" />
                <div className="text-2xl font-bold text-blue-900">{formatNumber(platformMetrics.followers)}</div>
                <div className="text-sm text-blue-700">Подписчики</div>
                <div className="flex items-center justify-center mt-1">
                  {platformMetrics.growth_rate > 0 ? (
                    <TrendingUp className="w-4 h-4 text-green-500" />
                  ) : (
                    <TrendingDown className="w-4 h-4 text-red-500" />
                  )}
                  <span className={`text-sm ml-1 ${platformMetrics.growth_rate > 0 ? 'text-green-600' : 'text-red-600'}`}>
                    {platformMetrics.growth_rate.toFixed(1)}%
                  </span>
                </div>
              </div>
              
              <div className="text-center p-4 bg-gradient-to-br from-purple-50 to-pink-50 rounded-lg">
                <Eye className="w-8 h-8 mx-auto mb-2 text-purple-600" />
                <div className="text-2xl font-bold text-purple-900">{formatNumber(platformMetrics.reach)}</div>
                <div className="text-sm text-purple-700">Охват</div>
                <div className="text-xs text-purple-600 mt-1">
                  {formatNumber(platformMetrics.impressions)} показов
                </div>
              </div>
              
              <div className="text-center p-4 bg-gradient-to-br from-green-50 to-emerald-50 rounded-lg">
                <Target className="w-8 h-8 mx-auto mb-2 text-green-600" />
                <div className="text-2xl font-bold text-green-900">{platformMetrics.engagement_rate.toFixed(1)}%</div>
                <div className="text-sm text-green-700">Вовлеченность</div>
                <div className="text-xs text-green-600 mt-1">
                  {formatNumber(platformMetrics.likes + platformMetrics.comments)} взаимодействий
                </div>
              </div>
              
              <div className="text-center p-4 bg-gradient-to-br from-orange-50 to-red-50 rounded-lg">
                <Award className="w-8 h-8 mx-auto mb-2 text-orange-600" />
                <div className="text-2xl font-bold text-orange-900">{formatNumber(platformMetrics.posts)}</div>
                <div className="text-sm text-orange-700">Публикации</div>
                <div className="text-xs text-orange-600 mt-1">
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