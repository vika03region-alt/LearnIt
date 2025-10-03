import { useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import { apiRequest } from '@/lib/queryClient';
import { 
  Rocket, 
  StopCircle, 
  Activity, 
  CheckCircle2,
  Clock,
  Zap,
  TrendingUp,
  Users,
  DollarSign,
  BarChart3
} from 'lucide-react';
import { isUnauthorizedError } from '@/lib/authUtils';

interface AutomationStatus {
  isActive: boolean;
  config?: any;
  scheduledJobs: number;
  safetyStatus: string;
  nextRun: string | null;
}

export default function MasterAutomationControl() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [isStarting, setIsStarting] = useState(false);

  const { data: automationStatus, isLoading } = useQuery<AutomationStatus>({
    queryKey: ['/api/automation/status'],
    refetchInterval: 5000,
    retry: false,
  });

  const startAutomationMutation = useMutation({
    mutationFn: async () => {
      setIsStarting(true);
      const response = await apiRequest('POST', '/api/automation/start', {});
      return await response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/automation/status'] });
      queryClient.invalidateQueries({ queryKey: ['/api/activity'] });
      toast({
        title: '🚀 Полная автоматизация запущена!',
        description: 'Все 10 шагов бизнес-процесса активированы',
      });
      setIsStarting(false);
    },
    onError: (error) => {
      setIsStarting(false);
      if (isUnauthorizedError(error)) {
        window.location.href = "/api/login";
        return;
      }
      toast({
        title: 'Ошибка запуска',
        description: error.message,
        variant: 'destructive',
      });
    },
  });

  const stopAutomationMutation = useMutation({
    mutationFn: async () => {
      const response = await apiRequest('POST', '/api/automation/stop', {});
      return await response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/automation/status'] });
      queryClient.invalidateQueries({ queryKey: ['/api/activity'] });
      toast({
        title: '⏸️ Автоматизация остановлена',
        description: 'Все процессы приостановлены',
      });
    },
    onError: (error) => {
      if (isUnauthorizedError(error)) {
        window.location.href = "/api/login";
        return;
      }
      toast({
        title: 'Ошибка остановки',
        description: error.message,
        variant: 'destructive',
      });
    },
  });

  const features = [
    { icon: TrendingUp, label: 'Сбор данных & Grok AI', color: 'text-blue-500' },
    { icon: Zap, label: 'Генерация контента', color: 'text-purple-500' },
    { icon: Clock, label: 'Автопостинг 3x/день', color: 'text-green-500' },
    { icon: Users, label: 'Вовлечение & квизы', color: 'text-orange-500' },
    { icon: Rocket, label: 'Виральность', color: 'text-pink-500' },
    { icon: DollarSign, label: 'Монетизация VIP', color: 'text-yellow-500' },
    { icon: BarChart3, label: 'Аналитика & A/B', color: 'text-indigo-500' },
  ];

  return (
    <Card className="bg-gradient-to-br from-purple-50 to-blue-50 border-2 border-purple-200">
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="flex items-center gap-2 text-2xl">
              <Rocket className="h-7 w-7 text-purple-600" />
              Мастер-Автоматизация
            </CardTitle>
            <CardDescription className="mt-2">
              Полный цикл автоматизации: от анализа до масштабирования (10 шагов)
            </CardDescription>
          </div>
          {automationStatus?.isActive ? (
            <Badge className="bg-green-500 text-white px-4 py-2 flex items-center gap-2">
              <Activity className="h-4 w-4 animate-pulse" />
              Активна
            </Badge>
          ) : (
            <Badge variant="secondary" className="px-4 py-2">
              Остановлена
            </Badge>
          )}
        </div>
      </CardHeader>

      <CardContent className="space-y-6">
        {/* Features Grid */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          {features.map((feature, index) => (
            <div
              key={index}
              className="flex items-center gap-2 bg-white/70 backdrop-blur-sm p-3 rounded-lg border border-slate-200"
            >
              <feature.icon className={`h-5 w-5 ${feature.color}`} />
              <span className="text-sm font-medium text-slate-700">{feature.label}</span>
            </div>
          ))}
        </div>

        {/* Status Info */}
        {automationStatus && (
          <div className="bg-white/70 backdrop-blur-sm p-4 rounded-lg border border-slate-200 space-y-3">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-center">
              <div>
                <div className="text-sm text-slate-600">Запланировано</div>
                <div className="text-2xl font-bold text-purple-600">
                  {automationStatus.scheduledJobs || 0}
                </div>
              </div>
              <div>
                <div className="text-sm text-slate-600">Безопасность</div>
                <div className="flex items-center justify-center gap-2">
                  {automationStatus.safetyStatus === 'safe' ? (
                    <CheckCircle2 className="h-6 w-6 text-green-500" />
                  ) : (
                    <StopCircle className="h-6 w-6 text-yellow-500" />
                  )}
                  <span className="text-sm font-medium capitalize">
                    {automationStatus.safetyStatus}
                  </span>
                </div>
              </div>
              <div>
                <div className="text-sm text-slate-600">Следующий запуск</div>
                <div className="text-sm font-medium text-slate-700">
                  {automationStatus.nextRun 
                    ? new Date(automationStatus.nextRun).toLocaleTimeString('ru-RU', {
                        hour: '2-digit',
                        minute: '2-digit'
                      })
                    : '—'}
                </div>
              </div>
              <div>
                <div className="text-sm text-slate-600">Статус</div>
                <div className={`text-sm font-medium ${
                  automationStatus.isActive ? 'text-green-600' : 'text-slate-500'
                }`}>
                  {automationStatus.isActive ? 'Работает' : 'Выключена'}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Control Buttons */}
        <div className="flex gap-3">
          <Button
            onClick={() => startAutomationMutation.mutate()}
            disabled={automationStatus?.isActive || startAutomationMutation.isPending || isStarting}
            className="flex-1 bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700 text-white font-semibold py-6 text-lg"
            data-testid="button-start-automation"
          >
            {isStarting ? (
              <>
                <div className="h-5 w-5 border-2 border-white border-t-transparent rounded-full animate-spin mr-2" />
                Запуск...
              </>
            ) : (
              <>
                <Rocket className="h-5 w-5 mr-2" />
                Запустить полную автоматизацию
              </>
            )}
          </Button>

          <Button
            onClick={() => stopAutomationMutation.mutate()}
            disabled={!automationStatus?.isActive || stopAutomationMutation.isPending}
            variant="outline"
            className="px-6 py-6 border-2"
            data-testid="button-stop-automation"
          >
            <StopCircle className="h-5 w-5 mr-2" />
            Остановить
          </Button>
        </div>

        {/* Info */}
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
          <p className="text-sm text-blue-800">
            <strong>Автоматизация включает:</strong> Сбор данных (Grok AI) → Генерация контента 
            (OpenAI + Hugging Face FREE) → Планирование постов → Геймификация → Виральные механики 
            → Монетизация → Аналитика → A/B тесты → Масштабирование
          </p>
        </div>
      </CardContent>
    </Card>
  );
}
