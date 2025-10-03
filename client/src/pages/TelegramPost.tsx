
import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Send, Image, Video, Calendar, Zap } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { ObjectUploader } from '@/components/ObjectUploader';

export default function TelegramPost() {
  const [content, setContent] = useState('');
  const [scheduledTime, setScheduledTime] = useState('');
  const [isPosting, setIsPosting] = useState(false);
  const { toast } = useToast();

  const postToTelegram = async (immediate = true) => {
    if (!content.trim()) {
      toast({
        title: "Ошибка",
        description: "Введите текст сообщения",
        variant: "destructive",
      });
      return;
    }

    setIsPosting(true);
    try {
      const endpoint = immediate ? '/api/telegram/post' : '/api/telegram/schedule';
      const response = await fetch(endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          content,
          scheduledTime: immediate ? null : scheduledTime,
        }),
      });

      if (response.ok) {
        toast({
          title: immediate ? "✅ Опубликовано!" : "⏰ Запланировано!",
          description: immediate 
            ? "Сообщение отправлено в Telegram канал" 
            : `Публикация запланирована на ${scheduledTime}`,
        });
        setContent('');
        setScheduledTime('');
      } else {
        throw new Error('Failed to post');
      }
    } catch (error) {
      toast({
        title: "Ошибка",
        description: "Не удалось опубликовать сообщение",
        variant: "destructive",
      });
    } finally {
      setIsPosting(false);
    }
  };

  return (
    <div className="space-y-6 p-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold">📱 Telegram Автопостинг</h1>
        <Badge variant="secondary">@IIPRB</Badge>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Send className="w-5 h-5" />
            Создать пост
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <Textarea
            placeholder="Введите текст сообщения для Telegram канала..."
            value={content}
            onChange={(e) => setContent(e.target.value)}
            rows={6}
            className="resize-none"
          />

          <ObjectUploader />

          <div className="flex gap-4">
            <Button
              onClick={() => postToTelegram(true)}
              disabled={isPosting}
              className="flex-1"
            >
              <Zap className="w-4 h-4 mr-2" />
              Опубликовать сейчас
            </Button>

            <div className="flex-1 flex gap-2">
              <Input
                type="datetime-local"
                value={scheduledTime}
                onChange={(e) => setScheduledTime(e.target.value)}
                className="flex-1"
              />
              <Button
                onClick={() => postToTelegram(false)}
                disabled={isPosting || !scheduledTime}
                variant="outline"
              >
                <Calendar className="w-4 h-4 mr-2" />
                Запланировать
              </Button>
            </div>
          </div>

          <div className="flex flex-wrap gap-2 pt-4 border-t">
            <Button size="sm" variant="ghost">
              <Image className="w-4 h-4 mr-2" />
              Добавить фото
            </Button>
            <Button size="sm" variant="ghost">
              <Video className="w-4 h-4 mr-2" />
              Добавить видео
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
