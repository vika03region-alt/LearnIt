
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Progress } from "@/components/ui/progress";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useState } from "react";
import { 
  Brain, 
  TrendingUp, 
  Zap, 
  Target, 
  Users, 
  Eye,
  Crown,
  Sparkles,
  BarChart3,
  PieChart,
  LineChart,
  Cpu,
  Rocket,
  Diamond,
  Star,
  Activity,
  Globe,
  Calendar,
  Hash,
  MessageSquare,
  ThumbsUp,
  Share2,
  Bookmark,
  Clock,
  Award
} from "lucide-react";

interface AdvancedAnalyticsProps {
  userId: string;
  platformId: number;
}

interface AdvancedMetrics {
  viral_potential: number;
  content_quality_score: number;
  audience_sentiment: 'positive' | 'negative' | 'neutral';
  trend_alignment: number;
  competition_analysis: {
    market_position: number;
    competitive_advantage: string[];
    threats: string[];
    opportunities: string[];
  };
  growth_projection: {
    next_30_days: number;
    confidence: number;
    required_actions: string[];
  };
  monetization_opportunities: {
    potential_revenue: number;
    recommended_strategies: string[];
    risk_level: 'low' | 'medium' | 'high';
  };
}

interface GrokInsight {
  type: 'strategic' | 'tactical' | 'creative' | 'technical';
  priority: 'high' | 'medium' | 'low';
  title: string;
  description: string;
  actionable_steps: string[];
  expected_impact: number;
  implementation_time: string;
}

interface PredictiveAnalysis {
  trend_predictions: Array<{
    trend: string;
    probability: number;
    impact_score: number;
    timeline: string;
    preparation_steps: string[];
  }>;
  content_recommendations: Array<{
    content_type: string;
    optimal_timing: string;
    expected_engagement: number;
    hashtags: string[];
    caption_style: string;
  }>;
  audience_behavior: {
    peak_activity_times: string[];
    content_preferences: string[];
    engagement_patterns: string[];
  };
}

