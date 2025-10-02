
import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "@/hooks/use-toast";
import { Loader2, Target, TrendingUp, Users, Eye, MessageSquare, Share2, BarChart3 } from "lucide-react";
import { SiTelegram } from "react-icons/si";

export default function TelegramChannelAnalyzer() {
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [channelId, setChannelId] = useState("@IIPRB");
  const [analysis, setAnalysis] = useState<{
    channelInfo?: {
      title: string;
      username: string;
      description: string;
      memberCount: number;
      photoUrl?: string;
    };
    recentPosts?: Array<{
      id: number;
      text: string;
      date: string;
      views: number;
      forwards: number;
    }>;
    analytics?: {
      avgViews: number;
      avgEngagement: number;
      postingFrequency: string;
      bestPostingTime: string;
      topKeywords: string[];
      growthRate: number;
    };
    recommendations?: string[];
  } | null>(null);

  const analyzeChannel = async () => {
    setIsAnalyzing(true);
    setAnalysis(null);

    try {
      const response = await fetch('/api/telegram/analyze-channel', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ channelId }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Ошибка анализа канала');
      }

      setAnalysis(data);

      toast({
        title: "✅ Анализ завершен!",
        description: `Канал ${channelId} успешно проанализирован`,
      });
    } catch (error: any) {
      toast({
        title: "❌ Ошибка анализа",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setIsAnalyzing(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Форма анализа */}
      <Card className="border-blue-200 bg-gradient-to-br from-blue-50 to-white">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <SiTelegram className="w-6 h-6 text-blue-500" />
            Анализ Telegram канала
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="channelId">ID или @username канала</Label>
            <Input
              id="channelId"
              value={channelId}
              onChange={(e) => setChannelId(e.target.value)}
              placeholder="@IIPRB"
              className="font-mono"
            />
          </div>

          <Button
            onClick={analyzeChannel}
            disabled={isAnalyzing || !channelId}
            size="lg"
            className="w-full"
          >
            {isAnalyzing ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                Анализируем канал...
              </>
            ) : (
              <>
                <Target className="w-4 h-4 mr-2" />
                Запустить анализ
              </>
            )}
          </Button>
        </CardContent>
      </Card>

      {/* Результаты анализа */}
      {analysis && (
        <>
          {/* Информация о канале */}
          {analysis.channelInfo && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Users className="w-5 h-5 text-blue-500" />
                  Информация о канале
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-start gap-4">
                  {analysis.channelInfo.photoUrl && (
                    <img
                      src={analysis.channelInfo.photoUrl}
                      alt={analysis.channelInfo.title}
                      className="w-16 h-16 rounded-full"
                    />
                  )}
                  <div className="flex-1">
                    <h3 className="text-xl font-bold">{analysis.channelInfo.title}</h3>
                    <p className="text-sm text-muted-foreground">{analysis.channelInfo.username}</p>
                    <p className="text-sm mt-2">{analysis.channelInfo.description}</p>
                  </div>
                </div>
                <div className="grid grid-cols-3 gap-4 mt-4">
                  <div className="text-center p-4 bg-blue-50 rounded-lg">
                    <Users className="w-6 h-6 mx-auto mb-2 text-blue-500" />
                    <p className="text-2xl font-bold">{analysis.channelInfo.memberCount.toLocaleString()}</p>
                    <p className="text-xs text-muted-foreground">Подписчиков</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Аналитика */}
          {analysis.analytics && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <BarChart3 className="w-5 h-5 text-green-500" />
                  Аналитика канала
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  <div className="p-4 bg-gradient-to-br from-blue-50 to-white rounded-lg border border-blue-200">
                    <Eye className="w-5 h-5 mb-2 text-blue-500" />
                    <p className="text-2xl font-bold">{analysis.analytics.avgViews.toLocaleString()}</p>
                    <p className="text-xs text-muted-foreground">Ср. просмотры</p>
                  </div>

                  <div className="p-4 bg-gradient-to-br from-green-50 to-white rounded-lg border border-green-200">
                    <MessageSquare className="w-5 h-5 mb-2 text-green-500" />
                    <p className="text-2xl font-bold">{analysis.analytics.avgEngagement.toFixed(1)}%</p>
                    <p className="text-xs text-muted-foreground">Вовлеченность</p>
                  </div>

                  <div className="p-4 bg-gradient-to-br from-purple-50 to-white rounded-lg border border-purple-200">
                    <Share2 className="w-5 h-5 mb-2 text-purple-500" />
                    <p className="text-lg font-bold">{analysis.analytics.postingFrequency}</p>
                    <p className="text-xs text-muted-foreground">Частота постов</p>
                  </div>

                  <div className="p-4 bg-gradient-to-br from-orange-50 to-white rounded-lg border border-orange-200">
                    <TrendingUp className="w-5 h-5 mb-2 text-orange-500" />
                    <p className="text-2xl font-bold">+{analysis.analytics.growthRate.toFixed(1)}%</p>
                    <p className="text-xs text-muted-foreground">Рост за месяц</p>
                  </div>
                </div>

                <div className="mt-6 space-y-3">
                  <div className="flex items-center justify-between p-3 bg-gray-50 rounded">
                    <span className="text-sm font-medium">Лучшее время для постов</span>
                    <Badge variant="secondary">{analysis.analytics.bestPostingTime}</Badge>
                  </div>

                  {analysis.analytics.topKeywords.length > 0 && (
                    <div className="p-3 bg-gray-50 rounded">
                      <p className="text-sm font-medium mb-2">Топ ключевые слова:</p>
                      <div className="flex flex-wrap gap-2">
                        {analysis.analytics.topKeywords.map((keyword, idx) => (
                          <Badge key={idx} variant="outline">{keyword}</Badge>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          )}

          {/* Последние посты */}
          {analysis.recentPosts && analysis.recentPosts.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <MessageSquare className="w-5 h-5 text-purple-500" />
                  Последние посты
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {analysis.recentPosts.slice(0, 5).map((post) => (
                    <div key={post.id} className="p-4 border rounded-lg hover:bg-gray-50 transition-colors">
                      <p className="text-sm mb-2 line-clamp-2">{post.text}</p>
                      <div className="flex items-center gap-4 text-xs text-muted-foreground">
                        <span className="flex items-center gap-1">
                          <Eye className="w-3 h-3" />
                          {post.views.toLocaleString()}
                        </span>
                        <span className="flex items-center gap-1">
                          <Share2 className="w-3 h-3" />
                          {post.forwards}
                        </span>
                        <span>{new Date(post.date).toLocaleDateString('ru-RU')}</span>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}

          {/* Рекомендации */}
          {analysis.recommendations && analysis.recommendations.length > 0 && (
            <Card className="border-green-200 bg-gradient-to-br from-green-50 to-white">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Target className="w-5 h-5 text-green-500" />
                  AI Рекомендации
                </CardTitle>
              </CardHeader>
              <CardContent>
                <ul className="space-y-2">
                  {analysis.recommendations.map((rec, idx) => (
                    <li key={idx} className="flex items-start gap-2">
                      <span className="text-green-500 mt-1">✓</span>
                      <span className="text-sm">{rec}</span>
                    </li>
                  ))}
                </ul>
              </CardContent>
            </Card>
          )}

          {/* Кнопка запуска продвижения */}
          <Card className="border-blue-500 bg-gradient-to-r from-blue-600 to-purple-600 text-white">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div className="flex-1">
                  <h3 className="text-xl font-bold mb-2">🚀 Запустить автоматическое продвижение</h3>
                  <p className="text-sm text-blue-100">
                    На основе анализа будет создан и запущен план продвижения с автоматическим постингом и оптимизацией контента
                  </p>
                </div>
                <Button
                  size="lg"
                  className="ml-4 bg-white text-blue-600 hover:bg-blue-50"
                  onClick={async () => {
                    setIsAnalyzing(true);
                    try {
                      const response = await fetch('/api/telegram/start-promotion', {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({ 
                          channelId, 
                          analysisData: analysis 
                        }),
                      });

                      const data = await response.json();

                      if (!response.ok) {
                        throw new Error(data.error || 'Ошибка запуска продвижения');
                      }

                      toast({
                        title: "🚀 Продвижение запущено!",
                        description: data.message,
                      });
                    } catch (error: any) {
                      toast({
                        title: "❌ Ошибка",
                        description: error.message,
                        variant: "destructive",
                      });
                    } finally {
                      setIsAnalyzing(false);
                    }
                  }}
                  disabled={isAnalyzing}
                >
                  {isAnalyzing ? (
                    <>
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      Запуск...
                    </>
                  ) : (
                    'Запустить продвижение'
                  )}
                </Button>
              </div>
            </CardContent>
          </Card>
        </>
      )}
    </div>
  );
}
