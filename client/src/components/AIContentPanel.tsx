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
import { Brain, Wand2, Circle } from "lucide-react";

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
        title: "Контент создан",
        description: "AI контент успешно сгенерирован.",
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
        title: "Отсутствует запрос",
        description: "Пожалуйста, введите запрос для генерации контента.",
        variant: "destructive",
      });
      return;
    }

    if (!contentType) {
      toast({
        title: "Не выбран тип контента",
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
    <Card className="bg-card border border-border" data-testid="ai-content-panel">
      <CardHeader>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-gradient-to-br from-purple-500 to-pink-500 rounded-lg flex items-center justify-center">
              <Brain className="text-white" />
            </div>
            <div>
              <CardTitle className="text-lg font-semibold text-foreground">
                AI генератор контента
              </CardTitle>
              <p className="text-sm text-muted-foreground">На базе OpenAI GPT-5</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Badge className="bg-green-100 text-green-800 text-xs font-medium">
              <Circle className="w-2 h-2 text-green-500 mr-1 fill-current" />
              Онлайн
            </Badge>
          </div>
        </div>
      </CardHeader>

      <CardContent className="space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <Label htmlFor="content-type" className="block text-sm font-medium text-foreground mb-2">
              Тип контента
            </Label>
            <Select value={contentType} onValueChange={setContentType}>
              <SelectTrigger id="content-type" data-testid="select-content-type">
                <SelectValue placeholder="Выберите тип контента" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="trading_signal">Торговый сигнал</SelectItem>
                <SelectItem value="market_analysis">Рыночная аналитика</SelectItem>
                <SelectItem value="educational">Обучающий контент</SelectItem>
                <SelectItem value="motivational">Мотивационная цитата</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div>
            <Label className="block text-sm font-medium text-foreground mb-2">
              Целевая платформа
            </Label>
            <div className="flex flex-wrap gap-2">
              {[
                { value: 'all', label: 'Все платформы' },
                { value: 'instagram', label: 'Instagram' },
                { value: 'tiktok', label: 'TikTok' },
                { value: 'youtube', label: 'YouTube' },
                { value: 'telegram', label: 'Telegram' },
              ].map((platform) => (
                <Button
                  key={platform.value}
                  variant={targetPlatforms.includes(platform.value) ? "default" : "outline"}
                  size="sm"
                  onClick={() => handlePlatformToggle(platform.value)}
                  data-testid={`button-platform-${platform.value}`}
                >
                  {platform.label}
                </Button>
              ))}
            </div>
          </div>
        </div>

        <div>
          <Label htmlFor="prompt" className="block text-sm font-medium text-foreground mb-2">
            Дополнительный контекст
          </Label>
          <Textarea
            id="prompt"
            className="resize-none"
            rows={3}
            placeholder="Опишите тему для генерации контента..."
            value={prompt}
            onChange={(e) => setPrompt(e.target.value)}
            data-testid="textarea-prompt"
          />
        </div>

        <div className="flex justify-between items-center">
          <div className="flex items-center gap-4">
            <div className="text-sm">
              <span className="text-muted-foreground">API кредиты:</span>
              <span className="font-medium text-foreground" data-testid="text-api-credits">
                847/1000
              </span>
            </div>
            <div className="w-24 bg-secondary rounded-full h-2">
              <div className="bg-primary h-2 rounded-full" style={{ width: '84.7%' }}></div>
            </div>
          </div>
          <Button
            className="bg-gradient-to-r from-purple-500 to-pink-500 text-white font-medium hover:from-purple-600 hover:to-pink-600"
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

        {generatedContent && (
          <div className="mt-4 p-4 bg-muted rounded-lg border-l-4 border-primary">
            <h4 className="font-medium text-foreground mb-2">Предпросмотр сгенерированного контента:</h4>
            <p className="text-sm text-muted-foreground mb-3" data-testid="text-generated-content">
              {generatedContent}
            </p>
            <div className="flex gap-2">
              <Button 
                size="sm" 
                className="bg-primary text-primary-foreground hover:bg-primary/90"
                data-testid="button-post-instagram"
              >
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
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
