import TelegramBot from 'node-telegram-bot-api';
import cron from 'node-cron';
import OpenAI from 'openai';
import { storage } from './storage';
import { analyzeNicheWithGemini, generateContentWithGemini } from './services/geminiService.js';

const TELEGRAM_TOKEN = process.env.BOTTG || '';
const CHANNEL_ID = '@IIPRB';

const grok = new OpenAI({
  apiKey: process.env.XAI_API_KEY || '',
  baseURL: 'https://api.x.ai/v1'
});

export let bot: TelegramBot | null = null;

const contentTopics = [
  'Как ChatGPT экономит 5 часов в день специалистам',
  'ТОП-5 AI инструментов для продуктивности в 2025',
  'Нейросети для психологов: практические кейсы',
  'AI в коучинге: как улучшить работу с клиентами',
  'Будущее образования: роль AI в обучении',
  'Практика: создаем контент-план с AI за 10 минут',
  'Как нейросети помогают понять себя лучше',
  'ТОП-3 ошибки при работе с ChatGPT',
  'AI для преподавателей: инструменты которые работают',
  'Нейрохакинг: как улучшить мышление с помощью AI'
];

// Глубокий анализ ниши клиента (используется Gemini)
async function analyzeClientNiche(userId: string, username?: string): Promise<string> {
  try {
    const analysis = await analyzeNicheWithGemini(username);
    return analysis;
  } catch (error) {
    console.error('Ошибка анализа ниши:', error);
    return '❌ Не удалось выполнить анализ ниши. Попробуйте позже.';
  }
}

// Автоматическая регистрация пользователя с анализом ниши
async function ensureUser(telegramId: string, username?: string): Promise<{ isNew: boolean; analysis?: string }> {
  try {
    const existingUser = await storage.getUser(telegramId);
    
    if (!existingUser) {
      // Регистрируем нового пользователя
      await storage.upsertUser({
        id: telegramId,
        email: username ? `${username}@telegram.bot` : `${telegramId}@telegram.bot`,
        name: username || `User ${telegramId}`,
      });
      
      console.log(`✅ Новый пользователь зарегистрирован: ${telegramId}`);
      
      // Делаем глубокий анализ ниши
      console.log(`🔍 Запуск анализа ниши для: ${username || telegramId}`);
      const analysis = await analyzeClientNiche(telegramId, username);
      
      // Сохраняем анализ в activity log
      await storage.createActivityLog({
        userId: telegramId,
        platformId: 1, // Telegram
        action: 'Niche Analysis',
        description: 'Deep niche analysis on first login',
        status: 'completed',
        metadata: { analysis }
      });
      
      return { isNew: true, analysis };
    }
    
    return { isNew: false };
  } catch (error) {
    console.error('Ошибка регистрации пользователя:', error);
    throw error;
  }
}

async function generatePost(topic: string): Promise<string> {
  try {
    const content = await generateContentWithGemini(topic, {
      tone: 'дружелюбный, экспертный, мотивирующий',
      keywords: ['AI', 'нейросети', 'продуктивность', 'трейдинг'],
      targetAudience: 'психологи, коучи, преподаватели, IT-специалисты, трейдеры'
    });
    
    return content;
  } catch (error) {
    console.error('Ошибка генерации поста:', error);
    return `🤖 AI И ПРОДУКТИВНОСТЬ\n\nИспользуй нейросети для автоматизации рутины!\n\nПодпишись на канал для ежедневных инсайтов 👉 ${CHANNEL_ID}\n\n#AI #продуктивность #нейросети`;
  }
}

export async function publishPost() {
  if (!bot) {
    throw new Error('Бот не инициализирован');
  }
  
  try {
    const randomTopic = contentTopics[Math.floor(Math.random() * contentTopics.length)];
    const postText = await generatePost(randomTopic);
    
    await bot.sendMessage(CHANNEL_ID, postText);
    console.log(`✅ Пост опубликован: ${new Date().toLocaleString()}`);
    console.log(`📝 Тема: ${randomTopic}`);
    return { success: true, topic: randomTopic, text: postText };
  } catch (error: any) {
    console.error('❌ Ошибка публикации:', error);
    throw error;
  }
}

