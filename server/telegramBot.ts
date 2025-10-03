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

let bot: TelegramBot | null = null;

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
    const prompt = `
Создай увлекательный пост для Telegram канала про AI и нейросети.

Тема: ${topic}

Требования:
- 300-500 символов
- Начни с эмодзи и цепляющего заголовка
- Дай практическую ценность
- Добавь призыв к действию
- Используй эмодзи для структуры
- В конце добавь 3-5 хештегов

Тон: дружелюбный, экспертный, мотивирующий
Аудитория: психологи, коучи, преподаватели, IT-специалисты

Ответь только текстом поста, без кавычек.
    `;

    const response = await grok.chat.completions.create({
      model: 'grok-2-latest',
      messages: [{ role: 'user', content: prompt }],
      temperature: 0.8,
      max_tokens: 600
    });

    return response.choices[0].message.content || 'Ошибка генерации контента';
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
/post - пост в канал
/stats - статистика`, { parse_mode: 'Markdown' });
      }
    } catch (error: any) {
      await bot!.sendMessage(chatId, `❌ Ошибка: ${error.message}`);
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
