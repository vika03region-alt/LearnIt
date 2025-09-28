import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Progress } from '@/components/ui/progress';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Separator } from '@/components/ui/separator';
import { useToast } from '@/hooks/use-toast';
import { 
  Zap, 
  Crown, 
  Gem, 
  Target, 
  TrendingUp, 
  Users, 
  DollarSign, 
  Clock, 
  Sparkles,
  Brain,
  Rocket,
  Star,
  Award,
  Settings,
  CheckCircle,
  AlertCircle,
  Info
} from 'lucide-react';

interface PromotionStrategy {
  id: string;
  name: string;
  description: string;
  type: 'free' | 'paid' | 'premium';
  effectiveness: number;
  effort: 'low' | 'medium' | 'high';
  timeframe: string;
  platforms: string[];
  tactics: string[];
  cost?: number;
  authorStyle: 'preserve' | 'enhance' | 'adapt';
}

interface ClientPersona {
  writing_style: string;
  tone: string;
  favorite_topics: string[];
  unique_selling_points: string[];
  target_audience: string;
  brand_voice: string;
  content_pillars: string[];
}

export default function PromotionStrategyManager() {
  const { toast } = useToast();
  const [currentStep, setCurrentStep] = useState(1);
  const [clientPersona, setClientPersona] = useState<ClientPersona | null>(null);
  const [strategies, setStrategies] = useState<{
    free: PromotionStrategy[];
    paid: PromotionStrategy[];
    premium: PromotionStrategy[];
  }>({ free: [], paid: [], premium: [] });
  const [selectedStrategies, setSelectedStrategies] = useState<PromotionStrategy[]>([]);
  const [budget, setBudget] = useState(1000);
  const [loading, setLoading] = useState(false);
  const [contentSamples, setContentSamples] = useState('');

  // Шаг 1: Анализ авторского стиля
  const analyzePersona = async () => {
    if (!contentSamples.trim()) {
      toast({
        title: "Ошибка",
        description: "Пожалуйста, добавьте примеры вашего контента",
        variant: "destructive",
      });
      return;
    }

    setLoading(true);
    try {
      const response = await fetch('/api/promotion/analyze-persona', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          clientContent: contentSamples.split('\n---\n').filter(c => c.trim()),
        }),
      });

      const result = await response.json();

      if (response.ok) {
        setClientPersona(result.persona);
        setCurrentStep(2);
        toast({
          title: "Анализ завершен!",
          description: "Ваш авторский стиль успешно проанализирован",
        });
      } else {
        throw new Error(result.error);
      }
    } catch (error) {
      toast({
        title: "Ошибка анализа",
        description: "Не удалось проанализировать авторский стиль",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  // Шаг 2: Генерация стратегий
  const generateStrategies = async () => {
    if (!clientPersona) return;

    setLoading(true);
    try {
      const response = await fetch('/api/promotion/generate-strategies', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          clientPersona,
          budget,
          currentMetrics: {},
        }),
      });

      const result = await response.json();

      if (response.ok) {
        setStrategies(result.strategies);
        setCurrentStep(3);
        toast({
          title: "Стратегии созданы!",
          description: `Создано ${result.strategies.free.length + result.strategies.paid.length + result.strategies.premium.length} стратегий`,
        });
      } else {
        throw new Error(result.error);
      }
    } catch (error) {
      toast({
        title: "Ошибка генерации",
        description: "Не удалось создать стратегии",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  // Выбор стратегии
  const toggleStrategy = (strategy: PromotionStrategy) => {
    setSelectedStrategies(prev => {
      const exists = prev.find(s => s.id === strategy.id);
      if (exists) {
        return prev.filter(s => s.id !== strategy.id);
      } else {
        return [...prev, strategy];
      }
    });
  };

  // Запуск выбранных стратегий
  const executeStrategies = async () => {
    if (selectedStrategies.length === 0) {
      toast({
        title: "Ошибка",
        description: "Выберите хотя бы одну стратегию",
        variant: "destructive",
      });
      return;
    }

    setLoading(true);
    try {
      const response = await fetch('/api/promotion/execute-strategies', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          strategies: selectedStrategies,
          clientPersona,
        }),
      });

      const result = await response.json();

      if (response.ok) {
        toast({
          title: "Стратегии запущены!",
          description: `Успешно выполнено ${result.executed.length} действий`,
        });
        setCurrentStep(4);
      } else {
        throw new Error(result.error);
      }
    } catch (error) {
      toast({
        title: "Ошибка выполнения",
        description: "Не удалось запустить стратегии",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const getStrategyIcon = (type: string) => {
    switch (type) {
      case 'free': return <Zap className="w-5 h-5 text-green-600" />;
      case 'paid': return <Crown className="w-5 h-5 text-blue-600" />;
      case 'premium': return <Gem className="w-5 h-5 text-purple-600" />;
      default: return <Star className="w-5 h-5" />;
    }
  };

  const getEffortColor = (effort: string) => {
    switch (effort) {
      case 'low': return 'text-green-600';
      case 'medium': return 'text-yellow-600';
      case 'high': return 'text-red-600';
      default: return 'text-gray-600';
    }
  };

  return (
    <div className="space-y-6">
      {/* Прогресс */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Settings className="w-5 h-5" />
            Мастер создания стратегии продвижения
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center gap-4 mb-4">
            {[1, 2, 3, 4].map((step) => (
              <div key={step} className="flex items-center gap-2">
                <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium ${
                  currentStep >= step ? 'bg-blue-600 text-white' : 'bg-gray-200 text-gray-600'
                }`}>
                  {step}
                </div>
                {step < 4 && <div className={`w-8 h-1 ${currentStep > step ? 'bg-blue-600' : 'bg-gray-200'}`} />}
              </div>
            ))}
          </div>
          <div className="text-sm text-muted-foreground">
            {currentStep === 1 && "Анализ авторского стиля"}
            {currentStep === 2 && "Генерация стратегий"}
            {currentStep === 3 && "Выбор стратегий"}
            {currentStep === 4 && "Результаты выполнения"}
          </div>
        </CardContent>
      </Card>

      {/* Шаг 1: Анализ стиля */}
      {currentStep === 1 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Brain className="w-5 h-5 text-purple-600" />
              Анализ вашего авторского стиля
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <Label htmlFor="content-samples">Примеры вашего контента</Label>
              <Textarea
                id="content-samples"
                placeholder="Вставьте 3-5 примеров ваших постов, разделив их строкой '---'"
                value={contentSamples}
                onChange={(e) => setContentSamples(e.target.value)}
                rows={10}
                className="mt-2"
              />
              <p className="text-sm text-muted-foreground mt-1">
                Добавьте примеры постов из разных платформ для более точного анализа
              </p>
            </div>
            <Button onClick={analyzePersona} disabled={loading} className="w-full">
              {loading ? 'Анализирую...' : 'Проанализировать стиль'}
            </Button>
          </CardContent>
        </Card>
      )}

      {/* Шаг 2: Результаты анализа */}
      {currentStep === 2 && clientPersona && (
        <Card>
          <CardHeader>
            <CardTitle>Ваш авторский профиль</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid md:grid-cols-2 gap-4">
              <div>
                <h4 className="font-medium mb-2">Стиль написания:</h4>
                <p className="text-sm text-muted-foreground">{clientPersona.writing_style}</p>
              </div>
              <div>
                <h4 className="font-medium mb-2">Тональность:</h4>
                <p className="text-sm text-muted-foreground">{clientPersona.tone}</p>
              </div>
              <div>
                <h4 className="font-medium mb-2">Голос бренда:</h4>
                <p className="text-sm text-muted-foreground">{clientPersona.brand_voice}</p>
              </div>
              <div>
                <h4 className="font-medium mb-2">Целевая аудитория:</h4>
                <p className="text-sm text-muted-foreground">{clientPersona.target_audience}</p>
              </div>
            </div>

            <div>
              <h4 className="font-medium mb-2">Любимые темы:</h4>
              <div className="flex flex-wrap gap-2">
                {clientPersona.favorite_topics.map((topic, index) => (
                  <Badge key={index} variant="outline">{topic}</Badge>
                ))}
              </div>
            </div>

            <div>
              <Label htmlFor="budget">Бюджет на продвижение ($)</Label>
              <Input
                id="budget"
                type="number"
                value={budget}
                onChange={(e) => setBudget(parseInt(e.target.value) || 0)}
                className="mt-2"
              />
            </div>

            <Button onClick={generateStrategies} disabled={loading} className="w-full">
              {loading ? 'Создаю стратегии...' : 'Создать стратегии продвижения'}
            </Button>
          </CardContent>
        </Card>
      )}

      {/* Шаг 3: Выбор стратегий */}
      {currentStep === 3 && (
        <Tabs defaultValue="free" className="space-y-6">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="free" className="flex items-center gap-2">
              <Zap className="w-4 h-4" />
              Бесплатные ({strategies.free.length})
            </TabsTrigger>
            <TabsTrigger value="paid" className="flex items-center gap-2">
              <Crown className="w-4 h-4" />
              Платные ({strategies.paid.length})
            </TabsTrigger>
            <TabsTrigger value="premium" className="flex items-center gap-2">
              <Gem className="w-4 h-4" />
              Премиум ({strategies.premium.length})
            </TabsTrigger>
          </TabsList>

          {(['free', 'paid', 'premium'] as const).map((type) => (
            <TabsContent key={type} value={type} className="space-y-4">
              {strategies[type].map((strategy) => (
                <Card key={strategy.id} className={`cursor-pointer transition-all ${
                  selectedStrategies.find(s => s.id === strategy.id) 
                    ? 'ring-2 ring-blue-500 bg-blue-50' 
                    : 'hover:shadow-md'
                }`} onClick={() => toggleStrategy(strategy)}>
                  <CardHeader>
                    <div className="flex items-start justify-between">
                      <div className="flex items-center gap-3">
                        {getStrategyIcon(strategy.type)}
                        <div>
                          <CardTitle className="text-lg">{strategy.name}</CardTitle>
                          <p className="text-sm text-muted-foreground mt-1">
                            {strategy.description}
                          </p>
                        </div>
                      </div>
                      <div className="text-right">
                        <Badge variant="outline" className="mb-2">
                          Эффективность: {strategy.effectiveness}/10
                        </Badge>
                        <div className={`text-sm font-medium ${getEffortColor(strategy.effort)}`}>
                          Усилия: {strategy.effort}
                        </div>
                        {strategy.cost && (
                          <div className="text-sm text-muted-foreground">
                            ${strategy.cost}
                          </div>
                        )}
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-3">
                      <div>
                        <h4 className="font-medium text-sm mb-2">Платформы:</h4>
                        <div className="flex flex-wrap gap-1">
                          {strategy.platforms.map((platform, index) => (
                            <Badge key={index} variant="secondary" className="text-xs">
                              {platform}
                            </Badge>
                          ))}
                        </div>
                      </div>

                      <div>
                        <h4 className="font-medium text-sm mb-2">Тактики:</h4>
                        <ul className="space-y-1">
                          {strategy.tactics.slice(0, 3).map((tactic, index) => (
                            <li key={index} className="text-sm text-muted-foreground flex items-start gap-2">
                              <span className="w-1 h-1 bg-gray-400 rounded-full mt-2 flex-shrink-0" />
                              {tactic}
                            </li>
                          ))}
                          {strategy.tactics.length > 3 && (
                            <li className="text-sm text-muted-foreground">
                              +{strategy.tactics.length - 3} дополнительных тактик
                            </li>
                          )}
                        </ul>
                      </div>

                      <div className="flex items-center justify-between text-sm">
                        <span className="text-muted-foreground">Временные рамки: {strategy.timeframe}</span>
                        <Badge variant={strategy.authorStyle === 'preserve' ? 'default' : 'secondary'}>
                          {strategy.authorStyle === 'preserve' ? 'Сохраняет стиль' : 
                           strategy.authorStyle === 'enhance' ? 'Улучшает стиль' : 'Адаптирует стиль'}
                        </Badge>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </TabsContent>
          ))}

          <Card className="bg-gradient-to-r from-blue-50 to-purple-50 border-blue-200">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="font-medium text-blue-900">
                    Выбрано стратегий: {selectedStrategies.length}
                  </h3>
                  <p className="text-sm text-blue-700">
                    Общая стоимость: ${selectedStrategies.reduce((sum, s) => sum + (s.cost || 0), 0)}
                  </p>
                </div>
                <Button onClick={executeStrategies} disabled={loading || selectedStrategies.length === 0}>
                  <Rocket className="w-4 h-4 mr-2" />
                  {loading ? 'Запускаю...' : 'Запустить стратегии'}
                </Button>
              </div>
            </CardContent>
          </Card>
        </Tabs>
      )}

      {/* Шаг 4: Результаты */}
      {currentStep === 4 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <CheckCircle className="w-5 h-5 text-green-600" />
              Стратегии успешно запущены!
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="p-4 bg-green-50 rounded-lg">
                <h4 className="font-medium text-green-900 mb-2">Следующие шаги:</h4>
                <ul className="space-y-1 text-sm text-green-800">
                  <li>• Система начнет автоматическое выполнение выбранных стратегий</li>
                  <li>• Вы получите уведомления о прогрессе</li>
                  <li>• Аналитика будет доступна в дашборде продвижения</li>
                  <li>• AI будет адаптировать стратегии на основе результатов</li>
                </ul>
              </div>

              <Button 
                onClick={() => window.location.href = '/dashboard'} 
                className="w-full"
              >
                Перейти к дашборду продвижения
              </Button>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}