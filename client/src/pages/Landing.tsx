
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Instagram, Youtube, Brain, Shield, TrendingUp, Users, Target, Zap, CheckCircle, Star } from "lucide-react";
import { SiTiktok, SiTelegram } from "react-icons/si";

export default function Landing() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-blue-900 to-slate-900">
      {/* Хедер */}
      <header className="container mx-auto px-6 py-4">
        <nav className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-cyan-400 rounded-xl flex items-center justify-center">
              <TrendingUp className="w-7 h-7 text-white" />
            </div>
            <div>
              <h1 className="text-xl font-bold text-white">Lucifer Trading</h1>
              <p className="text-xs text-blue-200">Автоматизация Соцсетей</p>
            </div>
          </div>
          <div className="flex items-center gap-4">
            <Button variant="ghost" className="text-white hover:text-blue-200">
              Войти
            </Button>
            <Button 
              className="bg-blue-600 hover:bg-blue-700 text-white"
              onClick={() => window.location.href = '/api/login'}
            >
              Начать
            </Button>
          </div>
        </nav>
      </header>

      {/* Главная секция */}
      <main className="container mx-auto px-6 py-16">
        <div className="text-center max-w-4xl mx-auto mb-16">
          <div className="flex items-center justify-center gap-3 mb-6">
            <div className="w-16 h-16 bg-gradient-to-br from-blue-500 to-cyan-400 rounded-2xl flex items-center justify-center shadow-xl">
              <TrendingUp className="w-8 h-8 text-white" />
            </div>
            <div className="text-left">
              <h1 className="text-4xl font-bold text-white">Lucifer Trading</h1>
              <p className="text-blue-200 text-lg">Центр Автоматизации Соцсетей</p>
            </div>
          </div>

          <h2 className="text-5xl lg:text-6xl font-bold text-white mb-6 leading-tight">
            Автоматизируйте Ваш
            <br />
            <span className="bg-gradient-to-r from-blue-400 to-cyan-300 bg-clip-text text-transparent">
              Трейдинг Контент
            </span>
            <br />
            Во Всех Соцсетях
          </h2>

          <p className="text-xl text-slate-300 mb-8 max-w-3xl mx-auto leading-relaxed">
            AI-платформа для автоматизации социальных сетей, разработанная специально для трейдеров.
            Создавайте привлекательный контент, планируйте публикации и отслеживайте результаты 
            с продвинутыми системами безопасности.
          </p>

          <div className="flex flex-col sm:flex-row gap-4 justify-center mb-12">
            <Button 
              size="lg"
              className="text-lg px-8 py-6 bg-blue-600 hover:bg-blue-700 shadow-xl"
              onClick={() => window.location.href = '/api/login'}
              data-testid="button-start-free"
            >
              Начать Бесплатно
            </Button>
            <Button 
              variant="outline" 
              size="lg"
              className="text-lg px-8 py-6 border-white text-white hover:bg-white hover:text-slate-900"
              data-testid="button-demo"
            >
              Посмотреть Демо
            </Button>
          </div>

          {/* Иконки платформ */}
          <div className="flex items-center justify-center gap-6 mb-16 flex-wrap">
            <Badge variant="secondary" className="flex items-center gap-2 px-4 py-2 bg-white/10 text-white border-white/20">
              <Instagram className="w-5 h-5 text-pink-400" />
              Instagram
            </Badge>
            <Badge variant="secondary" className="flex items-center gap-2 px-4 py-2 bg-white/10 text-white border-white/20">
              <SiTiktok className="w-5 h-5 text-red-400" />
              TikTok
            </Badge>
            <Badge variant="secondary" className="flex items-center gap-2 px-4 py-2 bg-white/10 text-white border-white/20">
              <Youtube className="w-5 h-5 text-red-400" />
              YouTube
            </Badge>
            <Badge variant="secondary" className="flex items-center gap-2 px-4 py-2 bg-white/10 text-white border-white/20">
              <SiTelegram className="w-5 h-5 text-blue-400" />
              Telegram
            </Badge>
          </div>
        </div>

        {/* Основные возможности */}
        <div className="grid md:grid-cols-2 gap-8 mb-16">
          <Card className="border-purple-200 bg-gradient-to-br from-purple-50 to-pink-50 hover:shadow-xl transition-all">
            <CardHeader>
              <div className="w-16 h-16 bg-purple-500 rounded-2xl flex items-center justify-center mx-auto mb-4">
                <Brain className="w-8 h-8 text-white" />
              </div>
              <CardTitle className="text-2xl text-center text-purple-800">
                AI Генерация Контента
              </CardTitle>
            </CardHeader>
            <CardContent className="text-center">
              <p className="text-purple-700 mb-4">
                На основе OpenAI GPT-5, создавайте привлекательный контент, 
                оптимизированный для максимального вовлечения аудитории.
              </p>
              <div className="space-y-2 text-sm text-purple-600">
                <div className="flex items-center gap-2">
                  <CheckCircle className="w-4 h-4" />
                  Анализ топовых трейдинг-каналов
                </div>
                <div className="flex items-center gap-2">
                  <CheckCircle className="w-4 h-4" />
                  Автоматическая оптимизация для каждой платформы
                </div>
                <div className="flex items-center gap-2">
                  <CheckCircle className="w-4 h-4" />
                  Генерация вирусного контента
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="border-green-200 bg-gradient-to-br from-green-50 to-emerald-50 hover:shadow-xl transition-all">
            <CardHeader>
              <div className="w-16 h-16 bg-green-500 rounded-2xl flex items-center justify-center mx-auto mb-4">
                <Shield className="w-8 h-8 text-white" />
              </div>
              <CardTitle className="text-2xl text-center text-green-800">
                Продвинутый Контроль Безопасности
              </CardTitle>
            </CardHeader>
            <CardContent className="text-center">
              <p className="text-green-700 mb-4">
                Комплексное ограничение скорости и мониторинг безопасности 
                для защиты ваших аккаунтов от блокировок.
              </p>
              <div className="space-y-2 text-sm text-green-600">
                <div className="flex items-center gap-2">
                  <CheckCircle className="w-4 h-4" />
                  Интеллектуальные лимиты активности
                </div>
                <div className="flex items-center gap-2">
                  <CheckCircle className="w-4 h-4" />
                  Мониторинг в реальном времени
                </div>
                <div className="flex items-center gap-2">
                  <CheckCircle className="w-4 h-4" />
                  Автоматические предупреждения
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Статистика */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-6 mb-16">
          <Card className="text-center bg-white/10 border-white/20">
            <CardContent className="p-6">
              <div className="text-3xl font-bold text-white mb-2">500+</div>
              <div className="text-blue-200">Активных Трейдеров</div>
            </CardContent>
          </Card>
          <Card className="text-center bg-white/10 border-white/20">
            <CardContent className="p-6">
              <div className="text-3xl font-bold text-white mb-2">10M+</div>
              <div className="text-blue-200">Публикаций</div>
            </CardContent>
          </Card>
          <Card className="text-center bg-white/10 border-white/20">
            <CardContent className="p-6">
              <div className="text-3xl font-bold text-white mb-2">95%</div>
              <div className="text-blue-200">Безопасность</div>
            </CardContent>
          </Card>
          <Card className="text-center bg-white/10 border-white/20">
            <CardContent className="p-6">
              <div className="text-3xl font-bold text-white mb-2">24/7</div>
              <div className="text-blue-200">Поддержка</div>
            </CardContent>
          </Card>
        </div>

        {/* Отзывы */}
        <div className="text-center mb-16">
          <h3 className="text-3xl font-bold text-white mb-8">Что Говорят Наши Клиенты</h3>
          <div className="grid md:grid-cols-3 gap-6">
            <Card className="bg-white/10 border-white/20">
              <CardContent className="p-6">
                <div className="flex justify-center mb-4">
                  {[1,2,3,4,5].map(i => (
                    <Star key={i} className="w-5 h-5 fill-yellow-400 text-yellow-400" />
                  ))}
                </div>
                <p className="text-white mb-4">
                  "Увеличил подписчиков на 300% за месяц. Автоматизация работает идеально!"
                </p>
                <div className="text-blue-200 font-medium">Алексей М.</div>
                <div className="text-blue-300 text-sm">Крипто-трейдер</div>
              </CardContent>
            </Card>
            <Card className="bg-white/10 border-white/20">
              <CardContent className="p-6">
                <div className="flex justify-center mb-4">
                  {[1,2,3,4,5].map(i => (
                    <Star key={i} className="w-5 h-5 fill-yellow-400 text-yellow-400" />
                  ))}
                </div>
                <p className="text-white mb-4">
                  "Лучший инструмент для автоматизации. Экономлю 5 часов в день!"
                </p>
                <div className="text-blue-200 font-medium">Мария В.</div>
                <div className="text-blue-300 text-sm">Форекс-аналитик</div>
              </CardContent>
            </Card>
            <Card className="bg-white/10 border-white/20">
              <CardContent className="p-6">
                <div className="flex justify-center mb-4">
                  {[1,2,3,4,5].map(i => (
                    <Star key={i} className="w-5 h-5 fill-yellow-400 text-yellow-400" />
                  ))}
                </div>
                <p className="text-white mb-4">
                  "Безопасность на высшем уровне. Ни одной блокировки за год!"
                </p>
                <div className="text-blue-200 font-medium">Дмитрий К.</div>
                <div className="text-blue-300 text-sm">Трейдинг-эксперт</div>
              </CardContent>
            </Card>
          </div>
        </div>

        {/* CTA секция */}
        <div className="text-center bg-gradient-to-r from-blue-600 to-cyan-500 rounded-3xl p-12">
          <h3 className="text-4xl font-bold text-white mb-4">
            Готовы Автоматизировать Свой Успех?
          </h3>
          <p className="text-xl text-blue-100 mb-8 max-w-2xl mx-auto">
            Присоединяйтесь к сотням успешных трейдеров, которые уже используют 
            нашу платформу для роста своей аудитории
          </p>
          <Button 
            size="lg"
            className="text-lg px-10 py-6 bg-white text-blue-600 hover:bg-gray-100 shadow-xl"
            onClick={() => window.location.href = '/api/login'}
          >
            Начать Прямо Сейчас
          </Button>
        </div>
      </main>

      {/* Футер */}
      <footer className="container mx-auto px-6 py-8 border-t border-white/20">
        <div className="text-center">
          <div className="flex items-center justify-center gap-3 mb-4">
            <div className="w-8 h-8 bg-gradient-to-br from-blue-500 to-cyan-400 rounded-lg flex items-center justify-center">
              <TrendingUp className="w-5 h-5 text-white" />
            </div>
            <span className="text-white font-semibold">Lucifer Trading</span>
          </div>
          <p className="text-slate-400 mb-4">
            © 2024 Lucifer Trading. Все права защищены.
          </p>
          <div className="flex justify-center gap-6 text-slate-400">
            <a href="#" className="hover:text-white transition-colors">Политика конфиденциальности</a>
            <a href="#" className="hover:text-white transition-colors">Условия использования</a>
            <a href="#" className="hover:text-white transition-colors">Поддержка</a>
          </div>
        </div>
      </footer>
    </div>
  );
}
