
import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Button } from './ui/button';
import { Badge } from './ui/badge';
import { Progress } from './ui/progress';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from './ui/tabs';
import { Alert, AlertDescription } from './ui/alert';
import { 
  MessageCircle, 
  Users, 
  TrendingUp, 
  Zap, 
  Target,
  Eye,
  Share2,
  BarChart3,
  Send,
  Download,
  CheckCircle,
  AlertTriangle,
  Clock
} from 'lucide-react';
import { useToast } from '../hooks/use-toast';

interface ChannelData {
  channelId: string;
  title: string;
  subscribers: number;
  posts: number;
  engagement: number;
}

interface TestResults {
  contentGenerated: string[];
  viralScore: number;
  expectedGrowth: {
    subscribers: number;
    engagement: number;
    reach: number;
  };
  recommendations: string[];
}

export function TelegramTestDashboard() {
  const [channelUrl, setChannelUrl] = useState('https://t.me/IIPRB');
  const [channelData, setChannelData] = useState<ChannelData | null>(null);
  const [testResults, setTestResults] = useState<TestResults | null>(null);
  const [loading, setLoading] = useState<string | null>(null);
  const [generatedContent, setGeneratedContent] = useState<string[]>([]);
  const [secretsStatus, setSecretsStatus] = useState<{telegram: boolean, channel: boolean, openai: boolean, grok: boolean, aiProvider: string}>({ 
    telegram: false, 
    channel: false, 
    openai: false, 
    grok: false,
    aiProvider: 'openai'
  });
  const { toast } = useToast();

  // Проверка секретов при загрузке
  useEffect(() => {
    checkSecretsStatus();
  }, []);

  const checkSecretsStatus = async () => {
    try {
      const response = await fetch('/api/telegram/check-secrets');
      const status = await response.json();
      setSecretsStatus(status);
    } catch (error) {
      console.error('Ошибка проверки секретов:', error);
    }
  };

  const analyzeChannel = async () => {
    setLoading('analyzing');
    try {
      const response = await fetch('/api/telegram/analyze-channel', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ channelUrl }),
      });

      const result = await response.json();

      if (response.ok) {
        setChannelData(result.channelData);
        toast({
          title: "Канал проанализирован!",
          description: `Найдено ${result.channelData.subscribers} подписчиков`,
        });
      } else {
        throw new Error(result.error);
      }
    } catch (error) {
      toast({
        title: "Ошибка анализа",
        description: "Не удалось проанализировать канал",
        variant: "destructive",
      });
    } finally {
      setLoading(null);
    }
  };

  const runTestCampaign = async () => {
    if (!channelData) {
      toast({
        title: "Ошибка",
        description: "Сначала проанализируйте канал",
        variant: "destructive",
      });
      return;
    }

    setLoading('testing');
    try {
      const response = await fetch('/api/telegram/run-test-campaign', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
      });

      const result = await response.json();

      if (response.ok) {
        setTestResults(result.results);
        toast({
          title: "Тестовая кампания запущена!",
          description: `Опубликовано ${result.posting.posted} постов`,
        });
      } else {
        throw new Error(result.error);
      }
    } catch (error) {
      toast({
        title: "Ошибка кампании",
        description: "Не удалось запустить тестовую кампанию",
        variant: "destructive",
      });
    } finally {
      setLoading(null);
    }
  };

  const generateContent = async (contentType: string) => {
    setLoading('generating');
    try {
      const response = await fetch('/api/telegram/generate-content', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ contentType, count: 5 }),
      });

      const result = await response.json();

      if (response.ok) {
        setGeneratedContent(result.content);
        toast({
          title: "Контент сгенерирован!",
          description: `Создано ${result.content.length} постов`,
        });
      } else {
        throw new Error(result.error);
      }
    } catch (error) {
      toast({
        title: "Ошибка генерации",
        description: "Не удалось сгенерировать контент",
        variant: "destructive",
      });
    } finally {
      setLoading(null);
    }
  };

  const exportReport = async () => {
    if (!testResults) {
      toast({
        title: "Ошибка",
        description: "Нет данных для экспорта",
        variant: "destructive",
      });
      return;
    }

    try {
      const response = await fetch('/api/telegram/export-report', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ testResults }),
      });

      const result = await response.json();

      if (response.ok) {
        // Создаем файл для скачивания
        const blob = new Blob([result.report], { type: 'text/plain' });
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `telegram_test_report_${new Date().toISOString().split('T')[0]}.txt`;
        a.click();
        window.URL.revokeObjectURL(url);

        toast({
          title: "Отчет экспортирован!",
          description: "Файл загружен в папку Downloads",
        });
      } else {
        throw new Error(result.error);
      }
    } catch (error) {
      toast({
        title: "Ошибка экспорта",
        description: "Не удалось экспортировать отчет",
        variant: "destructive",
      });
    }
  };

  return (
    <div className="space-y-6">
      {/* Заголовок */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold flex items-center gap-2">
            <MessageCircle className="w-6 h-6 text-blue-600" />
            Тестирование Telegram Продвижения
          </h2>
          <p className="text-gray-600">Тест автоматического продвижения для канала IIPRB</p>
        </div>
        <div className="flex items-center gap-2">
          <Badge className={secretsStatus.telegram ? "bg-green-100 text-green-800" : "bg-red-100 text-red-800"}>
            Bot: {secretsStatus.telegram ? "✓" : "✗"}
          </Badge>
          <Badge className={secretsStatus.channel ? "bg-green-100 text-green-800" : "bg-red-100 text-red-800"}>
            Channel: {secretsStatus.channel ? "✓" : "✗"}
          </Badge>
          <Badge className={secretsStatus.openai ? "bg-green-100 text-green-800" : "bg-red-100 text-red-800"}>
            OpenAI: {secretsStatus.openai ? "✓" : "✗"}
          </Badge>
          <Badge className={secretsStatus.grok ? "bg-green-100 text-green-800" : "bg-red-100 text-red-800"}>
            Grok: {secretsStatus.grok ? "✓" : "✗"}
          </Badge>
          <Badge className="bg-blue-100 text-blue-800">
            Provider: {secretsStatus.aiProvider}
          </Badge>
          <Badge className="bg-blue-100 text-blue-800">
            <MessageCircle className="w-4 h-4 mr-1" />
            Telegram Test
          </Badge>
        </div>
      </div>

      {/* Ввод канала и анализ */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Target className="w-5 h-5 text-blue-600" />
            Анализ канала
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="channel-url">URL канала Telegram</Label>
            <div className="flex gap-2">
              <Input
                id="channel-url"
                value={channelUrl}
                onChange={(e) => setChannelUrl(e.target.value)}
                placeholder="https://t.me/IIPRB"
                className="flex-1"
              />
              <Button 
                onClick={analyzeChannel}
                disabled={loading === 'analyzing'}
                className="bg-blue-600 hover:bg-blue-700"
              >
                {loading === 'analyzing' ? (
                  <>
                    <Clock className="w-4 h-4 mr-2 animate-spin" />
                    Анализ...
                  </>
                ) : (
                  <>
                    <BarChart3 className="w-4 h-4 mr-2" />
                    Анализировать
                  </>
                )}
              </Button>
            </div>
          </div>

          {channelData && (
            <div className="grid md:grid-cols-4 gap-4 p-4 bg-blue-50 rounded-lg">
              <div className="text-center">
                <div className="text-2xl font-bold text-blue-900">{channelData.subscribers}</div>
                <div className="text-sm text-blue-600">Подписчики</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-blue-900">{channelData.posts}</div>
                <div className="text-sm text-blue-600">Публикации</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-blue-900">{channelData.engagement.toFixed(1)}%</div>
                <div className="text-sm text-blue-600">Вовлеченность</div>
              </div>
              <div className="text-center">
                <Button 
                  onClick={runTestCampaign}
                  disabled={loading === 'testing'}
                  className="bg-green-600 hover:bg-green-700"
                >
                  {loading === 'testing' ? (
                    <>
                      <Clock className="w-4 h-4 mr-2 animate-spin" />
                      Тест...
                    </>
                  ) : (
                    <>
                      <Zap className="w-4 h-4 mr-2" />
                      Запустить тест
                    </>
                  )}
                </Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Результаты тестирования */}
      {testResults && (
        <Tabs defaultValue="results" className="space-y-4">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="results">Результаты</TabsTrigger>
            <TabsTrigger value="content">Контент</TabsTrigger>
            <TabsTrigger value="recommendations">Рекомендации</TabsTrigger>
          </TabsList>

          <TabsContent value="results" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <TrendingUp className="w-5 h-5 text-green-600" />
                  Прогнозируемые результаты
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid md:grid-cols-3 gap-6">
                  <div className="text-center p-4 bg-green-50 rounded-lg">
                    <Users className="w-8 h-8 mx-auto mb-2 text-green-600" />
                    <div className="text-2xl font-bold text-green-900">+{testResults.expectedGrowth.subscribers}</div>
                    <div className="text-sm text-green-600">Новых подписчиков</div>
                  </div>
                  <div className="text-center p-4 bg-blue-50 rounded-lg">
                    <TrendingUp className="w-8 h-8 mx-auto mb-2 text-blue-600" />
                    <div className="text-2xl font-bold text-blue-900">+{testResults.expectedGrowth.engagement}%</div>
                    <div className="text-sm text-blue-600">Рост вовлеченности</div>
                  </div>
                  <div className="text-center p-4 bg-purple-50 rounded-lg">
                    <Eye className="w-8 h-8 mx-auto mb-2 text-purple-600" />
                    <div className="text-2xl font-bold text-purple-900">{testResults.expectedGrowth.reach.toLocaleString()}</div>
                    <div className="text-sm text-purple-600">Ожидаемый охват</div>
                  </div>
                </div>

                <div className="mt-6">
                  <div className="flex justify-between text-sm mb-2">
                    <span>Вирусный рейтинг контента</span>
                    <span className="font-bold">{testResults.viralScore.toFixed(1)}/100</span>
                  </div>
                  <Progress value={testResults.viralScore} className="h-3" />
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="content" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Send className="w-5 h-5 text-blue-600" />
                  Сгенерированный контент ({testResults.contentGenerated.length})
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {testResults.contentGenerated.map((content, index) => (
                    <div key={index} className="p-4 bg-gray-50 rounded-lg border">
                      <div className="flex justify-between items-start mb-2">
                        <Badge variant="outline">Пост #{index + 1}</Badge>
                        <Button size="sm" variant="outline">
                          <Share2 className="w-4 h-4 mr-1" />
                          Скопировать
                        </Button>
                      </div>
                      <p className="text-sm whitespace-pre-wrap">{content}</p>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="recommendations" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Target className="w-5 h-5 text-amber-600" />
                  Рекомендации по улучшению
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {testResults.recommendations.map((rec, index) => (
                    <div key={index} className="flex items-start gap-3 p-3 bg-amber-50 rounded-lg">
                      <CheckCircle className="w-5 h-5 text-amber-600 mt-0.5 flex-shrink-0" />
                      <span className="text-sm">{rec}</span>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      )}

      {/* Генерация дополнительного контента */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Zap className="w-5 h-5 text-purple-600" />
            Генерация дополнительного контента
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid md:grid-cols-3 gap-4">
            <Button 
              onClick={() => generateContent('trading_signal')}
              disabled={loading === 'generating'}
              variant="outline"
              className="h-20 flex-col gap-2"
            >
              <Target className="w-6 h-6 text-green-600" />
              <span>Торговые сигналы</span>
            </Button>
            <Button 
              onClick={() => generateContent('market_analysis')}
              disabled={loading === 'generating'}
              variant="outline"
              className="h-20 flex-col gap-2"
            >
              <BarChart3 className="w-6 h-6 text-blue-600" />
              <span>Анализ рынка</span>
            </Button>
            <Button 
              onClick={() => generateContent('educational')}
              disabled={loading === 'generating'}
              variant="outline"
              className="h-20 flex-col gap-2"
            >
              <Users className="w-6 h-6 text-purple-600" />
              <span>Обучающий</span>
            </Button>
          </div>

          {generatedContent.length > 0 && (
            <div className="mt-6 space-y-3">
              <h4 className="font-medium">Дополнительно сгенерированный контент:</h4>
              {generatedContent.map((content, index) => (
                <div key={index} className="p-3 bg-gray-50 rounded border">
                  <p className="text-sm">{content}</p>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Экспорт отчета */}
      {testResults && (
        <Card className="border-green-200 bg-gradient-to-r from-green-50 to-emerald-50">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="font-medium text-green-900 mb-1">Тестирование завершено!</h3>
                <p className="text-sm text-green-700">
                  Экспортируйте полный отчет о результатах тестовой кампании
                </p>
              </div>
              <Button onClick={exportReport} className="bg-green-600 hover:bg-green-700">
                <Download className="w-4 h-4 mr-2" />
                Экспортировать отчет
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Предупреждения */}
      {(!secretsStatus.telegram || !secretsStatus.channel || (!secretsStatus.openai && !secretsStatus.grok)) && (
        <Alert className="border-amber-200 bg-amber-50">
          <AlertTriangle className="h-4 w-4 text-amber-600" />
          <AlertDescription className="text-amber-800">
            <strong>Требуется настройка:</strong>
            {(!secretsStatus.openai && !secretsStatus.grok) && " AI API Key (OpenAI или Grok)"}
            {((!secretsStatus.openai && !secretsStatus.grok) && (!secretsStatus.telegram || !secretsStatus.channel)) && ","}
            {!secretsStatus.telegram && " Telegram Bot Token"}
            {(!secretsStatus.telegram && !secretsStatus.channel) && " и"}
            {!secretsStatus.channel && " Channel ID"}
            . Проверьте настройки секретов в Replit.
            {(!secretsStatus.openai && !secretsStatus.grok) && (
              <div className="mt-2 text-sm">
                💡 Добавьте GROK_API_KEY для использования Grok AI или OPENAI_API_KEY для OpenAI GPT.
              </div>
            )}
          </AlertDescription>
        </Alert>
      )}
      
      <Alert>
        <AlertTriangle className="h-4 w-4" />
        <AlertDescription>
          Это тестовая симуляция продвижения. Реальная публикация в Telegram требует подключения через Telegram Bot API.
        </AlertDescription>
      </Alert>
    </div>
  );
}
