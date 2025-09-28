
import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Button } from './ui/button';
import { Badge } from './ui/badge';
import { Progress } from './ui/progress';
import { 
  Crown, 
  Target, 
  Zap, 
  Shield,
  Sword,
  Trophy,
  Rocket,
  Eye,
  Brain,
  Users,
  TrendingUp,
  AlertTriangle,
  CheckCircle,
  DollarSign
} from 'lucide-react';
import { useToast } from './ui/use-toast';

export function DominationControlCenter() {
  const [dominationMode, setDominationMode] = useState('strategic');
  const [isExecuting, setIsExecuting] = useState(false);
  const { toast } = useToast();

  const dominationPhases = [
    {
      phase: 1,
      name: 'Разведка и Позиционирование',
      status: 'completed',
      progress: 100,
      duration: '30 дней',
      tactics: ['Анализ конкурентов', 'Уникальное позиционирование', 'Создание core контента'],
    },
    {
      phase: 2,
      name: 'Агрессивная Экспансия',
      status: 'active',
      progress: 67,
      duration: '60 дней',
      tactics: ['Мультиплатформенное доминирование', 'Партнерства с инфлюенсерами', 'Вирусные кампании'],
    },
    {
      phase: 3,
      name: 'Консолидация Рынка',
      status: 'pending',
      progress: 0,
      duration: '90 дней',
      tactics: ['Приобретение конкурентов', 'Партнерства с платформами', 'Эксклюзивный контент'],
    },
    {
      phase: 4,
      name: 'Тотальное Доминирование',
      status: 'pending',
      progress: 0,
      duration: '180 дней',
      tactics: ['Лидерство в индустрии', 'Установление стандартов', 'Контроль экосистемы'],
    },
  ];

  const competitorThreats = [
    { name: 'Rayner Teo', threatLevel: 'critical', marketShare: 18.5, action: 'Aggressive Counter' },
    { name: 'Coin Bureau', threatLevel: 'high', marketShare: 12.3, action: 'Strategic Bypass' },
    { name: 'Trading Rush', threatLevel: 'medium', marketShare: 8.7, action: 'Direct Attack' },
    { name: 'Forex Factory', threatLevel: 'low', marketShare: 5.2, action: 'Ignore' },
  ];

  const executeDomination = async (strategy: string) => {
    setIsExecuting(true);
    try {
      const response = await fetch('/api/domination/aggressive-growth', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          clientProfile: {
            name: 'Lucifer Tradera',
            niche: 'trading',
            platforms: ['youtube', 'tiktok', 'instagram', 'telegram'],
          },
        }),
      });

      const result = await response.json();

      if (response.ok) {
        toast({
          title: "👑 Доминирование запущено!",
          description: `Стратегия ${strategy} активирована. Ожидаемый ROI: 500-1000%`,
        });
      } else {
        throw new Error(result.error);
      }
    } catch (error) {
      toast({
        title: "Ошибка доминирования",
        description: "Не удалось запустить стратегию доминирования",
        variant: "destructive",
      });
    } finally {
      setIsExecuting(false);
    }
  };

  const getThreatColor = (level: string) => {
    switch (level) {
      case 'critical': return 'text-red-600 bg-red-100';
      case 'high': return 'text-orange-600 bg-orange-100';
      case 'medium': return 'text-yellow-600 bg-yellow-100';
      case 'low': return 'text-green-600 bg-green-100';
      default: return 'text-gray-600 bg-gray-100';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'completed': return <CheckCircle className="w-4 h-4 text-green-600" />;
      case 'active': return <Zap className="w-4 h-4 text-blue-600 animate-pulse" />;
      case 'pending': return <Target className="w-4 h-4 text-gray-400" />;
      default: return null;
    }
  };

  return (
    <div className="space-y-6">
      {/* Заголовок */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold flex items-center gap-2">
            <Crown className="w-6 h-6 text-amber-600" />
            Центр Доминирования
          </h2>
          <p className="text-gray-600">Полный контроль над рынком и конкурентами</p>
        </div>
        <div className="flex gap-2">
          <Badge className="bg-amber-100 text-amber-800">
            👑 Рыночная Доля: 7.3%
          </Badge>
          <Badge className="bg-red-100 text-red-800">
            ⚔️ Агрессивный Режим
          </Badge>
        </div>
      </div>

      {/* Быстрые действия доминирования */}
      <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card 
          className="border-red-200 bg-gradient-to-r from-red-50 to-pink-50 hover:shadow-lg transition-all cursor-pointer"
          onClick={() => executeDomination('viral-blitz')}
        >
          <CardContent className="p-4">
            <div className="text-center">
              <div className="w-12 h-12 bg-red-500 rounded-full flex items-center justify-center mx-auto mb-2">
                <Zap className="w-6 h-6 text-white" />
              </div>
              <h3 className="font-semibold text-red-800">Viral Blitz</h3>
              <p className="text-xs text-red-600 mt-1">20+ вирусных кампаний за 72 часа</p>
              <div className="mt-2">
                <Badge className="text-xs bg-red-100 text-red-700">ROI: 500-1000%</Badge>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card 
          className="border-purple-200 bg-gradient-to-r from-purple-50 to-violet-50 hover:shadow-lg transition-all cursor-pointer"
          onClick={() => executeDomination('influencer-takeover')}
        >
          <CardContent className="p-4">
            <div className="text-center">
              <div className="w-12 h-12 bg-purple-500 rounded-full flex items-center justify-center mx-auto mb-2">
                <Users className="w-6 h-6 text-white" />
              </div>
              <h3 className="font-semibold text-purple-800">Захват Инфлюенсеров</h3>
              <p className="text-xs text-purple-600 mt-1">Поглощение топ-личностей ниши</p>
              <div className="mt-2">
                <Badge className="text-xs bg-purple-100 text-purple-700">ROI: 300-500%</Badge>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card 
          className="border-orange-200 bg-gradient-to-r from-orange-50 to-yellow-50 hover:shadow-lg transition-all cursor-pointer"
          onClick={() => executeDomination('competitor-poaching')}
        >
          <CardContent className="p-4">
            <div className="text-center">
              <div className="w-12 h-12 bg-orange-500 rounded-full flex items-center justify-center mx-auto mb-2">
                <Sword className="w-6 h-6 text-white" />
              </div>
              <h3 className="font-semibold text-orange-800">Переманивание</h3>
              <p className="text-xs text-orange-600 mt-1">Кража аудитории конкурентов</p>
              <div className="mt-2">
                <Badge className="text-xs bg-orange-100 text-orange-700">ROI: 200-400%</Badge>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card 
          className="border-blue-200 bg-gradient-to-r from-blue-50 to-cyan-50 hover:shadow-lg transition-all cursor-pointer"
          onClick={() => executeDomination('authority-domination')}
        >
          <CardContent className="p-4">
            <div className="text-center">
              <div className="w-12 h-12 bg-blue-500 rounded-full flex items-center justify-center mx-auto mb-2">
                <Trophy className="w-6 h-6 text-white" />
              </div>
              <h3 className="font-semibold text-blue-800">Авторитет</h3>
              <p className="text-xs text-blue-600 mt-1">Установление лидерства в отрасли</p>
              <div className="mt-2">
                <Badge className="text-xs bg-blue-100 text-blue-700">ROI: 1000-2000%</Badge>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Фазы доминирования */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Target className="w-5 h-5 text-blue-600" />
            План Тотального Доминирования
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {dominationPhases.map((phase) => (
              <div key={phase.phase} className="border rounded-lg p-4">
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-3">
                    {getStatusIcon(phase.status)}
                    <div>
                      <h4 className="font-semibold">Фаза {phase.phase}: {phase.name}</h4>
                      <p className="text-sm text-gray-600">{phase.duration}</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="text-lg font-bold">{phase.progress}%</div>
                    <Progress value={phase.progress} className="w-24 h-2" />
                  </div>
                </div>
                <div className="flex flex-wrap gap-2">
                  {phase.tactics.map((tactic, index) => (
                    <Badge key={index} variant="outline" className="text-xs">
                      {tactic}
                    </Badge>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Анализ угроз конкурентов */}
      <div className="grid lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <AlertTriangle className="w-5 h-5 text-red-600" />
              Мониторинг Угроз
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {competitorThreats.map((threat, index) => (
                <div key={index} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                  <div className="flex items-center gap-3">
                    <div className={`w-3 h-3 rounded-full ${
                      threat.threatLevel === 'critical' ? 'bg-red-500' :
                      threat.threatLevel === 'high' ? 'bg-orange-500' :
                      threat.threatLevel === 'medium' ? 'bg-yellow-500' : 'bg-green-500'
                    }`} />
                    <div>
                      <div className="font-medium">{threat.name}</div>
                      <div className="text-xs text-gray-600">{threat.marketShare}% рынка</div>
                    </div>
                  </div>
                  <div className="text-right">
                    <Badge className={`text-xs ${getThreatColor(threat.threatLevel)}`}>
                      {threat.threatLevel}
                    </Badge>
                    <div className="text-xs text-gray-600 mt-1">{threat.action}</div>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Brain className="w-5 h-5 text-purple-600" />
              Психологическое Воздействие
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="p-3 bg-purple-50 rounded-lg border border-purple-200">
                <h4 className="font-semibold text-purple-800 mb-2">Создание Культа Личности</h4>
                <p className="text-sm text-purple-700">
                  Формирование сильной эмоциональной привязки аудитории к бренду
                </p>
                <Progress value={85} className="mt-2 h-2" />
              </div>
              
              <div className="p-3 bg-blue-50 rounded-lg border border-blue-200">
                <h4 className="font-semibold text-blue-800 mb-2">Интеллектуальное Доминирование</h4>
                <p className="text-sm text-blue-700">
                  Превосходство в экспертизе и качестве аналитики
                </p>
                <Progress value={92} className="mt-2 h-2" />
              </div>

              <div className="p-3 bg-green-50 rounded-lg border border-green-200">
                <h4 className="font-semibold text-green-800 mb-2">Социальное Доказательство</h4>
                <p className="text-sm text-green-700">
                  Демонстрация массового признания и результатов
                </p>
                <Progress value={78} className="mt-2 h-2" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Метрики доминирования */}
      <div className="grid md:grid-cols-5 gap-4">
        <Card>
          <CardContent className="p-4 text-center">
            <div className="text-2xl font-bold text-amber-600">7.3%</div>
            <div className="text-xs text-gray-600">Рыночная доля</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 text-center">
            <div className="text-2xl font-bold text-red-600">4</div>
            <div className="text-xs text-gray-600">Поглощенных конкурентов</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 text-center">
            <div className="text-2xl font-bold text-blue-600">15</div>
            <div className="text-xs text-gray-600">Партнерств с инфлюенсерами</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 text-center">
            <div className="text-2xl font-bold text-green-600">847%</div>
            <div className="text-xs text-gray-600">ROI доминирования</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 text-center">
            <div className="text-2xl font-bold text-purple-600">92%</div>
            <div className="text-xs text-gray-600">Контроль mindshare</div>
          </CardContent>
        </Card>
      </div>

      {/* Экстренные действия */}
      <Card className="border-red-200 bg-gradient-to-r from-red-50 to-pink-50">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-red-800">
            <Shield className="w-5 h-5" />
            Экстренные Меры Доминирования
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-wrap gap-3">
            <Button 
              variant="outline" 
              className="border-red-300 text-red-700 hover:bg-red-50"
              onClick={() => executeDomination('emergency-response')}
              disabled={isExecuting}
            >
              <Zap className="w-4 h-4 mr-2" />
              {isExecuting ? 'Выполняется...' : 'Контр-атака'}
            </Button>
            <Button 
              variant="outline" 
              className="border-orange-300 text-orange-700 hover:bg-orange-50"
            >
              <Eye className="w-4 h-4 mr-2" />
              Усилить слежку
            </Button>
            <Button 
              variant="outline" 
              className="border-purple-300 text-purple-700 hover:bg-purple-50"
            >
              <Brain className="w-4 h-4 mr-2" />
              Психологическая война
            </Button>
            <Button 
              variant="outline" 
              className="border-green-300 text-green-700 hover:bg-green-50"
            >
              <DollarSign className="w-4 h-4 mr-2" />
              Агрессивный выкуп
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
