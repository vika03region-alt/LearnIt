
import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { useToast } from '@/hooks/use-toast';
import { Loader2, Rocket, TrendingUp, Users, Zap, Brain, Target } from 'lucide-react';

interface PromotionStats {
  postsScheduled: number;
  dailyPosts: number;
  aiModel: string;
  channel: string;
  followers: number;
  engagementRate: number;
}

export default function TelegramPromotion() {
  const [loading, setLoading] = useState(false);
  const [analyzing, setAnalyzing] = useState(false);
  const [stats, setStats] = useState<PromotionStats>({
    postsScheduled: 3,
    dailyPosts: 3,
    aiModel: 'Grok 2',
    channel: '@IIPRB',
    followers: 0,
    engagementRate: 0,
  });
  const [promotionActive, setPromotionActive] = useState(true);
  const { toast } = useToast();

  const publishNow = async () => {
    setLoading(true);
    try {
      const response = await fetch('/api/telegram/test-post', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
      });

      const result = await response.json();

      if (result.success) {
        toast({
          title: '✅ Пост опубликован!',
          description: `Тема: ${result.topic}`,
        });
      } else {
        throw new Error(result.error);
      }
    } catch (error: any) {
      toast({
        title: '❌ Ошибка публикации',
        description: error.message || 'Не удалось опубликовать пост',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const analyzeChannel = async () => {
    setAnalyzing(true);
    try {
      const response = await fetch('/api/telegram/analyze-channel', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ channelId: '@IIPRB' }),
      });

      const result = await response.json();

      if (result.success) {
        setStats(prev => ({
          ...prev,
          followers: result.subscribers || 0,
          engagementRate: result.engagementRate || 0,
        }));

        toast({
          title: '📊 Анализ завершен',
          description: `Канал: ${result.title || '@IIPRB'}`,
        });
      }
    } catch (error) {
      toast({
        title: '⚠️ Информация',
        description: 'Для полного анализа добавьте бота в канал как администратора',
        variant: 'default',
      });
    } finally {
      setAnalyzing(false);
    }
  };

  const startPromotion = async () => {
    try {
      const response = await fetch('/api/promotion/start', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          strategy: {
            clientId: 'IIPRB_Channel',
            platforms: ['telegram'],
            contentCalendar: [],
            targetMetrics: {
              followerGrowth: 30,
              engagementIncrease: 50,
              reachExpansion: 70,
            },
            budget: {
              aiCredits: 1000,
            },
            adaptiveElements: {
              contentTypes: ['educational', 'practical', 'motivational'],
              postingTimes: [9, 15, 20],
              hashtagSets: [['#AI', '#нейросети', '#продуктивность']],
              targetAudiences: ['психологи', 'коучи', 'преподаватели'],
            },
          },
        }),
      });

      const result = await response.json();

      toast({
        title: '🚀 Продвижение запущено!',
        description: 'Автоматическая система продвижения активирована',
      });

      setPromotionActive(true);
    } catch (error) {
      toast({
        title: '❌ Ошибка',
        description: 'Не удалось запустить продвижение',
        variant: 'destructive',
      });
    }
  };

  return (
    <div className="space-y-6">
      {/* Статус продвижения */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2">
                <Rocket className="w-5 h-5 text-blue-500" />
                Продвижение Telegram канала
              </CardTitle>
              <CardDescription>Автоматическое AI продвижение {stats.channel}</CardDescription>
            </div>
            <Badge variant={promotionActive ? 'default' : 'secondary'}>
              {promotionActive ? '🟢 Активно' : '🟡 Остановлено'}
            </Badge>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Основные метрики */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="text-center p-4 bg-blue-50 dark:bg-blue-950 rounded-lg">
              <div className="text-2xl font-bold text-blue-600">{stats.dailyPosts}</div>
              <div className="text-sm text-muted-foreground">Постов в день</div>
            </div>
            <div className="text-center p-4 bg-green-50 dark:bg-green-950 rounded-lg">
              <div className="text-2xl font-bold text-green-600">{stats.followers}</div>
              <div className="text-sm text-muted-foreground">Подписчики</div>
            </div>
            <div className="text-center p-4 bg-purple-50 dark:bg-purple-950 rounded-lg">
              <div className="text-2xl font-bold text-purple-600">{stats.engagementRate.toFixed(1)}%</div>
              <div className="text-sm text-muted-foreground">Вовлеченность</div>
            </div>
            <div className="text-center p-4 bg-orange-50 dark:bg-orange-950 rounded-lg">
              <div className="text-2xl font-bold text-orange-600">{stats.aiModel}</div>
              <div className="text-sm text-muted-foreground">AI модель</div>
            </div>
          </div>

          {/* Прогресс целей */}
          <div className="space-y-3">
            <div>
              <div className="flex justify-between text-sm mb-1">
                <span>Рост подписчиков (+30% цель)</span>
                <span className="font-medium">12%</span>
              </div>
              <Progress value={40} className="h-2" />
            </div>
            <div>
              <div className="flex justify-between text-sm mb-1">
                <span>Увеличение вовлеченности (+50% цель)</span>
                <span className="font-medium">25%</span>
              </div>
              <Progress value={50} className="h-2" />
            </div>
            <div>
              <div className="flex justify-between text-sm mb-1">
                <span>Расширение охвата (+70% цель)</span>
                <span className="font-medium">35%</span>
              </div>
              <Progress value={50} className="h-2" />
            </div>
          </div>

          {/* Действия */}
          <div className="flex gap-3 pt-4">
            <Button 
              onClick={publishNow} 
              disabled={loading}
              className="flex-1"
            >
              {loading ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Публикация...
                </>
              ) : (
                <>
                  <Zap className="w-4 h-4 mr-2" />
                  Опубликовать сейчас
                </>
              )}
            </Button>
            <Button 
              onClick={analyzeChannel} 
              disabled={analyzing}
              variant="outline"
              className="flex-1"
            >
              {analyzing ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Анализ...
                </>
              ) : (
                <>
                  <Brain className="w-4 h-4 mr-2" />
                  Анализировать канал
                </>
              )}
            </Button>
          </div>

          {!promotionActive && (
            <Button 
              onClick={startPromotion} 
              className="w-full"
              variant="default"
            >
              <Target className="w-4 h-4 mr-2" />
              Запустить продвижение
            </Button>
          )}
        </CardContent>
      </Card>

      {/* Расписание */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <TrendingUp className="w-5 h-5 text-green-500" />
            Расписание автопостинга
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            <div className="flex items-center justify-between p-3 bg-muted rounded-lg">
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
                <span className="font-medium">09:00</span>
                <span className="text-sm text-muted-foreground">Утренний пост</span>
              </div>
              <Badge variant="outline">Ежедневно</Badge>
            </div>
            <div className="flex items-center justify-between p-3 bg-muted rounded-lg">
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 bg-blue-500 rounded-full animate-pulse"></div>
                <span className="font-medium">15:00</span>
                <span className="text-sm text-muted-foreground">Дневной пост</span>
              </div>
              <Badge variant="outline">Ежедневно</Badge>
            </div>
            <div className="flex items-center justify-between p-3 bg-muted rounded-lg">
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 bg-purple-500 rounded-full animate-pulse"></div>
                <span className="font-medium">20:00</span>
                <span className="text-sm text-muted-foreground">Вечерний пост</span>
              </div>
              <Badge variant="outline">Ежедневно</Badge>
            </div>
            <div className="flex items-center justify-between p-3 bg-muted rounded-lg">
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 bg-orange-500 rounded-full animate-pulse"></div>
                <span className="font-medium">12:00</span>
                <span className="text-sm text-muted-foreground">Опрос</span>
              </div>
              <Badge variant="outline">Пн, Чт</Badge>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Последние темы */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Users className="w-5 h-5 text-indigo-500" />
            AI генерирует контент из этих тем
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
            {[
              'Как ChatGPT экономит 5 часов в день',
              'ТОП-5 AI инструментов для продуктивности',
              'Нейросети для психологов',
              'AI в коучинге',
              'Будущее образования с AI',
              'Создаем контент-план с AI за 10 минут',
            ].map((topic, i) => (
              <div key={i} className="p-2 bg-muted rounded text-sm">
                {topic}
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
