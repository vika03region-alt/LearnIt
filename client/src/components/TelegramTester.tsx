
import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { toast } from "@/hooks/use-toast";
import { Send, Loader2, CheckCircle, XCircle } from "lucide-react";
import { SiTelegram } from "react-icons/si";

export default function TelegramTester() {
  const [botToken, setBotToken] = useState('');
  const [chatId, setChatId] = useState('');
  const [message, setMessage] = useState('📊 Тестовое сообщение от системы продвижения!\n\n✅ Если вы видите это, интеграция работает корректно.');
  const [isTesting, setIsTesting] = useState(false);
  const [testResult, setTestResult] = useState<{ success: boolean; message: string } | null>(null);

  const testTelegramConnection = async () => {
    if (!botToken || !chatId) {
      toast({
        title: "Ошибка",
        description: "Укажите Bot Token и Chat ID",
        variant: "destructive",
      });
      return;
    }

    setIsTesting(true);
    setTestResult(null);

    try {
      // Проверка бота
      const botResponse = await fetch(`https://api.telegram.org/bot${botToken}/getMe`);
      const botData = await botResponse.json();

      if (!botData.ok) {
        throw new Error('Неверный Bot Token');
      }

      // Отправка тестового сообщения
      const sendResponse = await fetch(`https://api.telegram.org/bot${botToken}/sendMessage`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          chat_id: chatId,
          text: message,
          parse_mode: 'HTML',
        }),
      });

      const sendData = await sendResponse.json();

      if (sendData.ok) {
        setTestResult({
          success: true,
          message: `Сообщение успешно отправлено! ID: ${sendData.result.message_id}`,
        });
        toast({
          title: "✅ Успех!",
          description: "Telegram интеграция работает корректно",
        });
      } else {
        throw new Error(sendData.description || 'Ошибка отправки');
      }
    } catch (error) {
      setTestResult({
        success: false,
        message: error.message || 'Произошла ошибка',
      });
      toast({
        title: "Ошибка тестирования",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setIsTesting(false);
    }
  };

  const saveTelegramConfig = async () => {
    if (!botToken || !chatId) {
      toast({
        title: "Ошибка",
        description: "Укажите Bot Token и Chat ID",
        variant: "destructive",
      });
      return;
    }

    try {
      const response = await fetch('/api/user-accounts', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          platformId: 4, // Telegram
          accountHandle: chatId,
          accessToken: botToken,
          platformConfig: {
            channelUsername: chatId,
          },
          isActive: true,
          authStatus: 'connected',
        }),
      });

      if (response.ok) {
        toast({
          title: "✅ Сохранено!",
          description: "Telegram аккаунт успешно добавлен",
        });
      } else {
        throw new Error('Ошибка сохранения');
      }
    } catch (error) {
      toast({
        title: "Ошибка сохранения",
        description: error.message,
        variant: "destructive",
      });
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <SiTelegram className="w-6 h-6 text-blue-500" />
          Тестирование Telegram канала
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-2">
          <label className="text-sm font-medium">Bot Token</label>
          <Input
            type="password"
            placeholder="1234567890:ABCdefGHIjklMNOpqrsTUVwxyz"
            value={botToken}
            onChange={(e) => setBotToken(e.target.value)}
          />
          <p className="text-xs text-muted-foreground">
            Получите токен у @BotFather в Telegram
          </p>
        </div>

        <div className="space-y-2">
          <label className="text-sm font-medium">Chat ID / Username</label>
          <Input
            placeholder="@your_channel или -1001234567890"
            value={chatId}
            onChange={(e) => setChatId(e.target.value)}
          />
          <p className="text-xs text-muted-foreground">
            ID канала или username с @
          </p>
        </div>

        <div className="space-y-2">
          <label className="text-sm font-medium">Тестовое сообщение</label>
          <Textarea
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            rows={4}
          />
        </div>

        {testResult && (
          <div className={`p-3 rounded-lg border ${testResult.success ? 'bg-green-50 border-green-200' : 'bg-red-50 border-red-200'}`}>
            <div className="flex items-center gap-2">
              {testResult.success ? (
                <CheckCircle className="w-5 h-5 text-green-600" />
              ) : (
                <XCircle className="w-5 h-5 text-red-600" />
              )}
              <span className={testResult.success ? 'text-green-700' : 'text-red-700'}>
                {testResult.message}
              </span>
            </div>
          </div>
        )}

        <div className="flex gap-2">
          <Button
            onClick={testTelegramConnection}
            disabled={isTesting || !botToken || !chatId}
            className="flex-1"
          >
            {isTesting ? (
              <Loader2 className="w-4 h-4 mr-2 animate-spin" />
            ) : (
              <Send className="w-4 h-4 mr-2" />
            )}
            Тестировать
          </Button>

          <Button
            onClick={saveTelegramConfig}
            disabled={!testResult?.success}
            variant="outline"
          >
            Сохранить конфигурацию
          </Button>
        </div>

        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
          <h4 className="font-medium text-sm mb-2">📝 Инструкция:</h4>
          <ol className="text-sm space-y-1 text-muted-foreground">
            <li>1. Создайте бота через @BotFather в Telegram</li>
            <li>2. Получите Bot Token</li>
            <li>3. Добавьте бота в свой канал как администратора</li>
            <li>4. Узнайте Chat ID канала (можно через @userinfobot)</li>
            <li>5. Введите данные выше и нажмите "Тестировать"</li>
          </ol>
        </div>
      </CardContent>
    </Card>
  );
}
