
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
          clientContent: contentSamples.split('\n---\n').filter(s => s.trim()),
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
          currentMetrics: {}, // Можно добавить текущие метрики
        }),
      });

      const result = await response.json();
      if (response.ok) {
        setStrategies(result.strategies);
        setCurrentStep(3);
        toast({
          title: "Стратегии сгенерированы!",
          description: `Создано ${result.total} персонализированных стратегий`,
        });
      } else {
        throw new Error(result.error);
      }
    } catch (error) {
      toast({
        title: "Ошибка генерации",
        description: "Не удалось сгенерировать стратегии",
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
    const results = [];

    for (const strategy of selectedStrategies) {
      try {
        const response = await fetch('/api/promotion/execute-strategy', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            strategy,
            clientPersona,
          }),
        });

        const result = await response.json();
        results.push(result);
      } catch (error) {
        console.error('Ошибка выполнения стратегии:', strategy.name, error);
      }
    }

    setLoading(false);
    setCurrentStep(4);
    toast({
      title: "Стратегии запущены!",
      description: `Успешно запущено ${results.length} стратегий`,
    });
  };

  const getStrategyIcon = (type: string) => {
    switch (type) {
      case 'free': return <Zap className="w-5 h-5 text-green-600" />;
      case 'paid': return <Crown className="w-5 h-5 text-amber-600" />;
      case 'premium': return <Gem className="w-5 h-5 text-purple-600" />;
      default: return <Target className="w-5 h-5" />;
    }
  };

  const getEffortColor = (effort: string) => {
    switch (effort) {
      case 'low': return 'bg-green-100 text-green-800';
      case 'medium': return 'bg-yellow-100 text-yellow-800';
      case 'high': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getAuthorStyleDescription = (style: string) => {
    switch (style) {
      case 'preserve': return 'Сохраняет ваш уникальный стиль';
      case 'enhance': return 'Улучшает ваш существующий стиль';
      case 'adapt': return 'Адаптирует стиль под платформу';
      default: return 'Стандартный подход';
    }
  };

  return (
    <div className="space-y-6">
      {/* Прогресс */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Brain className="w-6 h-6 text-purple-600" />
            AI Стратегия Продвижения
          </CardTitle>
          <div className="flex items-center gap-4 mt-4">
            {[1, 2, 3, 4].map((step) => (
              <div key={step} className="flex items-center gap-2">
                <div className={`w-8 h-8 rounded-full flex items-center justify-center ${
                  currentStep >= step ? 'bg-purple-600 text-white' : 'bg-gray-200 text-gray-600'
                }`}>
                  {currentStep > step ? <CheckCircle className="w-4 h-4" /> : step}
                </div>
                {step < 4 && <div className={`w-12 h-1 ${
                  currentStep > step ? 'bg-purple-600' : 'bg-gray-200'
                }`} />}
              </div>
            ))}
          </div>
          <div className="grid grid-cols-4 gap-4 mt-2 text-sm">
            <span className={currentStep >= 1 ? 'text-purple-600 font-medium' : 'text-gray-500'}>
              Анализ стиля
            </span>
            <span className={currentStep >= 2 ? 'text-purple-600 font-medium' : 'text-gray-500'}>
              Генерация стратегий
            </span>
            <span className={currentStep >= 3 ? 'text-purple-600 font-medium' : 'text-gray-500'}>
              Выбор стратегий
            </span>
            <span className={currentStep >= 4 ? 'text-purple-600 font-medium' : 'text-gray-500'}>
              Запуск
            </span>
          </div>
        </CardHeader>
      </Card>

      {/* Шаг 1: Анализ авторского стиля */}
      {currentStep === 1 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Sparkles className="w-5 h-5 text-blue-600" />
              Анализ вашего авторского стиля
            </CardTitle>
            <p className="text-muted-foreground">
              Загрузите примеры вашего контента для AI анализа уникального стиля
            </p>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label>Примеры вашего контента</Label>
              <Textarea
                placeholder="Вставьте 3-5 примеров ваших постов, разделенных строкой '---'"
                value={contentSamples}
                onChange={(e) => setContentSamples(e.target.value)}
                rows={10}
                className="min-h-[200px]"
              />
              <p className="text-sm text-muted-foreground">
                Разделяйте разные посты строкой "---". Чем больше примеров, тем точнее анализ.
              </p>
            </div>

            <div className="bg-blue-50 p-4 rounded-lg">
              <div className="flex items-start gap-3">
                <Info className="w-5 h-5 text-blue-600 mt-0.5" />
                <div>
                  <h4 className="font-medium text-blue-900">Что анализирует AI:</h4>
                  <ul className="text-sm text-blue-800 mt-1 space-y-1">
                    <li>• Стиль написания и тональность</li>
                    <li>• Любимые темы и фокусы</li>
                    <li>• Уникальные особенности подачи</li>
                    <li>• Целевую аудиторию</li>
                    <li>• Голос бренда и ключевые столпы контента</li>
                  </ul>
                </div>
              </div>
            </div>

            <Button 
              onClick={analyzePersona}
              disabled={loading || !contentSamples.trim()}
              className="w-full"
              size="lg"
            >
              {loading ? (
                <>
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2" />
                  Анализирую стиль...
                </>
              ) : (
                <>
                  <Brain className="w-4 h-4 mr-2" />
                  Проанализировать авторский стиль
                </>
              )}
            </Button>
          </CardContent>
        </Card>
      )}

      {/* Шаг 2: Настройки генерации */}
      {currentStep === 2 && clientPersona && (
        <div className="space-y-6">
          {/* Результаты анализа */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <CheckCircle className="w-5 h-5 text-green-600" />
                Ваш авторский стиль проанализирован
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid md:grid-cols-2 gap-6">
                <div className="space-y-3">
                  <div>
                    <Label className="text-sm font-medium">Стиль написания</Label>
                    <p className="text-sm text-muted-foreground">{clientPersona.writing_style}</p>
                  </div>
                  <div>
                    <Label className="text-sm font-medium">Тональность</Label>
                    <p className="text-sm text-muted-foreground">{clientPersona.tone}</p>
                  </div>
                  <div>
                    <Label className="text-sm font-medium">Целевая аудитория</Label>
                    <p className="text-sm text-muted-foreground">{clientPersona.target_audience}</p>
                  </div>
                </div>
                <div className="space-y-3">
                  <div>
                    <Label className="text-sm font-medium">Любимые темы</Label>
                    <div className="flex flex-wrap gap-1 mt-1">
                      {clientPersona.favorite_topics.map((topic, index) => (
                        <Badge key={index} variant="secondary" className="text-xs">
                          {topic}
                        </Badge>
                      ))}
                    </div>
                  </div>
                  <div>
                    <Label className="text-sm font-medium">Столпы контента</Label>
                    <div className="flex flex-wrap gap-1 mt-1">
                      {clientPersona.content_pillars.map((pillar, index) => (
                        <Badge key={index} variant="outline" className="text-xs">
                          {pillar}
                        </Badge>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Настройки бюджета */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <DollarSign className="w-5 h-5 text-green-600" />
                Настройка бюджета и параметров
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label>Месячный бюджет на продвижение (USD)</Label>
                <div className="flex items-center gap-4">
                  <Input
                    type="number"
                    value={budget}
                    onChange={(e) => setBudget(Number(e.target.value))}
                    min="0"
                    max="10000"
                  />
                  <div className="text-sm text-muted-foreground">
                    ${budget} в месяц
                  </div>
                </div>
                <Progress value={(budget / 10000) * 100} className="h-2" />
                <div className="flex justify-between text-xs text-muted-foreground">
                  <span>$0 (только бесплатные)</span>
                  <span>$10,000 (максимум)</span>
                </div>
              </div>

              <Button 
                onClick={generateStrategies}
                disabled={loading}
                className="w-full"
                size="lg"
              >
                {loading ? (
                  <>
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2" />
                    Генерирую стратегии...
                  </>
                ) : (
                  <>
                    <Rocket className="w-4 h-4 mr-2" />
                    Сгенерировать персонализированные стратегии
                  </>
                )}
              </Button>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Шаг 3: Выбор стратегий */}
      {currentStep === 3 && (
        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Target className="w-5 h-5 text-purple-600" />
                Выберите стратегии продвижения
              </CardTitle>
              <p className="text-muted-foreground">
                Выберите комбинацию стратегий, которые лучше всего подходят вашим целям
              </p>
            </CardHeader>
          </Card>

          <Tabs defaultValue="free" className="w-full">
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
                  <Card 
                    key={strategy.id} 
                    className={`cursor-pointer transition-all ${
                      selectedStrategies.find(s => s.id === strategy.id)
                        ? 'ring-2 ring-purple-500 bg-purple-50'
                        : 'hover:shadow-md'
                    }`}
                    onClick={() => toggleStrategy(strategy)}
                  >
                    <CardContent className="p-6">
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <div className="flex items-center gap-3 mb-2">
                            {getStrategyIcon(strategy.type)}
                            <h3 className="font-semibold text-lg">{strategy.name}</h3>
                            <Badge className={getEffortColor(strategy.effort)}>
                              {strategy.effort === 'low' ? 'Легко' : 
                               strategy.effort === 'medium' ? 'Средне' : 'Сложно'}
                            </Badge>
                          </div>
                          
                          <p className="text-muted-foreground mb-3">{strategy.description}</p>
                          
                          <div className="grid md:grid-cols-2 gap-4 mb-4">
                            <div className="space-y-2">
                              <div className="flex items-center gap-2">
                                <TrendingUp className="w-4 h-4 text-green-600" />
                                <span className="text-sm">Эффективность: {strategy.effectiveness}/10</span>
                              </div>
                              <Progress value={strategy.effectiveness * 10} className="h-2" />
                            </div>
                            
                            <div className="space-y-2">
                              <div className="flex items-center gap-2">
                                <Clock className="w-4 h-4 text-blue-600" />
                                <span className="text-sm">Временные рамки: {strategy.timeframe}</span>
                              </div>
                              {strategy.cost && (
                                <div className="flex items-center gap-2">
                                  <DollarSign className="w-4 h-4 text-amber-600" />
                                  <span className="text-sm">Стоимость: ${strategy.cost}</span>
                                </div>
                              )}
                            </div>
                          </div>

                          <div className="space-y-3">
                            <div>
                              <Label className="text-sm font-medium">Платформы:</Label>
                              <div className="flex flex-wrap gap-1 mt-1">
                                {strategy.platforms.map((platform, index) => (
                                  <Badge key={index} variant="outline" className="text-xs">
                                    {platform}
                                  </Badge>
                                ))}
                              </div>
                            </div>

                            <div>
                              <Label className="text-sm font-medium">Основные тактики:</Label>
                              <ul className="text-sm text-muted-foreground mt-1 space-y-1">
                                {strategy.tactics.slice(0, 3).map((tactic, index) => (
                                  <li key={index}>• {tactic}</li>
                                ))}
                                {strategy.tactics.length > 3 && (
                                  <li className="text-xs">и еще {strategy.tactics.length - 3} тактик...</li>
                                )}
                              </ul>
                            </div>

                            <div className="flex items-center gap-2 text-sm">
                              <Star className="w-4 h-4 text-amber-500" />
                              <span className="font-medium">Авторский стиль:</span>
                              <span className="text-muted-foreground">
                                {getAuthorStyleDescription(strategy.authorStyle)}
                              </span>
                            </div>
                          </div>
                        </div>

                        <div className="ml-4">
                          <div className={`w-6 h-6 rounded-full border-2 flex items-center justify-center ${
                            selectedStrategies.find(s => s.id === strategy.id)
                              ? 'bg-purple-600 border-purple-600'
                              : 'border-gray-300'
                          }`}>
                            {selectedStrategies.find(s => s.id === strategy.id) && (
                              <CheckCircle className="w-4 h-4 text-white" />
                            )}
                          </div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </TabsContent>
            ))}
          </Tabs>

          {/* Выбранные стратегии и итоговая стоимость */}
          {selectedStrategies.length > 0 && (
            <Card className="bg-gradient-to-r from-purple-50 to-blue-50">
              <CardContent className="p-6">
                <h3 className="font-semibold mb-4 flex items-center gap-2">
                  <Award className="w-5 h-5 text-purple-600" />
                  Выбранные стратегии ({selectedStrategies.length})
                </h3>
                
                <div className="grid md:grid-cols-2 gap-4 mb-4">
                  <div>
                    <Label className="text-sm font-medium">Общая стоимость:</Label>
                    <p className="text-2xl font-bold text-purple-600">
                      ${selectedStrategies.reduce((sum, s) => sum + (s.cost || 0), 0)}
                    </p>
                  </div>
                  <div>
                    <Label className="text-sm font-medium">Средняя эффективность:</Label>
                    <p className="text-2xl font-bold text-green-600">
                      {(selectedStrategies.reduce((sum, s) => sum + s.effectiveness, 0) / selectedStrategies.length).toFixed(1)}/10
                    </p>
                  </div>
                </div>

                <Button 
                  onClick={executeStrategies}
                  disabled={loading}
                  className="w-full bg-gradient-to-r from-purple-600 to-blue-600"
                  size="lg"
                >
                  {loading ? (
                    <>
                      <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2" />
                      Запускаю стратегии...
                    </>
                  ) : (
                    <>
                      <Rocket className="w-4 h-4 mr-2" />
                      Запустить выбранные стратегии
                    </>
                  )}
                </Button>
              </CardContent>
            </Card>
          )}
        </div>
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
            <div className="text-center space-y-4">
              <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto">
                <Rocket className="w-8 h-8 text-green-600" />
              </div>
              <div>
                <h3 className="text-xl font-semibold mb-2">Автоматическое продвижение активировано</h3>
                <p className="text-muted-foreground">
                  Система начала выполнение выбранных стратегий. 
                  Результаты будут видны в разделе аналитики в течение 24-48 часов.
                </p>
              </div>
              
              <div className="grid md:grid-cols-3 gap-4 mt-6">
                <div className="text-center p-4 bg-blue-50 rounded-lg">
                  <Target className="w-8 h-8 text-blue-600 mx-auto mb-2" />
                  <h4 className="font-medium">Стратегии запущены</h4>
                  <p className="text-2xl font-bold text-blue-600">{selectedStrategies.length}</p>
                </div>
                <div className="text-center p-4 bg-green-50 rounded-lg">
                  <TrendingUp className="w-8 h-8 text-green-600 mx-auto mb-2" />
                  <h4 className="font-medium">Ожидаемый рост</h4>
                  <p className="text-2xl font-bold text-green-600">+25%</p>
                </div>
                <div className="text-center p-4 bg-purple-50 rounded-lg">
                  <Clock className="w-8 h-8 text-purple-600 mx-auto mb-2" />
                  <h4 className="font-medium">Время до результата</h4>
                  <p className="text-2xl font-bold text-purple-600">24ч</p>
                </div>
              </div>

              <Button 
                onClick={() => setCurrentStep(1)}
                variant="outline"
                className="mt-6"
              >
                <Settings className="w-4 h-4 mr-2" />
                Создать новую стратегию
              </Button>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
