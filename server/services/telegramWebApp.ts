
import TelegramBot from 'node-telegram-bot-api';

interface MiniAppConfig {
  url: string;
  title: string;
  description: string;
  shortName: string;
}

class TelegramMiniAppService {
  constructor(private bot: TelegramBot) {}

  // Создание кнопки для запуска Mini App
  createWebAppButton(appUrl: string, buttonText: string) {
    return {
      text: buttonText,
      web_app: { url: appUrl }
    };
  }

  // Отправка сообщения с Mini App
  async sendMiniApp(chatId: number, config: MiniAppConfig) {
    return await this.bot.sendMessage(chatId, config.description, {
      reply_markup: {
        inline_keyboard: [[
          this.createWebAppButton(config.url, config.title)
        ]]
      }
    });
  }

  // Валидация данных из Mini App
  validateWebAppData(initData: string, botToken: string): boolean {
    // Проверка подписи данных от Telegram WebApp
    const crypto = require('crypto');
    const urlParams = new URLSearchParams(initData);
    const hash = urlParams.get('hash');
    urlParams.delete('hash');
    
    const dataCheckString = Array.from(urlParams.entries())
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([key, value]) => `${key}=${value}`)
      .join('\n');
    
    const secretKey = crypto.createHmac('sha256', 'WebAppData').update(botToken).digest();
    const calculatedHash = crypto.createHmac('sha256', secretKey).update(dataCheckString).digest('hex');
    
    return calculatedHash === hash;
  }

  // Получение данных пользователя из Mini App
  parseWebAppUser(initData: string) {
    const urlParams = new URLSearchParams(initData);
    const userJson = urlParams.get('user');
    return userJson ? JSON.parse(userJson) : null;
  }
}

export const telegramWebAppService = new TelegramMiniAppService(null as any);
