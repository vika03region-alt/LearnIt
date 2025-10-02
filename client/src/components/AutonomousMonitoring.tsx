
import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { 
  Activity,
  Cpu,
  HardDrive,
  Zap,
  TrendingUp,
  AlertTriangle
} from "lucide-react";

interface SystemHealth {
  cpu_usage: number;
  memory_usage: number;
  disk_usage: number;
  active_processes: number;
  error_rate: number;
  performance_score: number;
}

interface SystemReport {
  health: SystemHealth | null;
  metrics: any;
  recommendations: string[];
  uptime: number;
}

export default function AutonomousMonitoring() {
  const [report, setReport] = useState<SystemReport | null>(null);

  useEffect(() => {
    fetchReport();
    const interval = setInterval(fetchReport, 30000); // Каждые 30 сек
    return () => clearInterval(interval);
  }, []);

  const fetchReport = async () => {
    try {
      const response = await fetch('/api/autonomous/status');
      const data = await response.json();
      if (data.systemReport) {
        setReport(data.systemReport);
      }
    } catch (error) {
      console.error('Ошибка получения отчета:', error);
    }
  };

  const getHealthColor = (value: number) => {
    if (value < 50) return 'text-green-600';
    if (value < 80) return 'text-yellow-600';
    return 'text-red-600';
  };

  if (!report || !report.health) {
    return (
      <Card>
        <CardContent className="py-8 text-center text-muted-foreground">
          Мониторинг не активен
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      {/* Метрики системы */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Activity className="w-5 h-5" />
            Здоровье системы
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-3 gap-4">
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Cpu className="w-4 h-4" />
                  <span className="text-sm font-medium">CPU</span>
                </div>
                <span className={`text-sm font-bold ${getHealthColor(report.health.cpu_usage)}`}>
                  {report.health.cpu_usage.toFixed(1)}%
                </span>
              </div>
              <Progress value={report.health.cpu_usage} />
            </div>

            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Zap className="w-4 h-4" />
                  <span className="text-sm font-medium">Память</span>
                </div>
                <span className={`text-sm font-bold ${getHealthColor(report.health.memory_usage)}`}>
                  {report.health.memory_usage.toFixed(1)}%
                </span>
              </div>
              <Progress value={report.health.memory_usage} />
            </div>

            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <HardDrive className="w-4 h-4" />
                  <span className="text-sm font-medium">Диск</span>
                </div>
                <span className={`text-sm font-bold ${getHealthColor(report.health.disk_usage)}`}>
                  {report.health.disk_usage.toFixed(1)}%
                </span>
              </div>
              <Progress value={report.health.disk_usage} />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4 pt-4 border-t">
            <div className="text-center">
              <div className="text-2xl font-bold text-purple-600">
                {report.health.performance_score.toFixed(0)}
              </div>
              <div className="text-sm text-muted-foreground">Производительность</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-blue-600">
                {Math.floor(report.uptime / 60)}м
              </div>
              <div className="text-sm text-muted-foreground">Время работы</div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Рекомендации */}
      {report.recommendations && report.recommendations.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <TrendingUp className="w-5 h-5" />
              Рекомендации
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {report.recommendations.map((rec, index) => (
                <div key={index} className="flex items-start gap-2 p-2 bg-yellow-50 rounded border border-yellow-200">
                  <AlertTriangle className="w-4 h-4 text-yellow-600 mt-0.5" />
                  <span className="text-sm">{rec}</span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
