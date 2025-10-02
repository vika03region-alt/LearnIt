
import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { BarChart3, Users, TrendingUp, MessageSquare } from "lucide-react";

interface ChannelAnalysis {
  channelInfo: {
    title: string;
    username: string;
    subscribersCount: number;
  };
  metrics: {
    avgViews: number;
    avgEngagement: number;
    postsPerDay: number;
  };
  recommendations: string[];
}

export default function TelegramChannelAnalyzer() {
  const [channelId, setChannelId] = useState('@IIPRB');
  const [analyzing, setAnalyzing] = useState(false);
  const [analysis, setAnalysis] = useState<ChannelAnalysis | null>(null);
  const { toast } = useToast();

  const analyzeChannel = async () => {
    if (!channelId) {
      toast({
        title: '⚠️ Ошибка',
        description: 'Введите ID канала',
        variant: 'destructive',
      });
      return;
    }

    setAnalyzing(true);

    try {
      const response = await fetch('/api/telegram/analyze-channel', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ channelId }),
      });

      const data = await response.json();

      if (data.success) {
        setAnalysis(data.analysis);
        toast({
          title: '✅ Анализ завершен',
          description: `Канал ${data.analysis.channelInfo.title} проанализирован`,
        });
      } else {
        throw new Error(data.error || 'Ошибка анализа');
      }
    } catch (error: any) {
      toast({
        title: '❌ Ошибка',
        description: error.message || 'Не удалось проанализировать канал',
        variant: 'destructive',
      });
    } finally {
      setAnalyzing(false);
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <BarChart3 className="w-5 h-5 text-purple-500" />
          Анализ Telegram канала
        </CardTitle>
        <CardDescription>
          Получите подробную аналитику вашего канала
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex gap-2">
          <div className="flex-1">
            <Label htmlFor="channelId">ID канала</Label>
            <Input
              id="channelId"
              value={channelId}
              onChange={(e) => setChannelId(e.target.value)}
              placeholder="@channel_name"
              className="mt-1"
            />
          </div>
          <Button 
            onClick={analyzeChannel} 
            disabled={analyzing}
            className="mt-auto"
          >
            {analyzing ? 'Анализ...' : 'Запустить анализ'}
          </Button>
        </div>

        {analysis && (
          <div className="space-y-4 pt-4 border-t">
            <div>
              <h3 className="font-semibold text-lg">{analysis.channelInfo.title}</h3>
              <p className="text-sm text-muted-foreground">{analysis.channelInfo.username}</p>
            </div>

            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="text-center p-3 bg-muted rounded-lg">
                <Users className="w-5 h-5 mx-auto mb-2 text-blue-500" />
                <div className="text-2xl font-bold">{analysis.channelInfo.subscribersCount.toLocaleString()}</div>
                <div className="text-xs text-muted-foreground">Подписчики</div>
              </div>
              <div className="text-center p-3 bg-muted rounded-lg">
                <TrendingUp className="w-5 h-5 mx-auto mb-2 text-green-500" />
                <div className="text-2xl font-bold">{analysis.metrics.avgViews.toLocaleString()}</div>
                <div className="text-xs text-muted-foreground">Ср. просмотры</div>
              </div>
              <div className="text-center p-3 bg-muted rounded-lg">
                <MessageSquare className="w-5 h-5 mx-auto mb-2 text-purple-500" />
                <div className="text-2xl font-bold">{analysis.metrics.avgEngagement.toFixed(1)}%</div>
                <div className="text-xs text-muted-foreground">Вовлеченность</div>
              </div>
              <div className="text-center p-3 bg-muted rounded-lg">
                <BarChart3 className="w-5 h-5 mx-auto mb-2 text-orange-500" />
                <div className="text-2xl font-bold">{analysis.metrics.postsPerDay.toFixed(1)}</div>
                <div className="text-xs text-muted-foreground">Постов/день</div>
              </div>
            </div>

            {analysis.recommendations.length > 0 && (
              <div>
                <h4 className="font-medium mb-2">Рекомендации:</h4>
                <div className="space-y-2">
                  {analysis.recommendations.map((rec, index) => (
                    <div key={index} className="flex items-start gap-2">
                      <Badge variant="outline" className="mt-0.5">💡</Badge>
                      <p className="text-sm text-muted-foreground">{rec}</p>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
