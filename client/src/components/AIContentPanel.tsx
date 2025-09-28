
import { useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { isUnauthorizedError } from "@/lib/authUtils";
import { Brain, Wand2, Circle, Sparkles, Target, TrendingUp, Award, Zap } from "lucide-react";
import { Progress } from "@/components/ui/progress";

export default function AIContentPanel() {
  const [contentType, setContentType] = useState("");
  const [targetPlatforms, setTargetPlatforms] = useState<string[]>([]);
  const [prompt, setPrompt] = useState("");
  const [generatedContent, setGeneratedContent] = useState("");
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const generateContentMutation = useMutation({
    mutationFn: async (data: {
      prompt: string;
      contentType: string;
      targetPlatforms: string[];
    }) => {
      const response = await apiRequest('POST', '/api/ai/generate-content', data);
      return await response.json();
    },
    onSuccess: (result) => {
      setGeneratedContent(result.content);
      queryClient.invalidateQueries({ queryKey: ['/api/ai/content-logs'] });
      queryClient.invalidateQueries({ queryKey: ['/api/activity'] });
      toast({
        title: "Контент создан успешно!",
        description: `AI контент сгенерирован. Потрачено ${result.tokensUsed} токенов.`,
      });
    },
    onError: (error) => {
      if (isUnauthorizedError(error)) {
        toast({
          title: "Нет доступа",
          description: "Вы не авторизованы. Выполняется вход...",
          variant: "destructive",
        });
        setTimeout(() => {
          window.location.href = "/api/login";
        }, 500);
        return;
      }
      toast({
        title: "Ошибка генерации",
        description: error.message || "Не удалось создать AI контент",
        variant: "destructive",
      });
    },
  });

  const handleGenerate = () => {
    if (!prompt.trim()) {
      toast({
        title: "Пустой запрос",
        description: "Пожалуйста, введите описание контента для генерации.",
        variant: "destructive",
      });
      return;
    }

    if (!contentType) {
      toast({
        title: "Не выбран тип",
        description: "Пожалуйста, выберите тип контента.",
        variant: "destructive",
      });
      return;
    }

    generateContentMutation.mutate({
      prompt: prompt.trim(),
      contentType,
      targetPlatforms: targetPlatforms.length > 0 ? targetPlatforms : ['all'],
    });
  };

  const handlePlatformToggle = (platform: string) => {
    if (platform === 'all') {
      setTargetPlatforms(['all']);
      return;
    }

    setTargetPlatforms(prev => {
      const filtered = prev.filter(p => p !== 'all');
      if (filtered.includes(platform)) {
        return filtered.filter(p => p !== platform);
      } else {
        return [...filtered, platform];
      }
    });
  };

  return (
    <Card className="bg-gradient-to-br from-white to-purple-50/30 border border-purple-200/50 shadow-lg" data-testid="ai-content-panel">
      <CardHeader>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 bg-gradient-to-br from-purple-500 via-violet-500 to-purple-600 rounded-xl flex items-center justify-center shadow-lg">
              <Brain className="text-white w-6 h-6" />
            </div>
            <div>
              <CardTitle className="text-lg font-semibold text-slate-800 flex items-center gap-2">
                AI Генератор Контента
                <Sparkles className="w-4 h-4 text-purple-500" />
              </CardTitle>
              <p className="text-sm text-slate-600">Создание контента с помощью OpenAI GPT-5</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Badge className="bg-green-100 text-green-800 text-xs font-medium border-green-200">
              <Circle className="w-2 h-2 text-green-500 mr-1 fill-current" />
              AI Активен
            </Badge>
          </div>
        </div>
      </CardHeader>

      <CardContent className="space-y-6">
        {/* Настройки генерации */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label htmlFor="content-type" className="block text-sm font-medium text-slate-700">
              Тип контента для генерации
            </Label>
            <Select value={contentType} onValueChange={setContentType}>
              <SelectTrigger id="content-type" data-testid="select-content-type" className="border-slate-300">
                <SelectValue placeholder="Выберите тип контента" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="trading_signal">
                  <div className="flex items-center gap-2">
                    <Target className="w-4 h-4 text-green-600" />
                    Торговый сигнал
                  </div>
                </SelectItem>
                <SelectItem value="market_analysis">
                  <div className="flex items-center gap-2">
                    <TrendingUp className="w-4 h-4 text-blue-600" />
                    Рыночная аналитика
                  </div>
                </SelectItem>
                <SelectItem value="educational">
                  <div className="flex items-center gap-2">
                    <Award className="w-4 h-4 text-purple-600" />
                    Обучающий контент
                  </div>
                </SelectItem>
                <SelectItem value="motivational">
                  <div className="flex items-center gap-2">
                    <Zap className="w-4 h-4 text-amber-600" />
                    Мотивационный пост
                  </div>
                </SelectItem>
              </SelectContent>
            </Select>
          </div>
          
          <div className="space-y-2">
            <Label className="block text-sm font-medium text-slate-700">
              Целевые платформы
            </Label>
            <div className="flex flex-wrap gap-2">
              {[
                { value: 'all', label: 'Все платформы', color: 'bg-slate-100 text-slate-800 hover:bg-slate-200' },
                { value: 'instagram', label: 'Instagram', color: 'bg-pink-100 text-pink-800 hover:bg-pink-200' },
                { value: 'tiktok', label: 'TikTok', color: 'bg-red-100 text-red-800 hover:bg-red-200' },
                { value: 'youtube', label: 'YouTube', color: 'bg-red-100 text-red-800 hover:bg-red-200' },
                { value: 'telegram', label: 'Telegram', color: 'bg-blue-100 text-blue-800 hover:bg-blue-200' },
              ].map((platform) => (
                <Button
                  key={platform.value}
                  variant={targetPlatforms.includes(platform.value) ? "default" : "outline"}
                  size="sm"
                  onClick={() => handlePlatformToggle(platform.value)}
                  data-testid={`button-platform-${platform.value}`}
                  className={targetPlatforms.includes(platform.value) 
                    ? "bg-purple-600 hover:bg-purple-700 text-white" 
                    : `${platform.color} border-slate-300`
                  }
                >
                  {platform.label}
                </Button>
              ))}
            </div>
          </div>
        </div>

        {/* Поле ввода */}
        <div className="space-y-2">
          <Label htmlFor="prompt" className="block text-sm font-medium text-slate-700">
            Описание контента
          </Label>
          <Textarea
            id="prompt"
            className="min-h-[100px] resize-none border-slate-300 focus:border-purple-500 focus:ring-purple-500"
            placeholder="Опишите что вы хотите создать... Например: 'EUR/USD прорыв выше 1.1250 сопротивления, цель 1.1300 со стоп-лоссом 1.1220'"
            value={prompt}
            onChange={(e) => setPrompt(e.target.value)}
            data-testid="textarea-prompt"
          />
          <p className="text-xs text-slate-500">
            Чем детальнее описание, тем лучше результат генерации
          </p>
        </div>

        {/* Панель управления */}
        <div className="flex justify-between items-center p-4 bg-gradient-to-r from-slate-50 to-purple-50 rounded-lg border">
          <div className="flex items-center gap-6">
            <div className="text-sm">
              <span className="text-slate-600">AI кредиты:</span>
              <span className="font-semibold text-slate-800 ml-1" data-testid="text-api-credits">
                847/1000
              </span>
            </div>
            <div className="flex items-center gap-2">
              <Progress value={84.7} className="w-24 h-2" />
              <span className="text-xs text-slate-500">84.7%</span>
            </div>
            <div className="text-xs text-slate-500">
              ~$0.03 за генерацию
            </div>
          </div>
          
          <Button
            className="bg-gradient-to-r from-purple-600 via-violet-600 to-purple-700 text-white font-medium hover:from-purple-700 hover:via-violet-700 hover:to-purple-800 shadow-lg"
            onClick={handleGenerate}
            disabled={generateContentMutation.isPending}
            data-testid="button-generate-content"
          >
            {generateContentMutation.isPending ? (
              <>
                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2"></div>
                Генерирую...
              </>
            ) : (
              <>
                <Wand2 className="w-4 h-4 mr-2" />
                Создать контент
              </>
            )}
          </Button>
        </div>

        {/* Результат генерации */}
        {generatedContent && (
          <div className="p-6 bg-gradient-to-r from-green-50 to-blue-50 rounded-lg border-l-4 border-green-500">
            <h4 className="font-semibold text-slate-800 mb-3 flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-green-600" />
              Сгенерированный контент готов:
            </h4>
            <div className="bg-white p-4 rounded-lg border mb-4 shadow-sm">
              <p className="text-sm text-slate-800 whitespace-pre-wrap leading-relaxed" data-testid="text-generated-content">
                {generatedContent}
              </p>
            </div>
            <div className="flex gap-2 flex-wrap">
              <Button 
                size="sm" 
                className="bg-green-600 text-white hover:bg-green-700"
                data-testid="button-post-instagram"
              >
                <Target className="w-4 h-4 mr-2" />
                Опубликовать в Instagram
              </Button>
              <Button 
                size="sm" 
                variant="secondary"
                data-testid="button-schedule"
              >
                Запланировать
              </Button>
              <Button 
                size="sm" 
                variant="secondary"
                data-testid="button-edit"
              >
                Редактировать
              </Button>
              <Button 
                size="sm" 
                variant="outline"
                onClick={() => setGeneratedContent("")}
              >
                Создать новый
              </Button>
            </div>
          </div>
        )}

        {/* Подсказки */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3 pt-2 border-t border-slate-200">
          <div className="text-center p-3 bg-blue-50 rounded-lg">
            <Target className="w-5 h-5 text-blue-600 mx-auto mb-1" />
            <p className="text-xs text-blue-800 font-medium">Торговые сигналы</p>
            <p className="text-xs text-blue-600">Точные входы и выходы</p>
          </div>
          <div className="text-center p-3 bg-purple-50 rounded-lg">
            <TrendingUp className="w-5 h-5 text-purple-600 mx-auto mb-1" />
            <p className="text-xs text-purple-800 font-medium">Аналитика рынков</p>
            <p className="text-xs text-purple-600">Детальный разбор</p>
          </div>
          <div className="text-center p-3 bg-amber-50 rounded-lg">
            <Sparkles className="w-5 h-5 text-amber-600 mx-auto mb-1" />
            <p className="text-xs text-amber-800 font-medium">Вирусный контент</p>
            <p className="text-xs text-amber-600">Для максимального охвата</p>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
