
import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Button } from './ui/button';
import { Badge } from './ui/badge';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { Textarea } from './ui/textarea';
import { Tabs, TabsContent, TabsList, TabsTrigger } from './ui/tabs';
import { Alert, AlertDescription } from './ui/alert';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select';
import { 
  Brain, 
  Zap, 
  TrendingUp, 
  MessageSquare,
  BarChart3,
  Sparkles,
  CheckCircle,
  AlertTriangle,
  Copy,
  Download,
  RefreshCw,
  Cpu
} from 'lucide-react';
import { useToast } from '../hooks/use-toast';

interface GrokStatus {
  available: boolean;
  model: string;
  features: string[];
}

interface GrokResponse {
  content: string;
  tokensUsed: number;
  cost: number;
  provider: string;
  message?: string;
}

export function GrokTestDashboard() {
  const [grokStatus, setGrokStatus] = useState<GrokStatus | null>(null);
  const [loading, setLoading] = useState<string | null>(null);
  const [prompt, setPrompt] = useState('');
  const [systemPrompt, setSystemPrompt] = useState('');
  const [response, setResponse] = useState<GrokResponse | null>(null);
  const [contentType, setContentType] = useState('general');
  const [platform, setPlatform] = useState('instagram');
  const [niche, setNiche] = useState('trading');
  const [trend, setTrend] = useState('');
  const [markets, setMarkets] = useState('BTC, ETH, EURUSD');
  const [timeframe, setTimeframe] = useState('24h');
  const { toast } = useToast();

  useEffect(() => {
    checkGrokStatus();
  }, []);

  const checkGrokStatus = async () => {
    try {
      const response = await fetch('/api/grok/status');
      const status = await response.json();
      setGrokStatus(status);
      
      if (!status.available) {
        toast({
          title: "Grok API недоступен",
          description: "Добавьте GROK_API_KEY в секреты Replit",
          variant: "destructive",
        });
      } else {
        toast({
          title: "Grok AI готов к работе!",
          description: `Модель: ${status.model}`,
        });
      }
    } catch (error) {
      console.error('Ошибка проверки статуса Grok:', error);
      setGrokStatus({ available: false, model: 'unavailable', features: [] });
      toast({
        title: "Ошибка подключения",
        description: "Не удалось проверить статус Grok API",
        variant: "destructive",
      });
    }
  };

  const generateContent = async () => {
    if (!prompt.trim()) {
      toast({
        title: "Ошибка",
        description: "Введите промпт для генерации",
        variant: "destructive",
      });
      return;
    }

    setLoading('generating');
    try {
      const response = await fetch('/api/grok/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          prompt: prompt.trim(), 
          contentType, 
          systemPrompt: systemPrompt.trim() || undefined 
        }),
      });

      const result = await response.json();

      if (response.ok) {
        setResponse(result);
        toast({
          title: "Контент сгенерирован!",
          description: `Использовано ${result.tokensUsed} токенов`,
        });
      } else {
        throw new Error(result.error || result.details);
      }
    } catch (error) {
      toast({
        title: "Ошибка генерации",
        description: error instanceof Error ? error.message : "Не удалось сгенерировать контент",
        variant: "destructive",
      });
    } finally {
      setLoading(null);
    }
  };

  const generateTradingContent = async () => {
    if (!prompt.trim()) {
      toast({
        title: "Ошибка",
        description: "Введите описание для торгового контента",
        variant: "destructive",
      });
      return;
    }

    setLoading('trading');
    try {
      const response = await fetch('/api/grok/trading-content', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          contentType, 
          prompt: prompt.trim()
        }),
      });

      const result = await response.json();

      if (response.ok) {
        setResponse(result);
        toast({
          title: "Торговый контент создан!",
          description: `Тип: ${contentType}`,
        });
      } else {
        throw new Error(result.error);
      }
    } catch (error) {
      toast({
        title: "Ошибка создания",
        description: "Не удалось создать торговый контент",
        variant: "destructive",
      });
    } finally {
      setLoading(null);
    }
  };

  const analyzeMarketSentiment = async () => {
    setLoading('sentiment');
    try {
      const marketArray = markets.split(',').map(m => m.trim()).filter(Boolean);
      
      const response = await fetch('/api/grok/market-sentiment', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          markets: marketArray, 
          timeframe 
        }),
      });

      const result = await response.json();

      if (response.ok) {
        setResponse(result);
        toast({
          title: "Анализ завершен!",
          description: `Проанализированы рынки: ${marketArray.join(', ')}`,
        });
      } else {
        throw new Error(result.error);
      }
    } catch (error) {
      toast({
        title: "Ошибка анализа",
        description: "Не удалось проанализировать рыночное настроение",
        variant: "destructive",
      });
    } finally {
      setLoading(null);
    }
  };

  const generateViralContent = async () => {
    if (!trend.trim()) {
      toast({
        title: "Ошибка",
        description: "Введите актуальный тренд",
        variant: "destructive",
      });
      return;
    }

    setLoading('viral');
    try {
      const response = await fetch('/api/grok/viral-content', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          platform, 
          niche, 
          trend: trend.trim()
        }),
      });

      const result = await response.json();

      if (response.ok) {
        setResponse(result);
        toast({
          title: "Вирусный контент готов!",
          description: `Создан для ${platform}`,
        });
      } else {
        throw new Error(result.error);
      }
    } catch (error) {
      toast({
        title: "Ошибка создания",
        description: "Не удалось создать вирусный контент",
        variant: "destructive",
      });
    } finally {
      setLoading(null);
    }
  };

  const testGrokConnection = async () => {
    setLoading('testing-connection');
    try {
      // Отправляем простой тестовый запрос к Grok
      const response = await fetch('/api/grok/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          prompt: "Привет! Это тест подключения. Ответь кратко, что ты Grok AI от xAI.",
          contentType: 'general'
        }),
      });

      const result = await response.json();

      if (response.ok) {
        setResponse(result);
        toast({
          title: "✅ Подключение успешно!",
          description: `Grok AI отвечает. Использовано ${result.tokensUsed} токенов.`,
        });
      } else {
        throw new Error(result.error || result.details);
      }
    } catch (error) {
      toast({
        title: "❌ Ошибка подключения",
        description: error instanceof Error ? error.message : "Не удалось подключиться к Grok API",
        variant: "destructive",
      });
    } finally {
      setLoading(null);
    }
  };

  const compareWithAI = async () => {
    if (!prompt.trim()) {
      toast({
        title: "Ошибка",
        description: "Введите промпт для сравнения",
        variant: "destructive",
      });
      return;
    }

    setLoading('comparing');
    try {
      const response = await fetch('/api/grok/compare', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ prompt: prompt.trim() }),
      });

      const result = await response.json();

      if (response.ok) {
        setResponse({
          ...result.grokResponse,
          content: `${result.grokResponse.content}\n\n--- СРАВНЕНИЕ ---\n${result.comparison}`,
          provider: result.provider,
          message: result.message
        });
        toast({
          title: "Сравнение готово!",
          description: "Анализ различий между AI моделями",
        });
      } else {
        throw new Error(result.error);
      }
    } catch (error) {
      toast({
        title: "Ошибка сравнения",
        description: "Не удалось выполнить сравнительный анализ",
        variant: "destructive",
      });
    } finally {
      setLoading(null);
    }
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    toast({
      title: "Скопировано!",
      description: "Контент скопирован в буфер обмена",
    });
  };

  const downloadResponse = () => {
    if (!response) return;
    
    const blob = new Blob([response.content], { type: 'text/plain' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `grok_response_${new Date().toISOString().split('T')[0]}.txt`;
    a.click();
    window.URL.revokeObjectURL(url);
  };

  return (
    <div className="space-y-6">
      {/* Заголовок */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold flex items-center gap-2">
            <Brain className="w-6 h-6 text-purple-600" />
            Grok AI Тестирование
          </h2>
          <p className="text-gray-600">Интеграция с Grok AI от xAI (Илона Маска)</p>
        </div>
        <div className="flex items-center gap-2">
          <Badge className={grokStatus?.available ? "bg-green-100 text-green-800" : "bg-red-100 text-red-800"}>
            <Cpu className="w-4 h-4 mr-1" />
            {grokStatus?.available ? "Доступен" : "Недоступен"}
          </Badge>
          {grokStatus?.available && (
            <Badge className="bg-purple-100 text-purple-800">
              {grokStatus.model}
            </Badge>
          )}
          <Button variant="outline" size="sm" onClick={checkGrokStatus}>
            <RefreshCw className="w-4 h-4" />
          </Button>
        </div>
      </div>

      {/* Статус Grok */}
      {!grokStatus?.available && (
        <Alert className="border-red-200 bg-red-50">
          <AlertTriangle className="h-4 w-4 text-red-600" />
          <AlertDescription className="text-red-800">
            <strong>Grok API недоступен.</strong>
            <div className="mt-2">
              Для использования Grok AI добавьте <code>GROK_API_KEY</code> в секреты Replit.
              <br />
              Получить API ключ можно на <a href="https://x.ai" target="_blank" rel="noopener noreferrer" className="underline">x.ai</a>
            </div>
            <div className="mt-3">
              <Button 
                onClick={testGrokConnection} 
                disabled={loading === 'testing-connection'}
                variant="outline" 
                size="sm"
              >
                {loading === 'testing-connection' ? (
                  <>
                    <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
                    Тестирование...
                  </>
                ) : (
                  <>
                    <Zap className="w-4 h-4 mr-2" />
                    Тест подключения
                  </>
                )}
              </Button>
            </div>
          </AlertDescription>
        </Alert>
      )}</div>

      {/* Тест подключения */}
      <Card className="border-purple-200">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Zap className="w-5 h-5 text-purple-600" />
            Тест реального подключения к Grok
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">
                Проверить реальное подключение к Grok API и выполнить тестовый запрос
              </p>
            </div>
            <Button 
              onClick={testGrokConnection} 
              disabled={loading === 'testing-connection'}
              className="bg-purple-600 hover:bg-purple-700"
            >
              {loading === 'testing-connection' ? (
                <>
                  <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
                  Тестирование...
                </>
              ) : (
                <>
                  <Zap className="w-4 h-4 mr-2" />
                  Тест подключения
                </>
              )}
            </Button>
          </div>
        </CardContent>
      </Card>

      {grokStatus?.available && (
        <Card className="bg-gradient-to-r from-purple-50 to-pink-50 border-purple-200">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="font-medium text-purple-900">Grok AI активен</h3>
                <p className="text-sm text-purple-700">
                  Доступные функции: {grokStatus.features.join(', ')}
                </p>
              </div>
              <CheckCircle className="w-8 h-8 text-green-600" />
            </div>
          </CardContent>
        </Card>
      )}

      {/* Основной интерфейс */}
      {grokStatus?.available && (
        <Tabs defaultValue="general" className="space-y-4">
          <TabsList className="grid w-full grid-cols-5">
            <TabsTrigger value="general">Общая генерация</TabsTrigger>
            <TabsTrigger value="trading">Торговля</TabsTrigger>
            <TabsTrigger value="sentiment">Настроение рынка</TabsTrigger>
            <TabsTrigger value="viral">Вирусный контент</TabsTrigger>
            <TabsTrigger value="compare">Сравнение AI</TabsTrigger>
          </TabsList>

          {/* Общая генерация */}
          <TabsContent value="general" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <MessageSquare className="w-5 h-5 text-purple-600" />
                  Общая генерация контента
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="prompt">Промпт</Label>
                  <Textarea
                    id="prompt"
                    value={prompt}
                    onChange={(e) => setPrompt(e.target.value)}
                    placeholder="Опишите, какой контент нужно создать..."
                    rows={3}
                  />
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="system-prompt">Системный промпт (опционально)</Label>
                  <Textarea
                    id="system-prompt"
                    value={systemPrompt}
                    onChange={(e) => setSystemPrompt(e.target.value)}
                    placeholder="Дополнительные инструкции для AI..."
                    rows={2}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="content-type">Тип контента</Label>
                  <Select value={contentType} onValueChange={setContentType}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="general">Общий</SelectItem>
                      <SelectItem value="educational">Образовательный</SelectItem>
                      <SelectItem value="promotional">Рекламный</SelectItem>
                      <SelectItem value="analytical">Аналитический</SelectItem>
                      <SelectItem value="creative">Творческий</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <Button 
                  onClick={generateContent}
                  disabled={loading === 'generating'}
                  className="w-full bg-purple-600 hover:bg-purple-700"
                >
                  {loading === 'generating' ? (
                    <>
                      <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
                      Генерация...
                    </>
                  ) : (
                    <>
                      <Sparkles className="w-4 h-4 mr-2" />
                      Сгенерировать
                    </>
                  )}
                </Button>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Торговый контент */}
          <TabsContent value="trading" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <TrendingUp className="w-5 h-5 text-green-600" />
                  Генерация торгового контента
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Тип торгового контента</Label>
                    <Select value={contentType} onValueChange={setContentType}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="signal">Торговый сигнал</SelectItem>
                        <SelectItem value="analysis">Анализ рынка</SelectItem>
                        <SelectItem value="prediction">Прогноз</SelectItem>
                        <SelectItem value="education">Обучение</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="trading-prompt">Описание</Label>
                    <Input
                      id="trading-prompt"
                      value={prompt}
                      onChange={(e) => setPrompt(e.target.value)}
                      placeholder="Например: BTCUSDT, восходящий тренд..."
                    />
                  </div>
                </div>

                <Button 
                  onClick={generateTradingContent}
                  disabled={loading === 'trading'}
                  className="w-full bg-green-600 hover:bg-green-700"
                >
                  {loading === 'trading' ? (
                    <>
                      <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
                      Создание...
                    </>
                  ) : (
                    <>
                      <TrendingUp className="w-4 h-4 mr-2" />
                      Создать торговый контент
                    </>
                  )}
                </Button>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Анализ настроения */}
          <TabsContent value="sentiment" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <BarChart3 className="w-5 h-5 text-blue-600" />
                  Анализ рыночного настроения
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="markets">Рынки (через запятую)</Label>
                    <Input
                      id="markets"
                      value={markets}
                      onChange={(e) => setMarkets(e.target.value)}
                      placeholder="BTC, ETH, EURUSD, AAPL"
                    />
                  </div>
                  
                  <div className="space-y-2">
                    <Label>Временные рамки</Label>
                    <Select value={timeframe} onValueChange={setTimeframe}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="1h">1 час</SelectItem>
                        <SelectItem value="4h">4 часа</SelectItem>
                        <SelectItem value="24h">24 часа</SelectItem>
                        <SelectItem value="7d">7 дней</SelectItem>
                        <SelectItem value="30d">30 дней</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <Button 
                  onClick={analyzeMarketSentiment}
                  disabled={loading === 'sentiment'}
                  className="w-full bg-blue-600 hover:bg-blue-700"
                >
                  {loading === 'sentiment' ? (
                    <>
                      <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
                      Анализ...
                    </>
                  ) : (
                    <>
                      <BarChart3 className="w-4 h-4 mr-2" />
                      Проанализировать настроение
                    </>
                  )}
                </Button>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Вирусный контент */}
          <TabsContent value="viral" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Zap className="w-5 h-5 text-orange-600" />
                  Генерация вирусного контента
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid md:grid-cols-3 gap-4">
                  <div className="space-y-2">
                    <Label>Платформа</Label>
                    <Select value={platform} onValueChange={setPlatform}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="tiktok">TikTok</SelectItem>
                        <SelectItem value="instagram">Instagram</SelectItem>
                        <SelectItem value="youtube">YouTube</SelectItem>
                        <SelectItem value="telegram">Telegram</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  
                  <div className="space-y-2">
                    <Label>Ниша</Label>
                    <Select value={niche} onValueChange={setNiche}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="trading">Трейдинг</SelectItem>
                        <SelectItem value="crypto">Криптовалюты</SelectItem>
                        <SelectItem value="finance">Финансы</SelectItem>
                        <SelectItem value="investments">Инвестиции</SelectItem>
                        <SelectItem value="business">Бизнес</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="trend">Актуальный тренд</Label>
                    <Input
                      id="trend"
                      value={trend}
                      onChange={(e) => setTrend(e.target.value)}
                      placeholder="Например: AI торговля"
                    />
                  </div>
                </div>

                <Button 
                  onClick={generateViralContent}
                  disabled={loading === 'viral'}
                  className="w-full bg-orange-600 hover:bg-orange-700"
                >
                  {loading === 'viral' ? (
                    <>
                      <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
                      Создание...
                    </>
                  ) : (
                    <>
                      <Zap className="w-4 h-4 mr-2" />
                      Создать вирусный контент
                    </>
                  )}
                </Button>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Сравнение AI */}
          <TabsContent value="compare" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Brain className="w-5 h-5 text-indigo-600" />
                  Сравнение с другими AI
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="compare-prompt">Промпт для сравнения</Label>
                  <Textarea
                    id="compare-prompt"
                    value={prompt}
                    onChange={(e) => setPrompt(e.target.value)}
                    placeholder="Задайте вопрос или опишите задачу для сравнения подходов разных AI..."
                    rows={3}
                  />
                </div>

                <Button 
                  onClick={compareWithAI}
                  disabled={loading === 'comparing'}
                  className="w-full bg-indigo-600 hover:bg-indigo-700"
                >
                  {loading === 'comparing' ? (
                    <>
                      <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
                      Сравнение...
                    </>
                  ) : (
                    <>
                      <Brain className="w-4 h-4 mr-2" />
                      Сравнить с другими AI
                    </>
                  )}
                </Button>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      )}

      {/* Результат */}
      {response && (
        <Card className="border-green-200 bg-gradient-to-r from-green-50 to-emerald-50">
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle className="flex items-center gap-2">
                <CheckCircle className="w-5 h-5 text-green-600" />
                Результат от Grok AI
              </CardTitle>
              <div className="flex items-center gap-2">
                <Badge className="bg-purple-100 text-purple-800">
                  {response.tokensUsed} токенов
                </Badge>
                <Badge className="bg-green-100 text-green-800">
                  ${response.cost.toFixed(4)}
                </Badge>
                <Button size="sm" variant="outline" onClick={() => copyToClipboard(response.content)}>
                  <Copy className="w-4 h-4" />
                </Button>
                <Button size="sm" variant="outline" onClick={downloadResponse}>
                  <Download className="w-4 h-4" />
                </Button>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <div className="bg-white p-4 rounded-lg border">
              <pre className="whitespace-pre-wrap text-sm font-mono">{response.content}</pre>
            </div>
            {response.message && (
              <div className="mt-2 text-sm text-green-700">
                💡 {response.message}
              </div>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  );
}
