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

// Реферальная система
const referralStats = new Map<string, { invites: number; rewards: number }>();
const userReferrals = new Map<string, string[]>();

// Автоматические приветствия
const welcomeMessages = [
  '👋 Добро пожаловать! Рад видеть тебя в нашем сообществе AI-энтузиастов!',
  '🎉 Привет! Ты присоединился к самому активному AI-каналу! Погнали учиться!',
  '🚀 Welcome! Здесь ты узнаешь всё про нейросети и AI. Задавай вопросы!',
  '💡 Привет! Каждый день публикуем полезный контент про AI. Не пропусти!',
  '🔥 Добро пожаловать! Тут вся магия нейросетей. Погружаемся вместе!'
];

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

  bot.onText(/\/start(?:\s+(.+))?/, async (msg, match) => {
    const chatId = msg.chat.id;
    const userId = msg.from?.id.toString() || '';
    const referrerId = match && match[1] ? match[1] : null;
    
    // Обработка реферальной ссылки
    if (referrerId && referrerId !== userId) {
      if (!referralStats.has(referrerId)) {
        referralStats.set(referrerId, { invites: 0, rewards: 0 });
      }
      if (!userReferrals.has(referrerId)) {
        userReferrals.set(referrerId, []);
      }
      
      const referrerData = referralStats.get(referrerId)!;
      const invitedUsers = userReferrals.get(referrerId)!;
      
      if (!invitedUsers.includes(userId)) {
        invitedUsers.push(userId);
        referrerData.invites++;
        
        if (referrerData.invites % 5 === 0) {
          referrerData.rewards++;
          await bot!.sendMessage(referrerId, `🎁 НАГРАДА! Ты пригласил ${referrerData.invites} друзей!\n\n🏆 Получена награда #${referrerData.rewards}\n\n💡 Продолжай приглашать друзей!`);
        } else {
          await bot!.sendMessage(referrerId, `✅ По твоей ссылке присоединился новый участник!\n\nВсего приглашений: ${referrerData.invites}\n🎁 До награды: ${5 - (referrerData.invites % 5)} друзей`);
        }
        
        const randomWelcome = welcomeMessages[Math.floor(Math.random() * welcomeMessages.length)];
        await bot!.sendMessage(chatId, `${randomWelcome}\n\n💝 Тебя пригласил друг, так держать!`);
      }
    }
    
    const welcomeMessage = `👋 <b>Привет! Я твой AI-помощник по Telegram</b>

🤖 Помогу автоматизировать канал, создавать вирусный контент и привлекать аудиторию!

💬 <b>Выбери что тебе нужно:</b>`;
    
    await bot!.sendMessage(chatId, welcomeMessage, {
      parse_mode: 'HTML',
      reply_markup: {
        inline_keyboard: [
          [
            { text: '✍️ Создать контент', callback_data: 'menu_content' },
            { text: '📊 Статистика', callback_data: 'menu_analytics' }
          ],
          [
            { text: '🚀 AI-Продвижение', callback_data: 'menu_promo' },
            { text: '🎁 Вирусный рост', callback_data: 'menu_viral' }
          ],
          [
            { text: '🔍 Конкуренты', callback_data: 'menu_spy' },
            { text: '💡 Советы', callback_data: 'menu_advice' }
          ],
          [
            { text: '📋 Все команды', callback_data: 'show_help' }
          ]
        ]
      }
    });
  });
  
  bot.onText(/\/menu/, async (msg) => {
    const chatId = msg.chat.id;
    const menuMessage = `🎯 <b>ГЛАВНОЕ МЕНЮ</b>

💬 Выбери категорию или просто напиши вопрос!`;
    
    await bot!.sendMessage(chatId, menuMessage, {
      parse_mode: 'HTML',
      reply_markup: {
        inline_keyboard: [
          [
            { text: '✍️ Контент', callback_data: 'menu_content' },
            { text: '📊 Статистика', callback_data: 'menu_analytics' }
          ],
          [
            { text: '🚀 Продвижение', callback_data: 'menu_promo' },
            { text: '🎁 Вирусный рост', callback_data: 'menu_viral' }
          ],
          [
            { text: '🔍 Конкуренты', callback_data: 'menu_spy' },
            { text: '💡 Советы', callback_data: 'menu_advice' }
          ],
          [
            { text: '⚙️ Настройки', callback_data: 'menu_settings' }
          ],
          [
            { text: '📋 Все команды', callback_data: 'show_help' }
          ]
        ]
      }
    });
  });

  bot.onText(/\/help/, async (msg) => {
    const chatId = msg.chat.id;
    const helpMessage = `
📚 МЕНЮ КОМАНД

✍️ СОЗДАТЬ КОНТЕНТ:
/ideas - идеи для постов
/viral - вирусный пост
/hashtags - подбор хештегов
/hook - цепляющие хуки

📊 АНАЛИТИКА:
/analytics - статистика канала
/growth - прогноз роста
/viralcheck - проверка вирусности

🔍 АНАЛИЗ РЫНКА:
/spy [название] - шпионаж за конкурентами
/niche [тема] - анализ ниши
/trends - актуальные тренды

🎯 СТРАТЕГИЯ:
/blueprint - план доминирования
/boost - план роста на 30 дней
/engage - стратегия вовлечения

🚀 ВИРУСНЫЕ МЕХАНИКИ:
/contest - генерация конкурса
/quiz - интерактивная викторина
/magnet - лид-магнит
/story - контент для Stories
/challenge - вирусный челлендж

🛠 УПРАВЛЕНИЕ:
/schedule - расписание постов
/settings - настройки бота
/pause - остановить публикации
/resume - возобновить публикации

💬 AI-АССИСТЕНТ:
Просто пиши вопросы - я отвечу!
Не нужны команды со "/"

Пример: "Как набрать 1000 подписчиков?"

🎯 Главное меню: /menu
📢 ${CHANNEL_ID}
    `;
    await bot!.sendMessage(chatId, helpMessage);
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

  // ====================================
  // УПРАВЛЕНИЕ
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
    
    await bot!.sendMessage(chatId, '🚀 Создаю ДЕТАЛЬНЫЙ план роста...');
    await bot!.sendChatAction(chatId, 'typing');
    
    try {
      const prompt = `Подробный 30-дневный план роста Telegram канала про AI:

**День 1-7: ФУНДАМЕНТ**
- Оптимизировать описание канала
- Создать контент-план на месяц
- Опубликовать 2-3 поста в день (утро/вечер)
- Результат: +50-100 подписчиков

**День 8-14: АКТИВАЦИЯ**
- Запустить первый опрос/викторину
- Начать отвечать на комментарии активно
- Добавить Stories 2-3 раза в день
- Результат: +100-150 подписчиков

**День 15-21: УСКОРЕНИЕ**
- Запустить кросс-промо с 3-5 каналами
- Провести первый конкурс
- Публиковать вирусный контент ежедневно
- Результат: +200-300 подписчиков

**День 22-24: ПОДДЕРЖАНИЕ АКТИВНОСТИ**
- Публиковать контент, который легко репостить (цитаты, мотивационные посты)
- Отвечать на комментарии и сообщения подписчиков, поддерживать активность
- Продолжить работу с вовлечением аудитории

**День 25-27: ВИРУСНАЯ ВОЛНА**
- Провести еще один конкурс или розыгрыш для поддержания интереса
- Публиковать контент, который вызывает эмоции и стимулирует обсуждения
- Продолжить активное взаимодействие с аудиторией, отвечать на отзывы

**День 28-30: ЗАВЕРШЕНИЕ И АНАЛИЗ**
- Подвести итоги месяца, опубликовать пост с благодарностью и результатами
- Проанализировать статистику и скорректировать стратегию на будущее
- Продолжить публикацию качественного контента и поддерживать вовлеченность аудитории

ИТОГО ЗА МЕСЯЦ: 750-1200 подписчиков

До 1400 символов, конкретные действия.`;

      const response = await grok.chat.completions.create({
        model: 'grok-2-latest',
        messages: [{ role: 'user', content: prompt }],
        temperature: 0.75,
        max_tokens: 1600
      });

      const boost = response.choices[0].message.content || 'Ошибка';
      await bot!.sendMessage(chatId, `🚀 ПЛАН РОСТА НА 30 ДНЕЙ\n\n${boost}`);
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
      // Меню: Контент
      if (data === 'menu_content') {
        await bot!.answerCallbackQuery(callbackQuery.id);
        await bot!.sendMessage(chatId, `✍️ <b>СОЗДАНИЕ КОНТЕНТА</b>

Выбери что тебе нужно:`, {
          parse_mode: 'HTML',
          reply_markup: {
            inline_keyboard: [
              [
                { text: '💡 Идеи для постов', callback_data: 'cmd_ideas' },
                { text: '🔥 Вирусный пост', callback_data: 'cmd_viral' }
              ],
              [
                { text: '🪝 Цепляющие хуки', callback_data: 'cmd_hook' },
                { text: '#️⃣ Хештеги', callback_data: 'cmd_hashtags' }
              ],
              [
                { text: '📝 Опубликовать пост', callback_data: 'cmd_post' }
              ],
              [
                { text: '◀️ Назад в меню', callback_data: 'back_menu' }
              ]
            ]
          }
        });
      }
      
      // Меню: Статистика
      else if (data === 'menu_analytics') {
        await bot!.answerCallbackQuery(callbackQuery.id);
        await bot!.sendMessage(chatId, `📊 <b>АНАЛИТИКА И СТАТИСТИКА</b>

Выбери что посмотреть:`, {
          parse_mode: 'HTML',
          reply_markup: {
            inline_keyboard: [
              [
                { text: '📈 Статистика канала', callback_data: 'cmd_analytics' },
                { text: '🚀 Прогноз роста', callback_data: 'cmd_growth' }
              ],
              [
                { text: '📋 Полный отчет', callback_data: 'cmd_report' }
              ],
              [
                { text: '◀️ Назад в меню', callback_data: 'back_menu' }
              ]
            ]
          }
        });
      }
      
      // Меню: AI-Продвижение
      else if (data === 'menu_promo') {
        await bot!.answerCallbackQuery(callbackQuery.id);
        await bot!.sendMessage(chatId, `🚀 <b>AI-ИНСТРУМЕНТЫ ПРОДВИЖЕНИЯ</b>

Мощные инструменты для роста:`, {
          parse_mode: 'HTML',
          reply_markup: {
            inline_keyboard: [
              [
                { text: '🎁 Конкурс', callback_data: 'cmd_contest' },
                { text: '🎯 Викторина', callback_data: 'cmd_quiz' }
              ],
              [
                { text: '🧲 Лид-магнит', callback_data: 'cmd_magnet' },
                { text: '📱 Stories', callback_data: 'cmd_story' }
              ],
              [
                { text: '🚀 План роста (30д)', callback_data: 'cmd_boost' },
                { text: '🏆 Челлендж', callback_data: 'cmd_challenge' }
              ],
              [
                { text: '💬 Стратегия вовлечения', callback_data: 'cmd_engage' }
              ],
              [
                { text: '◀️ Назад в меню', callback_data: 'back_menu' }
              ]
            ]
          }
        });
      }
      
      // Меню: Вирусный рост
      else if (data === 'menu_viral') {
        await bot!.answerCallbackQuery(callbackQuery.id);
        await bot!.sendMessage(chatId, `🎁 <b>ВИРУСНЫЙ РОСТ</b>

Привлекай друзей и получай награды!`, {
          parse_mode: 'HTML',
          reply_markup: {
            inline_keyboard: [
              [
                { text: '🔗 Моя реферальная ссылка', callback_data: 'cmd_referral' }
              ],
              [
                { text: '📊 Статистика приглашений', callback_data: 'referral_stats' }
              ],
              [
                { text: '◀️ Назад в меню', callback_data: 'back_menu' }
              ]
            ]
          }
        });
      }
      
      // Меню: Конкуренты
      else if (data === 'menu_spy') {
        await bot!.answerCallbackQuery(callbackQuery.id);
        await bot!.sendMessage(chatId, `🔍 <b>АНАЛИЗ КОНКУРЕНТОВ</b>

Узнай что делают другие:`, {
          parse_mode: 'HTML',
          reply_markup: {
            inline_keyboard: [
              [
                { text: '🕵️ Шпионаж', callback_data: 'cmd_spy' },
                { text: '📊 Анализ ниши', callback_data: 'cmd_niche' }
              ],
              [
                { text: '🎯 Обзор конкурентов', callback_data: 'cmd_competitors' }
              ],
              [
                { text: '◀️ Назад в меню', callback_data: 'back_menu' }
              ]
            ]
          }
        });
      }
      
      // Меню: Советы
      else if (data === 'menu_advice') {
        await bot!.answerCallbackQuery(callbackQuery.id);
        await bot!.sendMessage(chatId, `💡 <b>СОВЕТЫ И РЕКОМЕНДАЦИИ</b>

Получи экспертные советы:`, {
          parse_mode: 'HTML',
          reply_markup: {
            inline_keyboard: [
              [
                { text: '📈 Тренды 2025', callback_data: 'cmd_trends' },
                { text: '⏰ Когда публиковать', callback_data: 'cmd_optimize' }
              ],
              [
                { text: '👥 Профиль аудитории', callback_data: 'cmd_audience' },
                { text: '🎯 План доминирования', callback_data: 'cmd_blueprint' }
              ],
              [
                { text: '◀️ Назад в меню', callback_data: 'back_menu' }
              ]
            ]
          }
        });
      }
      
      // Меню: Настройки
      else if (data === 'menu_settings') {
        await bot!.answerCallbackQuery(callbackQuery.id);
        await bot!.sendMessage(chatId, `⚙️ <b>НАСТРОЙКИ БОТА</b>

Управление автоматизацией:`, {
          parse_mode: 'HTML',
          reply_markup: {
            inline_keyboard: [
              [
                { text: '📅 Расписание', callback_data: 'cmd_schedule' },
                { text: '⚙️ Настройки', callback_data: 'cmd_settings' }
              ],
              [
                { text: '⏸️ Пауза', callback_data: 'cmd_pause' },
                { text: '▶️ Возобновить', callback_data: 'cmd_resume' }
              ],
              [
                { text: '◀️ Назад в меню', callback_data: 'back_menu' }
              ]
            ]
          }
        });
      }
      
      // Показать help
      else if (data === 'show_help') {
        await bot!.answerCallbackQuery(callbackQuery.id);
        const helpMessage = `📚 <b>ВСЕ КОМАНДЫ БОТА</b>

<b>✍️ КОНТЕНТ:</b>
/ideas - идеи для постов
/viral - вирусный пост
/hook - цепляющие хуки
/hashtags - подбор хештегов
/post - опубликовать пост

<b>🚀 ПРОДВИЖЕНИЕ:</b>
/contest - конкурс
/quiz - викторина
/magnet - лид-магнит
/boost - план роста (30д)
/story - контент для Stories
/engage - вовлечение
/challenge - челлендж

<b>📊 АНАЛИТИКА:</b>
/analytics - статистика
/growth - прогноз роста
/report - полный отчет

<b>🔍 КОНКУРЕНТЫ:</b>
/spy - шпионаж
/niche - анализ ниши
/competitors - обзор

<b>💡 СОВЕТЫ:</b>
/trends - тренды 2025
/optimize - время публикаций
/audience - профиль ЦА
/blueprint - план доминирования

<b>🎁 ВИРУСНЫЙ РОСТ:</b>
/referral - реферальная ссылка

<b>⚙️ НАСТРОЙКИ:</b>
/schedule - расписание
/pause - пауза
/resume - возобновить

💬 Или просто напиши вопрос!`;

        await bot!.sendMessage(chatId, helpMessage, {
          parse_mode: 'HTML',
          reply_markup: {
            inline_keyboard: [
              [
                { text: '◀️ Назад в меню', callback_data: 'back_menu' }
              ]
            ]
          }
        });
      }
      
      // Назад в меню
      else if (data === 'back_menu') {
        await bot!.answerCallbackQuery(callbackQuery.id);
        const menuMessage = `🎯 <b>ГЛАВНОЕ МЕНЮ</b>

💬 Выбери категорию или просто напиши вопрос!`;
        
        await bot!.sendMessage(chatId, menuMessage, {
          parse_mode: 'HTML',
          reply_markup: {
            inline_keyboard: [
              [
                { text: '✍️ Контент', callback_data: 'menu_content' },
                { text: '📊 Статистика', callback_data: 'menu_analytics' }
              ],
              [
                { text: '🚀 Продвижение', callback_data: 'menu_promo' },
                { text: '🎁 Вирусный рост', callback_data: 'menu_viral' }
              ],
              [
                { text: '🔍 Конкуренты', callback_data: 'menu_spy' },
                { text: '💡 Советы', callback_data: 'menu_advice' }
              ],
              [
                { text: '⚙️ Настройки', callback_data: 'menu_settings' }
              ]
            ]
          }
        });
      }
      
      // Команды (запуск функций через кнопки)
      else if (data?.startsWith('cmd_')) {
        await bot!.answerCallbackQuery(callbackQuery.id);
        const command = data.replace('cmd_', '');
        
        // Направляем пользователя использовать команду напрямую
        await bot!.sendMessage(chatId, `💡 Используй команду /${command} для запуска этой функции!`);
      }
      
      // Старые callback (конкурсы и т.д.)
      else if (data === 'publish_contest') {
        await bot!.answerCallbackQuery(callbackQuery.id, {
          text: '✅ Конкурс будет опубликован!'
        });
        await bot!.sendMessage(chatId, '📝 Публикую конкурс в канале...');
      } else if (data === 'regenerate_contest') {
        await bot!.answerCallbackQuery(callbackQuery.id);
        await bot!.sendMessage(chatId, '🔄 Генерирую новый вариант...');
      } else if (data === 'referral_stats') {
        await bot!.answerCallbackQuery(callbackQuery.id);
        
        const userId = callbackQuery.from?.id.toString() || '';
        const stats = referralStats.get(userId) || { invites: 0, rewards: 0 };
        const invitedUsers = userReferrals.get(userId) || [];
        
        const statsMessage = `📊 <b>ДЕТАЛЬНАЯ СТАТИСТИКА</b>

👥 Всего приглашено: ${stats.invites} ${stats.invites === 1 ? 'друг' : 'друзей'}
🏆 Получено наград: ${stats.rewards}
📈 Активных рефералов: ${invitedUsers.length}

🎯 ПРОГРЕСС ДО НАГРАДЫ:
${stats.invites % 5}/5 друзей
${Array(stats.invites % 5).fill('🟢').join('')}${Array(5 - (stats.invites % 5)).fill('⚪️').join('')}

💎 СЛЕДУЮЩАЯ НАГРАДА:
${stats.invites < 5 ? '🎁 Награда #1 (5 друзей)' : 
  stats.invites < 10 ? '🎁 Награда #2 (10 друзей)' : 
  stats.invites < 15 ? '🎁 Награда #3 (15 друзей)' : 
  stats.invites < 20 ? '🎁 VIP статус (20 друзей)' : 
  '👑 VIP статус получен!'}

🚀 Продолжай приглашать друзей!`;

        await bot!.sendMessage(chatId, statsMessage, { parse_mode: 'HTML' });
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
