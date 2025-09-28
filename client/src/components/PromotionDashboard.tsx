import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useQuery } from '@tanstack/react-query';
import { useToast } from '@/hooks/use-toast';
import {
  TrendingUp,
  Target,
  Users,
  Eye,
  Heart,
  MessageCircle,
  Share2,
  BarChart3,
  Calendar,
  Zap,
  Crown,
  Star,
  Rocket,
  Award,
  Clock,
  CheckCircle,
  AlertCircle
} from 'lucide-react';

interface PromotionResults {
  summary: {
    totalPosts: number;
    avgEngagement: number;
    reachGrowth: number;
    topPerforming: Array<{
      platform: string;
      engagement: number;
      type: string;
    }>;
  };
  recommendations: string[];
  nextSteps: string[];
}

interface MetricCard {
  title: string;
  value: string | number;
  change: string;
  icon: any;
  color: string;
}

export default function PromotionDashboard() {
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [clientData, setClientData] = useState(null);
  const [promotionMetrics, setPromotionMetrics] = useState(null);
  const [strategyStatus, setStrategyStatus] = useState('idle');
  const [realTimeMetrics, setRealTimeMetrics] = useState({
    followers: 0,
    engagement: 0,
    reach: 0,
    growth: 0,
  });

  const initializeLuciferClient = async () => {
    setLoading(true);
    try {
      const response = await fetch('/api/client/init-lucifer', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
      });

      const result = await response.json();

      if (response.ok) {
        setClientData({
          name: 'Lucifer Tradera',
          platforms: ['YouTube', 'TikTok', 'Telegram'],
          status: 'active',
          lastAnalysis: new Date().toISOString(),
          analysis: result.analysis,
          strategy: result.strategy,
        });

        // Загружаем начальные метрики
        await loadPromotionMetrics();

        toast({
          title: "Клиент инициализирован!",
          description: result.message,
        });
      } else {
        throw new Error(result.error);
      }
    } catch (error) {
      toast({
        title: "Ошибка",
        description: "Не удалось инициализировать клиента",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const loadPromotionMetrics = async () => {
    try {
      const response = await fetch('/api/promotion/metrics/Lucifer_tradera');
      const metrics = await response.json();

      if (response.ok) {
        setPromotionMetrics(metrics);
        setRealTimeMetrics({
          followers: metrics.currentPeriod.followers,
          engagement: metrics.currentPeriod.engagement,
          reach: metrics.currentPeriod.reach,
          growth: metrics.growthRate.followers,
        });
      }
    } catch (error) {
      console.error('Ошибка загрузки метрик:', error);
    }
  };

  const startAutomatedPromotion = async () => {
    if (!clientData?.strategy) {
      toast({
        title: "Ошибка",
        description: "Сначала инициализируйте клиента",
        variant: "destructive",
      });
      return;
    }

    setLoading(true);
    setStrategyStatus('running');

    try {
      const response = await fetch('/api/promotion/start', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ strategy: clientData.strategy }),
      });

      const result = await response.json();

      if (response.ok) {
        toast({
          title: "Продвижение запущено!",
          description: result.message,
        });

        // Запускаем обновление метрик каждые 30 секунд
        const interval = setInterval(loadPromotionMetrics, 30000);

        // Останавливаем через 5 минут для демо
        setTimeout(() => {
          clearInterval(interval);
          setStrategyStatus('completed');
        }, 300000);

      } else {
        throw new Error(result.error);
      }
    } catch (error) {
      setStrategyStatus('failed');
      toast({
        title: "Ошибка запуска",
        description: "Не удалось запустить автоматическое продвижение",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const adaptStrategy = async () => {
    if (!promotionMetrics) return;

    setLoading(true);
    try {
      const response = await fetch('/api/promotion/adapt-strategy', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          strategyId: 'lucifer_strategy_1',
          performanceData: promotionMetrics,
        }),
      });

      const result = await response.json();

      if (response.ok) {
        toast({
          title: "Стратегия адаптирована!",
          description: "AI оптимизировал подход на основе текущей производительности",
        });

        // Обновляем данные клиента
        setClientData(prev => ({
          ...prev,
          strategy: result.adaptedStrategy,
        }));
      } else {
        throw new Error(result.error);
      }
    } catch (error) {
      toast({
        title: "Ошибка адаптации",
        description: "Не удалось адаптировать стратегию",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  // Загружаем метрики при монтировании компонента
  useEffect(() => {
    if (clientData) {
      loadPromotionMetrics();
    }
  }, [clientData]);


  // Получение результатов продвижения (устаревшее, используем loadPromotionMetrics)
  const { data: results, isLoading: resultsLoading } = useQuery<PromotionResults>({
    queryKey: ['/api/promotion/results'],
    refetchInterval: 30000, // Обновление каждые 30 секунд
  });

  // Запуск автоматического продвижения (устаревшее, используем startAutomatedPromotion)
  const startPromotion = async () => {
    // Эта функция теперь заглушка, так как startAutomatedPromotion уже реализована
    // и использует более актуальные данные
    startAutomatedPromotion();
  };

  const metricCards: MetricCard[] = [
    {
      title: 'Подписчики',
      value: realTimeMetrics.followers.toLocaleString(),
      change: `+${realTimeMetrics.growth.toFixed(1)}%`,
      icon: Users,
      color: 'text-green-600',
    },
    {
      title: 'Вовлеченность',
      value: `${realTimeMetrics.engagement.toFixed(1)}%`,
      change: `+${(realTimeMetrics.engagement * 0.1).toFixed(1)}%`, // Примерный рост
      icon: Heart,
      color: 'text-red-600',
    },
    {
      title: 'Охват',
      value: realTimeMetrics.reach.toLocaleString(),
      change: `+${(realTimeMetrics.reach * 0.05 / 1000).toFixed(1)}%`, // Примерный рост
      icon: Eye,
      color: 'text-blue-600',
    },
    {
      title: 'Публикаций',
      value: promotionMetrics?.totalPosts || 'N/A',
      change: promotionMetrics?.planCompletion ? `${promotionMetrics.planCompletion}%` : 'N/A',
      icon: Calendar,
      color: 'text-purple-600',
    },
  ];

  return (
    <div className="space-y-6">
      {/* Заголовок */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold bg-gradient-to-r from-blue-600 via-purple-600 to-pink-600 bg-clip-text text-transparent">
            Продвижение Lucifer Tradera
          </h1>
          <p className="text-muted-foreground mt-2">
            Автоматическая система продвижения трейдинг-контента
          </p>
        </div>
        <div className="flex gap-3">
          <Badge variant="outline" className="px-4 py-2 bg-green-50 text-green-700 border-green-200">
            <CheckCircle className="w-4 h-4 mr-2" />
            Система активна
          </Badge>
          <Button
            className="bg-gradient-to-r from-blue-600 to-purple-600 text-white"
            onClick={startAutomatedPromotion}
            disabled={loading || strategyStatus === 'running'}
          >
            <Rocket className="w-4 h-4 mr-2" />
            {strategyStatus === 'running' ? 'В процессе...' : 'Запустить продвижение'}
          </Button>
        </div>
      </div>

      {/* Ключевые метрики */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {metricCards.map((metric, index) => (
          <Card key={index} className="hover:shadow-lg transition-shadow">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground mb-1">{metric.title}</p>
                  <p className="text-2xl font-bold">{metric.value}</p>
                  <p className={`text-sm font-medium mt-1 ${metric.color.includes('green') ? 'text-green-600' : metric.color.includes('red') ? 'text-red-600' : 'text-blue-600'}`}>{metric.change}</p>
                </div>
                <div className={`w-12 h-12 rounded-lg bg-gray-100 flex items-center justify-center`}>
                  <metric.icon className={`w-6 h-6 ${metric.color}`} />
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      <Tabs defaultValue="overview" className="space-y-6">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="overview">Обзор</TabsTrigger>
          <TabsTrigger value="platforms">Платформы</TabsTrigger>
          <TabsTrigger value="content">Контент</TabsTrigger>
          <TabsTrigger value="analytics">Аналитика</TabsTrigger>
        </TabsList>

        {/* Обзор */}
        <TabsContent value="overview" className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Прогресс целей */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Target className="w-5 h-5 text-blue-600" />
                  Прогресс к целям
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span>Подписчики (цель: 5,000)</span>
                    <span className="font-medium">{realTimeMetrics.followers} / 5,000</span>
                  </div>
                  <Progress value={Math.min((realTimeMetrics.followers / 5000) * 100, 100)} className="h-2" />
                </div>

                <div className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span>Вовлеченность (цель: 10%)</span>
                    <span className="font-medium">{realTimeMetrics.engagement.toFixed(1)}%</span>
                  </div>
                  <Progress value={Math.min(realTimeMetrics.engagement, 10)} className="h-2" />
                </div>

                <div className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span>Охват (цель: 50K)</span>
                    <span className="font-medium">{realTimeMetrics.reach.toLocaleString()}</span>
                  </div>
                  <Progress value={Math.min((realTimeMetrics.reach / 50000) * 100, 100)} className="h-2" />
                </div>
              </CardContent>
            </Card>

            {/* Активность по платформам */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <BarChart3 className="w-5 h-5 text-purple-600" />
                  Активность платформ
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex items-center justify-between p-3 bg-red-50 rounded-lg">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 bg-red-500 rounded-lg flex items-center justify-center">
                        <span className="text-white text-sm font-bold">YT</span>
                      </div>
                      <div>
                        <p className="font-medium">YouTube</p>
                        <p className="text-sm text-muted-foreground">4 видео на неделе</p>
                      </div>
                    </div>
                    <Badge className="bg-green-100 text-green-800">Активно</Badge>
                  </div>

                  <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 bg-black rounded-lg flex items-center justify-center">
                        <span className="text-white text-sm font-bold">TT</span>
                      </div>
                      <div>
                        <p className="font-medium">TikTok</p>
                        <p className="text-sm text-muted-foreground">Ежедневно</p>
                      </div>
                    </div>
                    <Badge className="bg-green-100 text-green-800">Активно</Badge>
                  </div>

                  <div className="flex items-center justify-between p-3 bg-blue-50 rounded-lg">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 bg-blue-500 rounded-lg flex items-center justify-center">
                        <span className="text-white text-sm font-bold">TG</span>
                      </div>
                      <div>
                        <p className="font-medium">Telegram</p>
                        <p className="text-sm text-muted-foreground">3-5 постов в день</p>
                      </div>
                    </div>
                    <Badge className="bg-green-100 text-green-800">Активно</Badge>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Рекомендации AI */}
          <Card className="border-amber-200 bg-gradient-to-r from-amber-50 to-yellow-50">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-amber-800">
                <Crown className="w-5 h-5" />
                AI Рекомендации по продвижению
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid md:grid-cols-2 gap-6">
                <div>
                  <h4 className="font-medium text-amber-800 mb-3">🎯 Приоритетные действия:</h4>
                  <ul className="space-y-2">
                    {(clientData?.strategy?.recommendations || results?.recommendations || [
                      'Увеличить частоту постинга в TikTok на 30%',
                      'Сосредоточиться на торговых сигналах в Telegram',
                      'Добавить больше обучающего контента на YouTube',
                      'Оптимизировать время публикации по аналитике'
                    ]).map((rec, index) => (
                      <li key={index} className="flex items-start gap-2 text-sm text-amber-700">
                        <Star className="w-4 h-4 text-amber-500 mt-0.5 flex-shrink-0" />
                        <span>{rec}</span>
                      </li>
                    ))}
                  </ul>
                </div>
                <div>
                  <h4 className="font-medium text-amber-800 mb-3">🚀 Следующие шаги:</h4>
                  <ul className="space-y-2">
                    {(clientData?.strategy?.nextSteps || results?.nextSteps || [
                      'Запустить A/B тест для времени публикации',
                      'Создать серию обучающих видео',
                      'Настроить интерактивные опросы в Stories',
                      'Интегрировать чат-бот в Telegram'
                    ]).map((step, index) => (
                      <li key={index} className="flex items-start gap-2 text-sm text-amber-700">
                        <Award className="w-4 h-4 text-amber-500 mt-0.5 flex-shrink-0" />
                        <span>{step}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Детальная аналитика платформ */}
        <TabsContent value="platforms" className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {/* YouTube */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <div className="w-8 h-8 bg-red-500 rounded-lg flex items-center justify-center">
                    <span className="text-white text-sm font-bold">YT</span>
                  </div>
                  YouTube
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-2 gap-4 text-center">
                  <div>
                    <p className="text-2xl font-bold">1,245</p>
                    <p className="text-sm text-muted-foreground">Подписчики</p>
                  </div>
                  <div>
                    <p className="text-2xl font-bold">890</p>
                    <p className="text-sm text-muted-foreground">Ср. просмотры</p>
                  </div>
                </div>
                <div className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span>Рост подписчиков</span>
                    <span className="text-green-600 font-medium">+12.3%</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span>Вовлеченность</span>
                    <span className="font-medium">4.2%</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span>Видео в неделю</span>
                    <span className="font-medium">4-5</span>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* TikTok */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <div className="w-8 h-8 bg-black rounded-lg flex items-center justify-center">
                    <span className="text-white text-sm font-bold">TT</span>
                  </div>
                  TikTok
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-2 gap-4 text-center">
                  <div>
                    <p className="text-2xl font-bold">890</p>
                    <p className="text-sm text-muted-foreground">Подписчики</p>
                  </div>
                  <div>
                    <p className="text-2xl font-bold">1,280</p>
                    <p className="text-sm text-muted-foreground">Ср. просмотры</p>
                  </div>
                </div>
                <div className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span>Рост подписчиков</span>
                    <span className="text-green-600 font-medium">+28.7%</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span>Вовлеченность</span>
                    <span className="font-medium">8.9%</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span>Видео в день</span>
                    <span className="font-medium">1-2</span>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Telegram */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <div className="w-8 h-8 bg-blue-500 rounded-lg flex items-center justify-center">
                    <span className="text-white text-sm font-bold">TG</span>
                  </div>
                  Telegram
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-2 gap-4 text-center">
                  <div>
                    <p className="text-2xl font-bold">695</p>
                    <p className="text-sm text-muted-foreground">Участники</p>
                  </div>
                  <div>
                    <p className="text-2xl font-bold">142</p>
                    <p className="text-sm text-muted-foreground">Ср. охват</p>
                  </div>
                </div>
                <div className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span>Рост участников</span>
                    <span className="text-green-600 font-medium">+15.8%</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span>Читаемость</span>
                    <span className="font-medium">20.4%</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span>Постов в день</span>
                    <span className="font-medium">3-5</span>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* Контент-стратегия */}
        <TabsContent value="content" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Calendar className="w-5 h-5 text-purple-600" />
                Контент-календарь на неделю
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-7 gap-4">
                {['Пн', 'Вт', 'Ср', 'Чт', 'Пт', 'Сб', 'Вс'].map((day, index) => (
                  <div key={day} className="space-y-2">
                    <h4 className="font-medium text-center">{day}</h4>
                    <div className="space-y-2">
                      {index % 2 === 0 && (
                        <div className="p-2 bg-red-50 rounded text-xs text-center">
                          <div className="font-medium">YouTube</div>
                          <div className="text-muted-foreground">Анализ рынка</div>
                        </div>
                      )}
                      <div className="p-2 bg-gray-50 rounded text-xs text-center">
                        <div className="font-medium">TikTok</div>
                        <div className="text-muted-foreground">Сигнал дня</div>
                      </div>
                      <div className="p-2 bg-blue-50 rounded text-xs text-center">
                        <div className="font-medium">Telegram</div>
                        <div className="text-muted-foreground">3 поста</div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Детальная аналитика */}
        <TabsContent value="analytics" className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle>Топ-контент за неделю</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {(results?.summary.topPerforming || [
                    { platform: 'TikTok', engagement: 892, type: 'Сигнал EUR/USD' },
                    { platform: 'YouTube', engagement: 567, type: 'Урок технического анализа' },
                    { platform: 'Telegram', engagement: 234, type: 'Разбор сделки' }
                  ]).map((content, index) => (
                    <div key={index} className="flex items-center justify-between p-3 bg-muted rounded-lg">
                      <div>
                        <p className="font-medium">{content.type}</p>
                        <p className="text-sm text-muted-foreground">{content.platform}</p>
                      </div>
                      <div className="text-right">
                        <p className="font-bold">{content.engagement}</p>
                        <p className="text-sm text-muted-foreground">взаимодействий</p>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Эффективность времени</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  <div className="flex justify-between items-center p-2 bg-green-50 rounded">
                    <span className="text-sm">09:00 - Утренний анализ</span>
                    <Badge className="bg-green-100 text-green-800">89% CTR</Badge>
                  </div>
                  <div className="flex justify-between items-center p-2 bg-blue-50 rounded">
                    <span className="text-sm">14:00 - Дневные сигналы</span>
                    <Badge className="bg-blue-100 text-blue-800">76% CTR</Badge>
                  </div>
                  <div className="flex justify-between items-center p-2 bg-purple-50 rounded">
                    <span className="text-sm">19:00 - Обзор дня</span>
                    <Badge className="bg-purple-100 text-purple-800">82% CTR</Badge>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}
</replit_final_file>