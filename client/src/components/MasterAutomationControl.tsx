
import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Button } from './ui/button';
import { Badge } from './ui/badge';
import { Switch } from './ui/switch';
import { Progress } from './ui/progress';
import { 
  Power, 
  Zap, 
  Settings, 
  AlertCircle,
  CheckCircle,
  Clock,
  TrendingUp,
  Pause,
  Play
} from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

export function MasterAutomationControl() {
  const [automationStatus, setAutomationStatus] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    fetchAutomationStatus();
    const interval = setInterval(fetchAutomationStatus, 5000);
    return () => clearInterval(interval);
  }, []);

  const fetchAutomationStatus = async () => {
    try {
      const response = await fetch('/api/automation/status');
      const data = await response.json();
      setAutomationStatus(data);
    } catch (error) {
      console.error('Error fetching automation status:', error);
    }
  };

  const toggleAutomation = async () => {
    setIsLoading(true);
    try {
      const endpoint = automationStatus?.isActive 
        ? '/api/scheduler/emergency-stop' 
        : '/api/automation/start';
      
      const response = await fetch(endpoint, { method: 'POST' });
      
      if (response.ok) {
        toast({
          title: automationStatus?.isActive ? "⏸️ Автоматизация остановлена" : "▶️ Автоматизация запущена",
          description: automationStatus?.isActive 
            ? "Все автоматические процессы приостановлены" 
            : "Система работает в автоматическом режиме",
        });
        fetchAutomationStatus();
      }
    } catch (error) {
      toast({
        title: "Ошибка",
        description: "Не удалось изменить статус автоматизации",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      <Card className="border-purple-200 bg-gradient-to-br from-purple-50 to-indigo-50">
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <span className="flex items-center gap-2">
              <Zap className="w-6 h-6 text-purple-600" />
              Мастер Автоматизации
            </span>
            <Badge variant={automationStatus?.isActive ? "default" : "secondary"}>
              {automationStatus?.isActive ? "Активна" : "Остановлена"}
            </Badge>
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Main Control */}
          <div className="flex items-center justify-between p-4 bg-white rounded-lg shadow-sm">
            <div className="flex items-center gap-4">
              {automationStatus?.isActive ? (
                <Play className="w-8 h-8 text-green-600" />
              ) : (
                <Pause className="w-8 h-8 text-gray-400" />
              )}
              <div>
                <h3 className="font-semibold text-lg">Автоматический режим</h3>
                <p className="text-sm text-gray-600">
                  {automationStatus?.isActive 
                    ? `Запланировано задач: ${automationStatus?.scheduledJobs || 0}` 
                    : "Система в ручном режиме"}
                </p>
              </div>
            </div>
            <Switch
              checked={automationStatus?.isActive || false}
              onCheckedChange={toggleAutomation}
              disabled={isLoading}
            />
          </div>

          {/* Stats Grid */}
          <div className="grid grid-cols-3 gap-4">
            <Card>
              <CardContent className="pt-6 text-center">
                <Clock className="w-8 h-8 text-blue-600 mx-auto mb-2" />
                <p className="text-2xl font-bold">{automationStatus?.scheduledJobs || 0}</p>
                <p className="text-xs text-gray-600">Запланировано</p>
              </CardContent>
            </Card>
            
            <Card>
              <CardContent className="pt-6 text-center">
                <CheckCircle className="w-8 h-8 text-green-600 mx-auto mb-2" />
                <p className="text-2xl font-bold">{automationStatus?.completedToday || 0}</p>
                <p className="text-xs text-gray-600">Выполнено сегодня</p>
              </CardContent>
            </Card>
            
            <Card>
              <CardContent className="pt-6 text-center">
                <TrendingUp className="w-8 h-8 text-purple-600 mx-auto mb-2" />
                <p className="text-2xl font-bold">{automationStatus?.successRate || 0}%</p>
                <p className="text-xs text-gray-600">Успешность</p>
              </CardContent>
            </Card>
          </div>

          {/* Emergency Stop */}
          {automationStatus?.isActive && (
            <Button 
              variant="destructive" 
              className="w-full"
              onClick={toggleAutomation}
              disabled={isLoading}
            >
              <AlertCircle className="w-4 h-4 mr-2" />
              Аварийная остановка
            </Button>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
