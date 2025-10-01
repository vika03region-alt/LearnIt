
import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card';
import { Button } from './ui/button';
import { Badge } from './ui/badge';
import { AlertCircle, CheckCircle, Loader2, Brain, Zap } from 'lucide-react';
import { Alert, AlertDescription } from './ui/alert';

interface APITestResult {
  service: string;
  status: 'success' | 'error' | 'testing';
  response?: string;
  error?: string;
  model?: string;
  usage?: any;
}

const AIIntegrationTest = () => {
  const [results, setResults] = useState<APITestResult[]>([]);
  const [isTestingAll, setIsTestingAll] = useState(false);

  const updateResult = (service: string, result: Partial<APITestResult>) => {
    setResults(prev => {
      const existing = prev.find(r => r.service === service);
      if (existing) {
        return prev.map(r => r.service === service ? { ...r, ...result } : r);
      }
      return [...prev, { service, ...result } as APITestResult];
    });
  };

  const testOpenAI = async () => {
    updateResult('OpenAI GPT-5', { status: 'testing' });
    
    try {
      const response = await fetch('/api/ai/generate-content', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          prompt: 'Создай краткий анализ рынка криптовалют',
          contentType: 'market_analysis',
          targetPlatforms: ['telegram']
        })
      });

      const data = await response.json();
      
      if (response.ok) {
        updateResult('OpenAI GPT-5', {
          status: 'success',
          response: data.content?.substring(0, 200) + '...',
          usage: data.tokensUsed
        });
      } else {
        updateResult('OpenAI GPT-5', {
          status: 'error',
          error: data.message || 'Ошибка API'
        });
      }
    } catch (error) {
      updateResult('OpenAI GPT-5', {
        status: 'error',
        error: error instanceof Error ? error.message : 'Ошибка сети'
      });
    }
  };

  const testGrok = async () => {
    updateResult('Grok AI', { status: 'testing' });
    
    try {
      const response = await fetch('/api/grok/test', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          prompt: 'Проанализируй потенциал Telegram канала для трейдинга'
        })
      });

      const data = await response.json();
      
      if (data.success) {
        updateResult('Grok AI', {
          status: 'success',
          response: data.response?.substring(0, 200) + '...',
          model: data.model,
          usage: data.usage
        });
      } else {
        updateResult('Grok AI', {
          status: 'error',
          error: data.error || 'Ошибка Grok API'
        });
      }
    } catch (error) {
      updateResult('Grok AI', {
        status: 'error',
        error: error instanceof Error ? error.message : 'Ошибка сети'
      });
    }
  };

  const testAdvancedGrokAnalysis = async () => {
    updateResult('Grok Advanced', { status: 'testing' });
    
    try {
      const response = await fetch('/api/grok/advanced-analysis', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          prompt: 'Создай стратегию продвижения для канала https://t.me/IIPRB',
          type: 'telegram_promotion_analysis'
        })
      });

      const data = await response.json();
      
      if (data.success) {
        updateResult('Grok Advanced', {
          status: 'success',
          response: data.response?.substring(0, 200) + '...',
          model: data.model
        });
      } else {
        updateResult('Grok Advanced', {
          status: 'error',
          error: data.error || 'Ошибка продвинутого анализа'
        });
      }
    } catch (error) {
      updateResult('Grok Advanced', {
        status: 'error',
        error: error instanceof Error ? error.message : 'Ошибка сети'
      });
    }
  };

  const testAllAPIs = async () => {
    setIsTestingAll(true);
    setResults([]);
    
    await Promise.all([
      testOpenAI(),
      testGrok(),
      testAdvancedGrokAnalysis()
    ]);
    
    setIsTestingAll(false);
  };

  const getStatusIcon = (status: APITestResult['status']) => {
    switch (status) {
      case 'success':
        return <CheckCircle className="h-5 w-5 text-green-500" />;
      case 'error':
        return <AlertCircle className="h-5 w-5 text-red-500" />;
      case 'testing':
        return <Loader2 className="h-5 w-5 text-blue-500 animate-spin" />;
      default:
        return null;
    }
  };

  const getStatusColor = (status: APITestResult['status']) => {
    switch (status) {
      case 'success': return 'bg-green-100 text-green-800';
      case 'error': return 'bg-red-100 text-red-800';
      case 'testing': return 'bg-blue-100 text-blue-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  return (
    <div className="p-6 max-w-6xl mx-auto space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold flex items-center gap-2">
            <Brain className="h-8 w-8" />
            Тестирование AI Интеграций
          </h1>
          <p className="text-gray-600 mt-2">
            Проверка работоспособности OpenAI GPT-5 и Grok AI API
          </p>
        </div>
        
        <Button 
          onClick={testAllAPIs}
          disabled={isTestingAll}
          size="lg"
          className="bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700"
        >
          {isTestingAll ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Тестирование...
            </>
          ) : (
            <>
              <Zap className="mr-2 h-4 w-4" />
              Тестировать Все API
            </>
          )}
        </Button>
      </div>

      <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center justify-between">
              OpenAI GPT-5
              {results.find(r => r.service === 'OpenAI GPT-5') && 
                getStatusIcon(results.find(r => r.service === 'OpenAI GPT-5')!.status)}
            </CardTitle>
            <CardDescription>
              Генерация контента и анализ
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Button onClick={testOpenAI} className="w-full mb-4">
              Тестировать OpenAI
            </Button>
            {results.find(r => r.service === 'OpenAI GPT-5') && (
              <div className="space-y-2">
                <Badge className={getStatusColor(results.find(r => r.service === 'OpenAI GPT-5')!.status)}>
                  {results.find(r => r.service === 'OpenAI GPT-5')!.status}
                </Badge>
                {results.find(r => r.service === 'OpenAI GPT-5')!.response && (
                  <p className="text-sm text-gray-600">
                    {results.find(r => r.service === 'OpenAI GPT-5')!.response}
                  </p>
                )}
                {results.find(r => r.service === 'OpenAI GPT-5')!.error && (
                  <Alert>
                    <AlertCircle className="h-4 w-4" />
                    <AlertDescription>
                      {results.find(r => r.service === 'OpenAI GPT-5')!.error}
                    </AlertDescription>
                  </Alert>
                )}
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center justify-between">
              Grok AI
              {results.find(r => r.service === 'Grok AI') && 
                getStatusIcon(results.find(r => r.service === 'Grok AI')!.status)}
            </CardTitle>
            <CardDescription>
              Основной Grok API тест
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Button onClick={testGrok} className="w-full mb-4">
              Тестировать Grok
            </Button>
            {results.find(r => r.service === 'Grok AI') && (
              <div className="space-y-2">
                <Badge className={getStatusColor(results.find(r => r.service === 'Grok AI')!.status)}>
                  {results.find(r => r.service === 'Grok AI')!.status}
                </Badge>
                {results.find(r => r.service === 'Grok AI')!.model && (
                  <p className="text-xs text-gray-500">
                    Модель: {results.find(r => r.service === 'Grok AI')!.model}
                  </p>
                )}
                {results.find(r => r.service === 'Grok AI')!.response && (
                  <p className="text-sm text-gray-600">
                    {results.find(r => r.service === 'Grok AI')!.response}
                  </p>
                )}
                {results.find(r => r.service === 'Grok AI')!.error && (
                  <Alert>
                    <AlertCircle className="h-4 w-4" />
                    <AlertDescription>
                      {results.find(r => r.service === 'Grok AI')!.error}
                    </AlertDescription>
                  </Alert>
                )}
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center justify-between">
              Grok Advanced
              {results.find(r => r.service === 'Grok Advanced') && 
                getStatusIcon(results.find(r => r.service === 'Grok Advanced')!.status)}
            </CardTitle>
            <CardDescription>
              Продвинутый анализ продвижения
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Button onClick={testAdvancedGrokAnalysis} className="w-full mb-4">
              Тестировать Анализ
            </Button>
            {results.find(r => r.service === 'Grok Advanced') && (
              <div className="space-y-2">
                <Badge className={getStatusColor(results.find(r => r.service === 'Grok Advanced')!.status)}>
                  {results.find(r => r.service === 'Grok Advanced')!.status}
                </Badge>
                {results.find(r => r.service === 'Grok Advanced')!.response && (
                  <p className="text-sm text-gray-600">
                    {results.find(r => r.service === 'Grok Advanced')!.response}
                  </p>
                )}
                {results.find(r => r.service === 'Grok Advanced')!.error && (
                  <Alert>
                    <AlertCircle className="h-4 w-4" />
                    <AlertDescription>
                      {results.find(r => r.service === 'Grok Advanced')!.error}
                    </AlertDescription>
                  </Alert>
                )}
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {results.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Сводка Результатов</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {results.map((result, index) => (
                <div key={index} className="flex items-center justify-between p-3 border rounded-lg">
                  <div className="flex items-center gap-3">
                    {getStatusIcon(result.status)}
                    <span className="font-medium">{result.service}</span>
                  </div>
                  <Badge className={getStatusColor(result.status)}>
                    {result.status}
                  </Badge>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      <Alert>
        <Brain className="h-4 w-4" />
        <AlertDescription>
          <strong>Статус интеграций:</strong> OpenAI GPT-5 и Grok AI настроены и готовы к использованию. 
          Система может генерировать контент, анализировать каналы и создавать стратегии продвижения 
          для Telegram канала https://t.me/IIPRB
        </AlertDescription>
      </Alert>
    </div>
  );
};

export default AIIntegrationTest;
