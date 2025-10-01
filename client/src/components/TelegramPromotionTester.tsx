
import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { useToast } from '@/hooks/use-toast';
import {
  Send,
  Users,
  TrendingUp,
  Target,
  Zap,
  Clock,
  BarChart3,
  CheckCircle,
  Loader2,
  MessageCircle,
  Eye,
  Heart
} from 'lucide-react';

interface TelegramTestResult {
  groupName: string;
  analysis: {
    estimatedMembers: number;
    category: string;
    activity: string;
    growthPotential: number;
    targetAudience: string;
  };
  strategy: {
    name: string;
    expectedGrowth: number;
    timeframe: string;
    tactics: string[];
    viralElements: string[];
  };
  testResults: {
    executed: string[];
    scheduled: string[];
    viralContent: string[];
    analytics: {
      estimatedReach: number;
      expectedGrowth: number;
      engagementPrediction: number;
      viralPotential: number;
      recommendedActions: string[];
    };
  };
}

export default function TelegramPromotionTester() {
  const { toast } = useToast();
  const [telegramUrl, setTelegramUrl] = useState('https://t.me/IIPRB');
  const [loading, setLoading] = useState(false);
  const [testResult, setTestResult] = useState<TelegramTestResult | null>(null);

  const runTest = async () => {
    if (!telegramUrl.includes('t.me/')) {
      toast({
        title: "Ошибка",
        description: "Пожалуйста, введите корректную ссылку на Telegram группу",
        variant: "destructive",
      });
      return;
    }

    setLoading(true);
    try {
      const response = await fetch('/api/promotion/test-telegram', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ telegramUrl }),
      });

      const result = await response.json();

      if (response.ok) {
        setTestResult(result);
        toast({
          title: "Тест завершен успешно!",
          description: `Проанализирована группа: ${result.groupName}`,
        });
      } else {
        throw new Error(result.error);
      }
    } catch (error) {
      toast({
        title: "Ошибка тестирования",
        description: "Не удалось провести тест продвижения",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const getActivityColor = (activity: string) => {
    switch (activity) {
      case 'high': return 'bg-green-100 text-green-800';
      case 'medium': return 'bg-yellow-100 text-yellow-800';
      case 'low': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  return (
    <div className="space-y-6">
      {/* Заголовок и форма тестирования */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Send className="w-5 h-5 text-blue-600" />
            Тестирование продвижения Telegram группы
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <Label htmlFor="telegram-url">Ссылка на Telegram группу</Label>
            <Input
              id="telegram-url"
              value={telegramUrl}
              onChange={(e) => setTelegramUrl(e.target.value)}
              placeholder="https://t.me/your_group"
              className="mt-2"
            />
          </div>
          
          <Button onClick={runTest} disabled={loading} className="w-full">
            {loading ? (
              <Loader2 className="w-4 h-4 animate-spin mr-2" />
            ) : (
              <Zap className="w-4 h-4 mr-2" />
            )}
            {loading ? 'Тестирование...' : 'Запустить тест продвижения'}
          </Button>
        </CardContent>
      </Card>

      {/* Результаты тестирования */}
      {testResult && (
        <>
          {/* Анализ группы */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <BarChart3 className="w-5 h-5 text-purple-600" />
                Анализ группы: {testResult.groupName}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                <div className="text-center p-4 bg-blue-50 rounded-lg">
                  <Users className="w-8 h-8 text-blue-600 mx-auto mb-2" />
                  <div className="text-2xl font-bold text-blue-900">
                    {testResult.analysis.estimatedMembers.toLocaleString()}
                  </div>
                  <div className="text-sm text-blue-700">Участников</div>
                </div>

                <div className="text-center p-4 bg-green-50 rounded-lg">
                  <TrendingUp className="w-8 h-8 text-green-600 mx-auto mb-2" />
                  <div className="text-2xl font-bold text-green-900">
                    {testResult.analysis.growthPotential}%
                  </div>
                  <div className="text-sm text-green-700">Потенциал роста</div>
                </div>

                <div className="text-center p-4 bg-purple-50 rounded-lg">
                  <Target className="w-8 h-8 text-purple-600 mx-auto mb-2" />
                  <div className="text-lg font-bold text-purple-900 capitalize">
                    {testResult.analysis.category}
                  </div>
                  <div className="text-sm text-purple-700">Категория</div>
                </div>
              </div>

              <div className="mt-4 flex items-center justify-between">
                <div>
                  <span className="text-sm text-muted-foreground">Активность группы:</span>
                  <Badge className={`ml-2 ${getActivityColor(testResult.analysis.activity)}`}>
                    {testResult.analysis.activity.toUpperCase()}
                  </Badge>
                </div>
                <div>
                  <span className="text-sm text-muted-foreground">Аудитория:</span>
                  <Badge variant="outline" className="ml-2">
                    {testResult.analysis.targetAudience}
                  </Badge>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Стратегия продвижения */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Target className="w-5 h-5 text-green-600" />
                Стратегия продвижения
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <h4 className="font-medium mb-2">Ожидаемый рост:</h4>
                  <div className="flex items-center gap-2">
                    <Progress value={testResult.strategy.expectedGrowth} className="flex-1" />
                    <span className="text-sm font-medium">{testResult.strategy.expectedGrowth}%</span>
                  </div>
                </div>
                <div>
                  <h4 className="font-medium mb-2">Временные рамки:</h4>
                  <div className="flex items-center gap-2">
                    <Clock className="w-4 h-4 text-muted-foreground" />
                    <span className="text-sm">{testResult.strategy.timeframe}</span>
                  </div>
                </div>
              </div>

              <div>
                <h4 className="font-medium mb-3">Тактики продвижения:</h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                  {testResult.strategy.tactics.map((tactic, index) => (
                    <div key={index} className="flex items-center gap-2 p-2 bg-muted rounded">
                      <CheckCircle className="w-4 h-4 text-green-600" />
                      <span className="text-sm">{tactic}</span>
                    </div>
                  ))}
                </div>
              </div>

              <div>
                <h4 className="font-medium mb-3">Вирусные элементы:</h4>
                <div className="flex flex-wrap gap-2">
                  {testResult.strategy.viralElements.map((element, index) => (
                    <Badge key={index} variant="secondary">
                      {element}
                    </Badge>
                  ))}
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Результаты выполнения */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Zap className="w-5 h-5 text-orange-600" />
                Результаты тестирования
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="text-center p-4 bg-orange-50 rounded-lg">
                  <Eye className="w-8 h-8 text-orange-600 mx-auto mb-2" />
                  <div className="text-2xl font-bold text-orange-900">
                    {testResult.testResults.analytics.estimatedReach.toLocaleString()}
                  </div>
                  <div className="text-sm text-orange-700">Ожидаемый охват</div>
                </div>

                <div className="text-center p-4 bg-pink-50 rounded-lg">
                  <Heart className="w-8 h-8 text-pink-600 mx-auto mb-2" />
                  <div className="text-2xl font-bold text-pink-900">
                    {testResult.testResults.analytics.engagementPrediction}%
                  </div>
                  <div className="text-sm text-pink-700">Прогноз вовлеченности</div>
                </div>

                <div className="text-center p-4 bg-violet-50 rounded-lg">
                  <Zap className="w-8 h-8 text-violet-600 mx-auto mb-2" />
                  <div className="text-2xl font-bold text-violet-900">
                    {testResult.testResults.analytics.viralPotential}%
                  </div>
                  <div className="text-sm text-violet-700">Вирусный потенциал</div>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <h4 className="font-medium mb-3 text-green-800">Выполненные действия:</h4>
                  <div className="space-y-2">
                    {testResult.testResults.executed.map((action, index) => (
                      <div key={index} className="flex items-center gap-2 text-sm">
                        <CheckCircle className="w-4 h-4 text-green-600" />
                        <span>{action}</span>
                      </div>
                    ))}
                  </div>
                </div>

                <div>
                  <h4 className="font-medium mb-3 text-blue-800">Запланированный контент:</h4>
                  <div className="space-y-2">
                    {testResult.testResults.scheduled.slice(0, 4).map((content, index) => (
                      <div key={index} className="flex items-center gap-2 text-sm">
                        <Clock className="w-4 h-4 text-blue-600" />
                        <span>{content}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              {/* Вирусный контент */}
              {testResult.testResults.viralContent.length > 0 && (
                <div>
                  <h4 className="font-medium mb-3 text-purple-800">Создан вирусный контент:</h4>
                  <div className="space-y-3">
                    {testResult.testResults.viralContent.map((content, index) => (
                      <div key={index} className="p-3 bg-purple-50 rounded-lg border border-purple-200">
                        <pre className="whitespace-pre-wrap text-sm text-purple-900">{content}</pre>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Рекомендации */}
              <Alert>
                <TrendingUp className="h-4 w-4" />
                <AlertDescription>
                  <strong>Рекомендации для улучшения:</strong>
                  <ul className="mt-2 space-y-1">
                    {testResult.testResults.analytics.recommendedActions.map((action, index) => (
                      <li key={index} className="text-sm">• {action}</li>
                    ))}
                  </ul>
                </AlertDescription>
              </Alert>
            </CardContent>
          </Card>
        </>
      )}
    </div>
  );
}
