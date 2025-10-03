
import { useState } from 'react';
import { useQuery, useMutation } from '@tanstack/react-query';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Progress } from '@/components/ui/progress';
import { Rocket, TrendingUp, Target, DollarSign, Zap, Crown, BarChart3, CheckCircle2 } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

export default function SmartPromotionHub({ userId }: { userId: string }) {
  const { toast } = useToast();
  const [selectedPlan, setSelectedPlan] = useState<'free' | 'paid'>('free');

  // Анализ платформ
  const { data: analysis, isLoading: analysisLoading } = useQuery({
    queryKey: ['/api/smart-promotion/analyze'],
  });

  // План продвижения
  const { data: promotionPlan, isLoading: planLoading } = useQuery({
    queryKey: ['/api/smart-promotion/generate-plan'],
    enabled: !!analysis,
  });

  // План лидерства
  const { data: leadershipData } = useQuery({
    queryKey: ['/api/smart-promotion/leadership-plan'],
    enabled: !!promotionPlan,
  });

  // Запуск кампании
  const launchCampaign = useMutation({
    mutationFn: async (planType: 'free' | 'paid') => {
      const res = await fetch('/api/smart-promotion/launch', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ planType }),
        credentials: 'include',
      });
      return res.json();
    },
    onSuccess: (data) => {
      toast({
        title: 'Кампания запущена!',
        description: data.message,
      });
    },
  });

  if (analysisLoading || planLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4" />
          <p className="text-muted-foreground">Анализируем ваши платформы и создаем стратегию...</p>
        </div>
      </div>
    );
  }

  const plan = promotionPlan?.plan;
  const leadership = leadershipData?.leadership;

  return (
    <div className="space-y-6">
      {/* Заголовок */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-bold flex items-center gap-2">
            <Rocket className="h-8 w-8 text-primary" />
            Умное Продвижение
          </h2>
          <p className="text-muted-foreground mt-1">
            AI-анализ и стратегия для роста аудитории и лидерства на рынке
          </p>
        </div>
        <Badge variant="outline" className="text-lg px-4 py-2">
          <Crown className="h-5 w-5 mr-2" />
          {analysis?.integrations?.length || 0} платформ подключено
        </Badge>
      </div>

      {/* Анализ платформ */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {analysis?.integrations?.map((integration: any) => (
          <Card key={integration.platform}>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium capitalize">
                {integration.platform}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Подписчики</span>
                  <span className="font-semibold">{integration.analytics?.totalFollowers?.toLocaleString() || 0}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Вовлеченность</span>
                  <span className="font-semibold">{integration.analytics?.engagementRate?.toFixed(1) || 0}%</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Рост</span>
                  <span className="font-semibold text-green-600">+{integration.analytics?.growthRate?.toFixed(1) || 0}%</span>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Планы продвижения */}
      <Tabs value={selectedPlan} onValueChange={(v) => setSelectedPlan(v as 'free' | 'paid')}>
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="free" className="flex items-center gap-2">
            <Zap className="h-4 w-4" />
            Бесплатное продвижение
          </TabsTrigger>
          <TabsTrigger value="paid" className="flex items-center gap-2">
            <DollarSign className="h-4 w-4" />
            Платное продвижение
          </TabsTrigger>
        </TabsList>

        <TabsContent value="free" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <TrendingUp className="h-5 w-5" />
                Бесплатная стратегия роста
              </CardTitle>
              <CardDescription>
                Органическое продвижение через оптимизацию и вовлечение
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <p className="text-sm font-medium mb-2">Ожидаемый рост</p>
                  <div className="text-3xl font-bold text-green-600">+{plan?.free?.expectedGrowth}%</div>
                  <p className="text-xs text-muted-foreground mt-1">{plan?.free?.timeframe}</p>
                </div>
                <div>
                  <p className="text-sm font-medium mb-2">Инвестиции</p>
                  <div className="text-3xl font-bold">$0</div>
                  <p className="text-xs text-muted-foreground mt-1">Только ваше время</p>
                </div>
              </div>

              <div>
                <p className="text-sm font-semibold mb-3">Стратегии:</p>
                <div className="space-y-2">
                  {plan?.free?.strategies?.slice(0, 5).map((strategy: string, i: number) => (
                    <div key={i} className="flex items-start gap-2">
                      <CheckCircle2 className="h-4 w-4 text-green-600 mt-0.5 flex-shrink-0" />
                      <span className="text-sm">{strategy}</span>
                    </div>
                  ))}
                </div>
              </div>

              <Button 
                onClick={() => launchCampaign.mutate('free')}
                disabled={launchCampaign.isPending}
                className="w-full"
                size="lg"
              >
                {launchCampaign.isPending ? 'Запуск...' : 'Запустить бесплатную кампанию'}
              </Button>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="paid" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Rocket className="h-5 w-5" />
                Платная стратегия роста
              </CardTitle>
              <CardDescription>
                Агрессивное продвижение через рекламу и инфлюенсеров
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <p className="text-sm font-medium mb-2">Ожидаемый рост</p>
                  <div className="text-3xl font-bold text-green-600">+{plan?.paid?.expectedGrowth}%</div>
                  <p className="text-xs text-muted-foreground mt-1">{plan?.paid?.timeframe}</p>
                </div>
                <div>
                  <p className="text-sm font-medium mb-2">Бюджет</p>
                  <div className="text-3xl font-bold">${plan?.paid?.budget?.toLocaleString()}</div>
                  <p className="text-xs text-muted-foreground mt-1">Рекомендованный</p>
                </div>
                <div>
                  <p className="text-sm font-medium mb-2">ROI</p>
                  <div className="text-3xl font-bold text-blue-600">{plan?.paid?.roi}x</div>
                  <p className="text-xs text-muted-foreground mt-1">Возврат инвестиций</p>
                </div>
              </div>

              <div>
                <p className="text-sm font-semibold mb-3">Стратегии:</p>
                <div className="space-y-2">
                  {plan?.paid?.strategies?.slice(0, 5).map((strategy: string, i: number) => (
                    <div key={i} className="flex items-start gap-2">
                      <CheckCircle2 className="h-4 w-4 text-blue-600 mt-0.5 flex-shrink-0" />
                      <span className="text-sm">{strategy}</span>
                    </div>
                  ))}
                </div>
              </div>

              <Button 
                onClick={() => launchCampaign.mutate('paid')}
                disabled={launchCampaign.isPending}
                className="w-full"
                size="lg"
                variant="default"
              >
                {launchCampaign.isPending ? 'Запуск...' : `Запустить платную кампанию ($${plan?.paid?.budget})`}
              </Button>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* План лидерства */}
      {leadership && (
        <Card className="border-2 border-amber-500">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Crown className="h-5 w-5 text-amber-500" />
              План достижения лидерства на рынке
            </CardTitle>
            <CardDescription>
              Стратегия для занятия топ-1 позиции в вашей нише
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <p className="text-sm font-medium mb-2">Текущая позиция</p>
                <div className="text-2xl font-bold">#{leadership.currentPosition}</div>
              </div>
              <div>
                <p className="text-sm font-medium mb-2">Цель</p>
                <div className="text-2xl font-bold text-amber-600">#1</div>
              </div>
              <div>
                <p className="text-sm font-medium mb-2">Срок достижения</p>
                <div className="text-2xl font-bold">{leadership.estimatedTime}</div>
              </div>
            </div>

            <div>
              <p className="text-sm font-medium mb-2">Разрыв с лидером</p>
              <Progress value={50} className="h-2" />
              <p className="text-xs text-muted-foreground mt-1">
                {leadership.competitorGap?.toLocaleString()} подписчиков до топ-1
              </p>
            </div>

            <div>
              <p className="text-sm font-semibold mb-3">План действий:</p>
              <div className="space-y-2">
                {leadership.actionPlan?.map((action: string, i: number) => (
                  <div key={i} className="flex items-start gap-2">
                    <Target className="h-4 w-4 text-amber-600 mt-0.5 flex-shrink-0" />
                    <span className="text-sm">{action}</span>
                  </div>
                ))}
              </div>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
