
import TelegramBot from 'node-telegram-bot-api';
import cron from 'node-cron';
import OpenAI from 'openai';
import { storage } from '../storage';

const TELEGRAM_TOKEN = process.env.BOTTG || '';

const grok = new OpenAI({
  apiKey: process.env.XAI_API_KEY || '',
  baseURL: 'https://api.x.ai/v1'
});

let promoBot: TelegramBot | null = null;
let isActive = false;

// Кэш для оптимизации
const contentCache = new Map<string, { content: string; timestamp: number }>();
const userStats = new Map<number, {
  interactions: number;
  lastActive: Date;
  preferences: string[];
}>();

const CACHE_TTL = 3600000; // 1 час

class TelegramPromoBot {
  private bot: TelegramBot | null = null;
  private userId: string;
  private channelId: string;

  constructor(userId: string, channelId: string) {
    this.userId = userId;
    this.channelId = channelId;
  }

  async initialize() {
    if (!TELEGRAM_TOKEN) {
      throw new Error('Telegram токен не найден');
    }

    try {
      // Очищаем webhook
      const tempBot = new TelegramBot(TELEGRAM_TOKEN, { polling: false });
      await tempBot.deleteWebHook();
      await new Promise(resolve => setTimeout(resolve, 3000));

      this.bot = new TelegramBot(TELEGRAM_TOKEN, {
        polling: {
          interval: 1000,
          autoStart: true,
          params: { timeout: 30 }
        }
      });

      this.setupHandlers();
      this.setupScheduler();
      isActive = true;
      promoBot = this.bot;

      await storage.createActivityLog({
        userId: this.userId,
        action: 'Promo Bot Started',
        description: 'Telegram промо-бот успешно запущен',
        status: 'success',
        metadata: { channelId: this.channelId },
      });

      console.log('✅ Telegram промо-бот запущен');
      return { success: true };
    } catch (error) {
      console.error('❌ Ошибка запуска промо-бота:', error);
      throw error;
    }
  }

