
import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { 
  Bot, 
  Play, 
  Square, 
  Zap, 
  Brain, 
  Cpu, 
  Code, 
  Loader2,
  CheckCircle,
  AlertTriangle,
  Activity
} from "lucide-react";
import { toast } from "@/hooks/use-toast";

interface AutonomousStatus {
  isActive: boolean;
  currentCycle: number;
  improvementsCount: number;
  recentHistory: Array<{
    cycle: number;
    feature: string;
    timestamp: string;
    status: 'completed' | 'failed';
  }>;
}

export default function AutonomousAIControl() {
  const [status, setStatus] = useState<AutonomousStatus | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isEnhancing, setIsEnhancing] = useState(false);

  useEffect(() => {
    fetchStatus();
    // Обновляем статус каждые 30 секунд
    const interval = setInterval(fetchStatus, 30000);
    return () => clearInterval(interval);
  }, []);

  const fetchStatus = async () => {
    try {
      const response = await fetch('/api/autonomous/status');
      const data = await response.json();
      setStatus(data.status);
    } catch (error) {
      console.error('Ошибка получения статуса:', error);
    }
  };

  const startAutonomous = async () => {
    setIsLoading(true);
    try {
      const response = await fetch('/api/autonomous/start', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' }
      });

      const result = await response.json();

      if (response.ok) {
        toast({
          title: "🤖 Автономная AI запущена!",
          description: "Система начнет самостоятельно развиваться и улучшаться",
        });
        await fetchStatus();
      } else {
        throw new Error(result.error);
      }
    } catch (error) {
      toast({
        title: "Ошибка запуска",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const stopAutonomous = async () => {
    setIsLoading(true);
    try {
      const response = await fetch('/api/autonomous/stop', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' }
      });

      const result = await response.json();

      if (response.ok) {
        toast({
          title: "🛑 Автономная AI остановлена",
          description: "Система прекратила автономное развитие",
        });
        await fetchStatus();
      } else {
        throw new Error(result.error);
      }
    } catch (error) {
      toast({
        title: "Ошибка остановки",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const enhanceAI = async () => {
    setIsEnhancing(true);
    try {
      const response = await fetch('/api/autonomous/enhance-ai', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' }
      });

      const result = await response.json();

      if (response.ok) {
        toast({
          title: "🧠 Улучшение AI запущено!",
          description: "Система улучшает свои AI возможности",
        });
      } else {
        throw new Error(result.error);
      }
    } catch (error) {
      toast({
        title: "Ошибка улучшения",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setIsEnhancing(false);
    }
  };

  const getStatusColor = (isActive: boolean) => {
    return isActive ? 'bg-green-500' : 'bg-gray-400';
  };

  const getStatusText = (isActive: boolean) => {
    return isActive ? 'Активна' : 'Остановлена';
  };

  return (
    <div className="space-y-6">
      {/* Основная панель управления */}
      <Card className="bg-gradient-to-br from-purple-50 to-blue-50 border-purple-200">
        <CardHeader>
          <CardTitle className="flex items-center gap-3">
            <div className="relative">
              <Bot className="w-8 h-8 text-purple-600" />
              {status?.isActive && (
                <div className="absolute -top-1 -right-1 w-3 h-3 bg-green-500 rounded-full animate-pulse"></div>
              )}
            </div>
            <div>
              <h3 className="text-xl font-bold">🤖 Автономная AI Система</h3>
              <p className="text-sm text-muted-foreground font-normal">
                Система саморазвития и автономной доработки кода
              </p>
            </div>
            <div className="ml-auto">
              <Badge 
                variant={status?.isActive ? "default" : "secondary"}
                className={`${getStatusColor(status?.isActive || false)} text-white`}
              >
                {getStatusText(status?.isActive || false)}
              </Badge>
            </div>
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Статистика */}
          <div className="grid grid-cols-3 gap-4">
            <div className="text-center p-4 bg-white rounded-lg border">
              <div className="text-2xl font-bold text-purple-600">
                {status?.currentCycle || 0}
              </div>
              <div className="text-sm text-muted-foreground">Циклов развития</div>
            </div>
            <div className="text-center p-4 bg-white rounded-lg border">
              <div className="text-2xl font-bold text-blue-600">
                {status?.improvementsCount || 0}
              </div>
              <div className="text-sm text-muted-foreground">Улучшений</div>
            </div>
            <div className="text-center p-4 bg-white rounded-lg border">
              <div className="text-2xl font-bold text-green-600">
                {status?.recentHistory?.filter(h => h.status === 'completed').length || 0}
              </div>
              <div className="text-sm text-muted-foreground">Успешных</div>
            </div>
          </div>

          {/* Элементы управления */}
          <div className="flex gap-3">
            {!status?.isActive ? (
              <Button
                onClick={startAutonomous}
                disabled={isLoading}
                className="flex-1 bg-gradient-to-r from-green-500 to-emerald-600 hover:from-green-600 hover:to-emerald-700"
              >
                {isLoading ? (
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                ) : (
                  <Play className="w-4 h-4 mr-2" />
                )}
                Запустить Автономную AI
              </Button>
            ) : (
              <Button
                onClick={stopAutonomous}
                disabled={isLoading}
                variant="destructive"
                className="flex-1"
              >
                {isLoading ? (
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                ) : (
                  <Square className="w-4 h-4 mr-2" />
                )}
                Остановить AI
              </Button>
            )}

            <Button
              onClick={enhanceAI}
              disabled={isEnhancing}
              variant="outline"
              className="border-purple-200 hover:bg-purple-50"
            >
              {isEnhancing ? (
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
              ) : (
                <Zap className="w-4 h-4 mr-2" />
              )}
              Улучшить AI
            </Button>
          </div>

          {/* Прогресс (если активна) */}
          {status?.isActive && (
            <div className="space-y-2">
              <div className="flex justify-between items-center">
                <span className="text-sm font-medium">Автономное развитие активно</span>
                <Activity className="w-4 h-4 text-green-500 animate-pulse" />
              </div>
              <Progress value={75} className="h-2" />
              <p className="text-xs text-muted-foreground">
                Система анализирует код, планирует улучшения и реализует их автономно
              </p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* История улучшений */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Code className="w-5 h-5" />
            История автономных улучшений
          </CardTitle>
        </CardHeader>
        <CardContent>
          {status?.recentHistory && status.recentHistory.length > 0 ? (
            <div className="space-y-3">
              {status.recentHistory.slice().reverse().map((item, index) => (
                <div key={index} className="flex items-center justify-between p-3 border rounded-lg">
                  <div className="flex items-center gap-3">
                    {item.status === 'completed' ? (
                      <CheckCircle className="w-5 h-5 text-green-500" />
                    ) : (
                      <AlertTriangle className="w-5 h-5 text-red-500" />
                    )}
                    <div>
                      <div className="font-medium">{item.feature}</div>
                      <div className="text-sm text-muted-foreground">
                        Цикл {item.cycle} • {new Date(item.timestamp).toLocaleString()}
                      </div>
                    </div>
                  </div>
                  <Badge variant={item.status === 'completed' ? 'default' : 'destructive'}>
                    {item.status === 'completed' ? 'Успешно' : 'Ошибка'}
                  </Badge>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-8 text-muted-foreground">
              <Bot className="w-12 h-12 mx-auto mb-4 opacity-50" />
              <p>История улучшений появится после запуска автономной AI</p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Возможности системы */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Brain className="w-5 h-5" />
            Возможности автономной AI
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <h4 className="font-medium flex items-center gap-2">
                <Cpu className="w-4 h-4" />
                Анализ и улучшение
              </h4>
              <ul className="text-sm text-muted-foreground space-y-1">
                <li>• Автоматический анализ кода</li>
                <li>• Обнаружение проблем и багов</li>
                <li>• Оптимизация производительности</li>
                <li>• Рефакторинг устаревшего кода</li>
              </ul>
            </div>
            <div className="space-y-2">
              <h4 className="font-medium flex items-center gap-2">
                <Zap className="w-4 h-4" />
                Автономная разработка
              </h4>
              <ul className="text-sm text-muted-foreground space-y-1">
                <li>• Создание новых функций</li>
                <li>• Добавление интеграций</li>
                <li>• Улучшение UI/UX</li>
                <li>• Обновление зависимостей</li>
              </ul>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
