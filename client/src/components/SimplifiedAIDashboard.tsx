
import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Button } from './ui/button';
import { Textarea } from './ui/textarea';
import { Badge } from './ui/badge';
import { Sparkles, Zap, TrendingUp, Target } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

export function SimplifiedAIDashboard() {
  const [prompt, setPrompt] = useState('');
  const [result, setResult] = useState('');
  const [isGenerating, setIsGenerating] = useState(false);
  const { toast } = useToast();

  const quickPrompts = [
    { label: 'Viral TikTok', icon: '🎵', type: 'viral' },
    { label: 'Trading Signal', icon: '📈', type: 'signal' },
    { label: 'YouTube Анализ', icon: '🎥', type: 'analysis' },
    { label: 'Crypto Прогноз', icon: '💰', type: 'prediction' },
  ];

  const generateContent = async (type: string) => {
    setIsGenerating(true);
    try {
      const endpoints: Record<string, string> = {
        viral: '/api/ai/viral-tiktok',
        signal: '/api/ai/live-signal',
        analysis: '/api/ai/youtube-analysis',
        prediction: '/api/ai/crypto-predictions',
      };

      const response = await fetch(endpoints[type] || '/api/ai/generate-content', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          prompt: prompt || 'Создай вирусный контент',
          contentType: type,
        }),
      });

      const data = await response.json();
      setResult(data.content || data.text || 'Контент создан!');
      
      toast({
        title: "✨ Контент готов!",
        description: "AI сгенерировал уникальный контент",
      });
    } catch (error) {
      toast({
        title: "Ошибка",
        description: "Не удалось сгенерировать контент",
        variant: "destructive",
      });
    } finally {
      setIsGenerating(false);
    }
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Sparkles className="w-5 h-5 text-purple-600" />
            AI Генератор Контента
            <Badge variant="secondary">Упрощенный режим</Badge>
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-4 gap-2">
            {quickPrompts.map(({ label, icon, type }) => (
              <Button
                key={type}
                variant="outline"
                className="flex flex-col h-20"
                onClick={() => generateContent(type)}
                disabled={isGenerating}
              >
                <span className="text-2xl mb-1">{icon}</span>
                <span className="text-xs">{label}</span>
              </Button>
            ))}
          </div>

          <Textarea
            placeholder="Введите ваш запрос или выберите быструю команду выше..."
            value={prompt}
            onChange={(e) => setPrompt(e.target.value)}
            rows={3}
          />

          <Button
            className="w-full"
            onClick={() => generateContent('custom')}
            disabled={isGenerating || !prompt}
          >
            <Zap className="w-4 h-4 mr-2" />
            {isGenerating ? 'Генерация...' : 'Создать контент'}
          </Button>

          {result && (
            <Card className="bg-gradient-to-br from-purple-50 to-indigo-50">
              <CardContent className="pt-6">
                <p className="whitespace-pre-wrap">{result}</p>
              </CardContent>
            </Card>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
