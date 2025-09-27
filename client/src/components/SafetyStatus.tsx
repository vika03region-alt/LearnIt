import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Shield, ShieldCheck, AlertTriangle, XCircle } from "lucide-react";

interface SafetyStatusProps {
  status: {
    overall: 'safe' | 'warning' | 'critical';
    platforms: {
      [platformId: number]: {
        status: 'safe' | 'warning' | 'critical';
        rateLimitUsage: number;
        maxLimit: number;
        percentage: number;
        lastAction: Date | null;
      };
    };
    recommendations: string[];
  };
}

export default function SafetyStatus({ status }: SafetyStatusProps) {
  const getStatusConfig = () => {
    switch (status.overall) {
      case 'safe':
        return {
          icon: <ShieldCheck className="text-white" />,
          bgClass: 'from-green-50 to-blue-50',
          borderClass: 'border-green-200',
          iconBgClass: 'bg-green-500',
          titleClass: 'text-green-900',
          descClass: 'text-green-700',
          badgeClass: 'bg-green-100 text-green-800',
          badgeText: 'ЗАЩИЩЕНО',
          buttonClass: 'bg-green-600 hover:bg-green-700',
          title: 'Все системы под надёжной защитой',
        };
      case 'warning':
        return {
          icon: <AlertTriangle className="text-white" />,
          bgClass: 'from-yellow-50 to-orange-50',
          borderClass: 'border-yellow-200',
          iconBgClass: 'bg-yellow-500',
          titleClass: 'text-yellow-900',
          descClass: 'text-yellow-700',
          badgeClass: 'bg-yellow-100 text-yellow-800',
          badgeText: 'ВНИМАНИЕ',
          buttonClass: 'bg-yellow-600 hover:bg-yellow-700',
          title: 'Дозволенные пределы приближаются к исчерпанию',
        };
      case 'critical':
        return {
          icon: <XCircle className="text-white" />,
          bgClass: 'from-red-50 to-pink-50',
          borderClass: 'border-red-200',
          iconBgClass: 'bg-red-500',
          titleClass: 'text-red-900',
          descClass: 'text-red-700',
          badgeClass: 'bg-red-100 text-red-800',
          badgeText: 'ЭКСТРЕННО',
          buttonClass: 'bg-red-600 hover:bg-red-700',
          title: 'Критические пределы салона достигнуты',
        };
      default:
        return {
          icon: <Shield className="text-white" />,
          bgClass: 'from-gray-50 to-slate-50',
          borderClass: 'border-gray-200',
          iconBgClass: 'bg-gray-500',
          titleClass: 'text-gray-900',
          descClass: 'text-gray-700',
          badgeClass: 'bg-gray-100 text-gray-800',
          badgeText: 'НЕИЗВЕСТНО',
          buttonClass: 'bg-gray-600 hover:bg-gray-700',
          title: 'Статус безопасности неизвестен',
        };
    }
  };

  const config = getStatusConfig();

  const generateRateLimitDescription = () => {
    const platformNames: { [key: number]: string } = {
      1: 'Instagram',
      2: 'TikTok', 
      3: 'YouTube',
      4: 'Telegram'
    };

    const descriptions = Object.entries(status.platforms).map(([platformId, data]) => {
      const name = platformNames[parseInt(platformId)] || `Платформа ${platformId}`;
      return `${Math.round(data.percentage)}% ${name}`;
    });

    return `Лимиты: ${descriptions.join(', ')}`;
  };

  return (
    <Card 
      className={`bg-gradient-to-r ${config.bgClass} border ${config.borderClass}`}
      data-testid="safety-status-banner"
    >
      <CardContent className="p-4">
        <div className="flex items-center gap-3">
          <div className={`w-10 h-10 ${config.iconBgClass} rounded-full flex items-center justify-center`}>
            {config.icon}
          </div>
          <div className="flex-1">
            <h3 className={`font-semibold ${config.titleClass}`}>{config.title}</h3>
            <p className={`text-sm ${config.descClass}`}>
              {generateRateLimitDescription()}
            </p>
          </div>
          <div className="flex gap-2">
            <Badge className={config.badgeClass} data-testid="safety-status-badge">
              {config.badgeText}
            </Badge>
            <Button 
              className={`text-white text-sm font-medium ${config.buttonClass}`}
              data-testid="button-view-safety-details"
            >
              Подробнее
            </Button>
          </div>
        </div>
        
        {status.recommendations.length > 0 && (
          <div className="mt-3 pt-3 border-t border-current/20">
            <div className="space-y-1">
              {status.recommendations.slice(0, 2).map((recommendation, index) => (
                <p key={index} className={`text-xs ${config.descClass}`}>
                  • {recommendation}
                </p>
              ))}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