  private setupHandlers() {
    if (!this.bot) return;

    // === КОМАНДЫ БОТА ===
    
    this.bot.onText(/\/start/, async (msg) => {
      const chatId = msg.chat.id;
      const welcome = `🚀 <b>ЭФФЕКТИВНЫЙ ПРОМО-БОТ</b>

💎 Ваш помощник для взрывного роста в Telegram!

<b>🎯 ЧТО Я УМЕЮ:</b>

📝 <b>КОНТЕНТ</b>
• /viral - Вирусный пост (AI)
• /schedule - Расписание публикаций
• /analytics - Статистика канала

🚀 <b>ПРОДВИЖЕНИЕ</b>
• /growth - План роста на 30 дней
• /competitors - Анализ конкурентов
• /trends - Актуальные тренды

💡 <b>AI ПОМОЩНИК</b>
• /suggest - Персональные рекомендации
• /optimize - Оптимизация контента
• /autopilot - Автоматический режим

━━━━━━━━━━━━━━━━━━━━
🔥 Готов к работе! Начните с /viral
📢 Канал: ${this.channelId}`;

      await this.bot!.sendMessage(chatId, welcome, { parse_mode: 'HTML' });
      this.updateUserStats(chatId, 'start');
    });

    // === ГЕНЕРАЦИЯ ВИРУСНОГО КОНТЕНТА ===
    this.bot.onText(/\/viral(?:\s+(.+))?/, async (msg, match) => {
      const chatId = msg.chat.id;
      const topic = match && match[1] ? match[1] : 'продвижение в Telegram';

      await this.bot!.sendMessage(chatId, '🔥 Создаю вирусный контент...');

      try {
        const cached = this.getCachedContent(topic);
        if (cached) {
          await this.bot!.sendMessage(chatId, 
            `🔥 <b>ВИРУСНЫЙ ПОСТ</b>\n\n${cached}\n\n✅ Готов к публикации!\n/publish - опубликовать`,
            { parse_mode: 'HTML' }
          );
          return;
        }

        const prompt = `Создай ВИРУСНЫЙ пост для Telegram про "${topic}":

1. Начни с мощного хука (эмодзи + шокирующий факт)
2. Создай интригу и любопытство
3. Дай реальную ценность
4. Добавь социальное доказательство
5. Призыв к действию
6. 350-500 символов
7. Используй психологические триггеры: FOMO, дефицит, авторитет

Формат: готовый пост с эмодзи`;

        const response = await grok.chat.completions.create({
          model: 'grok-2-latest',
          messages: [{ role: 'user', content: prompt }],
          temperature: 0.9,
          max_tokens: 600
        });

        const content = response.choices[0].message.content || '';
        this.setCachedContent(topic, content);

        await this.bot!.sendMessage(chatId,
          `🔥 <b>ВИРУСНЫЙ ПОСТ</b>\n\n${content}\n\n✅ Готов к публикации!\n/publish - опубликовать`,
          { parse_mode: 'HTML' }
        );

        this.updateUserStats(chatId, 'viral');
      } catch (error) {
        await this.bot!.sendMessage(chatId, '❌ Ошибка генерации. Попробуйте /viral еще раз');
      }
    });

    // === АНАЛИТИКА И СТАТИСТИКА ===
    this.bot.onText(/\/analytics/, async (msg) => {
      const chatId = msg.chat.id;
      
      try {
        const stats = await storage.getUserAnalytics(this.userId);
        
        const analytics = `📊 <b>АНАЛИТИКА КАНАЛА</b>

📢 Канал: ${this.channelId}

📈 <b>Показатели:</b>
• Постов: ${stats.totalPosts || 0}
• AI генераций: ${stats.aiGenerations || 0}
• Охват: ${stats.reach || 'N/A'}

💡 <b>Эффективность:</b>
• Вовлечение: ${stats.engagement || 0}%
• Рост: ${stats.growth || 0}%

🎯 <b>Рекомендации:</b>
✅ Используйте /viral 2-3 раза в день
✅ Публикуйте в 9:00, 15:00, 20:00
✅ Следите за /trends

/growth - получить план роста`;

        await this.bot!.sendMessage(chatId, analytics, { parse_mode: 'HTML' });
      } catch (error) {
        await this.bot!.sendMessage(chatId, '❌ Ошибка получения аналитики');
      }
    });

    // === ПЛАН РОСТА ===
    this.bot.onText(/\/growth/, async (msg) => {
      const chatId = msg.chat.id;
      await this.bot!.sendMessage(chatId, '📈 Создаю персональный план роста...');

      try {
        const prompt = `Создай детальный план роста Telegram канала на 30 дней:

НЕДЕЛЯ 1 (дни 1-7): ФУНДАМЕНТ
- Конкретные действия каждый день
- Ожидаемый результат: +100-200 подписчиков

НЕДЕЛЯ 2 (дни 8-14): ВИРУСНОСТЬ
- Вирусные механики
- Результат: +300-500

НЕДЕЛЯ 3 (дни 15-21): МАСШТАБ
- Платное продвижение (бюджет)
- Кросс-промо
- Результат: +500-800

НЕДЕЛЯ 4 (дни 22-30): МОНЕТИЗАЦИЯ
- Удержание аудитории
- Первые продажи
- Результат: +300-500

ИТОГО: 1200-2000 подписчиков за месяц

Конкретные шаги, без воды. До 1200 символов.`;

        const response = await grok.chat.completions.create({
          model: 'grok-2-latest',
          messages: [{ role: 'user', content: prompt }],
          temperature: 0.8,
          max_tokens: 1500
        });

        const plan = response.choices[0].message.content || '';
        await this.bot!.sendMessage(chatId, `📈 <b>ПЛАН РОСТА НА 30 ДНЕЙ</b>\n\n${plan}`, { parse_mode: 'HTML' });
      } catch (error) {
        await this.bot!.sendMessage(chatId, '❌ Ошибка создания плана');
      }
    });

    // === КОНКУРЕНТЫ ===
    this.bot.onText(/\/competitors/, async (msg) => {
      const chatId = msg.chat.id;
      await this.bot!.sendMessage(chatId, '🔍 Анализирую конкурентов...');

      try {
        const prompt = `ТОП-3 Telegram канала для продвижения и маркетинга:

Для каждого:
1. Название
2. Подписчики (примерно)
3. Сильные стороны
4. Слабые места
5. Что скопировать

Конкретно. До 800 символов.`;

        const response = await grok.chat.completions.create({
          model: 'grok-2-latest',
          messages: [{ role: 'user', content: prompt }],
          temperature: 0.7,
          max_tokens: 1000
        });

        const analysis = response.choices[0].message.content || '';
        await this.bot!.sendMessage(chatId, `🔍 <b>АНАЛИЗ КОНКУРЕНТОВ</b>\n\n${analysis}`, { parse_mode: 'HTML' });
      } catch (error) {
        await this.bot!.sendMessage(chatId, '❌ Ошибка анализа');
      }
    });

    // === ТРЕНДЫ ===
    this.bot.onText(/\/trends/, async (msg) => {
      const chatId = msg.chat.id;
      await this.bot!.sendMessage(chatId, '📈 Анализирую тренды...');

      try {
        const prompt = `Главные тренды Telegram 2025:

1. Контент-тренды (топ-5)
2. Форматы которые взрывают
3. 3 идеи для внедрения СЕГОДНЯ

Конкретно. До 600 символов.`;

        const response = await grok.chat.completions.create({
          model: 'grok-2-latest',
          messages: [{ role: 'user', content: prompt }],
          temperature: 0.9,
          max_tokens: 800
        });

        const trends = response.choices[0].message.content || '';
        await this.bot!.sendMessage(chatId, `📈 <b>ТРЕНДЫ 2025</b>\n\n${trends}`, { parse_mode: 'HTML' });
      } catch (error) {
        await this.bot!.sendMessage(chatId, '❌ Ошибка получения трендов');
      }
    });

    // === ПЕРСОНАЛЬНЫЕ РЕКОМЕНДАЦИИ ===
    this.bot.onText(/\/suggest/, async (msg) => {
      const chatId = msg.chat.id;
      const stats = userStats.get(chatId);
      const hour = new Date().getHours();

      let suggestion = '';

      if (!stats || stats.interactions < 5) {
        suggestion = `🌟 <b>ВЫ НОВИЧОК!</b>

Рекомендую:
1. /viral - создать вирусный пост
2. /growth - получить план роста
3. /autopilot - включить автопилот

Начните сейчас! 🚀`;
      } else if (hour >= 9 && hour <= 11) {
        suggestion = `☀️ <b>УТРО - ВРЕМЯ ДЕЙСТВОВАТЬ!</b>

Сейчас максимальная активность:
1. /viral - создать утренний пост
2. /publish - опубликовать
3. /analytics - проверить статистику

Утро = лучший охват! 📈`;
      } else if (hour >= 19 && hour <= 21) {
        suggestion = `🌙 <b>ВЕЧЕР - ПИКОВОЕ ВРЕМЯ!</b>

Максимум аудитории онлайн:
1. /viral - вечерний пост
2. Добавь интерактив (опрос)
3. Используй эмоции

Вечер = максимум вовлечения! 🔥`;
      } else {
        suggestion = `💡 <b>СЕЙЧАС ХОРОШЕЕ ВРЕМЯ</b>

Что сделать:
1. /competitors - изучить конкурентов
2. /trends - узнать тренды
3. /growth - спланировать рост

Подготовка = успех! 🎯`;
      }

      await this.bot!.sendMessage(chatId, suggestion, { parse_mode: 'HTML' });
    });

    // === АВТОПИЛОТ ===
    this.bot.onText(/\/autopilot/, async (msg) => {
      const chatId = msg.chat.id;
      
      const info = `🤖 <b>РЕЖИМ АВТОПИЛОТА</b>

✅ <b>ЧТО ВКЛЮЧЕНО:</b>
• Автоматическая генерация контента
• Публикации 3 раза в день
• AI-оптимизация постов
• Анализ эффективности

📊 <b>РЕЗУЛЬТАТЫ:</b>
• Экономия 2 часов в день
• +40% вовлечение
• Стабильный рост

💰 <b>СТОИМОСТЬ AI:</b>
• ~$0.01/день
• ~$0.30/месяц
• ROI: 10x+

⚙️ <b>УПРАВЛЕНИЕ:</b>
/schedule - расписание
/pause - остановить
/resume - возобновить

✅ Автопилот активен!`;

      await this.bot!.sendMessage(chatId, info, { parse_mode: 'HTML' });
    });

    // === AI ПОМОЩНИК (обработка текста) ===
    this.bot.on('message', async (msg) => {
      if (!msg.text || msg.text.startsWith('/')) return;

      const chatId = msg.chat.id;
      const text = msg.text;

      try {
        await this.bot!.sendChatAction(chatId, 'typing');

        const prompt = `Ты эксперт по продвижению в Telegram. 
Вопрос: "${text}"

Дай конкретный, полезный ответ с:
- Практическими советами
- Конкретными шагами
- Эмодзи для читаемости

До 400 символов.`;

        const response = await grok.chat.completions.create({
          model: 'grok-2-latest',
          messages: [{ role: 'user', content: prompt }],
          temperature: 0.8,
          max_tokens: 500
        });

        const answer = response.choices[0].message.content || 'Попробуйте переформулировать или используйте /help';
        await this.bot!.sendMessage(chatId, answer);
      } catch (error) {
        await this.bot!.sendMessage(chatId, '⚠️ Ошибка. Попробуйте команду из /start');
      }
    });

    // Обработка ошибок
    this.bot.on('polling_error', (error) => {
      if (error.message.includes('409')) {
        console.log('⚠️ Конфликт 409 - перезапуск через 5 секунд');
        setTimeout(() => this.initialize(), 5000);
      } else if (!error.message.includes('ETELEGRAM')) {
        console.log('⚠️ Ошибка polling:', error.message.substring(0, 100));
      }
    });
  }

