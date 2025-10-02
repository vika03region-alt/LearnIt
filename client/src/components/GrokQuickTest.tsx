
import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { Brain, Loader2, CheckCircle, XCircle } from "lucide-react";
import { toast } from "@/hooks/use-toast";

export default function GrokQuickTest() {
  const [isTestingGrok, setIsTestingGrok] = useState(false);
  const [grokResult, setGrokResult] = useState<string>("");
  const [testPrompt, setTestPrompt] = useState("Создай короткий пост для трейдеров про анализ рынка");

  const testGrokAPI = async () => {
    setIsTestingGrok(true);
    try {
      const response = await fetch('/api/grok/test', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ prompt: testPrompt })
      });

      const data = await response.json();
      
      if (response.ok) {
        setGrokResult(data.result || data.message);
        toast({
          title: "✅ Grok API работает!",
          description: "Успешно получен ответ от Grok AI",
        });
      } else {
        setGrokResult(`Ошибка: ${data.error || 'Неизвестная ошибка'}`);
        toast({
          title: "❌ Ошибка Grok API",
          description: data.error || "Проверьте API ключ",
          variant: "destructive",
        });
      }
    } catch (error) {
      setGrokResult(`Ошибка подключения: ${error}`);
      toast({
        title: "❌ Ошибка сети",
        description: "Не удалось подключиться к Grok API",
        variant: "destructive",
      });
    } finally {
      setIsTestingGrok(false);
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Brain className="w-5 h-5" />
          🧠 Быстрый тест Grok AI
          <Badge variant={grokResult && !grokResult.includes('Ошибка') ? 'default' : 'secondary'}>
            {grokResult && !grokResult.includes('Ошибка') ? (
              <><CheckCircle className="w-3 h-3 mr-1" /> Работает</>
            ) : (
              <><XCircle className="w-3 h-3 mr-1" /> Не тестировался</>
            )}
          </Badge>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div>
          <label className="block text-sm font-medium mb-2">
            Тестовый промпт:
          </label>
          <Textarea
            value={testPrompt}
            onChange={(e) => setTestPrompt(e.target.value)}
            placeholder="Введите текст для тестирования Grok AI..."
            rows={3}
          />
        </div>

        <Button
          onClick={testGrokAPI}
          disabled={isTestingGrok || !testPrompt.trim()}
          className="w-full"
        >
          {isTestingGrok ? (
            <>
              <Loader2 className="w-4 h-4 mr-2 animate-spin" />
              Тестируем Grok AI...
            </>
          ) : (
            <>
              <Brain className="w-4 h-4 mr-2" />
              Протестировать Grok API
            </>
          )}
        </Button>

        {grokResult && (
          <div className={`p-4 rounded-lg border ${
            grokResult.includes('Ошибка') ? 'bg-red-50 border-red-200' : 'bg-green-50 border-green-200'
          }`}>
            <h4 className="font-medium mb-2">Результат теста:</h4>
            <pre className="text-sm whitespace-pre-wrap">{grokResult}</pre>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
