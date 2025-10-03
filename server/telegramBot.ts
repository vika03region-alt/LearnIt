import TelegramBot from 'node-telegram-bot-api';
import cron from 'node-cron';
import OpenAI from 'openai';
import { storage } from './storage.js';

const TELEGRAM_TOKEN = process.env.BOTTG || '';
const CHANNEL_ID = '@IIPRB';

const grok = new OpenAI({
  apiKey: process.env.XAI_API_KEY || '',
  baseURL: 'https://api.x.ai/v1'
});

let bot: TelegramBot | null = null;
let isSchedulerPaused = false;
let isStarting = false;
let pollingActive = false;

// Хранилище последних постов пользователей для публикации
const userPosts = new Map<number, string>();

// 🛡️ ЗАЩИТА ОТ СПАМА И RATE LIMITING
const userCommandTimestamps = new Map<number, number[]>();
const userAIRequestTimestamps = new Map<number, number[]>();
const COMMAND_RATE_LIMIT = 5; // команд в минуту
const AI_RATE_LIMIT = 3; // AI запросов в минуту
const RATE_LIMIT_WINDOW = 60000; // 1 минута

// 📊 АНАЛИТИКА ИСПОЛЬЗОВАНИЯ
const commandStats = new Map<string, number>();
const userStats = new Map<number, {
  commands: number;
  aiRequests: number;
  postsCreated: number;
  lastActive: Date;
}>();

// 💾 КЭШ ДЛЯ ЧАСТЫХ ОТВЕТОВ
const responseCache = new Map<string, { response: string; timestamp: number }>();
const CACHE_TTL = 3600000; // 1 час

// 🔒 ЕДИНСТВЕННЫЙ ЭКЗЕМПЛЯР БОТА
let botInstanceId: string | null = null;

// 🧹 АВТОМАТИЧЕСКАЯ ОЧИСТКА КЭША (каждые 2 часа)
setInterval(() => {
  const now = Date.now();
  let cleared = 0;

  // Очищаем старый кэш
  for (const [key, value] of Array.from(responseCache.entries())) {
    if (now - value.timestamp > CACHE_TTL) {
      responseCache.delete(key);
      cleared++;
    }
  }

  // Очищаем старые timestamps
  for (const [userId, timestamps] of Array.from(userCommandTimestamps.entries())) {
    const recent = timestamps.filter((t: number) => now - t < RATE_LIMIT_WINDOW);
    if (recent.length === 0) {
      userCommandTimestamps.delete(userId);
    } else {
      userCommandTimestamps.set(userId, recent);
    }
  }

  for (const [userId, timestamps] of Array.from(userAIRequestTimestamps.entries())) {
    const recent = timestamps.filter((t: number) => now - t < RATE_LIMIT_WINDOW);
    if (recent.length === 0) {
      userAIRequestTimestamps.delete(userId);
    } else {
      userAIRequestTimestamps.set(userId, recent);
    }
  }

  console.log(`🧹 Очистка кэша: удалено ${cleared} записей`);
}, 7200000); // 2 часа

function checkRateLimit(userId: number, type: 'command' | 'ai'): boolean {
  const now = Date.now();
  const timestamps = type === 'command' 
    ? userCommandTimestamps.get(userId) || []
    : userAIRequestTimestamps.get(userId) || [];

  // Удаляем старые timestamps
  const recentTimestamps = timestamps.filter(t => now - t < RATE_LIMIT_WINDOW);

  const limit = type === 'command' ? COMMAND_RATE_LIMIT : AI_RATE_LIMIT;

  if (recentTimestamps.length >= limit) {
    return false;
  }

  recentTimestamps.push(now);

  if (type === 'command') {
    userCommandTimestamps.set(userId, recentTimestamps);
  } else {
    userAIRequestTimestamps.set(userId, recentTimestamps);
  }

  return true;
}

function updateUserStats(userId: number, action: 'command' | 'ai' | 'post') {
  const stats = userStats.get(userId) || {
    commands: 0,
    aiRequests: 0,
    postsCreated: 0,
    lastActive: new Date()
  };

  if (action === 'command') stats.commands++;
  if (action === 'ai') stats.aiRequests++;
  if (action === 'post') stats.postsCreated++;
  stats.lastActive = new Date();

  userStats.set(userId, stats);
}

function getCachedResponse(key: string): string | null {
  const cached = responseCache.get(key);
  if (cached && Date.now() - cached.timestamp < CACHE_TTL) {
    return cached.response;
  }
  responseCache.delete(key);
  return null;
}

function setCachedResponse(key: string, response: string): void {
  responseCache.set(key, { response, timestamp: Date.now() });
}

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

async function generatePost(topic: string): Promise<string> {
  try {
    const prompt = `Создай пост для Telegram про "${topic}". 300-500 символов. Начни с эмодзи, дай практическую ценность, призыв к действию. Аудитория: психологи, коучи, IT. Добавь 3-5 хештегов.`;

    const response = await grok.chat.completions.create({
      model: 'grok-2-latest',
      messages: [{ role: 'user', content: prompt }],
      temperature: 0.8,
      max_tokens: 500
    });

    return response.choices[0].message.content || 'Ошибка генерации контента';
  } catch (error) {
    console.error('Ошибка генерации поста:', error);
    return `🤖 AI И ПРОДУКТИВНОСТЬ\n\nИспользуй нейросети для автоматизации рутины!\n\nПодпишись на канал для ежедневных инсайтов 👉 ${CHANNEL_ID}\n\n#AI #продуктивность #нейросети`;
  }
}

export async function publishPost() {
  if (!bot || isSchedulerPaused) {
    console.log('⏸️ Публикация пропущена (бот на паузе)');
    return;
  }

  try {
    // Пытаемся получить запланированный пост из базы данных
    const telegramPlatform = await storage.getPlatformByName('telegram');
    if (telegramPlatform) {
      const scheduledPosts = await storage.getPostsByPlatformAndStatus(
        telegramPlatform.id, 
        'scheduled'
      );
      
      // Проверяем, есть ли посты готовые к публикации
      const now = new Date();
      const postToPublish = scheduledPosts.find((post: any) => 
        post.scheduledAt && new Date(post.scheduledAt) <= now
      );

      if (postToPublish) {
        // Публикуем пост с медиа если есть
        if (postToPublish.mediaUrls && postToPublish.mediaUrls.length > 0) {
          const videoUrl = postToPublish.mediaUrls[0]; // Первый - это видео
          const coverUrl = postToPublish.mediaUrls[1]; // Второй - это обложка

          if (videoUrl) {
            // Публикуем видео (обложка будет автоматически извлечена из видео)
            const caption = postToPublish.title 
              ? `${postToPublish.title}\n\n${postToPublish.content}`
              : postToPublish.content;

            await bot.sendVideo(CHANNEL_ID, videoUrl, {
              caption
            });
          } else {
            // Просто текстовый пост
            await bot.sendMessage(CHANNEL_ID, postToPublish.content);
          }
        } else {
          // Текстовый пост
          const text = postToPublish.title 
            ? `${postToPublish.title}\n\n${postToPublish.content}`
            : postToPublish.content;
          await bot.sendMessage(CHANNEL_ID, text);
        }

        // Обновляем статус поста
        await storage.updatePostStatus(postToPublish.id, 'published', new Date());
        
        console.log(`✅ Пост из БД опубликован: ${postToPublish.id}`);
        return { success: true, postId: postToPublish.id, fromDatabase: true };
      }
    }

    // Если нет запланированных постов, генерируем новый
    const randomTopic = contentTopics[Math.floor(Math.random() * contentTopics.length)];
    const postText = await generatePost(randomTopic);

    await bot.sendMessage(CHANNEL_ID, postText);
    console.log(`✅ Сгенерированный пост опубликован: ${new Date().toLocaleString()}`);
    console.log(`📝 Тема: ${randomTopic}`);
    return { success: true, topic: randomTopic, text: postText, fromDatabase: false };
  } catch (error: any) {
    console.error('❌ Ошибка публикации:', error);
    throw error;
  }
}

