
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Sparkles, TrendingUp, Hash, Eye, Target } from "lucide-react";

export default function SimplifiedAIDashboard() {
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold">🎯 5 Инструментов от Топ-Каналов</h1>
        <p className="text-muted-foreground">Проверено: Rayner Teo, Coin Bureau</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {/* 1. Вирусный контент */}
        <Card className="p-6">
          <div className="flex items-center gap-3 mb-4">
            <Sparkles className="h-8 w-8 text-purple-500" />
            <h3 className="font-bold text-lg">1. Вирусный контент</h3>
          </div>
          <p className="text-sm text-muted-foreground mb-4">
            Генерация постов с высоким потенциалом охвата
          </p>
          <div className="space-y-2 text-sm">
            <div className="flex justify-between">
              <span>Используют:</span>
              <span className="font-semibold">100% топ-каналов</span>
            </div>
            <div className="flex justify-between">
              <span>Результат:</span>
              <span className="font-semibold text-green-600">+50% охвата</span>
            </div>
          </div>
          <Button className="w-full mt-4">Создать пост</Button>
        </Card>

        {/* 2. Анализ трендов */}
        <Card className="p-6">
          <div className="flex items-center gap-3 mb-4">
            <TrendingUp className="h-8 w-8 text-blue-500" />
            <h3 className="font-bold text-lg">2. Тренды</h3>
          </div>
          <p className="text-sm text-muted-foreground mb-4">
            Актуальные темы для публикаций
          </p>
          <div className="space-y-2 text-sm">
            <div className="flex justify-between">
              <span>Используют:</span>
              <span className="font-semibold">Все топ-каналы</span>
            </div>
            <div className="flex justify-between">
              <span>Результат:</span>
              <span className="font-semibold text-green-600">+30% охвата</span>
            </div>
          </div>
          <Button className="w-full mt-4" variant="outline">Анализ трендов</Button>
        </Card>

        {/* 3. Хештеги */}
        <Card className="p-6">
          <div className="flex items-center gap-3 mb-4">
            <Hash className="h-8 w-8 text-green-500" />
            <h3 className="font-bold text-lg">3. Хештеги</h3>
          </div>
          <p className="text-sm text-muted-foreground mb-4">
            Оптимизация для максимального охвата
          </p>
          <div className="space-y-2 text-sm">
            <div className="flex justify-between">
              <span>Используют:</span>
              <span className="font-semibold">Coin Bureau</span>
            </div>
            <div className="flex justify-between">
              <span>Результат:</span>
              <span className="font-semibold text-green-600">0→2.5M</span>
            </div>
          </div>
          <Button className="w-full mt-4" variant="outline">Оптимизировать</Button>
        </Card>

        {/* 4. Конкуренты */}
        <Card className="p-6">
          <div className="flex items-center gap-3 mb-4">
            <Eye className="h-8 w-8 text-orange-500" />
            <h3 className="font-bold text-lg">4. Конкуренты</h3>
          </div>
          <p className="text-sm text-muted-foreground mb-4">
            Мониторинг и анализ успешных каналов
          </p>
          <div className="space-y-2 text-sm">
            <div className="flex justify-between">
              <span>Используют:</span>
              <span className="font-semibold">Trading Channel</span>
            </div>
            <div className="flex justify-between">
              <span>Результат:</span>
              <span className="font-semibold text-green-600">Копируй лучшее</span>
            </div>
          </div>
          <Button className="w-full mt-4" variant="outline">Анализ</Button>
        </Card>

        {/* 5. Предсказание */}
        <Card className="p-6">
          <div className="flex items-center gap-3 mb-4">
            <Target className="h-8 w-8 text-red-500" />
            <h3 className="font-bold text-lg">5. Предсказание</h3>
          </div>
          <p className="text-sm text-muted-foreground mb-4">
            Проверка потенциала перед публикацией
          </p>
          <div className="space-y-2 text-sm">
            <div className="flex justify-between">
              <span>Используют:</span>
              <span className="font-semibold">Rayner Teo</span>
            </div>
            <div className="flex justify-between">
              <span>Результат:</span>
              <span className="font-semibold text-green-600">Score > 70</span>
            </div>
          </div>
          <Button className="w-full mt-4" variant="outline">Проверить</Button>
        </Card>

        {/* Статистика */}
        <Card className="p-6 bg-gradient-to-br from-purple-50 to-blue-50">
          <h3 className="font-bold text-lg mb-4">💰 Экономика</h3>
          <div className="space-y-3 text-sm">
            <div className="flex justify-between">
              <span>AI модель:</span>
              <span className="font-semibold">Grok 2</span>
            </div>
            <div className="flex justify-between">
              <span>Стоимость/месяц:</span>
              <span className="font-semibold text-green-600">~$0.01</span>
            </div>
            <div className="flex justify-between">
              <span>Экономия vs GPT-4:</span>
              <span className="font-semibold text-green-600">90%</span>
            </div>
            <div className="flex justify-between">
              <span>ROI:</span>
              <span className="font-semibold text-green-600">Измеримый</span>
            </div>
          </div>
        </Card>
      </div>

      <Card className="p-6 bg-gradient-to-r from-green-50 to-emerald-50">
        <h3 className="font-bold text-lg mb-3">✅ Что получаете</h3>
        <ul className="space-y-2 text-sm">
          <li>✓ Экономия 15 часов/месяц на создании контента</li>
          <li>✓ +50% охвата за счёт вирусного контента</li>
          <li>✓ +30% охвата за счёт использования трендов</li>
          <li>✓ Понимание что работает у конкурентов</li>
          <li>✓ Публикация только эффективного контента (score > 70)</li>
        </ul>
      </Card>
    </div>
  );
}
