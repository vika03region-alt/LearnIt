
import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Video, Wand2, Download, Play, Sparkles } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

export default function AIVideoStudio() {
  const [prompt, setPrompt] = useState('');
  const [videoUrl, setVideoUrl] = useState('');
  const [isGenerating, setIsGenerating] = useState(false);
  const [progress, setProgress] = useState(0);
  const { toast } = useToast();

  const generateVideo = async () => {
    if (!prompt.trim()) {
      toast({
        title: "Ошибка",
        description: "Введите описание для видео",
        variant: "destructive",
      });
      return;
    }

    setIsGenerating(true);
    setProgress(0);

    const progressInterval = setInterval(() => {
      setProgress(prev => Math.min(prev + 10, 90));
    }, 500);

    try {
      const response = await fetch('/api/ai/generate-video', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ prompt }),
      });

      if (response.ok) {
        const data = await response.json();
        setVideoUrl(data.videoUrl || '/placeholder-video.mp4');
        setProgress(100);
        toast({
          title: "✨ Видео создано!",
          description: "AI сгенерировал ваше видео",
        });
      } else {
        throw new Error('Failed to generate video');
      }
    } catch (error) {
      toast({
        title: "Ошибка",
        description: "Не удалось создать видео",
        variant: "destructive",
      });
      setProgress(0);
    } finally {
      clearInterval(progressInterval);
      setIsGenerating(false);
    }
  };

  return (
    <div className="space-y-6 p-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold flex items-center gap-2">
          <Video className="w-8 h-8" />
          AI Видео Студия
        </h1>
        <Badge variant="secondary">Beta</Badge>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Wand2 className="w-5 h-5" />
              Создание видео
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <Textarea
              placeholder="Опишите видео, которое хотите создать..."
              value={prompt}
              onChange={(e) => setPrompt(e.target.value)}
              rows={6}
            />

            <div className="space-y-2">
              <label className="text-sm font-medium">Стиль видео</label>
              <div className="grid grid-cols-2 gap-2">
                <Button variant="outline" size="sm">🎨 Современный</Button>
                <Button variant="outline" size="sm">💼 Бизнес</Button>
                <Button variant="outline" size="sm">🎵 Музыкальный</Button>
                <Button variant="outline" size="sm">🎮 Игровой</Button>
              </div>
            </div>

            <Button
              onClick={generateVideo}
              disabled={isGenerating}
              className="w-full"
            >
              <Sparkles className="w-4 h-4 mr-2" />
              {isGenerating ? 'Создание...' : 'Создать видео'}
            </Button>

            {isGenerating && (
              <div className="space-y-2">
                <Progress value={progress} />
                <p className="text-sm text-center text-gray-600">
                  Генерация: {progress}%
                </p>
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Play className="w-5 h-5" />
              Предварительный просмотр
            </CardTitle>
          </CardHeader>
          <CardContent>
            {videoUrl ? (
              <div className="space-y-4">
                <div className="aspect-video bg-gray-100 rounded-lg flex items-center justify-center">
                  <Video className="w-16 h-16 text-gray-400" />
                </div>
                <div className="flex gap-2">
                  <Button className="flex-1">
                    <Download className="w-4 h-4 mr-2" />
                    Скачать
                  </Button>
                  <Button variant="outline" className="flex-1">
                    <Send className="w-4 h-4 mr-2" />
                    Опубликовать
                  </Button>
                </div>
              </div>
            ) : (
              <div className="aspect-video bg-gray-100 rounded-lg flex items-center justify-center">
                <div className="text-center text-gray-500">
                  <Video className="w-16 h-16 mx-auto mb-2" />
                  <p>Видео появится здесь</p>
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