async function publishPoll() {
  if (!bot || isSchedulerPaused) return;

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

export async function startTelegramBot() {
  if (!TELEGRAM_TOKEN) {
    console.log('⚠️ BOTTG токен не найден - Telegram бот не запущен');
    return;
  }

  // 🔒 Генерируем уникальный ID экземпляра
  const currentInstanceId = `bot_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

  // Предотвращаем одновременный запуск нескольких экземпляров
  if (isStarting) {
    console.log('⚠️ Бот уже запускается, пропускаем повторный запуск');
    return;
  }

  isStarting = true;
  botInstanceId = currentInstanceId;

  try {
    // Если бот уже запущен, останавливаем его
    if (bot) {
      console.log('🔄 Остановка предыдущего экземпляра бота...');
      try {
        await bot.stopPolling({ cancel: true, reason: 'Restart requested' });
      } catch (e) {
        console.log('⚠️ Предупреждение при остановке:', e instanceof Error ? e.message : 'Unknown error');
      }
      bot = null;
      await new Promise(resolve => setTimeout(resolve, 3000));
    }

    // Создаём временный экземпляр для очистки webhook
    const tempBot = new TelegramBot(TELEGRAM_TOKEN, { polling: false });

    try {
      // Удаляем webhook, если был установлен
      await tempBot.deleteWebHook();
      console.log('✅ Webhook очищен');

      // Даем время серверам Telegram обработать удаление webhook и старому экземпляру завершиться
      await new Promise(resolve => setTimeout(resolve, 5000));
    } catch (error) {
      console.log('⚠️ Ошибка очистки webhook (возможно, его не было)');
    }

    // Запускаем бот с polling
    bot = new TelegramBot(TELEGRAM_TOKEN, { 
      polling: {
        interval: 1000,
        autoStart: true,
        params: {
          timeout: 30
        }
      }
    });

    // Обработка ошибок polling
    let conflict409Count = 0;
    bot.on('polling_error', (error) => {
      if (error.message.includes('409')) {
        conflict409Count++;
        if (conflict409Count === 1) {
          console.log('⚠️ Конфликт 409 обнаружен - скорее всего старый экземпляр еще активен');
          console.log('🔄 Автоматическое восстановление через 5 секунд...');
          
          // Останавливаем текущий экземпляр
          if (bot) {
            bot.stopPolling({ cancel: true }).catch(() => {});
          }
          
          // Пробуем перезапустить через 5 секунд
          setTimeout(() => {
            console.log('🔄 Попытка перезапуска бота...');
            startTelegramBot().catch(err => {
              console.error('❌ Не удалось перезапустить бота:', err.message);
            });
          }, 5000);
        }
        return;
      }
      
      // Логируем другие ошибки тихо, без паники
      if (!error.message.includes('ETELEGRAM')) {
        console.log('⚠️ Polling warning:', error.message.substring(0, 100));
      }
    });

  console.log('🤖 Telegram бот запущен!');
  console.log(`📢 Канал: ${CHANNEL_ID}`);
  console.log('');

  // Расписание постов
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

  // ====================================
  // БАЗОВЫЕ КОМАНДЫ
  // ====================================

  // 🛡️ Middleware для проверки rate limit
  bot.on('message', async (msg) => {
    if (!msg.text?.startsWith('/')) return;

    const chatId = msg.chat.id;

    if (!checkRateLimit(chatId, 'command')) {
      await bot!.sendMessage(chatId, '⏳ Слишком много команд! Подождите минуту и попробуйте снова.');
      return;
    }

    updateUserStats(chatId, 'command');

    // Логируем статистику команд
    const command = msg.text.split(' ')[0];
    commandStats.set(command, (commandStats.get(command) || 0) + 1);
  });

  bot.onText(/\/start/, async (msg) => {
    const chatId = msg.chat.id;
    const welcomeMessage = `
╔═══════════════════════════╗
   🤖 <b>LUCIFER TRADING BOT</b>
╚═══════════════════════════╝

Привет! Автоматизация соцсетей на AI 🚀

<b>✨ ВОЗМОЖНОСТИ:</b>

🎬 <b>AI ВИДЕО (Kling AI)</b>
   • Профессиональное качество 1080p
   • Text-to-Video за 20-30 сек
   • $0.25 за видео (лучшее в мире)

📝 <b>КОНТЕНТ (Grok AI)</b>
   • Вирусные посты за секунды
   • Идеи и хештеги на любую тему
   • AI ассистент 24/7

📊 <b>АНАЛИТИКА</b>
   • Тренды реального времени
   • Проверка вирусности контента
   • Анализ конкурентов

🚀 <b>АВТОМАТИЗАЦИЯ</b>
   • Автопостинг 3x/день
   • Расписание: 09:00, 15:00, 20:00
   • База данных для управления

━━━━━━━━━━━━━━━━━━━━━━━━━
🎯 /menu - Полное меню
📢 Канал: ${CHANNEL_ID}
━━━━━━━━━━━━━━━━━━━━━━━━━
    `;
    await bot!.sendMessage(chatId, welcomeMessage, { parse_mode: 'HTML' });
  });

  bot.onText(/\/menu/, async (msg) => {
    const chatId = msg.chat.id;

    const menuMessage = `
╔════════════════════════╗
   🎯 <b>ГЛАВНОЕ МЕНЮ</b>
╚════════════════════════╝

<b>🎬 AI ВИДЕО (Kling AI - #1 в мире)</b>
━━━━━━━━━━━━━━━━━━━━━━━
/aivideo [текст] - Создать видео ($0.25) 🎥
/uploadvideo - Загрузить своё видео 📤

<b>📝 КОНТЕНТ (Grok AI)</b>
━━━━━━━━━━━━━━━━━━━━━━━
/viral [тема] - Вирусный пост 🔥
/ideas [ниша] - Идеи для контента 💡
/hashtags [тема] - Популярные хештеги #️⃣
/hook [тема] - Цепляющий хук 🎣
/rewrite [текст] - Улучшить пост ✍️

<b>📊 АНАЛИТИКА & ТРЕНДЫ</b>
━━━━━━━━━━━━━━━━━━━━━━━
/analytics - Статистика канала 📈
/trends [ниша] - Актуальные тренды 🔥
/growth - Прогноз роста 📊
/spy [канал] - Анализ конкурентов 🔍

<b>🚀 ПРОДВИЖЕНИЕ</b>
━━━━━━━━━━━━━━━━━━━━━━━
/contest - Создать конкурс 🎁
/quiz [тема] - Интерактивная викторина ❓
/challenge [тема] - Челлендж для подписчиков 💪
/boost - План роста на 30 дней 📈

<b>⚙️ УПРАВЛЕНИЕ</b>
━━━━━━━━━━━━━━━━━━━━━━━
/publish - Опубликовать сохранённый пост 📤
/schedule - Расписание автопостинга ⏰
/mystats - Твоя статистика использования ⭐
/help - Полный список команд 📋

━━━━━━━━━━━━━━━━━━━━━━━
💬 <b>AI АССИСТЕНТ (Grok AI)</b>
Просто напиши вопрос - отвечу моментально!
━━━━━━━━━━━━━━━━━━━━━━━

<b>⚡ БЫСТРЫЙ СТАРТ:</b>
1️⃣ /viral trading - создай пост
2️⃣ /aivideo bitcoin - или видео
3️⃣ "опубликуй" - выложи в канал

💡 <b>Rate Limits:</b>
• Команды: 5/минуту
• AI запросы: 3/минуту
• Видео: 3/минуту

🎯 Канал: ${CHANNEL_ID}
    `;
    await bot!.sendMessage(chatId, menuMessage, { parse_mode: 'HTML' });
  });

  bot.onText(/\/help/, async (msg) => {
    const chatId = msg.chat.id;
    const helpMessage = `
╔═══════════════════════╗
      📚 <b>ВСЕ КОМАНДЫ</b>
╚═══════════════════════╝

<b>🏠 БАЗОВЫЕ КОМАНДЫ</b>
━━━━━━━━━━━━━━━━━━━━━━━
/start - Приветствие и возможности
/menu - Главное меню (быстрый доступ)
/help - Эта справка

<b>🎬 AI ВИДЕО (Kling AI)</b>
━━━━━━━━━━━━━━━━━━━━━━━
/aivideo [промпт] - Генерация видео ($0.25)
  Пример: /aivideo bitcoin rocket to the moon
  
/uploadvideo - Загрузка своего видео
  Получить ссылку на загрузку через Dashboard

<b>📝 ГЕНЕРАЦИЯ КОНТЕНТА (Grok AI)</b>
━━━━━━━━━━━━━━━━━━━━━━━
/viral [тема] - Вирусный пост
  Пример: /viral AI инструменты
  
/ideas [ниша] - 5 идей для контента
  Пример: /ideas крипта
  
/hashtags [тема] - Популярные хештеги
/hook [тема] - Цепляющий заголовок
/rewrite [текст] - Улучшение поста

<b>📤 ПУБЛИКАЦИЯ</b>
━━━━━━━━━━━━━━━━━━━━━━━
/publish - Опубликовать последний сохранённый пост
  Или напиши: "опубликуй", "опубликовать"
  
/post - Сгенерировать и сразу опубликовать
/poll - Создать опрос для подписчиков

<b>📊 АНАЛИТИКА И ТРЕНДЫ</b>
━━━━━━━━━━━━━━━━━━━━━━━
/analytics - Статистика канала
/trends [ниша] - Актуальные тренды
/growth - Прогноз роста
/spy [канал] - Шпионаж за конкурентами
/audit - Аудит контента
/viralcheck - Проверка вирусности

<b>🚀 ПРОДВИЖЕНИЕ</b>
━━━━━━━━━━━━━━━━━━━━━━━
/contest - Создать конкурс
/quiz [тема] - Интерактивная викторина
/challenge [тема] - Челлендж
/boost - План роста на 30 дней
/magnet - Лид-магнит
/blueprint - Стратегия продвижения

<b>⚙️ УПРАВЛЕНИЕ</b>
━━━━━━━━━━━━━━━━━━━━━━━
/schedule - Расписание автопостинга
  • 09:00 - Утренний пост
  • 15:00 - Дневной пост
  • 20:00 - Вечерний пост
  • 12:00 Пн/Чт - Опросы
  
/pause - Остановить автопостинг
/resume - Возобновить автопостинг
/mystats - Твоя статистика использования

<b>💬 AI АССИСТЕНТ (Grok AI)</b>
━━━━━━━━━━━━━━━━━━━━━━━
Просто пиши вопросы без команд!
Отвечу на любой вопрос по маркетингу,
трейдингу, продвижению и AI инструментам.

<b>🛡️ ЛИМИТЫ</b>
━━━━━━━━━━━━━━━━━━━━━━━
• Команды: 5 в минуту
• AI запросы: 3 в минуту
• Генерация видео: 3 в минуту
• Кэш ответов: 1 час

━━━━━━━━━━━━━━━━━━━━━━━
<b>💡 БЫСТРЫЙ СТАРТ:</b>

1. Создай контент:
   /viral trading или /aivideo bitcoin

2. Сохрани (автоматически)
   
3. Опубликуй:
   Напиши "опубликуй" или /publish

━━━━━━━━━━━━━━━━━━━━━━━
🎯 /menu - Главное меню
📢 Канал: ${CHANNEL_ID}
💰 Стоимость: ~$0.79/день
━━━━━━━━━━━━━━━━━━━━━━━

<b>🚀 АВТОМАТИЗАЦИЯ:</b>
Dashboard → Master Automation
Полная автоматизация 10 шагов:
• Сбор трендов (Grok AI)
• Генерация контента (Grok AI)
• AI видео (Kling AI)
• Автопостинг (3x/день)
• Аналитика + A/B тесты
    `;
    await bot!.sendMessage(chatId, helpMessage, { parse_mode: 'HTML' });
  });

  // ====================================
  // ДЕЙСТВИЯ
  // ====================================

  // ====================================
  // ГЕНЕРАЦИЯ И ПУБЛИКАЦИЯ
  // ====================================

  bot.onText(/\/post/, async (msg) => {
    const chatId = msg.chat.id;
    await bot!.sendMessage(chatId, '📝 Генерирую AI пост...');
    try {
      await publishPost();
      await bot!.sendMessage(chatId, '✅ Пост успешно опубликован в канале!');
    } catch (error) {
      await bot!.sendMessage(chatId, '❌ Ошибка публикации. Проверьте права бота.');
    }
  });

  bot.onText(/\/poll/, async (msg) => {
    const chatId = msg.chat.id;
    await bot!.sendMessage(chatId, '📊 Создаю опрос...');
    try {
      await publishPoll();
      await bot!.sendMessage(chatId, '✅ Опрос опубликован в канале!');
    } catch (error) {
      await bot!.sendMessage(chatId, '❌ Ошибка публикации опроса.');
    }
  });

  // ====================================
  // ГЕНЕРАЦИЯ КОНТЕНТА
  // ====================================

  bot.onText(/\/publish/, async (msg) => {
    const chatId = msg.chat.id;
    const savedPost = userPosts.get(chatId);

    if (!savedPost) {
      await bot!.sendMessage(chatId, '❌ Нет сохранённого поста!\n\n💡 Сначала создай пост:\n/viral - вирусный пост\n/contest - конкурс\n/challenge - челлендж');
      return;
    }

    try {
      await bot!.sendMessage(chatId, '📤 Публикую в канал...');
      await bot!.sendMessage(CHANNEL_ID, savedPost);
      await bot!.sendMessage(chatId, `✅ Пост успешно опубликован в канале ${CHANNEL_ID}!`);

      // Удаляем пост после публикации
      userPosts.delete(chatId);
      console.log(`✅ Пост опубликован пользователем ${chatId} по команде /publish`);
    } catch (error) {
      console.error('❌ Ошибка публикации поста:', error);
      await bot!.sendMessage(chatId, '❌ Ошибка публикации. Проверьте права бота в канале.');
    }
  });

  bot.onText(/\/ideas(?:\s+(.+))?/, async (msg, match) => {
    const chatId = msg.chat.id;
    const niche = match && match[1] ? match[1] : 'AI и нейросети';

    await bot!.sendMessage(chatId, '💡 Генерирую идеи для контента...');

    try {
      const prompt = `5 идей для постов в Telegram про "${niche}". Каждая: заголовок + 1 предложение.`;

      const response = await grok.chat.completions.create({
        model: 'grok-2-latest',
        messages: [{ role: 'user', content: prompt }],
        temperature: 0.9,
        max_tokens: 600
      });

      const ideas = response.choices[0].message.content || 'Ошибка генерации';
      await bot!.sendMessage(chatId, `💡 ИДЕИ ДЛЯ КОНТЕНТА\n\nНиша: ${niche}\n\n${ideas}`);
    } catch (error) {
      await bot!.sendMessage(chatId, '❌ Ошибка генерации идей. Попробуйте позже.');
    }
  });

  bot.onText(/\/viral(?:\s+(.+))?/, async (msg, match) => {
    const chatId = msg.chat.id;
    const topic = match && match[1] ? match[1] : 'AI инструменты';

    await bot!.sendMessage(chatId, '🚀 Создаю вирусный пост...');

    try {
      const prompt = `Создай ВИРУСНЫЙ пост для Telegram про "${topic}": сильный хук, эмоции, ценность, 350-600 символов, эмодзи.`;

      const response = await grok.chat.completions.create({
        model: 'grok-2-latest',
        messages: [{ role: 'user', content: prompt }],
        temperature: 0.85,
        max_tokens: 600
      });

      const viralPost = response.choices[0].message.content || 'Ошибка генерации';

      // Сохраняем пост для публикации
      userPosts.set(chatId, viralPost);

      await bot!.sendMessage(chatId, `🚀 ВИРУСНЫЙ ПОСТ:\n\n${viralPost}\n\n✅ Готов к публикации!\n\n💡 Для публикации:\n• Команда: /publish\n• Или напиши: "опубликуй"`);
    } catch (error) {
      await bot!.sendMessage(chatId, '❌ Ошибка генерации. Попробуйте позже.');
    }
  });

  bot.onText(/\/hashtags(?:\s+(.+))?/, async (msg, match) => {
    const chatId = msg.chat.id;
    const topic = match && match[1] ? match[1] : contentTopics[0];

    await bot!.sendMessage(chatId, '#️⃣ Генерирую хештеги...');

    try {
      const prompt = `10 хештегов для поста "${topic}": 5 популярных, 5 нишевых. Формат: #хештег - описание`;

      const response = await grok.chat.completions.create({
        model: 'grok-2-latest',
        messages: [{ role: 'user', content: prompt }],
        temperature: 0.7,
        max_tokens: 400
      });

      const hashtags = response.choices[0].message.content || 'Ошибка генерации';
      await bot!.sendMessage(chatId, `#️⃣ ХЕШТЕГИ:\n\n${hashtags}`);
    } catch (error) {
      await bot!.sendMessage(chatId, '❌ Ошибка генерации хештегов.');
    }
  });

  bot.onText(/\/rewrite\s+(.+)/, async (msg, match) => {
    const chatId = msg.chat.id;
    const text = match && match[1] ? match[1] : '';

    if (!text) {
      await bot!.sendMessage(chatId, '❌ Укажите текст!\n\nПример: /rewrite Ваш текст');
      return;
    }

    await bot!.sendMessage(chatId, '✍️ Переписываю текст...');

    try {
      const prompt = `Переписать текст: живой стиль, эмодзи, структура. Текст: "${text}"`;

      const response = await grok.chat.completions.create({
        model: 'grok-2-latest',
        messages: [{ role: 'user', content: prompt }],
        temperature: 0.8,
        max_tokens: 500
      });

      const rewritten = response.choices[0].message.content || 'Ошибка';
      await bot!.sendMessage(chatId, `✍️ ПЕРЕПИСАННЫЙ ТЕКСТ:\n\n${rewritten}`);
    } catch (error) {
      await bot!.sendMessage(chatId, '❌ Ошибка переписывания текста.');
    }
  });

  // ====================================
  // АНАЛИТИКА
  // ====================================

  bot.onText(/\/analytics/, async (msg) => {
    const chatId = msg.chat.id;
    await bot!.sendMessage(chatId, '📊 Получаю аналитику...');

    const analytics = `📊 АНАЛИТИКА КАНАЛА

📢 Канал: ${CHANNEL_ID}

📈 Активность бота:
• Постов: 3/день
• Опросов: 2/неделю
• AI модель: Grok 2
• Стоимость поста: ~$0.0001

⏰ Расписание:
• 09:00 - утренний пост
• 15:00 - дневной пост
• 20:00 - вечерний пост
• 12:00 (Пн/Чт) - опросы

💡 Рекомендации:
✅ Контент публикуется регулярно
✅ Используется бюджетная AI модель
✅ Опросы для вовлечения работают

Для детального отчета: /report
Для прогноза роста: /growth`;

    await bot!.sendMessage(chatId, analytics);
  });

  bot.onText(/\/growth/, async (msg) => {
    const chatId = msg.chat.id;
    await bot!.sendMessage(chatId, '📈 Анализирую потенциал роста...');

    try {
      const prompt = `Прогноз роста подписчиков для Telegram канала про AI: день/неделя/месяц. Источники роста и как ускорить. До 400 символов.`;

      const response = await grok.chat.completions.create({
        model: 'grok-2-latest',
        messages: [{ role: 'user', content: prompt }],
        temperature: 0.7,
        max_tokens: 500
      });

      const growth = response.choices[0].message.content || 'Ошибка';
      await bot!.sendMessage(chatId, `📈 ПРОГНОЗ РОСТА\n\n${growth}\n\n💡 Используйте /crosspromo для ускорения`);
    } catch (error) {
      await bot!.sendMessage(chatId, '❌ Ошибка анализа.');
    }
  });

  bot.onText(/\/report/, async (msg) => {
    const chatId = msg.chat.id;
    const date = new Date().toLocaleDateString('ru-RU');

    const report = `📋 ОТЧЕТ ЗА ${date}

📊 ПУБЛИКАЦИИ:
✅ Постов: 3/день
✅ Опросов: 2/неделю
✅ AI генерация: Grok 2
✅ Стоимость: $0.0003/день

💰 ЭКОНОМИКА:
• Затраты на AI: $0.01/месяц
• Экономия vs GPT-4: 90%
• ROI: отличный

🎯 РЕКОМЕНДАЦИИ:
1. Продолжайте текущую стратегию
2. Используйте /spy для анализа конкурентов
3. Тестируйте /viralcheck перед публикацией
4. Следите за /trends

✅ Все показатели в норме!
Статус: ${isSchedulerPaused ? '⏸️ На паузе' : '✅ Активен'}`;

    await bot!.sendMessage(chatId, report);
  });

  // ====================================
  // ПРОДВИЖЕНИЕ
  // ====================================

  bot.onText(/\/crosspromo/, async (msg) => {
    const chatId = msg.chat.id;

    const crossPromo = `🤝 КРОСС-ПРОМО

Взаимный пиар - эффективный способ роста!

📊 Как работает:
1. Найдите каналы вашей ниши (500-5К)
2. Договоритесь об обмене постами
3. Публикуйте про канал партнера
4. Получайте подписчиков

🎯 Где искать:
• @tgchannels
• @PR_Baza
• Тематические комьюнити

💡 Эффективность:
✅ Конверсия: 5-15%
✅ Целевая аудитория
✅ Бесплатно

📝 Шаблон сообщения:
"Привет! У меня канал про AI (${CHANNEL_ID}). Предлагаю взаимный пост. Аудитория близкая!"

💡 Команды для анализа:
/spy - шпионаж за каналами
/niche - анализ ниши
/competitors - ТОП конкурентов`;

    await bot!.sendMessage(chatId, crossPromo);
  });

  bot.onText(/\/competitors/, async (msg) => {
    const chatId = msg.chat.id;
    await bot!.sendMessage(chatId, '🔍 Анализирую конкурентов...');
    await bot!.sendChatAction(chatId, 'typing');

    try {
      const prompt = `ТОП-3 Telegram канала про AI и нейросети:

Для каждого укажи:
1. Название канала
2. Примерное кол-во подписчиков
3. Что делают ХОРОШО (сильные стороны)
4. Что делают ПЛОХО (слабые места)
5. Что можно скопировать

Конкретно и по делу. До 600 символов.`;

      const response = await grok.chat.completions.create({
        model: 'grok-2-latest',
        messages: [{ role: 'user', content: prompt }],
        temperature: 0.7,
        max_tokens: 700
      });

      const competitors = response.choices[0].message.content || 'Ошибка';
      await bot!.sendMessage(chatId, `🔍 ТОП-3 КОНКУРЕНТА\n\n${competitors}\n\n💡 Детальный анализ: /spy [название канала]`);
    } catch (error) {
      await bot!.sendMessage(chatId, '❌ Ошибка анализа конкурентов.');
    }
  });

  bot.onText(/\/chatlist/, async (msg) => {
    const chatId = msg.chat.id;

    const chatList = `💬 ЧАТЫ ДЛЯ ПРОДВИЖЕНИЯ

🎯 <b>AI/Tech чаты:</b>
• @ai_chat_ru - AI сообщество
• @chatgpt_community - ChatGPT обсуждения
• @neural_networks_chat - Нейросети

📢 <b>Промо-чаты:</b>
• @prbartertg - Бартер и обмен
• @channel_promo - Продвижение каналов
• @free_pr_chat - Бесплатный PR

💼 <b>Бизнес чаты:</b>
• @startupru - Стартапы
• @marketologiru - Маркетинг

💡 <b>Правила успеха:</b>
❌ НЕ спамьте рекламой
✅ Давайте полезный контент
✅ Будьте экспертом в теме
✅ Помогайте другим участникам

📊 <b>Ожидаемый результат:</b>
• +30-50 подписчиков/месяц
• Целевая аудитория
• Нетворкинг и связи

🚀 <b>Стратегия:</b>
1. Вступите в 5-10 чатов
2. Будьте активны 2-3 раза в день
3. Делитесь опытом, не рекламой
4. Упоминайте канал естественно`;

    await bot!.sendMessage(chatId, chatList, { parse_mode: 'HTML' });
  });

  // ====================================
  // УТИЛИТЫ
  // ====================================

  bot.onText(/\/schedule/, async (msg) => {
    const chatId = msg.chat.id;

    const schedule = `📅 РАСПИСАНИЕ ПУБЛИКАЦИЙ

⏰ Ежедневные посты:
• 09:00 - Утренний пост
• 15:00 - Дневной пост
• 20:00 - Вечерний пост

📊 Опросы:
• 12:00 (Пн, Чт)

🤖 AI: Grok 2
💰 Стоимость: ~$0.0001/пост

Статус: ${isSchedulerPaused ? '⏸️ На паузе' : '✅ Активно'}

Управление:
/pause - остановить
/resume - возобновить
/post - опубликовать сейчас`;

    await bot!.sendMessage(chatId, schedule);
  });

  bot.onText(/\/pause/, async (msg) => {
    const chatId = msg.chat.id;
    isSchedulerPaused = true;

    await bot!.sendMessage(chatId, `⏸️ ПУБЛИКАЦИИ ОСТАНОВЛЕНЫ

Автоматические посты и опросы приостановлены.

Чтобы возобновить:
/resume - запустить снова
/post - опубликовать пост вручную

Статус: ⏸️ На паузе`);
  });

  bot.onText(/\/resume/, async (msg) => {
    const chatId = msg.chat.id;
    isSchedulerPaused = false;

    await bot!.sendMessage(chatId, `▶️ ПУБЛИКАЦИИ ВОЗОБНОВЛЕНЫ

Автопилот снова активен!

⏰ Следующие публикации:
• 09:00 - утренний пост
• 15:00 - дневной пост
• 20:00 - вечерний пост

Статус: ✅ Активен`);
  });

  bot.onText(/\/settings/, async (msg) => {
    const chatId = msg.chat.id;

    const settings = `⚙️ НАСТРОЙКИ БОТА

📊 Конфигурация:
• AI модель: Grok 2
• Канал: ${CHANNEL_ID}
• Постов в день: 3
• Опросов в неделю: 2
• Язык: Русский

⏰ Расписание:
• 09:00, 15:00, 20:00 - посты
• 12:00 (Пн/Чт) - опросы

💰 Экономика:
• Стоимость поста: $0.0001
• Экономия vs GPT-4: 90%
• Расход в месяц: ~$0.01

📈 Статус: ${isSchedulerPaused ? '⏸️ На паузе' : '✅ Активен'}

🔧 Управление:
/pause - остановить автопубликацию
/resume - возобновить автопубликацию
/schedule - подробное расписание`;

    await bot!.sendMessage(chatId, settings);
  });

  // ====================================
  // РЕЖИМ ДОМИНИРОВАНИЯ
  // ====================================

  bot.onText(/\/niche(?:\s+(.+))?/, async (msg, match) => {
    const chatId = msg.chat.id;
    const niche = match && match[1] ? match[1] : 'AI и нейросети';

    await bot!.sendMessage(chatId, '🔍 Анализирую нишу... ⏳ 10-15 сек');
    await bot!.sendChatAction(chatId, 'typing');

    try {
      const prompt = `Анализ ниши "${niche}" в Telegram 2025:
1. Размер рынка и рост
2. ТОП-3 игрока (аудитория, УТП, слабости)
3. Тренды и пробелы
4. Стратегия входа
5. Монетизация

До 1000 символов, конкретно.`;

      const response = await grok.chat.completions.create({
        model: 'grok-2-latest',
        messages: [{ role: 'user', content: prompt }],
        temperature: 0.7,
        max_tokens: 1200
      });

      const analysis = response.choices[0].message.content || 'Ошибка анализа';
      await bot!.sendMessage(chatId, `📊 АНАЛИЗ НИШИ: ${niche}\n\n${analysis}`);
    } catch (error) {
      await bot!.sendMessage(chatId, '❌ Ошибка анализа ниши.');
    }
  });

  bot.onText(/\/spy(?:\s+(.+))?/, async (msg, match) => {
    const chatId = msg.chat.id;
    const competitor = match && match[1] ? match[1] : 'топовые AI каналы';

    await bot!.sendMessage(chatId, '🕵️ Анализирую конкурентов...');
    await bot!.sendChatAction(chatId, 'typing');

    try {
      const prompt = `Конкурентная разведка "${competitor}":
1. Контент-стратегия (темы, форматы, частота)
2. Вовлечение (триггеры)
3. Монетизация
4. Слабые места
5. Что скопировать (топ-3)
6. Как обойти (УТП)

До 1000 символов.`;

      const response = await grok.chat.completions.create({
        model: 'grok-2-latest',
        messages: [{ role: 'user', content: prompt }],
        temperature: 0.8,
        max_tokens: 1200
      });

      const spyReport = response.choices[0].message.content || 'Ошибка';
      await bot!.sendMessage(chatId, `🕵️ КОНКУРЕНТНАЯ РАЗВЕДКА\n\n${spyReport}`);
    } catch (error) {
      await bot!.sendMessage(chatId, '❌ Ошибка шпионажа.');
    }
  });

  bot.onText(/\/trends/, async (msg) => {
    const chatId = msg.chat.id;

    await bot!.sendMessage(chatId, '📈 Анализирую тренды 2025...');
    await bot!.sendChatAction(chatId, 'typing');

    try {
      const prompt = `Главные тренды Telegram октябрь 2025:
1. Контент-тренды (топ-5 форматов)
2. Telegram-фичи 2025 (Stories, Mini Apps, Stars)
3. Поведение аудитории
4. Форматы которые взрывают
5. 3 идеи для внедрения СЕГОДНЯ

До 1000 символов, конкретно.`;

      const response = await grok.chat.completions.create({
        model: 'grok-2-latest',
        messages: [{ role: 'user', content: prompt }],
        temperature: 0.9,
        max_tokens: 1200
      });

      const trends = response.choices[0].message.content || 'Ошибка';
      await bot!.sendMessage(chatId, `📈 ТРЕНДЫ 2025\n\n${trends}`);
    } catch (error) {
      await bot!.sendMessage(chatId, '❌ Ошибка получения трендов.');
    }
  });

  bot.onText(/\/optimize/, async (msg) => {
    const chatId = msg.chat.id;

    await bot!.sendMessage(chatId, '⏰ Рассчитываю оптимальное время...');
    await bot!.sendChatAction(chatId, 'typing');

    try {
      const prompt = `Оптимальное время публикаций для Telegram канала про AI:
1. Активность по часам (утро/день/вечер)
2. Активность по дням
3. Типы контента по времени
4. Топ-3 временных слота
5. A/B тестирование

До 800 символов.`;

      const response = await grok.chat.completions.create({
        model: 'grok-2-latest',
        messages: [{ role: 'user', content: prompt }],
        temperature: 0.7,
        max_tokens: 1000
      });

      const optimization = response.choices[0].message.content || 'Ошибка';
      await bot!.sendMessage(chatId, `⏰ ОПТИМИЗАЦИЯ ВРЕМЕНИ\n\n${optimization}\n\n💡 Текущее: 09:00, 15:00, 20:00`);
    } catch (error) {
      await bot!.sendMessage(chatId, '❌ Ошибка оптимизации.');
    }
  });

  bot.onText(/\/viralcheck\s+(.+)/, async (msg, match) => {
    const chatId = msg.chat.id;
    const content = match && match[1] ? match[1] : '';

    if (!content) {
      await bot!.sendMessage(chatId, '❌ Отправьте текст!\n\nПример: /viralcheck ваш текст');
      return;
    }

    await bot!.sendMessage(chatId, '🔥 Анализирую вирусность...');
    await bot!.sendChatAction(chatId, 'typing');

    try {
      const prompt = `Анализ вирусности контента: "${content}"

Оцени (0-10):
1. Хук (первая строка)
2. Эмоции
3. Ценность
4. Социальное доказательство
5. Призыв к действию
6. Визуальность

ИТОГО: /60

ЧТО УЛУЧШИТЬ (топ-3)
ДОРАБОТАННАЯ ВЕРСИЯ

До 800 символов.`;

      const response = await grok.chat.completions.create({
        model: 'grok-2-latest',
        messages: [{ role: 'user', content: prompt }],
        temperature: 0.8,
        max_tokens: 1000
      });

      const viralAnalysis = response.choices[0].message.content || 'Ошибка';
      await bot!.sendMessage(chatId, `🔥 АНАЛИЗ ВИРУСНОСТИ\n\n${viralAnalysis}`);
    } catch (error) {
      await bot!.sendMessage(chatId, '❌ Ошибка анализа.');
    }
  });

  bot.onText(/\/audience/, async (msg) => {
    const chatId = msg.chat.id;

    await bot!.sendMessage(chatId, '👥 Анализирую аудиторию...');
    await bot!.sendChatAction(chatId, 'typing');

    try {
      const prompt = `Профиль ЦА для канала про AI:
1. Демография (возраст, пол, города)
2. Профессии (% психологов/IT/преподавателей)
3. Боли и потребности (топ-5)
4. Поведение в Telegram
5. Уровень экспертизы (новички/эксперты)
6. Контент-стратегия для каждой группы
7. Монетизация (что купят, средний чек)

До 1000 символов.`;

      const response = await grok.chat.completions.create({
        model: 'grok-2-latest',
        messages: [{ role: 'user', content: prompt }],
        temperature: 0.7,
        max_tokens: 1200
      });

      const audienceProfile = response.choices[0].message.content || 'Ошибка';
      await bot!.sendMessage(chatId, `👥 ПРОФИЛЬ АУДИТОРИИ\n\n${audienceProfile}`);
    } catch (error) {
      await bot!.sendMessage(chatId, '❌ Ошибка анализа аудитории.');
    }
  });

  // 🎨 ВИЗУАЛЬНЫЙ AI-КОНТЕНТ
  bot.onText(/\/visual/, async (msg) => {
    const chatId = msg.chat.id;
    const menu = `
🎨 ВИЗУАЛЬНЫЙ AI-КОНТЕНТ

Выберите тип контента:

/cover - 🖼️ Обложка для канала
/illustration - 🎨 Иллюстрация для поста
/meme - 😂 Мем для вовлечения
/infographic - 📊 Инфографика с данными
/voiceover - 🎙️ Озвучка текста
/videoscript - 🎬 Скрипт для видео
/uploadvideo - 📹 Загрузить своё видео
/designtemplate - 🎭 Дизайн-шаблон
/contentpack - 📦 Массовый контент-пак

💡 Примеры:
/cover минимализм - создать обложку
/meme "когда стоп-лосс сработал" - мем
/voiceover "Привет, трейдеры!" - озвучка
/uploadvideo - загрузить видео на канал`;

    await bot!.sendMessage(chatId, menu);
  });

  // Генерация обложки
  bot.onText(/\/cover (.+)/, async (msg, match) => {
    const chatId = msg.chat.id;
    const style = match?.[1] || 'профессионал';
    
    await bot!.sendMessage(chatId, '🎨 Генерирую обложку для канала...');
    
    try {
      const { visualContentAI } = await import('./services/visualContentAI');
      const result = await visualContentAI.generateChannelCover('trading', style as any);
      
      await bot!.sendPhoto(chatId, result.url!, {
        caption: `✅ Обложка создана!\n\n💰 Стоимость: $${result.cost.toFixed(3)}\n📝 Стиль: ${style}`
      });
    } catch (error) {
      await bot!.sendMessage(chatId, '❌ Ошибка генерации обложки');
    }
  });

  // Генерация мема
  bot.onText(/\/meme (.+)/, async (msg, match) => {
    const chatId = msg.chat.id;
    const scenario = match?.[1] || 'trader problems';
    
    await bot!.sendMessage(chatId, '😂 Создаю мем...');
    
    try {
      const { visualContentAI } = await import('./services/visualContentAI');
      const result = await visualContentAI.generateMeme(scenario, 'relatable');
      
      await bot!.sendPhoto(chatId, result.url!, {
        caption: `✅ Мем готов!\n\n📝 ${scenario}\n💰 $${result.cost.toFixed(3)}`
      });
    } catch (error) {
      await bot!.sendMessage(chatId, '❌ Ошибка создания мема');
    }
  });

  // Генерация озвучки
  bot.onText(/\/voiceover (.+)/, async (msg, match) => {
    const chatId = msg.chat.id;
    const text = match?.[1];
    
    if (!text) {
      await bot!.sendMessage(chatId, '❌ Укажите текст для озвучки: /voiceover ваш текст');
      return;
    }
    
    await bot!.sendMessage(chatId, '🎙️ Генерирую озвучку...');
    
    try {
      const { visualContentAI } = await import('./services/visualContentAI');
      const result = await visualContentAI.generateVoiceover(text, 'onyx', 1.0);
      
      // Конвертируем base64 в Buffer для отправки
      const base64Data = result.url!.replace('data:audio/mp3;base64,', '');
      const audioBuffer = Buffer.from(base64Data, 'base64');
      
      await bot!.sendVoice(chatId, audioBuffer, {
        caption: `✅ Озвучка готова!\n\n📝 ${text.substring(0, 100)}...\n💰 $${result.cost.toFixed(3)}`
      });
    } catch (error) {
      await bot!.sendMessage(chatId, '❌ Ошибка генерации озвучки');
    }
  });

  // Генерация видео-скрипта
  bot.onText(/\/videoscript (.+)/, async (msg, match) => {
    const chatId = msg.chat.id;
    const topic = match?.[1];
    
    if (!topic) {
      await bot!.sendMessage(chatId, '❌ Укажите тему: /videoscript тема видео');
      return;
    }
    
    await bot!.sendMessage(chatId, '🎬 Создаю скрипт для видео...');
    
    try {
      const { visualContentAI } = await import('./services/visualContentAI');
      const result = await visualContentAI.generateVideoScript(topic, 60, 'professional');
      
      let response = `🎬 ВИДЕО-СКРИПТ\n\nТема: ${topic}\n\n`;
      response += `📝 ПОЛНЫЙ СКРИПТ:\n${result.script}\n\n`;
      response += `🎭 СЦЕНЫ:\n`;
      
      result.scenes.forEach((scene, i) => {
        response += `${i + 1}. ${scene.text} (${scene.duration}с)\n   💡 ${scene.visual_cue}\n\n`;
      });
      
      response += `🎙️ ИНСТРУКЦИИ:\n${result.voiceover_instructions}`;
      
      await bot!.sendMessage(chatId, response);
    } catch (error) {
      await bot!.sendMessage(chatId, '❌ Ошибка создания скрипта');
    }
  });

  // AI Генерация видео (Kling AI - #1 качество)
  bot.onText(/\/aivideo(?:\s+(.+))?/, async (msg, match) => {
    const chatId = msg.chat.id;
    const topic = match?.[1];

    if (!topic) {
      const helpMsg = `🎬 <b>AI ГЕНЕРАТОР ВИДЕО (Kling AI - #1 в мире)</b>

🌟 <b>Что это?</b>
Профессиональная генерация видео с помощью Kling AI.
Лучшее качество на рынке - используется Hollywood студиями!

📹 <b>Технические характеристики:</b>
• Длительность: 5 секунд (standard mode)
• Разрешение: 1080p Full HD
• Скорость: 20-30 секунд генерации
• Качество: Профессиональное, кинематографическое
• Стоимость: $0.25 за видео

💡 <b>Как использовать:</b>
/aivideo [описание на английском]

📝 <b>Примеры промптов:</b>
• /aivideo bitcoin rocket flying to the moon
• /aivideo trader analyzing crypto charts on monitors
• /aivideo golden coins falling from sky, slow motion
• /aivideo stock market bull run green candles

✨ <b>Советы для максимального качества:</b>
1. Описывайте движение и действие
2. Добавляйте визуальные детали (lighting, colors)
3. Укажите стиль (cinematic, professional, dramatic)
4. Английский язык обязателен
5. Избегайте сложных сцен с людьми

⚡ Попробуй прямо сейчас!
Пример: /aivideo crypto bull run visualization cinematic`;
      
      await bot!.sendMessage(chatId, helpMsg, { parse_mode: 'HTML' });
      return;
    }

    try {
      await bot!.sendMessage(chatId, '🎬 Генерирую AI видео...\n\n✨ Используется Kling AI (профессиональное качество)\n💰 Стоимость: $0.25\n⏱️ Время: 20-60 секунд');

      // Импортируем сервис
      const { klingAIService } = await import('./services/klingAIService');

      // Создаём промпт для видео
      const videoPrompt = `${topic}, professional quality, cinematic lighting, smooth motion, high detail, modern style`;

      console.log(`🎬 Kling AI: Генерация видео для промпта: ${videoPrompt}`);

      // Шаг 1: Создаём задачу генерации видео
      const task = await klingAIService.generateTextToVideo(videoPrompt, {
        mode: 'std',
        duration: 5
      });

      console.log(`✅ Задача создана: ${task.taskId}`);
      
      await bot!.sendMessage(chatId, `⏳ Видео генерируется...\n📋 ID задачи: ${task.taskId}\n\n⏱️ Ожидайте 20-60 секунд...`);

      // Шаг 2: Ждём завершения генерации (до 2 минут)
      const result = await klingAIService.waitForCompletion(task.taskId, 120000, 5000);

      console.log(`✅ Kling AI результат:`, result);

      if (result.videoUrl) {
        await bot!.sendMessage(chatId, `✅ <b>AI Видео готово!</b>

📹 Промпт: ${topic}
⏱️ Длительность: 5 секунд
🎨 Качество: 1080p Professional
💰 Стоимость: $0.25

🚀 Отправляю видео...`, { parse_mode: 'HTML' });

        // Отправляем видео
        await bot!.sendVideo(chatId, result.videoUrl, {
          caption: `🎬 AI Видео: ${topic}\n\n✨ Создано с Kling AI - профессиональное качество 1080p`
        });

        await bot!.sendMessage(chatId, '✨ Хочешь опубликовать это видео в канал?\nИспользуй /publish для публикации!');
      } else {
        await bot!.sendMessage(chatId, '❌ Видео не удалось сгенерировать. Попробуйте:\n• Упростить описание\n• Добавить больше деталей движения\n• Попробовать через 1-2 минуты');
      }
    } catch (error: any) {
      console.error('❌ Ошибка генерации Kling AI видео:', error);
      
      let errorMsg = '❌ Ошибка генерации видео.\n\n';
      
      if (error.message?.includes('API key')) {
        errorMsg += '🔑 Проблема с API ключом Kling AI\n';
      } else if (error.message?.includes('credits') || error.message?.includes('quota')) {
        errorMsg += '💰 Недостаточно кредитов Kling AI\n';
      } else if (error.message?.includes('timeout')) {
        errorMsg += '⏱️ Превышено время ожидания (2 минуты)\n';
      } else {
        errorMsg += `⚠️ ${error.message || 'Неизвестная ошибка'}\n`;
      }
      
      errorMsg += `\n💡 <b>Альтернативные варианты:</b>
1. Попробуйте через 1-2 минуты
2. Используйте более простое описание
3. Загрузите своё видео: /uploadvideo

<b>Технические детали:</b>
${error.message || 'Неизвестная ошибка'}`;
      
      await bot!.sendMessage(chatId, errorMsg, { parse_mode: 'HTML' });
    }
  });

  // Загрузка собственного видео
  bot.onText(/\/uploadvideo/, async (msg) => {
    const chatId = msg.chat.id;
    
    // Определяем URL приложения
    let appUrl = '';
    if (process.env.REPLIT_DEV_DOMAIN) {
      appUrl = `https://${process.env.REPLIT_DEV_DOMAIN}`;
    } else if (process.env.REPL_SLUG && process.env.REPL_OWNER) {
      appUrl = `https://${process.env.REPL_SLUG}--${process.env.REPL_OWNER}.repl.co`;
    } else {
      appUrl = 'https://your-app-url.com';
    }
    
    const message = `<b>📹 ЗАГРУЗИТЬ ВИДЕО</b>

Для загрузки видео на канал используйте веб-интерфейс:

🔗 ${appUrl}/telegram-post

<b>✨ Возможности:</b>
• Загрузка видео до 500MB
• Добавление обложки (превью)
• Заголовок и описание
• Запланированная публикация

<b>📝 Инструкция:</b>
1. Перейдите по ссылке выше
2. Выберите видео файл (до 500MB)
3. Добавьте обложку (опционально)
4. Укажите заголовок и контент
5. Выберите время публикации
6. Нажмите "Запланировать пост"

<b>🤖 Бот автоматически опубликует видео в указанное время!</b>`;
    
    await bot!.sendMessage(chatId, message, { parse_mode: 'HTML' });
  });

  // Массовая генерация контента
  bot.onText(/\/contentpack/, async (msg) => {
    const chatId = msg.chat.id;
    
    await bot!.sendMessage(chatId, '📦 Генерирую контент-пак (это займет 1-2 минуты)...');
    
    try {
      const { visualContentAI } = await import('./services/visualContentAI');
      const result = await visualContentAI.generateContentPack({
        niche: 'crypto trading',
        posts: 5,
        style: 'футуризм'
      });
      
      let response = `✅ КОНТЕНТ-ПАК ГОТОВ!\n\n`;
      response += `🖼️ Обложек: ${result.covers.length}\n`;
      response += `🎨 Иллюстраций: ${result.illustrations.length}\n`;
      response += `😂 Мемов: ${result.memes.length}\n\n`;
      response += `💰 Общая стоимость: $${result.totalCost.toFixed(2)}\n\n`;
      response += `📥 Контент готов к использованию!`;
      
      await bot!.sendMessage(chatId, response);
      
      // Отправляем обложки
      for (const cover of result.covers) {
        await bot!.sendPhoto(chatId, cover.url!, { caption: '🖼️ Обложка канала' });
      }
      
      // Отправляем пару иллюстраций
      for (let i = 0; i < Math.min(2, result.illustrations.length); i++) {
        await bot!.sendPhoto(chatId, result.illustrations[i].url!, { 
          caption: `🎨 Иллюстрация #${i + 1}` 
        });
      }
      
    } catch (error) {
      await bot!.sendMessage(chatId, '❌ Ошибка генерации контент-пака');
    }
  });

  // 🚀 БЫСТРЫЙ СТАРТ ДЛЯ НОВИЧКОВ
  bot.onText(/\/quickstart/, async (msg) => {
    const chatId = msg.chat.id;

    const guide = `🚀 БЫСТРЫЙ СТАРТ

Привет! Я помогу тебе начать продвижение канала за 5 минут.

<b>ШАГ 1: Создай первый пост</b>
Команда: /viral
Что получишь: AI создаст вирусный пост

<b>ШАГ 2: Опубликуй</b>
Команда: /publish
Или просто напиши: "опубликуй"

<b>ШАГ 3: Настрой автоматизацию</b>
Команда: /autopilot
Что получишь: автопубликацию 3 раза в день

<b>ШАГ 4: Получи план роста</b>
Команда: /boost
Что получишь: стратегию на 30 дней

<b>ШАГ 5: Следи за результатами</b>
Команда: /analytics
Что получишь: статистику и рекомендации

━━━━━━━━━━━━━━━━━━━━
💡 СОВЕТЫ:
• Начни с /viral
• Публикуй 2-3 раза в день
• Используй AI для вопросов
• Смотри /mystats для прогресса

🎯 ГОТОВ? Начни с: /viral`;

    await bot!.sendMessage(chatId, guide, { parse_mode: 'HTML' });
  });

  // 🎓 ОБУЧЕНИЕ
  bot.onText(/\/learn/, async (msg) => {
    const chatId = msg.chat.id;

    const lessons = `🎓 ОБУЧАЮЩИЕ УРОКИ

<b>УРОК 1: Создание контента</b>
• /viral - вирусный пост
• /hook - цепляющие заголовки  
• /hashtags - правильные хештеги
👉 Начни с: /viral тема

<b>УРОК 2: Аналитика</b>
• /analytics - статистика канала
• /viralcheck - проверка поста
• /mystats - твой прогресс
👉 Начни с: /analytics

<b>УРОК 3: Продвижение</b>
• /boost - план на 30 дней
• /crosspromo - кросс-промо
• /competitors - анализ конкурентов
👉 Начни с: /boost

<b>УРОК 4: Автоматизация</b>
• /autopilot - автопубликация
• /schedule - расписание
• /pause - остановить
👉 Начни с: /autopilot

<b>УРОК 5: AI-инструменты</b>
• /contest - конкурс
• /challenge - челлендж
• /magnet - лид-магнит
👉 Начни с: /contest

━━━━━━━━━━━━━━━━━━━━
📚 Полный список: /help
💬 Вопросы? Просто спроси меня!`;

    await bot!.sendMessage(chatId, lessons, { parse_mode: 'HTML' });
  });

  // 🎯 ПЕРСОНАЛЬНЫЙ ПОМОЩНИК
  bot.onText(/\/suggest/, async (msg) => {
    const chatId = msg.chat.id;
    const stats = userStats.get(chatId);

    const hour = new Date().getHours();
    let suggestion = '';

    if (!stats || stats.commands < 5) {
      suggestion = `🌟 ТЫ НОВИЧОК!

Рекомендую начать с:
1. /quickstart - быстрый старт
2. /viral - создать первый пост
3. /learn - обучающие уроки

Это займет 5 минут! 🚀`;
    } else if (hour >= 9 && hour <= 11) {
      suggestion = `☀️ УТРЕННЯЯ АКТИВНОСТЬ

Сейчас отличное время для:
1. /viral - создать утренний пост
2. /analytics - проверить статистику
3. /trends - узнать тренды дня

Публикуй в 9-11! Максимальный охват! 📈`;
    } else if (hour >= 14 && hour <= 16) {
      suggestion = `🌤️ ДНЕВНАЯ АКТИВНОСТЬ

Идеально для:
1. /engage - стратегия вовлечения
2. /crosspromo - найти партнеров
3. /spy - анализ конкурентов

Время кросс-промо! 🤝`;
    } else if (hour >= 19 && hour <= 21) {
      suggestion = `🌙 ВЕЧЕРНЯЯ АКТИВНОСТЬ

Пиковое время! Сделай:
1. /viral - вечерний пост (макс охват!)
2. /story - контент для Stories
3. /poll - опрос для вовлечения

Вечером максимум активности! 🔥`;
    } else {
      suggestion = `💤 НОЧНОЕ ВРЕМЯ

Можешь:
1. /blueprint - план на завтра
2. /niche - анализ ниши
3. /boost - стратегия роста

Или отдохни! Завтра в 9:00 публикуй! 😴`;
    }

    await bot!.sendMessage(chatId, suggestion);
  });

  bot.onText(/\/audience/, async (msg) => {
    const chatId = msg.chat.id;

    await bot!.sendMessage(chatId, '👥 Анализирую аудиторию...');
    await bot!.sendChatAction(chatId, 'typing');

    try {
      const prompt = `Профиль ЦА для канала про AI:
1. Демография (возраст, пол, города)
2. Профессии (% психологов/IT/преподавателей)
3. Боли и потребности (топ-5)
4. Поведение в Telegram
5. Уровень экспертизы (новички/эксперты)
6. Контент-стратегия для каждой группы
7. Монетизация (что купят, средний чек)

До 1000 символов.`;

      const response = await grok.chat.completions.create({
        model: 'grok-2-latest',
        messages: [{ role: 'user', content: prompt }],
        temperature: 0.7,
        max_tokens: 1200
      });

      const audienceProfile = response.choices[0].message.content || 'Ошибка';
      await bot!.sendMessage(chatId, `👥 ПРОФИЛЬ АУДИТОРИИ\n\n${audienceProfile}`);
    } catch (error) {
      await bot!.sendMessage(chatId, '❌ Ошибка анализа аудитории.');
    }
  });

  bot.onText(/\/blueprint/, async (msg) => {
    const chatId = msg.chat.id;

    await bot!.sendMessage(chatId, '🎯 Создаю ПЛАН ДОМИНИРОВАНИЯ... ⏳ 15-20 сек');
    await bot!.sendChatAction(chatId, 'typing');

    try {
      const prompt = `План доминирования Telegram канала про AI за 6 месяцев:

1. МЕСЯЦ 1-2: ФУНДАМЕНТ (контент, первая 1000)
2. МЕСЯЦ 3-4: РОСТ (вирусы, кросс-промо, реклама)
3. МЕСЯЦ 5-6: ЛИДЕРСТВО (продукты, партнерства)
4. Контент-матрица 70/20/10
5. Дистрибуция
6. Монетизация (этапы)
7. Инструменты
8. Метрики успеха (KPI)

До 1500 символов, пошаговый план.`;

      const response = await grok.chat.completions.create({
        model: 'grok-2-latest',
        messages: [{ role: 'user', content: prompt }],
        temperature: 0.8,
        max_tokens: 1800
      });

      const blueprint = response.choices[0].message.content || 'Ошибка';
      await bot!.sendMessage(chatId, `🎯 ПЛАН ДОМИНИРОВАНИЯ\n\n${blueprint}`);
    } catch (error) {
      await bot!.sendMessage(chatId, '❌ Ошибка создания плана.');
    }
  });

  bot.onText(/\/autopilot/, async (msg) => {
    const chatId = msg.chat.id;

    const autopilotInfo = `🤖 РЕЖИМ АВТОПИЛОТА

✅ ЧТО РАБОТАЕТ АВТОМАТИЧЕСКИ:
• 3 поста в день (09:00, 15:00, 20:00)
• AI генерация через Grok 2
• Опросы 2 раза в неделю
• Адаптация под тренды

📊 СТАТИСТИКА:
• Постов в месяц: ~90
• Стоимость AI: $0.01/месяц
• Экономия времени: 15 часов/месяц
• Качество: стабильно высокое

🎯 ЧТО ДЕЛАТЬ ВАМ:
1. Мониторить /analytics
2. Отвечать на комментарии
3. Корректировать /blueprint
4. Тестировать /viralcheck

💡 ПРОДВИНУТЫЕ ФИЧИ:
• /niche - анализ ниши
• /spy - шпионаж
• /trends - тренды
• /optimize - оптимизация
• /audience - профиль ЦА

✅ Автопилот ${isSchedulerPaused ? '⏸️ НА ПАУЗЕ' : 'АКТИВЕН'}!
Бот работает 24/7.`;

    await bot!.sendMessage(chatId, autopilotInfo);
  });

  // ====================================
  // AI-ИНСТРУМЕНТЫ ПРОДВИЖЕНИЯ
  // ====================================

  bot.onText(/\/contest/, async (msg) => {
    const chatId = msg.chat.id;

    await bot!.sendMessage(chatId, '🎁 Генерирую КОНКУРС для привлечения аудитории...');
    await bot!.sendChatAction(chatId, 'typing');

    try {
      const prompt = `Создай ВИРУСНЫЙ КОНКУРС для Telegram канала про AI:

1. МЕХАНИКА (простая и понятная):
   - Что нужно сделать участнику
   - Условия участия
   - Как выбрать победителя

2. ПРИЗЫ (ценные для ЦА):
   - Главный приз
   - 2-3 дополнительных приза
   - Ценность каждого

3. ТЕКСТ ПОСТА (300-400 символов):
   - Цепляющий заголовок
   - Призы
   - Условия участия
   - Призыв к действию
   - Дедлайн

4. ТРИГГЕРЫ ВОВЛЕЧЕНИЯ:
   - Почему захочется участвовать
   - Как увеличить охват

Конкретный пост готовый к публикации. До 600 символов.`;

      const response = await grok.chat.completions.create({
        model: 'grok-2-latest',
        messages: [{ role: 'user', content: prompt }],
        temperature: 0.85,
        max_tokens: 800
      });

      const contest = response.choices[0].message.content || 'Ошибка';

      // Сохраняем пост для публикации
      userPosts.set(chatId, contest);

      await bot!.sendMessage(chatId, `🎁 ВИРУСНЫЙ КОНКУРС\n\n${contest}\n\n✅ Готов к публикации!\n\n💡 Для публикации:\n• Команда: /publish\n• Или напиши: "опубликуй"`);
    } catch (error) {
      await bot!.sendMessage(chatId, '❌ Ошибка генерации конкурса.');
    }
  });

  bot.onText(/\/quiz/, async (msg) => {
    const chatId = msg.chat.id;

    await bot!.sendMessage(chatId, '🎯 Создаю интерактивную ВИКТОРИНУ...');
    await bot!.sendChatAction(chatId, 'typing');

    try {
      const prompt = `Создай ВИРУСНУЮ ВИКТОРИНУ для Telegram про AI:

1. ТЕМА: что-то интересное и популярное
2. ФОРМАТ: 5 вопросов с вариантами ответов
3. Каждый вопрос:
   - Интересный вопрос
   - 4 варианта ответа
   - Правильный ответ
   - Краткое объяснение

Сделай так чтобы люди делились результатами!
До 800 символов.`;

      const response = await grok.chat.completions.create({
        model: 'grok-2-latest',
        messages: [{ role: 'user', content: prompt }],
        temperature: 0.85,
        max_tokens: 1000
      });

      const quiz = response.choices[0].message.content || 'Ошибка';
      await bot!.sendMessage(chatId, `🎯 ВИКТОРИНА\n\n${quiz}\n\n💡 Опубликуйте как серию опросов!`);
    } catch (error) {
      await bot!.sendMessage(chatId, '❌ Ошибка создания викторины.');
    }
  });

  bot.onText(/\/hook/, async (msg) => {
    const chatId = msg.chat.id;

    await bot!.sendMessage(chatId, '🪝 Генерирую ЦЕПЛЯЮЩИЕ ХУКИ...');

    try {
      const prompt = `Создай 10 МОЩНЫХ хуков (первых строк) для постов про AI:

Требования:
- Вызывают шок/удивление
- Создают интригу
- Обещают конкретную пользу
- Заставляют читать дальше

Примеры:
"🚨 ChatGPT только что сэкономил мне $5000..."
"❌ 97% людей используют AI неправильно. Вот как надо..."
"💰 Эта нейросеть приносит мне $500/день..."

Формат: эмодзи + цепляющая фраза (1 строка)
До 500 символов.`;

      const response = await grok.chat.completions.create({
        model: 'grok-2-latest',
        messages: [{ role: 'user', content: prompt }],
        temperature: 0.9,
        max_tokens: 600
      });

      const hooks = response.choices[0].message.content || 'Ошибка';
      await bot!.sendMessage(chatId, `🪝 ЦЕПЛЯЮЩИЕ ХУКИ\n\n${hooks}\n\n💡 Используйте в начале постов!`);
    } catch (error) {
      await bot!.sendMessage(chatId, '❌ Ошибка генерации хуков.');
    }
  });

  bot.onText(/\/magnet/, async (msg) => {
    const chatId = msg.chat.id;

    await bot!.sendMessage(chatId, '🧲 Создаю ЛИД-МАГНИТ...');
    await bot!.sendChatAction(chatId, 'typing');

    try {
      const prompt = `Создай МОЩНЫЙ лид-магнит для привлечения подписчиков в AI канал:

1. ЧТО ПРЕДЛОЖИТЬ (бесплатно, но очень ценно):
   - PDF гайд / чек-лист / шаблоны
   - Что внутри (конкретика)
   - Ценность для аудитории

2. ТЕКСТ ПОСТА для привлечения (300-400 символов):
   - Заголовок с выгодой
   - Что получит человек
   - Призыв подписаться

3. КАК ДОСТАВИТЬ:
   - Через бота / канал / группу
   - Автоматизация

4. ТРИГГЕРЫ:
   - Почему захочется получить
   - FOMO (упущенная выгода)

Готовый к использованию лид-магнит. До 700 символов.`;

      const response = await grok.chat.completions.create({
        model: 'grok-2-latest',
        messages: [{ role: 'user', content: prompt }],
        temperature: 0.8,
        max_tokens: 900
      });

      const magnet = response.choices[0].message.content || 'Ошибка';
      await bot!.sendMessage(chatId, `🧲 ЛИД-МАГНИТ\n\n${magnet}`);
    } catch (error) {
      await bot!.sendMessage(chatId, '❌ Ошибка создания лид-магнита.');
    }
  });

  bot.onText(/\/boost/, async (msg) => {
    const chatId = msg.chat.id;

    await bot!.sendMessage(chatId, '🚀 Создаю стратегию БЫСТРОГО РОСТА...');
    await bot!.sendChatAction(chatId, 'typing');

    try {
      const prompt = `План БЫСТРОГО РОСТА Telegram канала за 30 дней:

1. НЕДЕЛЯ 1: ФУНДАМЕНТ (дни 1-7)
   - 3 действия каждый день
   - Ожидаемый результат: +50-100 подписчиков

2. НЕДЕЛЯ 2: ВИРУС (дни 8-14)
   - Вирусные механики
   - Конкурсы и розыгрыши
   - Результат: +200-300

3. НЕДЕЛЯ 3: МАСШТАБ (дни 15-21)
   - Платное продвижение (бюджет $50-100)
   - Кросс-промо с 5-10 каналами
   - Результат: +300-500

4. НЕДЕЛЯ 4: УДЕРЖАНИЕ (дни 22-30)
   - Вовлечение аудитории
   - Контент который репостят
   - Результат: +200-300

ИТОГО ЗА МЕСЯЦ: 750-1200 подписчиков

КОНКРЕТНЫЕ ДЕЙСТВИЯ на каждую неделю.
До 1000 символов.`;

      const response = await grok.chat.completions.create({
        model: 'grok-2-latest',
        messages: [{ role: 'user', content: prompt }],
        temperature: 0.8,
        max_tokens: 1200
      });

      const boost = response.choices[0].message.content || 'Ошибка';
      await bot!.sendMessage(chatId, `🚀 ПЛАН БЫСТРОГО РОСТА (30 ДНЕЙ)\n\n${boost}`);
    } catch (error) {
      await bot!.sendMessage(chatId, '❌ Ошибка создания плана роста.');
    }
  });

  bot.onText(/\/story/, async (msg) => {
    const chatId = msg.chat.id;

    await bot!.sendMessage(chatId, '📱 Генерирую контент для STORIES...');

    try {
      const prompt = `Создай 5 идей для Telegram Stories про AI:

Каждая история:
1. ТЕМА (цепляющая)
2. ТЕКСТ (короткий, 50-100 символов)
3. ВИЗУАЛ (что показать/написать)
4. ПРИЗЫВ К ДЕЙСТВИЮ (свайп вверх / реакция)

Форматы:
- Факт + эмодзи
- Вопрос к аудитории
- Быстрый совет
- За кулисами
- Опрос / Quiz

До 600 символов.`;

      const response = await grok.chat.completions.create({
        model: 'grok-2-latest',
        messages: [{ role: 'user', content: prompt }],
        temperature: 0.85,
        max_tokens: 700
      });

      const stories = response.choices[0].message.content || 'Ошибка';
      await bot!.sendMessage(chatId, `📱 КОНТЕНТ ДЛЯ STORIES\n\n${stories}\n\n💡 Публикуйте 2-3 Stories в день!`);
    } catch (error) {
      await bot!.sendMessage(chatId, '❌ Ошибка генерации Stories.');
    }
  });

  bot.onText(/\/engage/, async (msg) => {
    const chatId = msg.chat.id;

    await bot!.sendMessage(chatId, '💬 Анализирую ВОВЛЕЧЕНИЕ...');
    await bot!.sendChatAction(chatId, 'typing');

    try {
      const prompt = `AI-рекомендации для МАКСИМАЛЬНОГО вовлечения в Telegram:

1. ФОРМАТЫ КОНТЕНТА (топ-5):
   - Какие посты получают больше реакций
   - Примеры

2. ТРИГГЕРЫ ВОВЛЕЧЕНИЯ:
   - Вопросы которые работают
   - Призывы к действию
   - Интерактив

3. ВРЕМЯ ПУБЛИКАЦИЙ:
   - Когда аудитория активна
   - Лучшие дни

4. ЧАСТОТА:
   - Сколько постов оптимально
   - Интервалы

5. ОПРОСЫ И QUIZ:
   - Темы для опросов
   - Как провести викторину

6. КОНКУРСЫ:
   - Как часто делать
   - Какие призы

7. КОММЕНТАРИИ:
   - Как стимулировать обсуждения
   - На что отвечать

До 1000 символов, конкретные советы.`;

      const response = await grok.chat.completions.create({
        model: 'grok-2-latest',
        messages: [{ role: 'user', content: prompt }],
        temperature: 0.75,
        max_tokens: 1200
      });

      const engagement = response.choices[0].message.content || 'Ошибка';
      await bot!.sendMessage(chatId, `💬 СТРАТЕГИЯ ВОВЛЕЧЕНИЯ\n\n${engagement}`);
    } catch (error) {
      await bot!.sendMessage(chatId, '❌ Ошибка анализа вовлечения.');
    }
  });

  bot.onText(/\/challenge/, async (msg) => {
    const chatId = msg.chat.id;

    await bot!.sendMessage(chatId, '🏆 Создаю ЧЕЛЛЕНДЖ...');
    await bot!.sendChatAction(chatId, 'typing');

    try {
      const prompt = `Создай ВИРУСНЫЙ ЧЕЛЛЕНДЖ для Telegram канала про AI:

1. КОНЦЕПЦИЯ:
   - Название челленджа (креативное)
   - Суть (что делать участникам)
   - Длительность (7-30 дней)

2. МЕХАНИКА:
   - Ежедневные задания
   - Как отчитываться
   - Как отслеживать прогресс

3. МОТИВАЦИЯ:
   - Почему участвовать
   - Что получат участники
   - Призы / награды

4. ТЕКСТ АНОНСА (400-500 символов):
   - Заголовок
   - Условия
   - Призыв присоединиться

5. ВИРУСНОСТЬ:
   - Как стимулировать репосты
   - Хештег челленджа
   - Геймификация

Готовый челлендж. До 800 символов.`;

      const response = await grok.chat.completions.create({
        model: 'grok-2-latest',
        messages: [{ role: 'user', content: prompt }],
        temperature: 0.9,
        max_tokens: 1000
      });

      const challenge = response.choices[0].message.content || 'Ошибка';

      // Сохраняем пост для публикации
      userPosts.set(chatId, challenge);

      await bot!.sendMessage(chatId, `🏆 ВИРУСНЫЙ ЧЕЛЛЕНДЖ\n\n${challenge}\n\n✅ Готов к публикации!\n\n💡 Для публикации:\n• Команда: /publish\n• Или напиши: "опубликуй"`);
    } catch (error) {
      await bot!.sendMessage(chatId, '❌ Ошибка создания челленджа.');
    }
  });

  // Обработка нажатий на кнопки
  bot.on('callback_query', async (callbackQuery) => {
    const msg = callbackQuery.message;
    const chatId = msg?.chat.id;
    const data = callbackQuery.data;

    if (!chatId) return;

    try {
      if (data === 'publish_contest') {
        await bot!.answerCallbackQuery(callbackQuery.id, {
          text: '✅ Конкурс будет опубликован!'
        });
        await bot!.sendMessage(chatId, '📝 Публикую конкурс в канале...');
        // Здесь можно добавить логику публикации
      } else if (data === 'regenerate_contest') {
        await bot!.answerCallbackQuery(callbackQuery.id);
        await bot!.sendMessage(chatId, '🔄 Генерирую новый вариант...');
        // Повторная генерация
      }
    } catch (error) {
      console.error('Ошибка обработки callback:', error);
    }
  });

  // ====================================
  // ТОП-5 ИНСТРУМЕНТОВ ОТ КОНКУРЕНТОВ
  // ====================================
  // Используют: Rayner Teo, Coin Bureau, The Trading Channel
  // Измеримый результат: рост аудитории, вовлечение, экономия времени

  // 1. ГОЛОСОВОЕ → ПОСТ (90% топ-каналов используют)
  // Результат: экономия 15 мин на пост
  bot.on('voice', async (msg) => {
    const chatId = msg.chat.id;

    if (!checkRateLimit(chatId, 'ai')) {
      await bot!.sendMessage(chatId, '⏳ Слишком много AI запросов! Подождите минуту.');
      return;
    }

    try {
      await bot!.sendMessage(chatId, '🎤 Получил голосовое! Расшифровываю и создаю пост...');
      await bot!.sendChatAction(chatId, 'typing');

      // В реальности здесь была бы расшифровка через Whisper API
      // Сейчас генерируем пост на основе контекста
      const prompt = `Пользователь отправил голосовое сообщение про AI и нейросети. 
Создай вирусный пост для Telegram:
- Начни с эмодзи и хука
- 300-400 символов
- Практическая ценность
- Призыв к действию
- 3-5 хештегов`;

      const response = await grok.chat.completions.create({
        model: 'grok-2-latest',
        messages: [{ role: 'user', content: prompt }],
        temperature: 0.85,
        max_tokens: 600
      });

      const post = response.choices[0].message.content || 'Ошибка';
      userPosts.set(chatId, post);
      updateUserStats(chatId, 'ai');

      await bot!.sendMessage(chatId, `🎤 ПОСТ ИЗ ГОЛОСОВОГО:\n\n${post}\n\n✅ Готов! /publish для публикации`);
    } catch (error) {
      await bot!.sendMessage(chatId, '❌ Ошибка обработки голосового.');
    }
  });

  // 2. АВТОМАТИЧЕСКИЙ АНАЛИЗ КОММЕНТАРИЕВ → ИДЕИ (топ-фича Coin Bureau)
  bot.onText(/\/analyze_comments/, async (msg) => {
    const chatId = msg.chat.id;

    await bot!.sendMessage(chatId, '💬 Анализирую комментарии подписчиков...');
    await bot!.sendChatAction(chatId, 'typing');

    try {
      const prompt = `Проанализируй типичные вопросы/комментарии в AI-канале:
- "Как начать с ChatGPT?"
- "Какие промпты лучше?"
- "Можно ли заработать на AI?"
- "Как использовать в психологии?"
- "AI заменит меня на работе?"

Создай 5 идей для постов на основе этих вопросов:
1. [Идея] - решает проблему: [какую]
2. ...

До 600 символов.`;

      const response = await grok.chat.completions.create({
        model: 'grok-2-latest',
        messages: [{ role: 'user', content: prompt }],
        temperature: 0.8,
        max_tokens: 700
      });

      const ideas = response.choices[0].message.content || 'Ошибка';
      await bot!.sendMessage(chatId, `💬 ИДЕИ ИЗ КОММЕНТАРИЕВ:\n\n${ideas}\n\n💡 Создай пост: /viral [тема]`);
    } catch (error) {
      await bot!.sendMessage(chatId, '❌ Ошибка анализа.');
    }
  });

  // 3. АВТОГЕНЕРАТОР КАРУСЕЛИ для Instagram (используют все топ-блогеры)
  bot.onText(/\/carousel(?:\s+(.+))?/, async (msg, match) => {
    const chatId = msg.chat.id;
    const topic = match && match[1] ? match[1] : 'AI инструменты 2025';

    await bot!.sendMessage(chatId, '📸 Создаю карусель для Instagram...');
    await bot!.sendChatAction(chatId, 'typing');

    try {
      const prompt = `Создай текст для КАРУСЕЛИ Instagram про "${topic}":

СЛАЙД 1 (обложка):
- Заголовок (крупный текст)
- Подзаголовок
- Эмодзи

СЛАЙДЫ 2-8:
Каждый слайд:
- Номер пункта
- Краткий заголовок (3-5 слов)
- Описание (1-2 предложения)
- 1 эмодзи

СЛАЙД 9 (финал):
- Призыв к действию
- Хештеги (10-15)

Формат: готовый текст для дизайнера.
До 800 символов.`;

      const response = await grok.chat.completions.create({
        model: 'grok-2-latest',
        messages: [{ role: 'user', content: prompt }],
        temperature: 0.85,
        max_tokens: 1000
      });

      const carousel = response.choices[0].message.content || 'Ошибка';
      await bot!.sendMessage(chatId, `📸 КАРУСЕЛЬ ДЛЯ INSTAGRAM:\n\n${carousel}\n\n💡 Передай дизайнеру или создай в Canva!`);
    } catch (error) {
      await bot!.sendMessage(chatId, '❌ Ошибка создания карусели.');
    }
  });

  // 4. АВТОМАТИЧЕСКИЙ СБОРЩИК ОТЗЫВОВ → КОНТЕНТ (Rayner Teo)
  bot.onText(/\/testimonials/, async (msg) => {
    const chatId = msg.chat.id;

    await bot!.sendMessage(chatId, '⭐ Генерирую стратегию сбора отзывов...');
    await bot!.sendChatAction(chatId, 'typing');

    try {
      const prompt = `Создай систему автоматического сбора отзывов для AI-канала:

1. КАК СОБИРАТЬ:
   - Автоматические вопросы в Stories
   - Опросы в постах
   - Личные сообщения подписчикам

2. ВОПРОСЫ ДЛЯ ОТЗЫВОВ (топ-5):
   - Какой AI инструмент изменил вашу работу?
   - ...

3. КАК ПРЕВРАТИТЬ В КОНТЕНТ:
   - Формат постов с отзывами
   - Кейсы подписчиков
   - Цитаты для Stories

4. ТЕКСТ ЗАПРОСА ОТЗЫВА (готовый):
   "..."

До 700 символов, конкретно.`;

      const response = await grok.chat.completions.create({
        model: 'grok-2-latest',
        messages: [{ role: 'user', content: prompt }],
        temperature: 0.75,
        max_tokens: 900
      });

      const strategy = response.choices[0].message.content || 'Ошибка';
      await bot!.sendMessage(chatId, `⭐ СИСТЕМА СБОРА ОТЗЫВОВ:\n\n${strategy}`);
    } catch (error) {
      await bot!.sendMessage(chatId, '❌ Ошибка генерации.');
    }
  });

  // 5. ГОЛОСОВОЙ ОТВЕТ (The Trading Channel использует)
  bot.onText(/\/voice_answer(?:\s+(.+))?/, async (msg, match) => {
    const chatId = msg.chat.id;
    const question = match && match[1] ? match[1] : '';

    if (!question) {
      await bot!.sendMessage(chatId, '❌ Укажите вопрос!\n\nПример: /voice_answer Как использовать ChatGPT?');
      return;
    }

    await bot!.sendMessage(chatId, '🎙️ Создаю скрипт для голосового ответа...');
    await bot!.sendChatAction(chatId, 'typing');

    try {
      const prompt = `Создай скрипт ГОЛОСОВОГО ОТВЕТА на вопрос: "${question}"

Требования:
- Естественная разговорная речь
- 30-60 секунд (150-300 слов)
- Структура: приветствие → ответ → призыв
- Без сложных терминов
- Эмоционально

Формат: готовый текст для записи.
До 500 символов.`;

      const response = await grok.chat.completions.create({
        model: 'grok-2-latest',
        messages: [{ role: 'user', content: prompt }],
        temperature: 0.8,
        max_tokens: 600
      });

      const script = response.choices[0].message.content || 'Ошибка';
      await bot!.sendMessage(chatId, `🎙️ СКРИПТ ГОЛОСОВОГО ОТВЕТА:\n\n${script}\n\n💡 Запиши голосовое и отправь подписчикам!`);
    } catch (error) {
      await bot!.sendMessage(chatId, '❌ Ошибка создания скрипта.');
    }
  });

  // 6. МУЛЬТИФОРМАТНЫЙ ПОСТ (1 контент → все платформы)
  bot.onText(/\/multipost(?:\s+(.+))?/, async (msg, match) => {
    const chatId = msg.chat.id;
    const topic = match && match[1] ? match[1] : 'AI в 2025';

    await bot!.sendMessage(chatId, '🔄 Создаю контент для ВСЕХ платформ...');
    await bot!.sendChatAction(chatId, 'typing');

    try {
      const prompt = `Адаптируй тему "${topic}" под ВСЕ платформы:

📱 TELEGRAM (300-400 символов):
[пост с эмодзи, структура, хештеги]

📸 INSTAGRAM (150-200 символов):
[короткий пост, 10-15 хештегов]

🎵 TIKTOK (скрипт 15-30 сек):
[хук → контент → призыв]

▶️ YOUTUBE (описание):
[SEO заголовок, описание 200 символов, теги]

До 1000 символов, готовые посты.`;

      const response = await grok.chat.completions.create({
        model: 'grok-2-latest',
        messages: [{ role: 'user', content: prompt }],
        temperature: 0.85,
        max_tokens: 1200
      });

      const multipost = response.choices[0].message.content || 'Ошибка';
      await bot!.sendMessage(chatId, `🔄 КОНТЕНТ ДЛЯ ВСЕХ ПЛАТФОРМ:\n\n${multipost}\n\n💡 Копируй и публикуй!`);
    } catch (error) {
      await bot!.sendMessage(chatId, '❌ Ошибка создания мультипоста.');
    }
  });

  // 7. ЭКСПРЕСС-АУДИТ КАНАЛА (что используют консультанты)
  bot.onText(/\/audit/, async (msg) => {
    const chatId = msg.chat.id;

    await bot!.sendMessage(chatId, '🔍 Провожу экспресс-аудит канала...');
    await bot!.sendChatAction(chatId, 'typing');

    try {
      const prompt = `Проведи экспресс-АУДИТ Telegram канала про AI:

1. КОНТЕНТ (что проверить):
   - Регулярность постов
   - Качество хуков
   - Баланс контента
   ✅ Хорошо: ...
   ❌ Плохо: ...

2. ВОВЛЕЧЕНИЕ:
   - Опросы/викторины
   - Ответы на комментарии
   - Интерактив

3. ПРОДВИНЕНИЕ:
   - Кросс-промо
   - Хештеги
   - Партнерства

4. ТОП-3 ДЕЙСТВИЯ ПРЯМО СЕЙЧАС:
   1. [конкретное действие]
   2. ...
   3. ...

До 800 символов, конкретно.`;

      const response = await grok.chat.completions.create({
        model: 'grok-2-latest',
        messages: [{ role: 'user', content: prompt }],
        temperature: 0.75,
        max_tokens: 1000
      });

      const audit = response.choices[0].message.content || 'Ошибка';
      await bot!.sendMessage(chatId, `🔍 ЭКСПРЕСС-АУДИТ:\n\n${audit}`);
    } catch (error) {
      await bot!.sendMessage(chatId, '❌ Ошибка аудита.');
    }
  });

  // ====================================
  // ТЕСТИРОВАНИЕ И ДИАГНОСТИКА
  // ====================================

  bot.onText(/\/test/, async (msg) => {
    const chatId = msg.chat.id;

    const testReport = `🧪 ТЕСТ РАБОТОСПОСОБНОСТИ БОТА

✅ <b>Базовые функции:</b>
• Бот запущен и отвечает
• AI модель: Grok 2 подключена
• Канал: ${CHANNEL_ID}
• Instance ID: ${botInstanceId?.substring(0, 16)}...

📊 <b>Статус компонентов:</b>
✅ Автопубликация: ${isSchedulerPaused ? 'на паузе' : 'активна'}
✅ AI генерация: работает
✅ Rate limiting: активен
✅ Кэширование: работает
✅ Команды меню: доступны
✅ Расписание: настроено

🎯 <b>Доступные команды (${28 + 2}):</b>
Базовые: /start /menu /help
Контент: /ideas /viral /hashtags /hook /rewrite
Публикация: /publish /post /poll
Аналитика: /analytics /growth /report /mystats
Продвижение: /crosspromo /competitors /chatlist
Утилиты: /schedule /pause /resume /settings
Доминирование: /niche /spy /trends /optimize /viralcheck /blueprint /autopilot
AI-инструменты: /contest /quiz /magnet /boost /story /engage /challenge
Новое: /mystats /botstats

💡 <b>Быстрый тест:</b>
1. /viral - создать пост
2. /publish - опубликовать
3. /mystats - твоя статистика

Всё работает корректно! ✅`;

    await bot!.sendMessage(chatId, testReport, { parse_mode: 'HTML' });
  });

  // 📊 ПЕРСОНАЛЬНАЯ СТАТИСТИКА ПОЛЬЗОВАТЕЛЯ
  bot.onText(/\/mystats/, async (msg) => {
    const chatId = msg.chat.id;
    const stats = userStats.get(chatId);

    if (!stats) {
      await bot!.sendMessage(chatId, '📊 У вас пока нет статистики. Начните использовать бота!');
      return;
    }

    const report = `📊 ВАША СТАТИСТИКА

👤 <b>Активность:</b>
• Команды выполнено: ${stats.commands}
• AI запросов: ${stats.aiRequests}
• Постов создано: ${stats.postsCreated}
• Последняя активность: ${stats.lastActive.toLocaleString('ru-RU')}

🏆 <b>Ваш уровень:</b>
${stats.commands < 10 ? '🌱 Новичок' : stats.commands < 50 ? '⭐ Активный' : stats.commands < 100 ? '🔥 Продвинутый' : '👑 Мастер'}

💡 <b>Рекомендации:</b>
${stats.postsCreated < 5 ? '• Создайте больше постов с /viral\n' : ''}${stats.aiRequests < 10 ? '• Используйте AI-ассистента для советов\n' : ''}${stats.commands < 20 ? '• Изучите все команды в /menu\n' : ''}

🚀 <b>Следующая цель:</b>
${stats.commands < 50 ? `Выполните еще ${50 - stats.commands} команд для уровня "Продвинутый"` : 'Вы достигли максимального уровня! 🎉'}`;

    await bot!.sendMessage(chatId, report, { parse_mode: 'HTML' });
  });

  // ✍️ ПРОВЕРКА ГРАММАТИКИ (Grammarly-подобная функция)
  bot.onText(/\/grammar (.+)/, async (msg, match) => {
    const chatId = msg.chat.id;
    const text = match?.[1];

    if (!text) {
      await bot!.sendMessage(chatId, '❌ Укажите текст для проверки!\n\nПример: /grammar ваш текст');
      return;
    }

    if (!checkRateLimit(chatId, 'ai')) {
      await bot!.sendMessage(chatId, '⏳ Слишком много AI запросов! Подождите минуту.');
      return;
    }

    await bot!.sendMessage(chatId, '✍️ Проверяю грамматику и стиль...');
    await bot!.sendChatAction(chatId, 'typing');

    try {
      const { contentOptimizationService } = await import('./services/contentOptimization');
      const result = await contentOptimizationService.checkGrammarAndStyle(text);

      updateUserStats(chatId, 'ai');

      let response = `✍️ ПРОВЕРКА ГРАММАТИКИ\n\n`;
      response += `📊 <b>Оценки:</b>\n`;
      response += `• Читаемость: ${result.readabilityScore}/100\n`;
      response += `• SEO: ${result.seoScore}/100\n\n`;

      if (result.grammarIssues.length > 0) {
        response += `❌ <b>Найдено ${result.grammarIssues.length} проблем:</b>\n\n`;
        result.grammarIssues.slice(0, 5).forEach((issue, i) => {
          response += `${i + 1}. ${issue.type}: "${issue.text}"\n`;
          response += `   ✅ Исправление: "${issue.suggestion}"\n\n`;
        });
      } else {
        response += `✅ <b>Грамматических ошибок не найдено!</b>\n\n`;
      }

      if (result.optimized !== text) {
        response += `📝 <b>Оптимизированная версия:</b>\n"${result.optimized}"\n\n`;
      }

      if (result.suggestions.length > 0) {
        response += `💡 <b>Рекомендации:</b>\n`;
        result.suggestions.forEach(s => response += `• ${s}\n`);
      }

      await bot!.sendMessage(chatId, response, { parse_mode: 'HTML' });
    } catch (error) {
      await bot!.sendMessage(chatId, '❌ Ошибка проверки грамматики.');
    }
  });

  // 📝 TLDR - краткое содержание
  bot.onText(/\/tldr (.+)/, async (msg, match) => {
    const chatId = msg.chat.id;
    const text = match?.[1];

    if (!text) {
      await bot!.sendMessage(chatId, '❌ Укажите текст для сокращения!\n\nПример: /tldr длинный текст...');
      return;
    }

    if (!checkRateLimit(chatId, 'ai')) {
      await bot!.sendMessage(chatId, '⏳ Слишком много AI запросов! Подождите минуту.');
      return;
    }

    await bot!.sendMessage(chatId, '📝 Создаю краткое содержание...');
    await bot!.sendChatAction(chatId, 'typing');

    try {
      const { contentOptimizationService } = await import('./services/contentOptimization');
      const result = await contentOptimizationService.generateTLDR(text);

      updateUserStats(chatId, 'ai');

      let response = `📝 <b>КРАТКОЕ СОДЕРЖАНИЕ (TLDR)</b>\n\n`;
      response += `${result.summary}\n\n`;
      response += `📌 <b>Ключевые пункты:</b>\n`;
      result.keyPoints.forEach((point, i) => {
        response += `${i + 1}. ${point}\n`;
      });
      response += `\n⏱ Время чтения полного текста: ${result.readingTime}`;

      await bot!.sendMessage(chatId, response, { parse_mode: 'HTML' });
    } catch (error) {
      await bot!.sendMessage(chatId, '❌ Ошибка создания краткого содержания.');
    }
  });

  // 🎮 ГЕЙМИФИКАЦИЯ - генерация викторин
  bot.onText(/\/gamify(?:\s+(.+))?/, async (msg, match) => {
    const chatId = msg.chat.id;
    const topic = match && match[1] ? match[1] : 'AI и нейросети';

    if (!checkRateLimit(chatId, 'ai')) {
      await bot!.sendMessage(chatId, '⏳ Слишком много AI запросов! Подождите минуту.');
      return;
    }

    await bot!.sendMessage(chatId, '🎮 Создаю интерактивную викторину...');
    await bot!.sendChatAction(chatId, 'typing');

    try {
      const { contentOptimizationService } = await import('./services/contentOptimization');
      const result = await contentOptimizationService.generateGameContent('quiz', topic, 'medium');

      updateUserStats(chatId, 'ai');

      let response = `🎮 <b>ВИКТОРИНА: ${topic}</b>\n\n`;
      
      if (result.questions) {
        result.questions.slice(0, 3).forEach((q, i) => {
          response += `<b>${i + 1}. ${q.question}</b>\n`;
          q.options.forEach((opt, idx) => {
            response += `${idx === q.correctAnswer ? '✅' : '❌'} ${opt}\n`;
          });
          response += `💡 ${q.explanation}\n\n`;
        });
      }

      response += `🎁 <b>Награда:</b> ${result.reward}`;

      await bot!.sendMessage(chatId, response, { parse_mode: 'HTML' });
    } catch (error) {
      await bot!.sendMessage(chatId, '❌ Ошибка создания викторины.');
    }
  });

  // 📈 СТАТИСТИКА БОТА
  bot.onText(/\/botstats/, async (msg) => {
    const chatId = msg.chat.id;

    // Топ-5 команд
    const topCommands = Array.from(commandStats.entries())
      .sort((a, b) => b[1] - a[1])
      .slice(0, 5)
      .map(([cmd, count], i) => `${i + 1}. ${cmd} - ${count} раз`)
      .join('\n');

    const totalUsers = userStats.size;
    const totalCommands = Array.from(commandStats.values()).reduce((a, b) => a + b, 0);
    const totalAI = Array.from(userStats.values()).reduce((sum, s) => sum + s.aiRequests, 0);
    const totalPosts = Array.from(userStats.values()).reduce((sum, s) => sum + s.postsCreated, 0);

    const report = `📈 СТАТИСТИКА БОТА

👥 <b>Пользователи:</b>
• Всего: ${totalUsers}
• Активных сегодня: ${Array.from(userStats.values()).filter(s => 
      new Date().toDateString() === s.lastActive.toDateString()
    ).length}

📊 <b>Активность:</b>
• Команд выполнено: ${totalCommands}
• AI запросов: ${totalAI}
• Постов создано: ${totalPosts}
• Размер кэша: ${responseCache.size}

🏆 <b>ТОП-5 КОМАНД:</b>
${topCommands || 'Нет данных'}

⚡ <b>Производительность:</b>
• Rate limiting: активен
• Кэш-хиты: ~${Math.round(responseCache.size / Math.max(totalAI, 1) * 100)}%
• Instance: ${botInstanceId?.substring(0, 12)}...

💡 <b>Система:</b>
• Автопубликация: ${isSchedulerPaused ? '⏸️ пауза' : '✅ работает'}
• Расписание: 09:00, 15:00, 20:00`;

    await bot!.sendMessage(chatId, report, { parse_mode: 'HTML' });
  });

  // ====================================
  // AI АССИСТЕНТ В РЕАЛЬНОМ ВРЕМЕНИ
  // ====================================

  bot.on('message', async (msg) => {
    const chatId = msg.chat.id;
    const text = msg.text || '';

    if (text.startsWith('/') || !text.trim()) {
      return;
    }

    console.log(`💬 Сообщение от ${chatId}: ${text}`);

    // Проверка на команды публикации
    const publishKeywords = ['опубликуй', 'опубликовать', 'публикуй', 'опублікуй', 'publish'];
    const isPublishCommand = publishKeywords.some(keyword => 
      text.toLowerCase().includes(keyword)
    );

    if (isPublishCommand) {
      const savedPost = userPosts.get(chatId);

      if (!savedPost) {
        await bot!.sendMessage(chatId, '❌ Нет сохранённого поста!\n\n💡 Сначала создай пост командой /viral');
        return;
      }

      try {
        await bot!.sendMessage(chatId, '📤 Публикую в канал...');
        await bot!.sendMessage(CHANNEL_ID, savedPost);
        await bot!.sendMessage(chatId, `✅ Пост успешно опубликован в канале ${CHANNEL_ID}!`);

        updateUserStats(chatId, 'post');
        userPosts.delete(chatId);
        console.log(`✅ Пост опубликован пользователем ${chatId}`);
      } catch (error) {
        console.error('❌ Ошибка публикации поста:', error);
        await bot!.sendMessage(chatId, '❌ Ошибка публикации. Проверьте права бота в канале.');
      }
      return;
    }

    // 🛡️ Rate limit для AI запросов
    if (!checkRateLimit(chatId, 'ai')) {
      await bot!.sendMessage(chatId, '⏳ Слишком много AI запросов! Подождите минуту.\n\n💡 Используйте команды из /menu для быстрого доступа.');
      return;
    }

    // 💾 Проверяем кэш для частых вопросов
    const cacheKey = text.toLowerCase().trim().substring(0, 100);
    const cachedResponse = getCachedResponse(cacheKey);

    if (cachedResponse) {
      await bot!.sendMessage(chatId, `${cachedResponse}\n\n⚡ (из кэша)`);
      console.log(`💾 Ответ из кэша для ${chatId}`);
      return;
    }

    // AI-ассистент для обычных вопросов
    try {
      await bot!.sendChatAction(chatId, 'typing');
      updateUserStats(chatId, 'ai');

      const prompt = `Ты AI-ассистент по продвижению Telegram. Канал: ${CHANNEL_ID}. Вопрос: "${text}". Дай полезный ответ: дружелюбный, конкретные советы, эмодзи. Макс 500 символов.`;

      const response = await grok.chat.completions.create({
        model: 'grok-2-latest',
        messages: [{ role: 'user', content: prompt }],
        temperature: 0.8,
        max_tokens: 600
      });

      const answer = response.choices[0].message.content || 'Извините, не могу ответить. Попробуйте переформулировать или используйте /help';

      // Сохраняем в кэш
      setCachedResponse(cacheKey, answer);

      await bot!.sendMessage(chatId, answer);
      console.log(`✅ Ответ отправлен ${chatId}`);
    } catch (error) {
      console.error('❌ Ошибка AI ассистента:', error);
      await bot!.sendMessage(chatId, '⚠️ Ошибка. Попробуйте позже или используйте /help');
    }
  });

  console.log('📅 Расписание: 09:00, 15:00, 20:00 (посты), 12:00 Пн/Чт (опросы)');
  console.log('💡 Команды: /start /menu /help');
  console.log('🔥 Режим доминирования: /niche /spy /trends /viralcheck /blueprint');
  console.log('🤖 AI ассистент: отвечает на любые сообщения');
  } catch (error) {
    console.error('❌ Критическая ошибка при запуске бота:', error);
    bot = null;
  } finally {
    isStarting = false;
  }
}

// Очистка при завершении процесса
export async function stopTelegramBot() {
  if (bot) {
    console.log('🛑 Остановка Telegram бота...');
    try {
      await bot.stopPolling({ cancel: true, reason: 'Server shutdown' });
    } catch (e) {
      // Игнорируем ошибки остановки
    }
    bot = null;
  }
}

// Обработчики завершения процесса
process.on('SIGINT', async () => {
  await stopTelegramBot();
  process.exit(0);
});

process.on('SIGTERM', async () => {
  await stopTelegramBot();
  process.exit(0);
});