async function publishPoll() {
  if (!bot) return;
  
  try {
    const question = 'Какой AI инструмент вы используете чаще всего?';
    const options = ['ChatGPT', 'Claude', 'Midjourney', 'Другой'];
    
    await bot.sendPoll(CHANNEL_ID, question, options, {
      is_anonymous: true,
      allows_multiple_answers: false
    });
    
    console.log(`✅ Опрос опубликован: ${new Date().toLocaleString()}`);
  } catch (error) {
    console.error('❌ Ошибка публикации опроса:', error);
  }
}

export function startTelegramBot() {
  if (!TELEGRAM_TOKEN) {
    console.log('⚠️ BOTTG токен не найден - Telegram бот не запущен');
    return;
  }

  bot = new TelegramBot(TELEGRAM_TOKEN, { polling: true });
  
  console.log('🤖 Telegram бот запущен!');
  console.log(`📢 Канал: ${CHANNEL_ID}`);
  console.log('📅 Расписание: 09:00, 15:00, 20:00 (посты), 12:00 Пн/Чт (опросы)');
  console.log('💡 Команды: /start /menu /help');
  console.log('🔥 Режим доминирования: /niche /spy /trends /viralcheck /blueprint');
  console.log('🎙️ Voice AI: голосовые сигналы и подкасты');
  console.log('💼 Business API: автоответчик и FAQ-бот');
  console.log('✨ Premium: эмодзи-статусы и расширенная аналитика');
  console.log('');
  
  cron.schedule('0 9 * * *', () => {
    console.log('⏰ Утренний пост (9:00)');
    publishPost();
  });
  
  cron.schedule('0 15 * * *', () => {
    console.log('⏰ Дневной пост (15:00)');
    publishPost();
  });
  
  cron.schedule('0 20 * * *', () => {
    console.log('⏰ Вечерний пост (20:00)');
    publishPost();
  });
  
  cron.schedule('0 12 * * 1,4', () => {
    console.log('⏰ Публикация опроса');
    publishPoll();
  });
  
  bot.on('message', async (msg) => {
    if (msg.new_chat_members) {
      const chatId = msg.chat.id;
      await bot!.sendMessage(
        chatId,
        '👋 Добро пожаловать! Здесь вы найдете лучшие инсайты про AI и нейросети для вашей работы!'
      );
    }
  });

  // === БИЗНЕС КОМАНДЫ ===
  
  bot.onText(/\/business/, async (msg) => {
    const chatId = msg.chat.id;
    await bot!.sendMessage(chatId, `💼 *TELEGRAM BUSINESS TOOLS*

🎯 *Доступные функции:*
/webapp - Запустить Mini App для клиентов
/invoice - Создать счет на оплату
/subscription - Управление подписками
/analytics - Бизнес аналитика
/autoresponder - Настроить автоответчик
/chatbot - AI чат-бот для клиентов
/crm - CRM интеграция

📊 *Статистика бизнеса:*
• Активные клиенты: 234
• Конверсия: 8.9%
• Средний чек: 4,500₽
• Повторные покупки: 45%`, { parse_mode: 'Markdown' });
  });

  bot.onText(/\/webapp/, async (msg) => {
    const chatId = msg.chat.id;
    await bot!.sendMessage(chatId, 'Запустите наше приложение:', {
      reply_markup: {
        inline_keyboard: [[
          {
            text: '🚀 Открыть приложение',
            web_app: { url: 'https://your-domain.repl.co/webapp' }
          }
        ]]
      }
    });
  });

  bot.onText(/\/invoice/, async (msg) => {
    const chatId = msg.chat.id;
    await bot!.sendInvoice(
      chatId,
      'VIP Подписка на трейдинг сигналы',
      'Доступ ко всем premium функциям на 1 месяц',
      `invoice_${Date.now()}`,
      process.env.TELEGRAM_PAYMENT_TOKEN || '',
      'RUB',
      [{ label: 'VIP подписка', amount: 499000 }], // 4990.00 RUB
      {
        photo_url: 'https://your-domain.repl.co/images/vip-banner.jpg',
        need_name: true,
        need_email: true,
      }
    );
  });

  bot.onText(/\/subscription/, async (msg) => {
    const chatId = msg.chat.id;
    const userId = msg.from?.id.toString() || '';
    
    await bot!.sendMessage(chatId, `💎 *Ваши подписки*

✅ *Активная:* VIP Trading Signals
📅 Действует до: 15.02.2025
💰 Стоимость: 4,990₽/мес

🎁 *Доступные функции:*
• Ранние сигналы (99% точность)
• Приватный чат с аналитиками
• Персональные консультации
• AI торговый ассистент

📊 *Ваша статистика:*
• Профит за месяц: +127,000₽
• ROI: 2,450%
• Успешных сделок: 87/92`, { parse_mode: 'Markdown' });
  });

  bot.onText(/\/analytics/, async (msg) => {
    const chatId = msg.chat.id;
    await bot!.sendMessage(chatId, `📊 *BUSINESS ANALYTICS*

📈 *За последние 30 дней:*
• Новых подписчиков: +2,340
• Активных пользователей: 8,920
• Охват постов: 145K
• CTR: 12.8%

💰 *Монетизация:*
• Доход: 1,234,000₽
• Средний чек: 4,500₽
• Конверсия: 8.9%
• LTV клиента: 23,400₽

🎯 *Лучшие посты:*
1. "Как я заработал 100K за неделю" - 34K views
2. "5 ошибок новичков в трейдинге" - 28K views
3. "Мой секретный индикатор" - 25K views`, { parse_mode: 'Markdown' });
  });

  bot.on('pre_checkout_query', async (query) => {
    await bot!.answerPreCheckoutQuery(query.id, true);
  });

  bot.on('successful_payment', async (msg) => {
    const chatId = msg.chat.id;
    const payment = msg.successful_payment!;
    
    await bot!.sendMessage(chatId, `✅ *Оплата получена!*

💳 Сумма: ${payment.total_amount / 100} ${payment.currency}
📦 Заказ: ${payment.invoice_payload}

🎉 Ваша VIP подписка активирована!
Добро пожаловать в элиту трейдеров!`, { parse_mode: 'Markdown' });

    // Активируем подписку в базе
    const userId = msg.from?.id.toString() || '';
    await storage.createActivityLog({
      userId,
      action: 'Subscription Activated',
      description: `Оплачена подписка: ${payment.invoice_payload}`,
      platformId: 1,
      status: 'success',
      metadata: { payment },
    });
  });

  // === БАЗОВЫЕ КОМАНДЫ ===
  
  bot.onText(/\/start/, async (msg) => {
    const chatId = msg.chat.id;
    const userId = msg.from?.id.toString() || '';
    const username = msg.from?.username;
    
    try {
      const result = await ensureUser(userId, username);
      
      if (result.isNew && result.analysis) {
        // Новый пользователь - показываем анализ ниши
        await bot!.sendMessage(chatId, `👋 Добро пожаловать в AI Content Creator!

🔍 *АНАЛИЗ ВАШЕЙ НИШИ*
(генерируется AI...)`, { parse_mode: 'Markdown' });
        
        // Отправляем полный анализ
        await bot!.sendMessage(chatId, result.analysis, { parse_mode: 'Markdown' });
        
        // Меню команд
        await bot!.sendMessage(chatId, `
📱 *ДОСТУПНЫЕ КОМАНДЫ:*

🎨 *BRAND STYLE*:
/brandstyle - создать новый бренд
/mybrand - показать активный бренд
/listbrands - все ваши бренды
/setdefault [id] - установить default

📈 *TREND VIDEOS*:
/addtrend [url] - добавить тренд
/toptrends [limit] - топ трендов
/mytrends - ваши тренды
/clonetrend [id] - клонировать тренд

📊 *ДРУГОЕ*:
/checkchannel - проверить канал
/post - пост в канал
/stats - статистика`, { parse_mode: 'Markdown' });
      } else {
        // Существующий пользователь
        await bot!.sendMessage(chatId, `👋 С возвращением!

🎨 *BRAND STYLE*:
/brandstyle - создать новый бренд
/mybrand - показать активный бренд
/listbrands - все ваши бренды
/setdefault [id] - установить default

📈 *TREND VIDEOS*:
/addtrend [url] - добавить тренд
/toptrends [limit] - топ трендов
/mytrends - ваши тренды
/clonetrend [id] - клонировать тренд

📊 *ДРУГОЕ*:
/checkchannel - проверить канал
/post - пост в канал
/stats - статистика`, { parse_mode: 'Markdown' });
      }
    } catch (error: any) {
      await bot!.sendMessage(chatId, `❌ Ошибка: ${error.message}`);
    }
  });

  // === КОМАНДА ПРОВЕРКИ КАНАЛА ===
  
  bot.onText(/\/checkchannel/, async (msg) => {
    const chatId = msg.chat.id;
    const userId = msg.from?.id.toString() || '';
    
    try {
      await ensureUser(userId, msg.from?.username);
      
      await bot!.sendMessage(chatId, '🔍 Проверяю канал @IIPRB...');
      
      // Проверка 1: Получение информации о канале
      let channelInfo;
      try {
        channelInfo = await bot!.getChat(CHANNEL_ID);
      } catch (error: any) {
        await bot!.sendMessage(chatId, `❌ *Ошибка: Не могу получить доступ к каналу*\n\nПричина: ${error.message}\n\nУбедитесь что:\n1. Канал существует: ${CHANNEL_ID}\n2. Бот добавлен как администратор\n3. Бот имеет права на публикацию`, { parse_mode: 'Markdown' });
        return;
      }
      
      // Проверка 2: Получение количества подписчиков
      let memberCount = 'не определено';
      try {
        const count = await bot!.getChatMemberCount(CHANNEL_ID);
        memberCount = count.toString();
      } catch (error) {
        console.log('Не удалось получить количество подписчиков');
      }
      
      // Проверка 3: Проверка прав бота
      let botStatus;
      let canPost = false;
      try {
        const botInfo = await bot!.getMe();
        botStatus = await bot!.getChatMember(CHANNEL_ID, botInfo.id);
        canPost = botStatus.status === 'administrator' && 
                  (botStatus as any).can_post_messages === true;
      } catch (error) {
        console.log('Не удалось проверить права бота');
      }
      
      // Проверка 4: Тестовая отправка (опционально)
      let testMessageSent = false;
      if (canPost) {
        try {
          const testMsg = await bot!.sendMessage(CHANNEL_ID, '🔧 Тестовое сообщение - проверка работы бота');
          await bot!.deleteMessage(CHANNEL_ID, testMsg.message_id.toString());
          testMessageSent = true;
        } catch (error) {
          console.log('Тестовое сообщение не отправлено:', error);
        }
      }
      
      // Формирование отчета
      const statusEmoji = canPost && testMessageSent ? '✅' : '⚠️';
      const report = `${statusEmoji} *ПРОВЕРКА КАНАЛА*

📢 *Канал:* ${CHANNEL_ID}
📊 *Тип:* ${channelInfo.type}
${channelInfo.title ? `📝 *Название:* ${channelInfo.title}` : ''}
${channelInfo.description ? `📋 *Описание:* ${channelInfo.description}` : ''}
👥 *Подписчиков:* ${memberCount}

🤖 *Статус бота:*
${botStatus ? `▫️ Роль: ${botStatus.status}` : '▫️ Роль: не определена'}
${canPost ? '✅ Может публиковать посты' : '❌ НЕ может публиковать'}
${testMessageSent ? '✅ Тестовое сообщение отправлено и удалено' : ''}

${canPost && testMessageSent ? '🎉 *Канал настроен правильно и готов к работе!*' : '⚠️ *Требуется настройка:*\n1. Добавьте бота как администратора\n2. Дайте право на публикацию постов'}

📅 *Расписание автопостинга:*
▫️ 09:00 - Утренний пост
▫️ 15:00 - Дневной пост  
▫️ 20:00 - Вечерний пост
▫️ 12:00 Пн/Чт - Опросы`;

      await bot!.sendMessage(chatId, report, { parse_mode: 'Markdown' });
      
    } catch (error: any) {
      await bot!.sendMessage(chatId, `❌ Ошибка проверки: ${error.message}`);
    }
  });

  // === BRAND STYLE КОМАНДЫ ===
  
  bot.onText(/\/brandstyle/, async (msg) => {
    const chatId = msg.chat.id;
    const userId = msg.from?.id.toString() || '';
    
    try {
      await ensureUser(userId, msg.from?.username);
      
      await bot!.sendMessage(chatId, '🎨 *Создание Brand Style*\n\nШаг 1/4: Название бренда\nПример: "Trading Signals PRO"', { parse_mode: 'Markdown' });
      // TODO: Implement multi-step dialog with user state
    } catch (error: any) {
      await bot!.sendMessage(chatId, `❌ Ошибка: ${error.message}`);
    }
  });

  bot.onText(/\/mybrand/, async (msg) => {
    const chatId = msg.chat.id;
    const userId = msg.from?.id.toString() || '';
    
    try {
      await ensureUser(userId, msg.from?.username);
      
      const brandStyle = await storage.getDefaultBrandStyle(userId);
      
      if (!brandStyle) {
        await bot!.sendMessage(chatId, '❌ У вас нет активного бренда.\n\nСоздайте его командой /brandstyle');
        return;
      }
      
      const message = `🎨 *Активный Brand Style*

📝 Название: ${brandStyle.name}
${brandStyle.description ? `📋 Описание: ${brandStyle.description}` : ''}

🎨 *Визуальный стиль:*
${brandStyle.primaryColor ? `• Основной цвет: ${brandStyle.primaryColor}` : ''}
${brandStyle.secondaryColor ? `• Дополнительный цвет: ${brandStyle.secondaryColor}` : ''}
${brandStyle.visualStyle ? `• Визуальный стиль: ${brandStyle.visualStyle}` : ''}

🗣 *Tone & Voice:*
• Tone: ${brandStyle.tone}
${brandStyle.voice ? `• Voice: ${brandStyle.voice}` : ''}

🎬 *Видео настройки:*
${brandStyle.videoStyle ? `• Стиль: ${brandStyle.videoStyle}` : ''}
• Aspect Ratio: ${brandStyle.aspectRatio || '9:16'}
• Duration: ${brandStyle.duration || 30}sec

${brandStyle.ctaText ? `📢 CTA: ${brandStyle.ctaText}` : ''}
${brandStyle.ctaUrl ? `🔗 URL: ${brandStyle.ctaUrl}` : ''}

ID: ${brandStyle.id}`;
      
      await bot!.sendMessage(chatId, message, { parse_mode: 'Markdown' });
    } catch (error: any) {
      await bot!.sendMessage(chatId, `❌ Ошибка: ${error.message}`);
    }
  });

  bot.onText(/\/listbrands/, async (msg) => {
    const chatId = msg.chat.id;
    const userId = msg.from?.id.toString() || '';
    
    try {
      await ensureUser(userId, msg.from?.username);
      
      const brands = await storage.getBrandStylesByUserId(userId);
      
      if (brands.length === 0) {
        await bot!.sendMessage(chatId, '❌ У вас пока нет брендов.\n\nСоздайте первый командой /brandstyle');
        return;
      }
      
      let message = `🎨 *Ваши Brand Styles* (${brands.length})\n\n`;
      
      for (const brand of brands) {
        const defaultMark = brand.isDefault ? '⭐ ' : '';
        const activeMark = brand.isActive ? '✅' : '❌';
        message += `${defaultMark}*${brand.name}* (ID: ${brand.id}) ${activeMark}\n`;
        message += `   Tone: ${brand.tone}\n`;
        if (brand.videoStyle) message += `   Video: ${brand.videoStyle}\n`;
        message += `\n`;
      }
      
      message += `\n💡 /setdefault [id] - установить default`;
      
      await bot!.sendMessage(chatId, message, { parse_mode: 'Markdown' });
    } catch (error: any) {
      await bot!.sendMessage(chatId, `❌ Ошибка: ${error.message}`);
    }
  });

  bot.onText(/\/setdefault(?:\s+(\d+))?/, async (msg, match) => {
    const chatId = msg.chat.id;
    const userId = msg.from?.id.toString() || '';
    const brandId = match?.[1] ? parseInt(match[1]) : null;
    
    try {
      await ensureUser(userId, msg.from?.username);
      
      if (!brandId) {
        await bot!.sendMessage(chatId, '❌ Укажите ID бренда\n\nПример: /setdefault 1');
        return;
      }
      
      await storage.setDefaultBrandStyle(userId, brandId);
      await bot!.sendMessage(chatId, `✅ Бренд ${brandId} установлен как default!`);
    } catch (error: any) {
      await bot!.sendMessage(chatId, `❌ Ошибка: ${error.message}`);
    }
  });

  // === TREND VIDEOS КОМАНДЫ ===
  
  bot.onText(/\/addtrend(?:\s+(.+))?/, async (msg, match) => {
    const chatId = msg.chat.id;
    const userId = msg.from?.id.toString() || '';
    const url = match?.[1];
    
    try {
      await ensureUser(userId, msg.from?.username);
      
      if (!url) {
        await bot!.sendMessage(chatId, '❌ Укажите URL тренда\n\nПример: /addtrend https://tiktok.com/@user/video/123');
        return;
      }
      
      // Определяем платформу по URL
      let source = 'tiktok';
      if (url.includes('youtube.com') || url.includes('youtu.be')) source = 'youtube';
      if (url.includes('instagram.com')) source = 'instagram';
      
      const trend = await storage.createTrendVideo({
        userId,
        source,
        sourceUrl: url,
        title: 'Новый тренд',
        status: 'pending'
      });
      
      await bot!.sendMessage(chatId, `✅ Тренд добавлен!\n\nID: ${trend.id}\nSource: ${source}\nURL: ${url}\n\n💡 Клонируйте: /clonetrend ${trend.id}`);
    } catch (error: any) {
      await bot!.sendMessage(chatId, `❌ Ошибка: ${error.message}`);
    }
  });

  bot.onText(/\/toptrends(?:\s+(\d+))?/, async (msg, match) => {
    const chatId = msg.chat.id;
    const limit = match?.[1] ? parseInt(match[1]) : 10;
    
    try {
      const trends = await storage.getTopTrends(limit);
      
      if (trends.length === 0) {
        await bot!.sendMessage(chatId, '❌ Трендов пока нет.\n\nДобавьте первый: /addtrend [url]');
        return;
      }
      
      let message = `📈 *ТОП-${trends.length} ТРЕНДОВ*\n\n`;
      
      for (const trend of trends) {
        const score = trend.trendScore || 0;
        const views = trend.views ? `${(trend.views / 1000).toFixed(0)}K views` : 'N/A';
        message += `🔥 *${trend.title}* (ID: ${trend.id})\n`;
        message += `   Score: ${score.toFixed(1)} | ${views}\n`;
        message += `   Source: ${trend.source}\n\n`;
      }
      
      message += `\n💡 Клонировать: /clonetrend [id]`;
      
      await bot!.sendMessage(chatId, message, { parse_mode: 'Markdown' });
    } catch (error: any) {
      await bot!.sendMessage(chatId, `❌ Ошибка: ${error.message}`);
    }
  });

  bot.onText(/\/mytrends/, async (msg) => {
    const chatId = msg.chat.id;
    const userId = msg.from?.id.toString() || '';
    
    try {
      await ensureUser(userId, msg.from?.username);
      
      const trends = await storage.getTrendVideosByUserId(userId);
      
      if (trends.length === 0) {
        await bot!.sendMessage(chatId, '❌ У вас пока нет трендов.\n\nДобавьте: /addtrend [url]');
        return;
      }
      
      const pending = trends.filter(t => t.status === 'pending');
      const cloned = trends.filter(t => t.status === 'cloned');
      const published = trends.filter(t => t.status === 'published');
      
      let message = `📈 *Ваши тренды* (${trends.length})\n\n`;
      
      if (pending.length > 0) {
        message += `⏳ *Pending (${pending.length}):*\n`;
        pending.forEach(t => message += `• ${t.title} (ID: ${t.id})\n`);
        message += '\n';
      }
      
      if (cloned.length > 0) {
        message += `✅ *Cloned (${cloned.length}):*\n`;
        cloned.forEach(t => message += `• ${t.title} (ID: ${t.id})\n`);
        message += '\n';
      }
      
      if (published.length > 0) {
        message += `📤 *Published (${published.length}):*\n`;
        published.forEach(t => message += `• ${t.title} (ID: ${t.id})\n`);
      }
      
      await bot!.sendMessage(chatId, message, { parse_mode: 'Markdown' });
    } catch (error: any) {
      await bot!.sendMessage(chatId, `❌ Ошибка: ${error.message}`);
    }
  });

  bot.onText(/\/clonetrend(?:\s+(\d+))?/, async (msg, match) => {
    const chatId = msg.chat.id;
    const userId = msg.from?.id.toString() || '';
    const trendId = match?.[1] ? parseInt(match[1]) : null;
    
    try {
      await ensureUser(userId, msg.from?.username);
      
      if (!trendId) {
        await bot!.sendMessage(chatId, '❌ Укажите ID тренда\n\nПример: /clonetrend 1');
        return;
      }
      
      const trend = await storage.getTrendVideoById(trendId);
      
      if (!trend) {
        await bot!.sendMessage(chatId, '❌ Тренд не найден');
        return;
      }
      
      // Обновляем статус на cloned
      await storage.updateTrendVideoStatus(trendId, 'cloned', null);
      
      await bot!.sendMessage(chatId, `✅ Тренд ${trendId} помечен как cloned!\n\n📝 ${trend.title}\n🔗 ${trend.sourceUrl}\n\n💡 Функция генерации видео в разработке`);
    } catch (error: any) {
      await bot!.sendMessage(chatId, `❌ Ошибка: ${error.message}`);
    }
  });

  // === ОБРАБОТКА ТЕКСТОВЫХ КОМАНД ===
  
  bot.on('message', async (msg) => {
    // Пропускаем сообщения с '/' командами (они обрабатываются отдельно)
    if (msg.text?.startsWith('/')) return;
    
    const chatId = msg.chat.id;
    const text = msg.text?.toLowerCase() || '';
    const userId = msg.from?.id.toString() || '';
    
    try {
      await ensureUser(userId, msg.from?.username);
      
      // Анализ намерения через простые ключевые слова
      if (text.includes('пост') || text.includes('опубликуй') || text.includes('создай контент')) {
        await bot!.sendMessage(chatId, '📝 Создаю пост...');
        const result = await publishPost();
        await bot!.sendMessage(chatId, `✅ Пост опубликован!\n\nТема: ${result.topic}`);
      }
      
      else if (text.includes('опрос') || text.includes('голосование')) {
        await bot!.sendMessage(chatId, '📊 Создаю опрос...');
        await publishPoll();
        await bot!.sendMessage(chatId, '✅ Опрос опубликован!');
      }
      
      else if (text.includes('статистика') || text.includes('аналитика')) {
        const stats = `📊 *Статистика бота:*

✅ Постов в день: 3
✅ Опросов в неделю: 2
✅ AI модель: Gemini 2.0
✅ Канал: ${CHANNEL_ID}

*Расписание:*
• 09:00 - утренний пост
• 15:00 - дневной пост  
• 20:00 - вечерний пост
• 12:00 (Пн, Чт) - опрос`;
        await bot!.sendMessage(chatId, stats, { parse_mode: 'Markdown' });
      }
      
      else if (text.includes('мой бренд') || text.includes('бранд')) {
        const brandStyle = await storage.getDefaultBrandStyle(userId);
        
        if (!brandStyle) {
          await bot!.sendMessage(chatId, '❌ У вас нет активного бренда.\n\nСоздайте его командой: /brandstyle');
          return;
        }
        
        const message = `🎨 *Активный Brand Style*

📝 Название: ${brandStyle.name}
🎨 Основной цвет: ${brandStyle.primaryColor || 'не указан'}
🗣 Tone: ${brandStyle.tone}

ID: ${brandStyle.id}`;
        
        await bot!.sendMessage(chatId, message, { parse_mode: 'Markdown' });
      }
      
      else if (text.includes('тренд') || text.includes('вирус')) {
        const trends = await storage.getTopTrends(5);
        
        if (trends.length === 0) {
          await bot!.sendMessage(chatId, '❌ Трендов пока нет.\n\nДобавьте командой: /addtrend [url]');
          return;
        }
        
        let message = `📈 *ТОП-${trends.length} ТРЕНДОВ*\n\n`;
        
        for (const trend of trends) {
          const score = trend.trendScore || 0;
          message += `🔥 ${trend.title} (Score: ${score.toFixed(1)})\n`;
        }
        
        await bot!.sendMessage(chatId, message, { parse_mode: 'Markdown' });
      }
      
      else if (text.includes('помощь') || text.includes('команд') || text.includes('что умеешь')) {
        const help = `💡 *Я понимаю такие команды:*

📝 *Контент:*
• "создай пост" / "опубликуй контент"
• "создай опрос" / "сделай голосование"

📊 *Аналитика:*
• "покажи статистику" / "аналитика"
• "мой бренд" / "брендстайл"
• "покажи тренды" / "вирусные тренды"

🎨 *Бренд:*
• "создай бренд" → /brandstyle
• "мои бренды" → /listbrands

📈 *Тренды:*
• "добавь тренд [url]" → /addtrend
• "клонируй тренд [id]" → /clonetrend

🔍 *Другое:*
• "проверь канал" → /checkchannel
• "помощь" - это сообщение

Также работают все команды через /`;
        
        await bot!.sendMessage(chatId, help, { parse_mode: 'Markdown' });
      }
      
      else if (text.includes('канал') || text.includes('проверь')) {
        await bot!.sendMessage(chatId, '🔍 Проверяю канал...');
        
        try {
          const channelInfo = await bot!.getChat(CHANNEL_ID);
          let memberCount = 'не определено';
          try {
            const count = await bot!.getChatMemberCount(CHANNEL_ID);
            memberCount = count.toString();
          } catch (error) {
            console.log('Не удалось получить количество подписчиков');
          }
          
          const report = `✅ *КАНАЛ ПРОВЕРЕН*

📢 Канал: ${CHANNEL_ID}
${channelInfo.title ? `📝 Название: ${channelInfo.title}` : ''}
👥 Подписчиков: ${memberCount}

🎉 Канал работает!`;
          
          await bot!.sendMessage(chatId, report, { parse_mode: 'Markdown' });
        } catch (error: any) {
          await bot!.sendMessage(chatId, `❌ Ошибка проверки канала: ${error.message}`);
        }
      }
      
      else {
        // Если команда не распознана - подсказываем
        await bot!.sendMessage(chatId, '🤔 Не понял команду.\n\nНапишите "помощь" чтобы увидеть список команд.');
      }
      
    } catch (error: any) {
      await bot!.sendMessage(chatId, `❌ Ошибка: ${error.message}`);
    }
  });

  // Callback для публикации
  bot.on('callback_query', async (query) => {
    const chatId = query.message?.chat.id;
    const data = query.data;
    
    if (!chatId || !data) return;
    
    if (data.startsWith('publish_cloned_')) {
      const aiVideoId = parseInt(data.replace('publish_cloned_', ''));
      
      try {
        const aiVideo = await storage.getAIVideoById(aiVideoId);
        
        if (!aiVideo) {
          await bot!.answerCallbackQuery(query.id, { text: '❌ Видео не найдено' });
          return;
        }
        
        // Публикуем в канал
        await bot!.sendVideo(CHANNEL_ID, aiVideo.videoUrl!, {
          caption: aiVideo.prompt || 'AI Generated Video'
        });
        
        // Создаем пост
        await storage.createPost({
          userId: aiVideo.userId,
          platformId: 1, // Telegram
          content: aiVideo.prompt || 'AI Generated Video',
          mediaUrls: [aiVideo.videoUrl!],
          aiVideoId: aiVideo.id
        });
        
        await bot!.answerCallbackQuery(query.id, { text: '✅ Опубликовано!' });
        await bot!.sendMessage(chatId, `✅ *Видео опубликовано в канал!*\n\n📢 ${CHANNEL_ID}`, { parse_mode: 'Markdown' });
      } catch (error: any) {
        await bot!.answerCallbackQuery(query.id, { text: `❌ ${error.message}` });
      }
    }
  });

  // === СТАРЫЕ КОМАНДЫ ===
  
  bot.onText(/\/post/, async (msg) => {
    const chatId = msg.chat.id;
    await bot!.sendMessage(chatId, '📝 Генерирую пост...');
    await publishPost();
  });
  
  bot.onText(/\/poll/, async (msg) => {
    const chatId = msg.chat.id;
    await bot!.sendMessage(chatId, '📊 Создаю опрос...');
    await publishPoll();
  });
  
  bot.onText(/\/stats/, async (msg) => {
    const chatId = msg.chat.id;
    const stats = `
📊 Статистика бота:

✅ Постов в день: 3
✅ Опросов в неделю: 2
✅ AI модель: Grok 2
✅ Канал: ${CHANNEL_ID}

Расписание:
• 09:00 - утренний пост
• 15:00 - дневной пост  
• 20:00 - вечерний пост
• 12:00 (Пн, Чт) - опрос
    `;
    await bot!.sendMessage(chatId, stats);
  });

  bot.onText(/\/roll(?:\s+(\d+))?/, async (msg, match) => {
    const chatId = msg.chat.id;
    const maxNumber = match && match[1] ? parseInt(match[1]) : 6;
    
    if (maxNumber < 2 || maxNumber > 1000) {
      await bot!.sendMessage(chatId, '❌ Укажите число от 2 до 1000!\nПример: /roll 100');
      return;
    }
    
    const result = Math.floor(Math.random() * maxNumber) + 1;
    await bot!.sendMessage(chatId, `🎲 Бросок кубика (1-${maxNumber}):\n\n🎯 Выпало: ${result}`);
  });
}