export default function AdvancedAnalyticsDashboard({ userId, platformId }: AdvancedAnalyticsProps) {
  const [selectedInsightType, setSelectedInsightType] = useState<string>('all');
  const [analysisDepth, setAnalysisDepth] = useState<'basic' | 'advanced' | 'master'>('advanced');

  // Запросы к API
  const { data: advancedMetrics, isLoading: metricsLoading } = useQuery<AdvancedMetrics>({
    queryKey: ['/api/analytics/advanced-metrics', userId, platformId],
  });

  const { data: grokInsights, isLoading: insightsLoading } = useQuery<GrokInsight[]>({
    queryKey: ['/api/grok/insights', userId, platformId, analysisDepth],
  });

  const { data: predictiveAnalysis, isLoading: predictiveLoading } = useQuery<PredictiveAnalysis>({
    queryKey: ['/api/analytics/predictive', userId, platformId],
  });

  // Мутация для генерации нового анализа
  const generateAnalysis = useMutation({
    mutationFn: async (depth: string) => {
      const response = await fetch('/api/grok/generate-analysis', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId, platformId, depth }),
      });
      if (!response.ok) throw new Error('Ошибка генерации анализа');
      return response.json();
    },
  });

  const getMetricColor = (score: number) => {
    if (score >= 80) return 'text-green-600 bg-green-50 border-green-200';
    if (score >= 60) return 'text-yellow-600 bg-yellow-50 border-yellow-200';
    return 'text-red-600 bg-red-50 border-red-200';
  };

  const getPriorityIcon = (priority: string) => {
    switch (priority) {
      case 'high': return <Crown className="w-4 h-4 text-red-500" />;
      case 'medium': return <Star className="w-4 h-4 text-yellow-500" />;
      case 'low': return <Award className="w-4 h-4 text-blue-500" />;
      default: return <Activity className="w-4 h-4 text-gray-500" />;
    }
  };

  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'strategic': return <Brain className="w-4 h-4 text-purple-500" />;
      case 'tactical': return <Target className="w-4 h-4 text-blue-500" />;
      case 'creative': return <Sparkles className="w-4 h-4 text-pink-500" />;
      case 'technical': return <Cpu className="w-4 h-4 text-green-500" />;
      default: return <Activity className="w-4 h-4 text-gray-500" />;
    }
  };

  if (metricsLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="text-center">
          <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-muted-foreground">Grok AI анализирует ваши данные...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6" data-testid="advanced-analytics">
      {/* Заголовок */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-4">
          <div className="p-3 bg-gradient-to-br from-purple-500 to-pink-500 rounded-lg">
            <Brain className="w-8 h-8 text-white" />
          </div>
          <div>
            <h1 className="text-3xl font-bold bg-gradient-to-r from-purple-600 via-pink-600 to-blue-600 bg-clip-text text-transparent">
              Продвинутый AI Анализ
            </h1>
            <p className="text-muted-foreground">
              Глубокий анализ с помощью Grok AI и машинного обучения
            </p>
          </div>
        </div>
        
        <div className="flex items-center gap-3">
          <Badge variant="outline" className="px-4 py-2 bg-gradient-to-r from-purple-50 to-pink-50 border-purple-200">
            <Diamond className="w-4 h-4 mr-2 text-purple-600" />
            Master Level
          </Badge>
          <Button 
            onClick={() => generateAnalysis.mutate(analysisDepth)}
            disabled={generateAnalysis.isPending}
            className="bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600"
          >
            <Rocket className="w-4 h-4 mr-2" />
            Перегенерировать
          </Button>
        </div>
      </div>

      {/* Ключевые метрики */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        <Card className="bg-gradient-to-br from-purple-50 to-purple-100 border-purple-200">
          <CardContent className="p-6">
            <div className="flex items-center justify-between mb-4">
              <Rocket className="w-8 h-8 text-purple-600" />
              <Badge className="bg-purple-100 text-purple-800">Viral</Badge>
            </div>
            <div className="text-2xl font-bold text-purple-900 mb-1">
              {advancedMetrics?.viral_potential || 0}%
            </div>
            <p className="text-sm text-purple-700">Вирусный потенциал</p>
            <Progress 
              value={advancedMetrics?.viral_potential || 0} 
              className="mt-2 h-2"
            />
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-blue-50 to-blue-100 border-blue-200">
          <CardContent className="p-6">
            <div className="flex items-center justify-between mb-4">
              <Star className="w-8 h-8 text-blue-600" />
              <Badge className="bg-blue-100 text-blue-800">Quality</Badge>
            </div>
            <div className="text-2xl font-bold text-blue-900 mb-1">
              {advancedMetrics?.content_quality_score || 0}%
            </div>
            <p className="text-sm text-blue-700">Качество контента</p>
            <Progress 
              value={advancedMetrics?.content_quality_score || 0} 
              className="mt-2 h-2"
            />
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-green-50 to-green-100 border-green-200">
          <CardContent className="p-6">
            <div className="flex items-center justify-between mb-4">
              <TrendingUp className="w-8 h-8 text-green-600" />
              <Badge className="bg-green-100 text-green-800">Trends</Badge>
            </div>
            <div className="text-2xl font-bold text-green-900 mb-1">
              {advancedMetrics?.trend_alignment || 0}%
            </div>
            <p className="text-sm text-green-700">Соответствие трендам</p>
            <Progress 
              value={advancedMetrics?.trend_alignment || 0} 
              className="mt-2 h-2"
            />
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-orange-50 to-orange-100 border-orange-200">
          <CardContent className="p-6">
            <div className="flex items-center justify-between mb-4">
              <Eye className="w-8 h-8 text-orange-600" />
              <Badge className={`${advancedMetrics?.audience_sentiment === 'positive' ? 'bg-green-100 text-green-800' : 
                                 advancedMetrics?.audience_sentiment === 'negative' ? 'bg-red-100 text-red-800' : 
                                 'bg-gray-100 text-gray-800'}`}>
                {advancedMetrics?.audience_sentiment === 'positive' ? 'Позитив' :
                 advancedMetrics?.audience_sentiment === 'negative' ? 'Негатив' : 'Нейтрал'}
              </Badge>
            </div>
            <div className="text-2xl font-bold text-orange-900 mb-1">
              {advancedMetrics?.competition_analysis?.market_position || 0}%
            </div>
            <p className="text-sm text-orange-700">Позиция на рынке</p>
            <Progress 
              value={advancedMetrics?.competition_analysis?.market_position || 0} 
              className="mt-2 h-2"
            />
          </CardContent>
        </Card>
      </div>

      {/* Табы анализа */}
      <Tabs defaultValue="grok-insights" className="w-full">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="grok-insights">Grok Инсайты</TabsTrigger>
          <TabsTrigger value="predictive">Прогнозы</TabsTrigger>
          <TabsTrigger value="competition">Конкуренция</TabsTrigger>
          <TabsTrigger value="monetization">Монетизация</TabsTrigger>
        </TabsList>

        {/* Grok AI Инсайты */}
        <TabsContent value="grok-insights" className="space-y-4">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle className="flex items-center gap-2">
                  <Brain className="w-5 h-5 text-purple-600" />
                  Grok AI Инсайты
                </CardTitle>
                <div className="flex items-center gap-2">
                  <select 
                    value={selectedInsightType} 
                    onChange={(e) => setSelectedInsightType(e.target.value)}
                    className="border rounded px-3 py-1 text-sm"
                  >
                    <option value="all">Все типы</option>
                    <option value="strategic">Стратегические</option>
                    <option value="tactical">Тактические</option>
                    <option value="creative">Креативные</option>
                    <option value="technical">Технические</option>
                  </select>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              {grokInsights && grokInsights.length > 0 ? (
                <div className="space-y-4">
                  {grokInsights
                    .filter(insight => selectedInsightType === 'all' || insight.type === selectedInsightType)
                    .map((insight, index) => (
                    <div key={index} className="border rounded-lg p-4 bg-gradient-to-r from-white to-gray-50">
                      <div className="flex items-start justify-between mb-3">
                        <div className="flex items-center gap-3">
                          {getTypeIcon(insight.type)}
                          <div>
                            <h3 className="font-semibold text-lg">{insight.title}</h3>
                            <p className="text-sm text-muted-foreground">{insight.type} • {insight.implementation_time}</p>
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          {getPriorityIcon(insight.priority)}
                          <Badge variant="outline" className={`
                            ${insight.priority === 'high' ? 'border-red-200 text-red-700' : 
                              insight.priority === 'medium' ? 'border-yellow-200 text-yellow-700' : 
                              'border-blue-200 text-blue-700'}
                          `}>
                            {insight.priority === 'high' ? 'Высокий' : 
                             insight.priority === 'medium' ? 'Средний' : 'Низкий'} приоритет
                          </Badge>
                        </div>
                      </div>
                      
                      <p className="text-gray-700 mb-4">{insight.description}</p>
                      
                      <div className="grid md:grid-cols-2 gap-4 mb-4">
                        <div>
                          <h4 className="font-medium mb-2 text-sm text-gray-900">🎯 План действий:</h4>
                          <ul className="text-sm space-y-1">
                            {insight.actionable_steps.map((step, stepIndex) => (
                              <li key={stepIndex} className="flex items-start gap-2">
                                <span className="text-purple-500 mt-1 text-xs">▶</span>
                                <span>{step}</span>
                              </li>
                            ))}
                          </ul>
                        </div>
                        
                        <div className="space-y-3">
                          <div>
                            <div className="flex items-center justify-between text-sm">
                              <span className="text-gray-600">Ожидаемый эффект:</span>
                              <span className="font-medium">{insight.expected_impact}%</span>
                            </div>
                            <Progress value={insight.expected_impact} className="mt-1 h-2" />
                          </div>
                          
                          <Button variant="outline" size="sm" className="w-full">
                            <Zap className="w-3 h-3 mr-1" />
                            Применить инсайт
                          </Button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8 text-gray-500">
                  <Brain className="w-12 h-12 mx-auto mb-2 opacity-50" />
                  <p>Grok AI анализирует ваши данные...</p>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Прогностический анализ */}
        <TabsContent value="predictive" className="space-y-4">
          <div className="grid md:grid-cols-2 gap-6">
            {/* Прогнозы трендов */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <TrendingUp className="w-5 h-5 text-blue-600" />
                  Прогнозы трендов
                </CardTitle>
              </CardHeader>
              <CardContent>
                {predictiveAnalysis?.trend_predictions ? (
                  <div className="space-y-4">
                    {predictiveAnalysis.trend_predictions.slice(0, 3).map((prediction, index) => (
                      <div key={index} className="border rounded-lg p-3">
                        <div className="flex items-center justify-between mb-2">
                          <h4 className="font-medium">{prediction.trend}</h4>
                          <Badge className="bg-blue-100 text-blue-800">
                            {prediction.probability}% вероятность
                          </Badge>
                        </div>
                        <div className="text-sm text-muted-foreground mb-2">
                          Эффект: {prediction.impact_score}/10 • Время: {prediction.timeline}
                        </div>
                        <div className="text-xs text-gray-600">
                          <strong>Подготовка:</strong>
                          <ul className="mt-1 space-y-1">
                            {prediction.preparation_steps.slice(0, 2).map((step, stepIndex) => (
                              <li key={stepIndex}>• {step}</li>
                            ))}
                          </ul>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-6 text-gray-500">
                    <Clock className="w-8 h-8 mx-auto mb-2 opacity-50" />
                    <p>Анализируем тренды...</p>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Рекомендации контента */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Sparkles className="w-5 h-5 text-pink-600" />
                  Рекомендации контента
                </CardTitle>
              </CardHeader>
              <CardContent>
                {predictiveAnalysis?.content_recommendations ? (
                  <div className="space-y-4">
                    {predictiveAnalysis.content_recommendations.slice(0, 3).map((rec, index) => (
                      <div key={index} className="border rounded-lg p-3">
                        <div className="flex items-center justify-between mb-2">
                          <h4 className="font-medium">{rec.content_type}</h4>
                          <Badge className="bg-green-100 text-green-800">
                            {rec.expected_engagement}% вовлечение
                          </Badge>
                        </div>
                        <div className="text-sm text-muted-foreground mb-2">
                          ⏰ {rec.optimal_timing} • 📝 {rec.caption_style}
                        </div>
                        <div className="flex flex-wrap gap-1">
                          {rec.hashtags.slice(0, 3).map((tag, tagIndex) => (
                            <Badge key={tagIndex} variant="secondary" className="text-xs">
                              {tag}
                            </Badge>
                          ))}
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-6 text-gray-500">
                    <MessageSquare className="w-8 h-8 mx-auto mb-2 opacity-50" />
                    <p>Создаем рекомендации...</p>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* Конкурентный анализ */}
        <TabsContent value="competition" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Target className="w-5 h-5 text-red-600" />
                SWOT Анализ
              </CardTitle>
            </CardHeader>
            <CardContent>
              {advancedMetrics?.competition_analysis ? (
                <div className="grid md:grid-cols-2 gap-6">
                  <div className="space-y-4">
                    <div className="border border-green-200 rounded-lg p-4 bg-green-50">
                      <h4 className="font-medium text-green-800 mb-2">💪 Преимущества</h4>
                      <ul className="text-sm space-y-1">
                        {advancedMetrics.competition_analysis.competitive_advantage.map((advantage, index) => (
                          <li key={index} className="flex items-start gap-2">
                            <span className="text-green-600 mt-1">✓</span>
                            <span>{advantage}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                    
                    <div className="border border-blue-200 rounded-lg p-4 bg-blue-50">
                      <h4 className="font-medium text-blue-800 mb-2">🎯 Возможности</h4>
                      <ul className="text-sm space-y-1">
                        {advancedMetrics.competition_analysis.opportunities.map((opportunity, index) => (
                          <li key={index} className="flex items-start gap-2">
                            <span className="text-blue-600 mt-1">▶</span>
                            <span>{opportunity}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  </div>
                  
                  <div className="space-y-4">
                    <div className="border border-red-200 rounded-lg p-4 bg-red-50">
                      <h4 className="font-medium text-red-800 mb-2">⚠️ Угрозы</h4>
                      <ul className="text-sm space-y-1">
                        {advancedMetrics.competition_analysis.threats.map((threat, index) => (
                          <li key={index} className="flex items-start gap-2">
                            <span className="text-red-600 mt-1">!</span>
                            <span>{threat}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                    
                    <div className="border border-purple-200 rounded-lg p-4 bg-purple-50">
                      <h4 className="font-medium text-purple-800 mb-2">📊 Позиция на рынке</h4>
                      <div className="flex items-center gap-3">
                        <Progress 
                          value={advancedMetrics.competition_analysis.market_position} 
                          className="flex-1 h-3"
                        />
                        <span className="font-medium text-lg">
                          {advancedMetrics.competition_analysis.market_position}%
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="text-center py-8 text-gray-500">
                  <Target className="w-12 h-12 mx-auto mb-2 opacity-50" />
                  <p>Анализируем конкурентную среду...</p>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Монетизация */}
        <TabsContent value="monetization" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Diamond className="w-5 h-5 text-yellow-600" />
                Возможности монетизации
              </CardTitle>
            </CardHeader>
            <CardContent>
              {advancedMetrics?.monetization_opportunities ? (
                <div className="space-y-6">
                  <div className="grid md:grid-cols-3 gap-4">
                    <div className="text-center p-4 bg-gradient-to-br from-yellow-50 to-yellow-100 rounded-lg border border-yellow-200">
                      <div className="text-2xl font-bold text-yellow-800 mb-1">
                        ${advancedMetrics.monetization_opportunities.potential_revenue.toLocaleString()}
                      </div>
                      <p className="text-sm text-yellow-700">Потенциальный доход</p>
                    </div>
                    
                    <div className="text-center p-4 bg-gradient-to-br from-green-50 to-green-100 rounded-lg border border-green-200">
                      <div className="text-2xl font-bold text-green-800 mb-1">
                        {advancedMetrics.monetization_opportunities.recommended_strategies.length}
                      </div>
                      <p className="text-sm text-green-700">Стратегий</p>
                    </div>
                    
                    <div className="text-center p-4 bg-gradient-to-br from-blue-50 to-blue-100 rounded-lg border border-blue-200">
                      <Badge className={`
                        ${advancedMetrics.monetization_opportunities.risk_level === 'low' ? 'bg-green-100 text-green-800' :
                          advancedMetrics.monetization_opportunities.risk_level === 'medium' ? 'bg-yellow-100 text-yellow-800' :
                          'bg-red-100 text-red-800'}
                      `}>
                        {advancedMetrics.monetization_opportunities.risk_level === 'low' ? 'Низкий риск' :
                         advancedMetrics.monetization_opportunities.risk_level === 'medium' ? 'Средний риск' :
                         'Высокий риск'}
                      </Badge>
                      <p className="text-sm text-blue-700 mt-2">Уровень риска</p>
                    </div>
                  </div>
                  
                  <div>
                    <h4 className="font-medium mb-3">🚀 Рекомендуемые стратегии монетизации:</h4>
                    <div className="grid md:grid-cols-2 gap-3">
                      {advancedMetrics.monetization_opportunities.recommended_strategies.map((strategy, index) => (
                        <div key={index} className="flex items-center gap-3 p-3 border rounded-lg bg-gray-50">
                          <div className="w-8 h-8 bg-gradient-to-br from-purple-500 to-pink-500 rounded-full flex items-center justify-center">
                            <span className="text-white text-sm font-bold">{index + 1}</span>
                          </div>
                          <span className="text-sm font-medium">{strategy}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              ) : (
                <div className="text-center py-8 text-gray-500">
                  <Diamond className="w-12 h-12 mx-auto mb-2 opacity-50" />
                  <p>Анализируем возможности монетизации...</p>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
