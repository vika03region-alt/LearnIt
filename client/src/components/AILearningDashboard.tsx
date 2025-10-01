
import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Button } from './ui/button';
import { Badge } from './ui/badge';
import { Progress } from './ui/progress';
import { 
  Brain, 
  TrendingUp, 
  Target, 
  Zap, 
  BookOpen, 
  Lightbulb,
  BarChart3,
  Rocket,
  RefreshCw,
  CheckCircle,
  AlertCircle,
  Crown
} from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

interface LearningMetrics {
  learning_progress: {
    cycles_completed: number;
    data_points: number;
    accuracy_improvement: number;
    unique_insights: number;
  };
  knowledge_areas: {
    content_optimization: number;
    audience_understanding: number;
    trend_recognition: number;
    viral_techniques: number;
  };
  predictions_accuracy: number;
  recommendations: string[];
  future_improvements: string[];
}

export function AILearningDashboard() {
  const [learningMetrics, setLearningMetrics] = useState<LearningMetrics | null>(null);
  const [isLearning, setIsLearning] = useState(false);
  const [autoLearningEnabled, setAutoLearningEnabled] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    loadLearningReport();
  }, []);

  const loadLearningReport = async () => {
    try {
      const response = await fetch('/api/ai/learning-report');
      const data = await response.json();
      
      if (response.ok) {
        setLearningMetrics(data.report);
      }
    } catch (error) {
      console.error('Ошибка загрузки отчета об обучении:', error);
    }
  };

  const initializeLearning = async () => {
    setIsLearning(true);
    try {
      const clientProfile = {
        name: 'Lucifer Tradera',
        niche: 'trading',
        platforms: ['youtube', 'tiktok', 'telegram'],
      };

      const response = await fetch('/api/ai/initialize-learning', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ clientProfile }),
      });

      const result = await response.json();

      if (response.ok) {
        toast({
          title: "AI Обучение инициализировано!",
          description: result.message,
        });
        await loadLearningReport();
      } else {
        throw new Error(result.error);
      }
    } catch (error) {
      toast({
        title: "Ошибка обучения",
        description: "Не удалось инициализировать обучение AI",
        variant: "destructive",
      });
    } finally {
      setIsLearning(false);
    }
  };

  const runContinuousLearning = async () => {
    setIsLearning(true);
    try {
      const response = await fetch('/api/ai/continuous-learning', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
      });

      const result = await response.json();

      if (response.ok) {
        toast({
          title: "Обучение завершено!",
          description: result.message,
        });
        await loadLearningReport();
      } else {
        throw new Error(result.error);
      }
    } catch (error) {
      toast({
        title: "Ошибка обучения",
        description: "Не удалось выполнить обучение",
        variant: "destructive",
      });
    } finally {
      setIsLearning(false);
    }
  };

  const enableAutoLearning = async () => {
    try {
      const response = await fetch('/api/ai/auto-learning', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
      });

      const result = await response.json();

      if (response.ok) {
        setAutoLearningEnabled(true);
        toast({
          title: "Автообучение активировано!",
          description: result.message,
        });
      } else {
        throw new Error(result.error);
      }
    } catch (error) {
      toast({
        title: "Ошибка активации",
        description: "Не удалось активировать автообучение",
        variant: "destructive",
      });
    }
  };

  if (!learningMetrics) {
    return (
      <div className="space-y-6">
        <Card className="border-blue-200 bg-gradient-to-r from-blue-50 to-cyan-50">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-blue-800">
              <Brain className="w-6 h-6" />
              Инициализация AI Системы Обучения
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-gray-600 mb-4">
              Запустите обучение AI системы для создания уникальных стратегий продвижения
            </p>
            <Button 
              onClick={initializeLearning}
              disabled={isLearning}
              className="bg-blue-600 hover:bg-blue-700"
            >
              {isLearning ? (
                <>
                  <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
                  Обучение...
                </>
              ) : (
                <>
                  <Brain className="w-4 h-4 mr-2" />
                  Инициализировать AI Обучение
                </>
              )}
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Заголовок и статус */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold flex items-center gap-2">
            <Brain className="w-6 h-6 text-blue-600" />
            AI Система Обучения
          </h2>
          <p className="text-gray-600">Постоянно развивающаяся система продвижения</p>
        </div>
        <div className="flex gap-2">
          <Badge className={autoLearningEnabled ? "bg-green-100 text-green-800" : "bg-gray-100 text-gray-800"}>
            {autoLearningEnabled ? "Автообучение активно" : "Ручное обучение"}
          </Badge>
          <Badge className="bg-blue-100 text-blue-800">
            Точность: {learningMetrics.predictions_accuracy}%
          </Badge>
        </div>
      </div>

      {/* Прогресс обучения */}
      <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card className="border-purple-200 bg-gradient-to-r from-purple-50 to-pink-50">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-purple-700">Циклы обучения</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-purple-900">
              {learningMetrics.learning_progress.cycles_completed}
            </div>
            <p className="text-xs text-purple-600">завершенных циклов</p>
          </CardContent>
        </Card>

        <Card className="border-green-200 bg-gradient-to-r from-green-50 to-emerald-50">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-green-700">Точки данных</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-900">
              {learningMetrics.learning_progress.data_points.toLocaleString()}
            </div>
            <p className="text-xs text-green-600">обработано данных</p>
          </CardContent>
        </Card>

        <Card className="border-orange-200 bg-gradient-to-r from-orange-50 to-yellow-50">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-orange-700">Рост точности</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-orange-900">
              +{learningMetrics.learning_progress.accuracy_improvement}%
            </div>
            <p className="text-xs text-orange-600">улучшение прогнозов</p>
          </CardContent>
        </Card>

        <Card className="border-indigo-200 bg-gradient-to-r from-indigo-50 to-blue-50">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-indigo-700">Уникальные инсайты</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-indigo-900">
              {learningMetrics.learning_progress.unique_insights}
            </div>
            <p className="text-xs text-indigo-600">новых открытий</p>
          </CardContent>
        </Card>
      </div>

      {/* Области знаний */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <BookOpen className="w-5 h-5" />
            Области знаний AI
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid md:grid-cols-2 gap-4">
            <div className="space-y-3">
              <div>
                <div className="flex justify-between text-sm mb-1">
                  <span>Оптимизация контента</span>
                  <span>{learningMetrics.knowledge_areas.content_optimization}</span>
                </div>
                <Progress value={(learningMetrics.knowledge_areas.content_optimization / 100) * 100} className="h-2" />
              </div>

              <div>
                <div className="flex justify-between text-sm mb-1">
                  <span>Понимание аудитории</span>
                  <span>{learningMetrics.knowledge_areas.audience_understanding}</span>
                </div>
                <Progress value={(learningMetrics.knowledge_areas.audience_understanding / 50) * 100} className="h-2" />
              </div>
            </div>

            <div className="space-y-3">
              <div>
                <div className="flex justify-between text-sm mb-1">
                  <span>Распознавание трендов</span>
                  <span>{learningMetrics.knowledge_areas.trend_recognition}</span>
                </div>
                <Progress value={(learningMetrics.knowledge_areas.trend_recognition / 30) * 100} className="h-2" />
              </div>

              <div>
                <div className="flex justify-between text-sm mb-1">
                  <span>Вирусные техники</span>
                  <span>{learningMetrics.knowledge_areas.viral_techniques}</span>
                </div>
                <Progress value={(learningMetrics.knowledge_areas.viral_techniques / 25) * 100} className="h-2" />
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Рекомендации системы */}
      <div className="grid md:grid-cols-2 gap-6">
        <Card className="border-amber-200 bg-gradient-to-r from-amber-50 to-yellow-50">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-amber-800">
              <Lightbulb className="w-5 h-5" />
              Рекомендации системы
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {learningMetrics.recommendations.map((rec, index) => (
                <div key={index} className="flex items-start gap-2">
                  <CheckCircle className="w-4 h-4 text-green-500 mt-0.5 flex-shrink-0" />
                  <span className="text-sm">{rec}</span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        <Card className="border-blue-200 bg-gradient-to-r from-blue-50 to-cyan-50">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-blue-800">
              <Rocket className="w-5 h-5" />
              Будущие улучшения
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {learningMetrics.future_improvements.map((improvement, index) => (
                <div key={index} className="flex items-start gap-2">
                  <AlertCircle className="w-4 h-4 text-blue-500 mt-0.5 flex-shrink-0" />
                  <span className="text-sm">{improvement}</span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Управление обучением */}
      <Card className="border-gray-200">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Target className="w-5 h-5" />
            Управление обучением
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-wrap gap-3">
            <Button 
              onClick={runContinuousLearning}
              disabled={isLearning}
              variant="outline"
              className="border-blue-200 hover:bg-blue-50"
            >
              {isLearning ? (
                <>
                  <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
                  Обучение...
                </>
              ) : (
                <>
                  <Brain className="w-4 h-4 mr-2" />
                  Запустить обучение
                </>
              )}
            </Button>

            <Button 
              onClick={enableAutoLearning}
              disabled={autoLearningEnabled}
              variant="outline"
              className="border-green-200 hover:bg-green-50"
            >
              <Zap className="w-4 h-4 mr-2" />
              {autoLearningEnabled ? "Автообучение активно" : "Включить автообучение"}
            </Button>

            <Button 
              onClick={loadLearningReport}
              variant="outline"
              className="border-gray-200 hover:bg-gray-50"
            >
              <BarChart3 className="w-4 h-4 mr-2" />
              Обновить отчет
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Уникальность системы */}
      <Card className="border-purple-200 bg-gradient-to-r from-purple-50 to-pink-50">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-purple-800">
            <Crown className="w-5 h-5" />
            Уникальные возможности системы
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
            <div className="p-3 bg-white rounded-lg border">
              <h4 className="font-semibold text-sm mb-1">Персонализированный AI</h4>
              <p className="text-xs text-gray-600">Адаптируется под стиль каждого клиента</p>
            </div>
            <div className="p-3 bg-white rounded-lg border">
              <h4 className="font-semibold text-sm mb-1">Вирусные триггеры</h4>
              <p className="text-xs text-gray-600">Генерирует контент с высоким потенциалом</p>
            </div>
            <div className="p-3 bg-white rounded-lg border">
              <h4 className="font-semibold text-sm mb-1">Предсказание трендов</h4>
              <p className="text-xs text-gray-600">Предугадывает изменения алгоритмов</p>
            </div>
            <div className="p-3 bg-white rounded-lg border">
              <h4 className="font-semibold text-sm mb-1">Мультиплатформенность</h4>
              <p className="text-xs text-gray-600">Оптимизирует под каждую соцсеть</p>
            </div>
            <div className="p-3 bg-white rounded-lg border">
              <h4 className="font-semibold text-sm mb-1">Самообучение</h4>
              <p className="text-xs text-gray-600">Постоянно улучшает результаты</p>
            </div>
            <div className="p-3 bg-white rounded-lg border">
              <h4 className="font-semibold text-sm mb-1">Конкурентный анализ</h4>
              <p className="text-xs text-gray-600">Изучает успешные стратегии</p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
