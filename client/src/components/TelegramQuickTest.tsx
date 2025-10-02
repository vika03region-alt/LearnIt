
import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { toast } from "@/hooks/use-toast";
import { Send, Loader2, CheckCircle, XCircle, Bot } from "lucide-react";
import { SiTelegram } from "react-icons/si";

export default function TelegramQuickTest() {
  const [isTesting, setIsTesting] = useState(false);
  const [testResults, setTestResults] = useState<{
    botTokenValid: boolean;
    channelAccessible: boolean;
    messageSent: boolean;
    error?: string;
  } | null>(null);

  const runQuickTest = async () => {
    setIsTesting(true);
    setTestResults(null);

    try {
      // Проверка наличия секрета (через API)
      const response = await fetch('/api/telegram/quick-test', {
        method: 'POST',
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Тест не пройден');
      }

      setTestResults(data);

      if (data.messageSent) {
        toast({
          title: "✅ Telegram подключен!",
          description: "Тестовое сообщение успешно отправлено в канал",
        });
      } else {
        toast({
          title: "⚠️ Проблема с Telegram",
          description: data.error || "Проверьте настройки",
          variant: "destructive",
        });
      }
    } catch (error: any) {
      setTestResults({
        botTokenValid: false,
        channelAccessible: false,
        messageSent: false,
        error: error.message,
      });
      toast({
        title: "❌ Ошибка тестирования",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setIsTesting(false);
    }
  };

  return (
    <Card className="border-blue-200 bg-gradient-to-br from-blue-50 to-white">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <SiTelegram className="w-6 h-6 text-blue-500" />
          Быстрое тестирование Telegram
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <p className="font-medium">Статус интеграции</p>
            <p className="text-sm text-muted-foreground">
              Проверка Bot Token и доступа к каналу
            </p>
          </div>
          <Button
            onClick={runQuickTest}
            disabled={isTesting}
            size="lg"
          >
            {isTesting ? (
              <Loader2 className="w-4 h-4 mr-2 animate-spin" />
            ) : (
              <Send className="w-4 h-4 mr-2" />
            )}
            {isTesting ? 'Тестирование...' : 'Запустить тест'}
          </Button>
        </div>

        {testResults && (
          <div className="space-y-2 pt-4 border-t">
            <div className="flex items-center justify-between">
              <span className="text-sm">Bot Token валиден</span>
              {testResults.botTokenValid ? (
                <Badge variant="default" className="gap-1">
                  <CheckCircle className="w-3 h-3" />
                  Да
                </Badge>
              ) : (
                <Badge variant="destructive" className="gap-1">
                  <XCircle className="w-3 h-3" />
                  Нет
                </Badge>
              )}
            </div>

            <div className="flex items-center justify-between">
              <span className="text-sm">Доступ к каналу</span>
              {testResults.channelAccessible ? (
                <Badge variant="default" className="gap-1">
                  <CheckCircle className="w-3 h-3" />
                  Да
                </Badge>
              ) : (
                <Badge variant="destructive" className="gap-1">
                  <XCircle className="w-3 h-3" />
                  Нет
                </Badge>
              )}
            </div>

            <div className="flex items-center justify-between">
              <span className="text-sm">Сообщение отправлено</span>
              {testResults.messageSent ? (
                <Badge variant="default" className="gap-1">
                  <CheckCircle className="w-3 h-3" />
                  Да
                </Badge>
              ) : (
                <Badge variant="destructive" className="gap-1">
                  <XCircle className="w-3 h-3" />
                  Нет
                </Badge>
              )}
            </div>

            {testResults.error && (
              <div className="p-3 bg-red-50 border border-red-200 rounded text-sm text-red-700">
                <strong>Ошибка:</strong> {testResults.error}
              </div>
            )}
          </div>
        )}

        <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 text-xs">
          <p className="font-medium mb-1">📋 Требуется:</p>
          <ul className="list-disc list-inside space-y-1 text-muted-foreground">
            <li>TELEGRAM_BOT_TOKEN в секретах</li>
            <li>TELEGRAM_CHANNEL_ID в секретах</li>
            <li>Бот добавлен в канал как администратор</li>
          </ul>
        </div>
      </CardContent>
    </Card>
  );
}