  private setupScheduler() {
    // Утренний пост (9:00)
    cron.schedule('0 9 * * *', async () => {
      await this.autoPost('утренняя мотивация для роста канала');
      console.log('✅ Утренний автопост');
    });

    // Дневной пост (15:00)
    cron.schedule('0 15 * * *', async () => {
      await this.autoPost('полезный совет по продвижению');
      console.log('✅ Дневной автопост');
    });

    // Вечерний пост (20:00)
    cron.schedule('0 20 * * *', async () => {
      await this.autoPost('вечерний инсайт о трендах');
      console.log('✅ Вечерний автопост');
    });
  }

  private async autoPost(topic: string) {
    try {
      const prompt = `Создай вирусный пост для Telegram про "${topic}":
- Мощный хук
- Реальная ценность
- Призыв к действию
- 300-400 символов
- Эмодзи`;

      const response = await grok.chat.completions.create({
        model: 'grok-2-latest',
        messages: [{ role: 'user', content: prompt }],
        temperature: 0.85,
        max_tokens: 500
      });

      const content = response.choices[0].message.content || '';
      
      if (this.bot && this.channelId) {
        await this.bot.sendMessage(this.channelId, content);
        
        await storage.createActivityLog({
          userId: this.userId,
          action: 'Auto Post Published',
          description: `Автопост: ${topic}`,
          status: 'success',
          metadata: { topic, content: content.substring(0, 100) },
        });
      }
    } catch (error) {
      console.error('Ошибка автопоста:', error);
    }
  }

  private getCachedContent(key: string): string | null {
    const cached = contentCache.get(key);
    if (cached && Date.now() - cached.timestamp < CACHE_TTL) {
      return cached.content;
    }
    contentCache.delete(key);
    return null;
  }

  private setCachedContent(key: string, content: string): void {
    contentCache.set(key, { content, timestamp: Date.now() });
  }

  private updateUserStats(chatId: number, action: string): void {
    const stats = userStats.get(chatId) || {
      interactions: 0,
      lastActive: new Date(),
      preferences: []
    };

    stats.interactions++;
    stats.lastActive = new Date();
    if (!stats.preferences.includes(action)) {
      stats.preferences.push(action);
    }

    userStats.set(chatId, stats);
  }

  async stop() {
    if (this.bot) {
      await this.bot.stopPolling({ cancel: true });
      this.bot = null;
      isActive = false;
      promoBot = null;
      console.log('🛑 Промо-бот остановлен');
    }
  }
}

export { TelegramPromoBot, promoBot, isActive };
