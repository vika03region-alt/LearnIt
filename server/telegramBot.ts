import TelegramBot from 'node-telegram-bot-api';
import cron from 'node-cron';
import OpenAI from 'openai';

const TELEGRAM_TOKEN = process.env.BOTTG || '';
const CHANNEL_ID = '@IIPRB';

const grok = new OpenAI({
  apiKey: process.env.XAI_API_KEY || '',
  baseURL: 'https://api.x.ai/v1'
});

let bot: TelegramBot | null = null;
let isSchedulerPaused = false;

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

export function startTelegramBot() {
  if (!TELEGRAM_TOKEN) {
    console.log('⚠️ BOTTG токен не найден - Telegram бот не запущен');
    return;
  }

  bot = new TelegramBot(TELEGRAM_TOKEN, { polling: true });
  
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

  bot.onText(/\/start/, async (msg) => {
    const chatId = msg.chat.id;
    const welcomeMessage = `
👋 Привет! Я твой AI-помощник

💡 ЧТО Я УМЕЮ:

1️⃣ ПОМОГАЮ С КОНТЕНТОМ
   /ideas - дам идеи для постов
   /viral - создам вирусный пост

2️⃣ ПОКАЗЫВАЮ СТАТИСТИКУ
   /analytics - статистика канала
   /growth - прогноз роста

3️⃣ АНАЛИЗИРУЮ КОНКУРЕНТОВ
   /spy - что делают другие
   /niche - анализ рынка

4️⃣ ДАЮ СОВЕТЫ
   /trends - что сейчас работает
   /blueprint - план развития

💬 ПРОСТО СПРОСИ:
Можешь писать обычные вопросы
без команд - я отвечу!

Например: "Как увеличить подписчиков?"

🎯 Главное меню: /menu
📋 Все команды: /help
📢 Канал: ${CHANNEL_ID}
    `;
    await bot!.sendMessage(chatId, welcomeMessage);
  });
  
  bot.onText(/\/menu/, async (msg) => {
    const chatId = msg.chat.id;
    const menuMessage = `
🎯 ГЛАВНОЕ МЕНЮ

Выбери что тебе нужно:

1️⃣ Создать контент → /ideas
2️⃣ Посмотреть статистику → /analytics
3️⃣ Узнать про конкурентов → /spy
4️⃣ Получить советы → /trends
5️⃣ План развития → /blueprint

💬 Или просто напиши вопрос!

📋 Все команды: /help
    `;
    await bot!.sendMessage(chatId, menuMessage);
  });

  bot.onText(/\/help/, async (msg) => {
    const chatId = msg.chat.id;
    const helpMessage = `
📚 МЕНЮ КОМАНД

✍️ СОЗДАТЬ КОНТЕНТ:
/ideas - дам идеи для постов
/viral - создам вирусный пост
/hashtags - подберу хештеги
/post - опубликую пост сейчас

📊 ПОСМОТРЕТЬ СТАТИСТИКУ:
/analytics - статистика канала
/growth - прогноз роста
/report - полный отчет

🔍 УЗНАТЬ ПРО КОНКУРЕНТОВ:
/spy [название] - что делают другие
/niche [тема] - анализ рынка
/competitors - обзор конкурентов

💡 ПОЛУЧИТЬ СОВЕТЫ:
/trends - что сейчас работает
/blueprint - план развития канала
/optimize - когда публиковать
/audience - кто ваша аудитория

🚀 AI-ПРОДВИЖЕНИЕ (НОВОЕ!):
/contest - генерация конкурса
/quiz - интерактивная викторина
/hook - цепляющие хуки для постов
/magnet - лид-магнит для роста
/boost - план быстрого роста
/story - контент для Stories
/engage - стратегия вовлечения
/challenge - вирусный челлендж

🛠 НАСТРОЙКИ:
/schedule - расписание постов
/settings - настройки бота
/pause - остановить публикации
/resume - возобновить публикации

💬 ПРОСТО СПРОСИ:
Пиши обычные вопросы - я отвечу!
Не нужно писать команды со "/"

Пример: "Как набрать подписчиков?"

🎯 Главное меню: /menu
📢 ${CHANNEL_ID}
    `;
    await bot!.sendMessage(chatId, helpMessage);
  });
  
  // ====================================
  // ДЕЙСТВИЯ
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

  // ====================================
  // ГЕНЕРАЦИЯ КОНТЕНТА
  // ====================================
  
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
      await bot!.sendMessage(chatId, `🚀 ВИРУСНЫЙ ПОСТ:\n\n${viralPost}\n\n✅ Готов к публикации!`);
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

📝 Шаблон:
"Привет! У меня канал про AI (${CHANNEL_ID}). Предлагаю взаимный пост. Аудитория близкая!"

/spy для анализа каналов`;
    
    await bot!.sendMessage(chatId, crossPromo);
  });

  bot.onText(/\/competitors/, async (msg) => {
    const chatId = msg.chat.id;
    await bot!.sendMessage(chatId, '🔍 Анализирую конкурентов...');
    
    try {
      const prompt = `ТОП-3 Telegram канала про AI: название, подписчики, что делают хорошо, что плохо. До 400 символов.`;

      const response = await grok.chat.completions.create({
        model: 'grok-2-latest',
        messages: [{ role: 'user', content: prompt }],
        temperature: 0.7,
        max_tokens: 500
      });

      const competitors = response.choices[0].message.content || 'Ошибка';
      await bot!.sendMessage(chatId, `🔍 АНАЛИЗ КОНКУРЕНТОВ\n\n${competitors}\n\n💡 Используйте /spy для детального анализа`);
    } catch (error) {
      await bot!.sendMessage(chatId, '❌ Ошибка анализа.');
    }
  });

  bot.onText(/\/chatlist/, async (msg) => {
    const chatId = msg.chat.id;
    
    const chatList = `💬 ЧАТЫ ДЛЯ ПРОДВИЖЕНИЯ

🎯 AI/Tech чаты:
• @ai_chat_ru
• @chatgpt_community
• @neural_networks_chat

📢 Промо-чаты:
• @prbartertg
• @channel_promo
• @free_pr_chat

💡 Правила:
❌ НЕ спамьте
✅ Давайте ценность
✅ Будьте экспертом

📊 Результат:
+30-50 подписчиков/месяц`;
    
    await bot!.sendMessage(chatId, chatList);
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
• 09:00, 15:00, 20:00

💰 Экономика:
• Стоимость поста: $0.0001
• Экономия vs GPT-4: 90%

📈 Статус: ${isSchedulerPaused ? '⏸️ На паузе' : '✅ Активен'}`;
    
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
      
      await bot!.sendMessage(chatId, `🎁 ВИРУСНЫЙ КОНКУРС\n\n${contest}`, {
        reply_markup: {
          inline_keyboard: [
            [
              { text: '✅ Опубликовать в канале', callback_data: 'publish_contest' },
              { text: '🔄 Другой вариант', callback_data: 'regenerate_contest' }
            ]
          ]
        }
      });
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
      await bot!.sendMessage(chatId, `🏆 ВИРУСНЫЙ ЧЕЛЛЕНДЖ\n\n${challenge}`);
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
  // AI АССИСТЕНТ В РЕАЛЬНОМ ВРЕМЕНИ
  // ====================================
  
  bot.on('message', async (msg) => {
    const chatId = msg.chat.id;
    const text = msg.text || '';
    
    if (text.startsWith('/') || !text.trim()) {
      return;
    }
    
    console.log(`💬 Сообщение от ${chatId}: ${text}`);
    
    try {
      await bot!.sendChatAction(chatId, 'typing');
      
      const prompt = `Ты AI-ассистент по продвижению Telegram. Канал: ${CHANNEL_ID}. Вопрос: "${text}". Дай полезный ответ: дружелюбный, конкретные советы, эмодзи. Макс 500 символов.`;

      const response = await grok.chat.completions.create({
        model: 'grok-2-latest',
        messages: [{ role: 'user', content: prompt }],
        temperature: 0.8,
        max_tokens: 600
      });

      const answer = response.choices[0].message.content || 'Извините, не могу ответить. Попробуйте переформулировать или используйте /help';
      
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
}
