
import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Button } from './ui/button';
import { Badge } from './ui/badge';
import { Progress } from './ui/progress';
import { 
  Zap, 
  TrendingUp, 
  Target, 
  Brain, 
  Flame,
  Rocket,
  Eye,
  Heart,
  Share,
  Users,
  Crown,
  Sparkles,
  AlertTriangle,
  CheckCircle
} from 'lucide-react';
import { useToast } from './ui/use-toast';

export function ViralGrowthDashboard() {
  const [isLaunching, setIsLaunching] = useState(false);
  const [viralContent, setViralContent] = useState('');
  const [activeEmotion, setActiveEmotion] = useState('excitement');
  const { toast } = useToast();

  const emotions = [
    { key: 'fear', label: 'Страх', icon: '😨', color: 'red' },
    { key: 'greed', label: 'Жадность', icon: '🤑', color: 'green' },
    { key: 'hope', label: 'Надежда', icon: '🌟', color: 'blue' },
    { key: 'excitement', label: 'Возбуждение', icon: '🚀', color: 'purple' },
    { key: 'trust', label: 'Доверие', icon: '🤝', color: 'indigo' },
    { key: 'curiosity', label: 'Любопытство', icon: '🧐', color: 'amber' },
  ];

  const platforms = [
    { key: 'tiktok', label: 'TikTok', icon: '🎵', viralScore: 95 },
    { key: 'instagram', label: 'Instagram', icon: '📸', viralScore: 87 },
    { key: 'youtube', label: 'YouTube', icon: '🎥', viralScore: 82 },
    { key: 'telegram', label: 'Telegram', icon: '💬', viralScore: 76 },
  ];

  const launchViralCampaign = async (campaignType: string) => {
    setIsLaunching(true);
    try {
      const response = await fetch('/api/viral/launch-campaign', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          campaignType,
          niche: 'trading',
        }),
      });

      const result = await response.json();

      if (response.ok) {
        toast({
          title: "🚀 Вирусная кампания запущена!",
          description: `Ожидаемый охват: ${result.campaign.expectedReach.toLocaleString()}`,
        });
      } else {
        throw new Error(result.error);
      }
    } catch (error) {
      toast({
        title: "Ошибка запуска",
        description: "Не удалось запустить вирусную кампанию",
        variant: "destructive",
      });
    } finally {
      setIsLaunching(false);
    }
  };

  const generateViralContent = async () => {
    try {
      const response = await fetch('/api/viral/generate-content', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          niche: 'trading',
          platform: 'tiktok',
          targetEmotion: activeEmotion,
        }),
      });

      const result = await response.json();

      if (response.ok) {
        setViralContent(result.content.content);
        toast({
          title: "🔥 Вирусный контент создан!",
          description: `Вирусный потенциал: ${result.content.viralScore}/100`,
        });
      }
    } catch (error) {
      toast({
        title: "Ошибка генерации",
        description: "Не удалось создать вирусный контент",
        variant: "destructive",
      });
    }
  };

  return (
    <div className="space-y-6">
      {/* Заголовок */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold flex items-center gap-2">
            <Flame className="w-6 h-6 text-orange-600" />
            Вирусный Рост
          </h2>
          <p className="text-gray-600">Система создания вирусного контента и массового охвата</p>
        </div>
        <Badge className="bg-orange-100 text-orange-800">
          🔥 Максимальная Вирусность
        </Badge>
      </div>

      {/* Быстрый запуск кампаний */}
      <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="border-red-200 bg-gradient-to-r from-red-50 to-pink-50 hover:shadow-lg transition-all cursor-pointer">
          <CardContent className="p-4" onClick={() => launchViralCampaign('challenge')}>
            <div className="text-center">
              <div className="w-12 h-12 bg-red-500 rounded-full flex items-center justify-center mx-auto mb-2">
                <Target className="w-6 h-6 text-white" />
              </div>
              <h3 className="font-semibold text-red-800">Challenge Кампания</h3>
              <p className="text-xs text-red-600 mt-1">Массовое участие пользователей</p>
              <div className="mt-2">
                <Progress value={95} className="h-2" />
                <span className="text-xs text-red-700">95% вирусности</span>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="border-purple-200 bg-gradient-to-r from-purple-50 to-violet-50 hover:shadow-lg transition-all cursor-pointer">
          <CardContent className="p-4" onClick={() => launchViralCampaign('controversy')}>
            <div className="text-center">
              <div className="w-12 h-12 bg-purple-500 rounded-full flex items-center justify-center mx-auto mb-2">
                <Zap className="w-6 h-6 text-white" />
              </div>
              <h3 className="font-semibold text-purple-800">Контроверсия</h3>
              <p className="text-xs text-purple-600 mt-1">Спорные но обоснованные мнения</p>
              <div className="mt-2">
                <Progress value={88} className="h-2" />
                <span className="text-xs text-purple-700">88% вирусности</span>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="border-green-200 bg-gradient-to-r from-green-50 to-emerald-50 hover:shadow-lg transition-all cursor-pointer">
          <CardContent className="p-4" onClick={() => launchViralCampaign('educational')}>
            <div className="text-center">
              <div className="w-12 h-12 bg-green-500 rounded-full flex items-center justify-center mx-auto mb-2">
                <Brain className="w-6 h-6 text-white" />
              </div>
              <h3 className="font-semibold text-green-800">Образовательная</h3>
              <p className="text-xs text-green-600 mt-1">Ценная информация в viral формате</p>
              <div className="mt-2">
                <Progress value={92} className="h-2" />
                <span className="text-xs text-green-700">92% вирусности</span>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="border-amber-200 bg-gradient-to-r from-amber-50 to-yellow-50 hover:shadow-lg transition-all cursor-pointer">
          <CardContent className="p-4" onClick={() => launchViralCampaign('emotional')}>
            <div className="text-center">
              <div className="w-12 h-12 bg-amber-500 rounded-full flex items-center justify-center mx-auto mb-2">
                <Heart className="w-6 h-6 text-white" />
              </div>
              <h3 className="font-semibold text-amber-800">Эмоциональная</h3>
              <p className="text-xs text-amber-600 mt-1">Сильное эмоциональное воздействие</p>
              <div className="mt-2">
                <Progress value={90} className="h-2" />
                <span className="text-xs text-amber-700">90% вирусности</span>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Генератор эмоционального контента */}
      <div className="grid lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Sparkles className="w-5 h-5 text-purple-600" />
              Эмоциональный Генератор
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div>
                <label className="text-sm font-medium mb-2 block">Выберите эмоцию:</label>
                <div className="grid grid-cols-3 gap-2">
                  {emotions.map((emotion) => (
                    <button
                      key={emotion.key}
                      onClick={() => setActiveEmotion(emotion.key)}
                      className={`p-3 rounded-lg border text-center transition-all ${
                        activeEmotion === emotion.key
                          ? `border-${emotion.color}-300 bg-${emotion.color}-50`
                          : 'border-gray-200 hover:border-gray-300'
                      }`}
                    >
                      <div className="text-2xl mb-1">{emotion.icon}</div>
                      <div className="text-xs font-medium">{emotion.label}</div>
                    </button>
                  ))}
                </div>
              </div>

              <Button onClick={generateViralContent} className="w-full">
                <Rocket className="w-4 h-4 mr-2" />
                Создать Вирусный Контент
              </Button>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <TrendingUp className="w-5 h-5 text-blue-600" />
              Платформы Вирусности
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {platforms.map((platform) => (
                <div key={platform.key} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                  <div className="flex items-center gap-3">
                    <span className="text-xl">{platform.icon}</span>
                    <div>
                      <div className="font-medium">{platform.label}</div>
                      <div className="text-xs text-gray-600">Вирусный потенциал</div>
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="font-bold text-lg">{platform.viralScore}%</div>
                    <Progress value={platform.viralScore} className="w-20 h-2" />
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Сгенерированный контент */}
      {viralContent && (
        <Card className="border-green-200 bg-gradient-to-r from-green-50 to-emerald-50">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-green-800">
              <CheckCircle className="w-5 h-5" />
              Сгенерированный Вирусный Контент
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="bg-white p-4 rounded-lg border">
              <pre className="whitespace-pre-wrap text-sm">{viralContent}</pre>
            </div>
            <div className="flex gap-2 mt-4">
              <Button size="sm" variant="outline">
                <Share className="w-4 h-4 mr-2" />
                Опубликовать везде
              </Button>
              <Button size="sm" variant="outline">
                <Eye className="w-4 h-4 mr-2" />
                Предварительный просмотр
              </Button>
              <Button size="sm" variant="outline">
                <Target className="w-4 h-4 mr-2" />
                Настроить таргетинг
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Психологические триггеры */}
      <Card className="border-red-200 bg-gradient-to-r from-red-50 to-pink-50">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-red-800">
            <AlertTriangle className="w-5 h-5" />
            Активные Психологические Триггеры
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid md:grid-cols-3 gap-4">
            <div className="p-3 bg-white rounded-lg border">
              <h4 className="font-semibold text-sm mb-2">FOMO (Fear of Missing Out)</h4>
              <p className="text-xs text-gray-600">
                "Только сегодня! Эксклюзивные сигналы для первых 100 подписчиков"
              </p>
            </div>
            <div className="p-3 bg-white rounded-lg border">
              <h4 className="font-semibold text-sm mb-2">Social Proof</h4>
              <p className="text-xs text-gray-600">
                "+1247 трейдеров уже следуют этому сигналу и зарабатывают"
              </p>
            </div>
            <div className="p-3 bg-white rounded-lg border">
              <h4 className="font-semibold text-sm mb-2">Authority</h4>
              <p className="text-xs text-gray-600">
                "10+ лет на рынке. Проверенные стратегии от сертифицированного аналитика"
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Статистика и результаты */}
      <div className="grid md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4 text-center">
            <div className="text-2xl font-bold text-red-600">15.7M</div>
            <div className="text-xs text-gray-600">Общий охват</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 text-center">
            <div className="text-2xl font-bold text-green-600">847%</div>
            <div className="text-xs text-gray-600">Рост вирусности</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 text-center">
            <div className="text-2xl font-bold text-blue-600">23</div>
            <div className="text-xs text-gray-600">Активных кампаний</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 text-center">
            <div className="text-2xl font-bold text-purple-600">92%</div>
            <div className="text-xs text-gray-600">Успешность кампаний</div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
