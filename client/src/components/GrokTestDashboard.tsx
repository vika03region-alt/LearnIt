import React, { useState, useEffect } from 'react';
import { Clock, Zap, Bot } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Separator } from '@/components/ui/separator';

const GrokAPITest = () => {
  const [testPrompt, setTestPrompt] = useState('Привет, Grok!');
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null);
  const [error, setError] = useState(null);

  const testGrokAPI = async () => {
    setLoading(true);
    setResult(null);
    setError(null);

    try {
      console.log('🔄 Тестирование Grok API...');
      const response = await fetch('/api/grok/test', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          prompt: testPrompt,
        }),
      });

      const data = await response.json();
      console.log('📊 Ответ от Grok API:', data);

      if (data.success) {
        setResult(data);
        console.log('✅ Grok API работает успешно!');
      } else {
        setError(data.error || 'Неизвестная ошибка');
        console.error('❌ Ошибка Grok API:', data.error);
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Ошибка сети';
      setError(errorMessage);
      console.error('🚨 Критическая ошибка:', errorMessage);
    } finally {
      setLoading(false);
    }
  };

  const runAdvancedTest = async () => {
    setLoading(true);
    setResult(null);
    setError(null);

    try {
      const advancedPrompt = `Проанализируй потенциал продвижения Telegram канала https://t.me/IIPRB. 
      Какие стратегии роста можешь предложить для трейдинг-сообщества? 
      Дай конкретные рекомендации по контенту и взаимодействию с аудиторией.`;

      const response = await fetch('/api/grok/advanced-analysis', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          prompt: advancedPrompt,
          type: 'telegram_promotion_analysis'
        }),
      });

      const data = await response.json();

      if (data.success) {
        setResult(data);
      } else {
        setError(data.error || 'Ошибка продвинутого анализа');
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Ошибка сети');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="p-6 max-w-4xl mx-auto space-y-6">
      <h1 className="text-3xl font-bold">Тестирование Grok API</h1>

      <div className="space-y-4">
        <div>
          <Label htmlFor="testPrompt">Ваш запрос:</Label>
          <Textarea
            id="testPrompt"
            value={testPrompt}
            onChange={(e) => setTestPrompt(e.target.value)}
            placeholder="Введите ваш запрос для Grok API..."
            rows={4}
            className="mt-2"
          />
        </div>

        <div className="flex gap-2">
          <Button onClick={testGrokAPI} disabled={loading} variant="default">
            {loading ? (
              <>
                <Clock className="w-4 h-4 mr-2 animate-spin" />
                Тестирование...
              </>
            ) : (
              <>
                <Zap className="w-4 h-4 mr-2" />
                Базовый тест
              </>
            )}
          </Button>

          <Button onClick={runAdvancedTest} disabled={loading} variant="outline">
            {loading ? (
              <>
                <Clock className="w-4 h-4 mr-2 animate-spin" />
                Анализ...
              </>
            ) : (
              <>
                <Bot className="w-4 h-4 mr-2" />
                Анализ канала
              </>
            )}
          </Button>
        </div>
      </div>

      <Separator />

      {loading && (
        <div className="flex items-center justify-center py-10">
          <Clock className="w-6 h-6 mr-2 animate-spin" />
          <span className="text-lg">Загрузка...</span>
        </div>
      )}

      {error && (
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded relative" role="alert">
          <strong className="font-bold">Ошибка:</strong>
          <span className="block sm:inline ml-2">{error}</span>
        </div>
      )}

      {result && !loading && (
        <div className="bg-green-100 border border-green-400 text-green-700 px-4 py-3 rounded relative" role="alert">
          <strong className="font-bold">Результат:</strong>
          <pre className="mt-2 whitespace-pre-wrap font-mono">{JSON.stringify(result, null, 2)}</pre>
        </div>
      )}
    </div>
  );
};

export default GrokAPITest;