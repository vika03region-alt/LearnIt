
import TelegramBot from 'node-telegram-bot-api';

interface BusinessConfig {
  workingHours: { start: number; end: number };
  autoReply: {
    enabled: boolean;
    message: string;
    delay: number;
  };
  greeting: {
    enabled: boolean;
    message: string;
  };
  awayMessage: {
    enabled: boolean;
    message: string;
  };
}

class TelegramBusinessService {
  private config: BusinessConfig = {
    workingHours: { start: 9, end: 18 },
    autoReply: {
      enabled: true,
      message: '✅ Спасибо за сообщение! Наш менеджер ответит в течение 15 минут.',
      delay: 3000,
    },
    greeting: {
      enabled: true,
      message: '👋 Добро пожаловать! Я AI-ассистент канала Lucifer Tradera.\n\n💡 Чем могу помочь?\n\n📊 /signals - торговые сигналы\n📈 /analysis - анализ рынка\n🎓 /education - обучение\n💎 /vip - VIP доступ',
    },
    awayMessage: {
      enabled: true,
      message: '🌙 Мы сейчас оффлайн. Рабочие часы: 9:00-18:00 МСК.\n\nОставьте сообщение, ответим утром!',
    },
  };

  constructor(private bot: TelegramBot) {}

  // Автоответчик с AI персонализацией
  async setupAutoResponder() {
    this.bot.on('message', async (msg) => {
      const chatId = msg.chat.id;
      const text = msg.text || '';
      
      // Проверка рабочих часов
      const hour = new Date().getHours();
      const isWorkingHours = hour >= this.config.workingHours.start && hour <= this.config.workingHours.end;

      if (!isWorkingHours && this.config.awayMessage.enabled) {
        await this.bot.sendMessage(chatId, this.config.awayMessage.message);
        return;
      }

      // Приветствие для новых пользователей
      if (text === '/start' && this.config.greeting.enabled) {
        await this.bot.sendMessage(chatId, this.config.greeting.message, {
          reply_markup: {
            inline_keyboard: [
              [
                { text: '📊 Сигналы', callback_data: 'signals' },
                { text: '📈 Анализ', callback_data: 'analysis' },
              ],
              [
                { text: '🎓 Обучение', callback_data: 'education' },
                { text: '💎 VIP', callback_data: 'vip' },
              ],
            ],
          },
        });
        return;
      }

      // AI автоответ через Gemini
      if (this.config.autoReply.enabled && !text.startsWith('/')) {
        setTimeout(async () => {
          const aiResponse = await this.generateAIResponse(text);
          await this.bot.sendMessage(chatId, aiResponse);
        }, this.config.autoReply.delay);
      }
    });
  }

  // FAQ бот с AI
  async setupFAQBot() {
    const faq = [
      {
        keywords: ['цена', 'стоимость', 'сколько'],
        answer: '💰 *Наши тарифы:*\n\n🆓 Базовый - бесплатно\n⭐ PRO - 2,990₽/мес\n💎 VIP - 9,990₽/мес\n\nПодробнее: /pricing',
      },
      {
        keywords: ['сигнал', 'торговля', 'трейдинг'],
        answer: '📊 *Торговые сигналы:*\n\n✅ 10-15 сигналов/день\n✅ 85% точность\n✅ Все рынки: Crypto, Forex, Stocks\n\nПопробовать: /signals',
      },
      {
        keywords: ['обучение', 'курс', 'учиться'],
        answer: '🎓 *Обучение трейдингу:*\n\n📚 Бесплатные уроки\n📹 Видео-курсы\n👨‍🏫 Личный наставник (VIP)\n\nНачать: /education',
      },
    ];

    this.bot.on('message', async (msg) => {
      const text = (msg.text || '').toLowerCase();
      
      for (const item of faq) {
        if (item.keywords.some(keyword => text.includes(keyword))) {
          await this.bot.sendMessage(msg.chat.id, item.answer, { parse_mode: 'Markdown' });
          break;
        }
      }
    });
  }

  // Бизнес-статусы
  async setBusinessStatus(status: 'online' | 'busy' | 'offline') {
    const statusMessages = {
      online: '✅ Онлайн - отвечаем мгновенно',
      busy: '⏳ Заняты - ответим через 15 минут',
      offline: '🌙 Оффлайн - ответим утром',
    };

    // В реальности использовали бы Telegram Business API
    console.log(`📱 Статус изменен: ${statusMessages[status]}`);
  }

  // AI персонализированный ответ
  private async generateAIResponse(userMessage: string): Promise<string> {
    try {
      const { geminiService } = await import('./geminiService');
      
      const context = `
Ты AI-ассистент канала Lucifer Tradera - эксперта по трейдингу.
Отвечай профессионально, но дружелюбно.
Сообщение пользователя: "${userMessage}"

Если вопрос о:
- Сигналах - предложи /signals
- Обучении - предложи /education
- VIP - предложи /vip
- Ценах - предложи /pricing
`;

      const response = await geminiService.generateContent(context, 'Отвечай кратко, максимум 3 предложения');
      return response.content || '✅ Спасибо за сообщение! Специалист ответит в ближайшее время.';
    } catch (error) {
      return '✅ Спасибо за сообщение! Специалист ответит в ближайшее время.';
    }
  }

  // Telegram Login Widget для сайта
  generateLoginWidget(domain: string): string {
    const botUsername = process.env.BOTTG?.split(':')[0] || 'your_bot';
    
    return `
<script async src="https://telegram.org/js/telegram-widget.js?22" 
  data-telegram-login="${botUsername}" 
  data-size="large" 
  data-auth-url="${domain}/auth/telegram" 
  data-request-access="write">
</script>`;
  }

  // Встраиваемый чат для сайта
  generateChatWidget(channelUsername: string): string {
    return `
<script async src="https://telegram.org/js/telegram-widget.js?22" 
  data-telegram-discussion="${channelUsername}" 
  data-comments-limit="5" 
  data-colorful="1">
</script>`;
  }
}

export const telegramBusinessService = new TelegramBusinessService(null as any);
