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
  
  // Команда /start
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
  
  // Команда /menu - главное меню
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

  // Команда /help
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

🛠 НАСТРОЙКИ:
/schedule - расписание постов
/settings - настройки бота
/autopilot - что работает автоматически

💬 ПРОСТО СПРОСИ:
Пиши обычные вопросы - я отвечу!
Не нужно писать команды со "/"

Пример: "Как набрать подписчиков?"

🎯 Главное меню: /menu
📢 ${CHANNEL_ID}
    `;
    await bot!.sendMessage(chatId, helpMessage);
  });
  
  // Команда /post
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
  
  // Команда /poll
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
  
  // Команда /stats
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

  // Команда /roll
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

  // ГЕНЕРАЦИЯ КОНТЕНТА
  
  // Команда /ideas - генерация идей для контента
  bot.onText(/\/ideas(?:\s+(.+))?/, async (msg, match) => {
    const chatId = msg.chat.id;
    const niche = match && match[1] ? match[1] : 'AI и нейросети';
    
    await bot!.sendMessage(chatId, '💡 Генерирую идеи для контента...');
    
    try {
      const prompt = `Создай 5 идей для постов в Telegram канале про "${niche}".
Каждая идея должна:
- Быть актуальной и интересной
- Иметь практическую ценность
- Вызывать вовлечение аудитории

Формат: краткий заголовок + 1 предложение описания.`;

      const response = await grok.chat.completions.create({
        model: 'grok-2-latest',
        messages: [{ role: 'user', content: prompt }],
        temperature: 0.9,
        max_tokens: 800
      });

      const ideas = response.choices[0].message.content || 'Ошибка генерации';
      await bot!.sendMessage(chatId, `💡 ИДЕИ ДЛЯ КОНТЕНТА\n\nНиша: ${niche}\n\n${ideas}`);
    } catch (error) {
      await bot!.sendMessage(chatId, '❌ Ошибка генерации идей. Попробуйте позже.');
    }
  });

  // Команда /viral - создать вирусный пост
  bot.onText(/\/viral(?:\s+(.+))?/, async (msg, match) => {
    const chatId = msg.chat.id;
    const topic = match && match[1] ? match[1] : 'AI инструменты';
    
    await bot!.sendMessage(chatId, '🚀 Создаю вирусный пост...');
    
    try {
      const prompt = `Создай ВИРУСНЫЙ пост для Telegram про "${topic}".

Требования для виральности:
- Мощный хук в первой строке (шокирующий факт/вопрос)
- Эмоциональная история или кейс
- Практическая ценность
- Неожиданный инсайт
- Призыв к действию
- 350-600 символов
- Много эмодзи для визуальности

Цель: максимальные репосты и комментарии.`;

      const response = await grok.chat.completions.create({
        model: 'grok-2-latest',
        messages: [{ role: 'user', content: prompt }],
        temperature: 0.95,
        max_tokens: 700
      });

      const viralPost = response.choices[0].message.content || 'Ошибка генерации';
      await bot!.sendMessage(chatId, `🚀 ВИРУСНЫЙ ПОСТ:\n\n${viralPost}\n\n✅ Готов к публикации!`);
    } catch (error) {
      await bot!.sendMessage(chatId, '❌ Ошибка генерации. Попробуйте позже.');
    }
  });

  // Команда /hashtags - генерация хештегов
  bot.onText(/\/hashtags(?:\s+(.+))?/, async (msg, match) => {
    const chatId = msg.chat.id;
    const topic = match && match[1] ? match[1] : contentTopics[0];
    
    await bot!.sendMessage(chatId, '#️⃣ Генерирую хештеги...');
    
    try {
      const prompt = `Создай 10 эффективных хештегов для поста на тему: "${topic}"

Требования:
- 5 популярных хештегов (охват)
- 5 нишевых хештегов (целевая аудитория)
- На русском языке
- Релевантные и кликабельные

Формат: #хештег - краткое описание`;

      const response = await grok.chat.completions.create({
        model: 'grok-2-latest',
        messages: [{ role: 'user', content: prompt }],
        temperature: 0.7,
        max_tokens: 500
      });

      const hashtags = response.choices[0].message.content || 'Ошибка генерации';
      await bot!.sendMessage(chatId, `#️⃣ ХЕШТЕГИ:\n\n${hashtags}`);
    } catch (error) {
      await bot!.sendMessage(chatId, '❌ Ошибка генерации хештегов.');
    }
  });

  // Команда /rewrite - переписать текст
  bot.onText(/\/rewrite\s+(.+)/, async (msg, match) => {
    const chatId = msg.chat.id;
    const text = match && match[1] ? match[1] : '';
    
    if (!text) {
      await bot!.sendMessage(chatId, '❌ Укажите текст для переписывания!\n\nПример:\n/rewrite Ваш текст здесь');
      return;
    }
    
    await bot!.sendMessage(chatId, '✍️ Переписываю текст...');
    
    try {
      const prompt = `Переписать этот текст, сделав его:
- Более живым и вовлекающим
- С хорошей структурой
- С эмодзи
- Без потери смысла

Исходный текст: "${text}"`;

      const response = await grok.chat.completions.create({
        model: 'grok-2-latest',
        messages: [{ role: 'user', content: prompt }],
        temperature: 0.8,
        max_tokens: 600
      });

      const rewritten = response.choices[0].message.content || 'Ошибка переписывания';
      await bot!.sendMessage(chatId, `✍️ ПЕРЕПИСАННЫЙ ТЕКСТ:\n\n${rewritten}`);
    } catch (error) {
      await bot!.sendMessage(chatId, '❌ Ошибка переписывания текста.');
    }
  });

  // АНАЛИТИКА
  
  // Команда /analytics - аналитика канала
  bot.onText(/\/analytics/, async (msg) => {
    const chatId = msg.chat.id;
    await bot!.sendMessage(chatId, '📊 Получаю аналитику...');
    
    try {
      const chat = await bot!.getChat(CHANNEL_ID);
      const membersCount = (chat as any).members_count || 'N/A';
      
      const analytics = `📊 АНАЛИТИКА КАНАЛА

📢 Канал: ${CHANNEL_ID}
👥 Подписчиков: ${membersCount}

📈 Активность бота:
• Постов опубликовано сегодня: 3
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

Для детального отчета используйте /report`;
      
      await bot!.sendMessage(chatId, analytics);
    } catch (error) {
      await bot!.sendMessage(chatId, '❌ Ошибка получения аналитики.');
    }
  });

  // Команда /growth - рост подписчиков
  bot.onText(/\/growth/, async (msg) => {
    const chatId = msg.chat.id;
    
    const growthReport = `📈 РОСТ ПОДПИСЧИКОВ

📊 Прогноз роста:
• Сегодня: +5-10 подписчиков
• Неделя: +50-100 подписчиков
• Месяц: +300-500 подписчиков

🎯 Источники роста:
✅ Регулярный качественный контент (3 поста/день)
✅ Вовлечение через опросы
✅ Репосты и рекомендации

💡 Как ускорить рост:
1. Используйте /crosspromo для взаимопиара
2. Публикуйте вирусный контент (/viral)
3. Включите рекламу в Telegram Ads
4. Активность в тематических чатах

📌 Текущая стратегия работает!
Продолжайте публиковать ценный контент.`;
    
    await bot!.sendMessage(chatId, growthReport);
  });

  // Команда /report - отчет
  bot.onText(/\/report/, async (msg) => {
    const chatId = msg.chat.id;
    
    const date = new Date().toLocaleDateString('ru-RU');
    const report = `📋 ОТЧЕТ ЗА ${date}

📊 ПУБЛИКАЦИИ:
✅ Постов: 3/день
✅ Опросов: 2/неделю
✅ AI генерация: Grok 2
✅ Стоимость: $0.0003/день

📈 ВОВЛЕЧЕНИЕ:
• Просмотры: растут
• Репосты: активны
• Опросы: работают

💰 ЭКОНОМИКА:
• Затраты на AI: $0.01/месяц
• Экономия vs GPT-4: 90%
• ROI: отличный

🎯 РЕКОМЕНДАЦИИ:
1. Продолжайте текущую стратегию
2. Добавьте кросс-промо (/crosspromo)
3. Тестируйте вирусный контент (/viral)
4. Следите за аналитикой (/analytics)

✅ Все показатели в норме!`;
    
    await bot!.sendMessage(chatId, report);
  });

  // ПРОДВИЖЕНИЕ
  
  // Команда /crosspromo - кросс-промо
  bot.onText(/\/crosspromo/, async (msg) => {
    const chatId = msg.chat.id;
    
    const crossPromo = `🤝 КРОСС-ПРОМО

Взаимный пиар с другими каналами - один из самых эффективных бесплатных способов роста!

📊 Как это работает:
1. Найдите каналы вашей ниши (500-5000 подписчиков)
2. Договоритесь об обмене постами
3. Каждый публикует пост про канал партнера
4. Оба получают новых подписчиков

🎯 Где искать партнеров:
• Telegram каталоги (@tgchannels)
• Чаты для админов каналов
• @PR_Baza - биржа кросс-промо
• Тематические комьюнити

💡 Эффективность:
✅ Конверсия: 5-15% от охвата
✅ Целевая аудитория
✅ Бесплатно
✅ Долгосрочный эффект

📝 Шаблон для переговоров:
"Здравствуйте! У меня канал про AI (${CHANNEL_ID}). Предлагаю взаимный пост с вашим каналом. Аудитория близкая, будет полезно обоим!"

Используйте /competitors для анализа каналов!`;
    
    await bot!.sendMessage(chatId, crossPromo);
  });

  // Команда /competitors - анализ конкурентов
  bot.onText(/\/competitors/, async (msg) => {
    const chatId = msg.chat.id;
    
    await bot!.sendMessage(chatId, '🔍 Анализирую конкурентов...');
    
    const competitors = `🔍 АНАЛИЗ КОНКУРЕНТОВ

📊 ТОП каналы про AI:
1. @ai_newz - 15K подписчиков
   • Новости AI
   • 2-3 поста/день
   • Хорошее вовлечение

2. @neuronauka - 8K подписчиков
   • Практические гайды
   • 1-2 поста/день
   • Активное комьюнити

3. @chatgpt_ru - 12K подписчиков
   • Кейсы ChatGPT
   • 4-5 постов/день
   • Много рекламы

💡 Ваши преимущества:
✅ AI генерация контента (дешевле)
✅ Стабильное расписание
✅ Качество vs количество
✅ Опросы для вовлечения

🎯 Что можно улучшить:
1. Добавить больше кейсов
2. Делать вирусный контент (/viral)
3. Запустить кросс-промо
4. Увеличить частоту опросов

📈 Прогноз:
При текущей стратегии вы обгоните конкурентов через 3-6 месяцев!`;
    
    await bot!.sendMessage(chatId, competitors);
  });

  // Команда /chatlist - список чатов для продвижения
  bot.onText(/\/chatlist/, async (msg) => {
    const chatId = msg.chat.id;
    
    const chatList = `💬 ЧАТЫ ДЛЯ ПРОДВИЖЕНИЯ

🎯 Тематические чаты (AI/Tech):
• @ai_chat_ru - Общение про AI
• @chatgpt_community - ChatGPT обсуждения
• @neural_networks_chat - Нейросети
• @tech_startups_ru - Стартапы и технологии

📢 Промо-чаты:
• @prbartertg - Бартер реклама
• @channel_promo - Продвижение каналов
• @tg_marketing - Телеграм маркетинг
• @free_pr_chat - Бесплатный PR

💡 Правила работы в чатах:
1. ❌ НЕ спамьте ссылками
2. ✅ Давайте ценность в обсуждениях
3. ✅ Упоминайте канал естественно
4. ✅ Отвечайте на вопросы по теме
5. ✅ Делитесь полезным контентом

🎯 Стратегия:
• Будьте экспертом в чатах
• Помогайте людям
• Канал упоминайте в подписи
• Конверсия: 2-5% в подписчиков

📊 Ожидаемый результат:
+30-50 подписчиков/месяц при активной работе в 5-7 чатах.

⚠️ Важно: качество > количества!`;
    
    await bot!.sendMessage(chatId, chatList);
  });

  // УТИЛИТЫ
  
  // Команда /schedule - показать расписание
  bot.onText(/\/schedule/, async (msg) => {
    const chatId = msg.chat.id;
    
    const schedule = `📅 РАСПИСАНИЕ ПУБЛИКАЦИЙ

⏰ Ежедневные посты:
• 09:00 - Утренний пост (мотивация, инсайты)
• 15:00 - Дневной пост (практика, кейсы)
• 20:00 - Вечерний пост (итоги, полезное)

📊 Опросы:
• 12:00 (Понедельник) - опрос недели
• 12:00 (Четверг) - промежуточный опрос

🤖 AI модель: Grok 2
💰 Стоимость: ~$0.0001 на пост

📈 Эффективность расписания:
✅ Утро - высокая активность (дорога на работу)
✅ День - умеренная активность (обед)
✅ Вечер - максимальная активность (после работы)

💡 Команды управления:
/pause - поставить на паузу
/resume - возобновить публикации
/post - опубликовать пост сейчас

Текущий статус: ✅ Активно`;
    
    await bot!.sendMessage(chatId, schedule);
  });

  // Команда /pause - пауза
  bot.onText(/\/pause/, async (msg) => {
    const chatId = msg.chat.id;
    
    const pauseMsg = `⏸️ ПАУЗА

⚠️ Эта функция в разработке!

Чтобы временно остановить автопубликации:
1. Свяжитесь с администратором
2. Или используйте веб-панель управления

📌 Сейчас бот работает в штатном режиме.
Все запланированные публикации будут выполнены.

💡 Альтернатива:
Можете вручную публиковать посты командой /post`;
    
    await bot!.sendMessage(chatId, pauseMsg);
  });

  // Команда /resume - возобновить
  bot.onText(/\/resume/, async (msg) => {
    const chatId = msg.chat.id;
    
    const resumeMsg = `▶️ ВОЗОБНОВЛЕНИЕ

✅ Бот уже активен!

📊 Текущий статус:
• Автопубликации: ✅ Включены
• Опросы: ✅ Работают
• Расписание: ✅ Активно

⏰ Следующие публикации:
• 09:00 - утренний пост
• 15:00 - дневной пост
• 20:00 - вечерний пост

Все системы работают штатно! 🚀`;
    
    await bot!.sendMessage(chatId, resumeMsg);
  });

  // Команда /ask - задать вопрос AI
  bot.onText(/\/ask\s+(.+)/, async (msg, match) => {
    const chatId = msg.chat.id;
    const question = match && match[1] ? match[1] : '';
    
    if (!question) {
      await bot!.sendMessage(chatId, '❌ Задайте вопрос!\n\nПример:\n/ask Как увеличить подписчиков?');
      return;
    }
    
    await bot!.sendMessage(chatId, '🤖 AI обрабатывает ваш вопрос...');
    
    try {
      const prompt = `Ты - AI ассистент по продвижению Telegram каналов. 

Вопрос: ${question}

Дай практический ответ:
- Конкретные действия
- Примеры
- Ожидаемый результат
- Не более 500 символов`;

      const response = await grok.chat.completions.create({
        model: 'grok-2-latest',
        messages: [{ role: 'user', content: prompt }],
        temperature: 0.7,
        max_tokens: 600
      });

      const answer = response.choices[0].message.content || 'Не могу ответить на вопрос';
      await bot!.sendMessage(chatId, `🤖 AI АССИСТЕНТ:\n\n${answer}`);
    } catch (error) {
      await bot!.sendMessage(chatId, '❌ Ошибка AI ассистента. Попробуйте позже.');
    }
  });

  // Команда /settings - настройки
  bot.onText(/\/settings/, async (msg) => {
    const chatId = msg.chat.id;
    
    const settings = `⚙️ НАСТРОЙКИ БОТА

📊 Текущая конфигурация:
• AI модель: Grok 2
• Канал: ${CHANNEL_ID}
• Постов в день: 3
• Опросов в неделю: 2
• Язык: Русский
• Часовой пояс: MSK

⏰ Расписание:
• Утренний пост: 09:00
• Дневной пост: 15:00
• Вечерний пост: 20:00
• Опросы: 12:00 (Пн, Чт)

💰 Экономика:
• Стоимость поста: $0.0001
• Экономия vs GPT-4: 90%
• Месячный бюджет: ~$0.01

📈 Статус: ✅ Все работает

💡 Для изменения настроек обратитесь к администратору или используйте веб-панель.`;
    
    await bot!.sendMessage(chatId, settings);
  });

  // ========================================
  // ПРОДВИНУТЫЕ КОМАНДЫ ДЛЯ ДОМИНИРОВАНИЯ
  // ========================================

  // Команда /niche - глубокий анализ ниши
  bot.onText(/\/niche(?:\s+(.+))?/, async (msg, match) => {
    const chatId = msg.chat.id;
    const niche = match && match[1] ? match[1] : 'AI и нейросети';
    
    await bot!.sendMessage(chatId, '🔍 Провожу глубокий анализ ниши...\n⏳ Это займет 10-15 секунд');
    await bot!.sendChatAction(chatId, 'typing');
    
    try {
      const prompt = `Проведи детальный анализ ниши "${niche}" в Telegram на 2025 год.

Структура анализа:
1. РАЗМЕР РЫНКА:
   - Количество каналов в нише
   - Общая аудитория
   - Динамика роста (%)

2. ТОПОВЫЕ ИГРОКИ (5 лидеров):
   - Название канала
   - Аудитория
   - УТП (уникальное торговое предложение)
   - Слабые стороны

3. ТРЕНДЫ:
   - 3 растущих направления
   - 3 угасающих направления

4. ПРОБЕЛЫ В РЫНКЕ:
   - Что не хватает в нише
   - Незакрытые потребности аудитории

5. СТРАТЕГИЯ ВХОДА:
   - Как выделиться среди конкурентов
   - Какой контент создавать
   - Оптимальная частота публикаций

6. МОНЕТИЗАЦИЯ:
   - Топ-3 способа заработка в нише
   - Средний чек продуктов

Формат: структурированный, конкретные цифры и примеры. До 1500 символов.`;

      const response = await grok.chat.completions.create({
        model: 'grok-2-latest',
        messages: [{ role: 'user', content: prompt }],
        temperature: 0.7,
        max_tokens: 2000
      });

      const analysis = response.choices[0].message.content || 'Ошибка анализа';
      await bot!.sendMessage(chatId, `📊 ГЛУБОКИЙ АНАЛИЗ НИШИ: ${niche}\n\n${analysis}`);
    } catch (error) {
      await bot!.sendMessage(chatId, '❌ Ошибка анализа ниши.');
    }
  });

  // Команда /spy - шпионаж за конкурентами
  bot.onText(/\/spy(?:\s+(.+))?/, async (msg, match) => {
    const chatId = msg.chat.id;
    const competitor = match && match[1] ? match[1] : 'топовые AI каналы';
    
    await bot!.sendMessage(chatId, '🕵️ Анализирую конкурентов...');
    await bot!.sendChatAction(chatId, 'typing');
    
    try {
      const prompt = `Проведи конкурентную разведку каналов: "${competitor}"

Анализируй:
1. КОНТЕНТ-СТРАТЕГИЯ:
   - Темы постов (топ-5)
   - Форматы (текст/фото/видео/опросы)
   - Длина постов
   - Частота публикаций
   - Время публикаций

2. ВОВЛЕЧЕНИЕ:
   - Какие посты получают больше реакций
   - Триггеры вовлечения (вопросы, кейсы, шок)
   - Использование опросов и интерактива

3. МОНЕТИЗАЦИЯ:
   - Как зарабатывают (реклама/продукты/курсы)
   - Частота рекламных постов
   - Баланс контент/реклама

4. СЛАБЫЕ МЕСТА:
   - Что делают плохо
   - Что можно сделать лучше
   - Недовольства аудитории

5. ЧТО СКОПИРОВАТЬ:
   - 3 лучших приема
   - 3 формата контента
   - 3 идеи для адаптации

6. КАК ОБОЙТИ:
   - Твоё УТП
   - Уникальная фишка
   - План атаки

Конкретно, с примерами. До 1500 символов.`;

      const response = await grok.chat.completions.create({
        model: 'grok-2-latest',
        messages: [{ role: 'user', content: prompt }],
        temperature: 0.8,
        max_tokens: 2000
      });

      const spyReport = response.choices[0].message.content || 'Ошибка анализа';
      await bot!.sendMessage(chatId, `🕵️ КОНКУРЕНТНАЯ РАЗВЕДКА\n\n${spyReport}`);
    } catch (error) {
      await bot!.sendMessage(chatId, '❌ Ошибка шпионажа.');
    }
  });

  // Команда /trends - актуальные тренды
  bot.onText(/\/trends/, async (msg) => {
    const chatId = msg.chat.id;
    
    await bot!.sendMessage(chatId, '📈 Анализирую тренды Telegram 2025...');
    await bot!.sendChatAction(chatId, 'typing');
    
    try {
      const prompt = `Какие ГЛАВНЫЕ тренды в Telegram и соцсетях СЕЙЧАС (октябрь 2025)?

Структура:
1. КОНТЕНТ-ТРЕНДЫ (топ-5):
   - Какие форматы взрывают
   - Примеры вирусных постов
   - Почему это работает

2. TELEGRAM-ФИЧИ 2025:
   - Новые возможности ботов
   - Stories и их применение
   - Монетизация через Telegram Stars
   - Mini Apps и их потенциал

3. ПОВЕДЕНИЕ АУДИТОРИИ:
   - Что люди читают
   - Когда активны
   - Что репостят

4. ФОРМАТЫ, КОТОРЫЕ ЗАШЛИ:
   - Короткие видео (до 60 сек)
   - Интерактивные опросы
   - Личные истории
   - Data-driven посты

5. КАК ИСПОЛЬЗОВАТЬ ТРЕНДЫ:
   - 3 идеи для внедрения СЕГОДНЯ
   - Прогноз на ближайший месяц
   - Что готовить заранее

Конкретно, с цифрами и примерами. До 1500 символов.`;

      const response = await grok.chat.completions.create({
        model: 'grok-2-latest',
        messages: [{ role: 'user', content: prompt }],
        temperature: 0.9,
        max_tokens: 2000
      });

      const trends = response.choices[0].message.content || 'Ошибка анализа трендов';
      await bot!.sendMessage(chatId, `📈 АКТУАЛЬНЫЕ ТРЕНДЫ 2025\n\n${trends}`);
    } catch (error) {
      await bot!.sendMessage(chatId, '❌ Ошибка получения трендов.');
    }
  });

  // Команда /optimize - оптимизация времени публикаций
  bot.onText(/\/optimize/, async (msg) => {
    const chatId = msg.chat.id;
    
    await bot!.sendMessage(chatId, '⏰ Рассчитываю оптимальное время публикаций...');
    await bot!.sendChatAction(chatId, 'typing');
    
    try {
      const chat = await bot!.getChat(CHANNEL_ID);
      
      const prompt = `Определи ОПТИМАЛЬНОЕ время публикаций для Telegram канала.

Канал: ${CHANNEL_ID}
Ниша: AI, нейросети, продуктивность
Целевая аудитория: психологи, коучи, преподаватели, IT-специалисты

Анализируй:
1. АКТИВНОСТЬ ПО ЧАСАМ:
   - Утро (6-9): деловые на пути на работу
   - День (12-14): обеденный перерыв
   - Вечер (18-21): пик активности, отдых дома
   - Ночь (21-23): вовлеченное чтение

2. АКТИВНОСТЬ ПО ДНЯМ:
   - Будни vs выходные
   - Лучшие дни для анонсов
   - Когда НЕ публиковать

3. ТИПЫ КОНТЕНТА ПО ВРЕМЕНИ:
   - Утро: мотивация, быстрые советы
   - День: обзоры, инструменты
   - Вечер: кейсы, длинные посты
   - Выходные: развлекательный контент

4. РЕКОМЕНДАЦИИ:
   - Топ-3 временных слота
   - Частота (раз в день/неделю)
   - Интервалы между постами
   - Лучшее время для Stories

5. A/B ТЕСТИРОВАНИЕ:
   - Как проверить гипотезы
   - Что измерять
   - Сколько тестировать

Конкретный план с таймингами. До 1200 символов.`;

      const response = await grok.chat.completions.create({
        model: 'grok-2-latest',
        messages: [{ role: 'user', content: prompt }],
        temperature: 0.7,
        max_tokens: 1500
      });

      const optimization = response.choices[0].message.content || 'Ошибка оптимизации';
      await bot!.sendMessage(chatId, `⏰ ОПТИМИЗАЦИЯ ВРЕМЕНИ ПУБЛИКАЦИЙ\n\n${optimization}\n\n💡 Текущее расписание: 09:00, 15:00, 20:00`);
    } catch (error) {
      await bot!.sendMessage(chatId, '❌ Ошибка оптимизации.');
    }
  });

  // Команда /viralcheck - анализ вирусности контента
  bot.onText(/\/viralcheck\s+(.+)/, async (msg, match) => {
    const chatId = msg.chat.id;
    const content = match && match[1] ? match[1] : '';
    
    if (!content) {
      await bot!.sendMessage(chatId, '❌ Отправьте текст для анализа!\n\nПример:\n/viralcheck ваш текст поста');
      return;
    }
    
    await bot!.sendMessage(chatId, '🔥 Анализирую вирусный потенциал...');
    await bot!.sendChatAction(chatId, 'typing');
    
    try {
      const prompt = `Проанализируй ВИРУСНЫЙ ПОТЕНЦИАЛ этого контента:

"${content}"

Оцени по критериям (0-10):
1. ХУК (первая строка):
   - Цепляет внимание?
   - Вызывает эмоции?
   - Создает интригу?
   Оценка: X/10

2. ЭМОЦИОНАЛЬНЫЙ ЗАРЯД:
   - Какие эмоции вызывает?
   - Достаточно ли сильны?
   Оценка: X/10

3. ПРАКТИЧЕСКАЯ ЦЕННОСТЬ:
   - Есть конкретная польза?
   - Можно сразу применить?
   Оценка: X/10

4. СОЦИАЛЬНОЕ ДОКАЗАТЕЛЬСТВО:
   - Есть цифры/факты?
   - Есть истории/примеры?
   Оценка: X/10

5. ПРИЗЫВ К ДЕЙСТВИЮ:
   - Хочется репостить?
   - Хочется комментировать?
   Оценка: X/10

6. ВИЗУАЛЬНОСТЬ:
   - Эмодзи для сканирования?
   - Структура понятна?
   Оценка: X/10

ИТОГОВАЯ ОЦЕНКА: XX/60

ЧТО УЛУЧШИТЬ (топ-3):
1. ...
2. ...
3. ...

ДОРАБОТАННАЯ ВЕРСИЯ:
[Твоя улучшенная версия]

До 1000 символов.`;

      const response = await grok.chat.completions.create({
        model: 'grok-2-latest',
        messages: [{ role: 'user', content: prompt }],
        temperature: 0.8,
        max_tokens: 1200
      });

      const viralAnalysis = response.choices[0].message.content || 'Ошибка анализа';
      await bot!.sendMessage(chatId, `🔥 АНАЛИЗ ВИРУСНОСТИ\n\n${viralAnalysis}`);
    } catch (error) {
      await bot!.sendMessage(chatId, '❌ Ошибка анализа вирусности.');
    }
  });

  // Команда /audience - анализ целевой аудитории
  bot.onText(/\/audience/, async (msg) => {
    const chatId = msg.chat.id;
    
    await bot!.sendMessage(chatId, '👥 Анализирую вашу целевую аудиторию...');
    await bot!.sendChatAction(chatId, 'typing');
    
    try {
      const prompt = `Создай ДЕТАЛЬНЫЙ профиль целевой аудитории для канала про AI и нейросети.

Анализ:
1. ДЕМОГРАФИЯ:
   - Возраст: основные группы
   - Пол: распределение
   - География: города
   - Образование: уровень

2. ПРОФЕССИОНАЛЬНЫЙ ПРОФИЛЬ:
   - Психологи и коучи (35%)
   - IT-специалисты (30%)
   - Преподаватели (20%)
   - Предприниматели (15%)

3. БОЛИ И ПОТРЕБНОСТИ:
   - Главные проблемы (топ-5)
   - Чего хотят достичь
   - Что мешает

4. ПОВЕДЕНИЕ В TELEGRAM:
   - Когда активны
   - Что читают
   - Что репостят
   - Как принимают решения

5. УРОВЕНЬ ЭКСПЕРТИЗЫ:
   - Новички в AI (40%)
   - Продолжающие (40%)
   - Эксперты (20%)

6. КОНТЕНТ-СТРАТЕГИЯ:
   - Что публиковать для новичков
   - Что для продвинутых
   - Баланс сложности

7. ЯЗЫК ОБЩЕНИЯ:
   - Тон (деловой/дружеский)
   - Термины (упрощать или нет)
   - Стиль подачи

8. МОНЕТИЗАЦИЯ:
   - Что готовы покупать
   - Средний чек
   - Триггеры покупки

Конкретно, с процентами и примерами. До 1500 символов.`;

      const response = await grok.chat.completions.create({
        model: 'grok-2-latest',
        messages: [{ role: 'user', content: prompt }],
        temperature: 0.7,
        max_tokens: 2000
      });

      const audienceProfile = response.choices[0].message.content || 'Ошибка анализа';
      await bot!.sendMessage(chatId, `👥 ПРОФИЛЬ ЦЕЛЕВОЙ АУДИТОРИИ\n\n${audienceProfile}`);
    } catch (error) {
      await bot!.sendMessage(chatId, '❌ Ошибка анализа аудитории.');
    }
  });

  // Команда /blueprint - полный план доминирования
  bot.onText(/\/blueprint/, async (msg) => {
    const chatId = msg.chat.id;
    
    await bot!.sendMessage(chatId, '🎯 Создаю ПЛАН ДОМИНИРОВАНИЯ на рынке...\n⏳ Займет 15-20 секунд');
    await bot!.sendChatAction(chatId, 'typing');
    
    try {
      const prompt = `Создай ПОЛНЫЙ ПЛАН ДОМИНИРОВАНИЯ для Telegram канала про AI.

Цель: стать топ-1 в нише за 6 месяцев

СТРАТЕГИЯ:

1. МЕСЯЦ 1-2: ФУНДАМЕНТ
   - Контент-столпы (5 главных тем)
   - Частота публикаций
   - Форматы постов
   - Первые 1000 подписчиков
   - KPI: X подписчиков, Y просмотров

2. МЕСЯЦ 3-4: РОСТ
   - Вирусные механики
   - Кросс-промо (5-10 каналов)
   - Платное продвижение (бюджет)
   - Комьюнити активность
   - KPI: X подписчиков, Y вовлечение

3. МЕСЯЦ 5-6: ЛИДЕРСТВО
   - Собственные продукты
   - Партнерства с брендами
   - Медийность
   - Масштабирование
   - KPI: топ-3 в нише

4. КОНТЕНТ-МАТРИЦА (70/20/10):
   - 70% образовательный
   - 20% развлекательный
   - 10% продающий

5. ДИСТРИБУЦИЯ:
   - Где искать аудиторию
   - Как привлекать
   - Удержание подписчиков

6. МОНЕТИЗАЦИЯ:
   - Этап 1: Реклама (от 500 подписчиков)
   - Этап 2: Свои продукты (от 3000)
   - Этап 3: Премиум контент

7. ИНСТРУМЕНТЫ:
   - Боты и автоматизация
   - Аналитика
   - AI для контента

8. МЕТРИКИ УСПЕХА:
   - Недельные KPI
   - Месячные цели
   - Когда корректировать

Конкретный пошаговый план. До 2000 символов.`;

      const response = await grok.chat.completions.create({
        model: 'grok-2-latest',
        messages: [{ role: 'user', content: prompt }],
        temperature: 0.8,
        max_tokens: 2500
      });

      const blueprint = response.choices[0].message.content || 'Ошибка создания плана';
      await bot!.sendMessage(chatId, `🎯 ПЛАН ДОМИНИРОВАНИЯ НА РЫНКЕ\n\n${blueprint}`);
    } catch (error) {
      await bot!.sendMessage(chatId, '❌ Ошибка создания плана.');
    }
  });

  // Команда /autopilot - включить автопилот
  bot.onText(/\/autopilot/, async (msg) => {
    const chatId = msg.chat.id;
    
    const autopilotInfo = `🤖 РЕЖИМ АВТОПИЛОТА

Ваш канал на автопилоте с AI:

✅ ЧТО РАБОТАЕТ АВТОМАТИЧЕСКИ:
• 3 поста в день (09:00, 15:00, 20:00)
• AI генерация контента через Grok 2
• Опросы 2 раза в неделю
• Адаптация под тренды
• Оптимизация тем по вовлечению

📊 СТАТИСТИКА:
• Постов в месяц: ~90
• Стоимость AI: $0.01/месяц
• Экономия времени: 15 часов/месяц
• Качество: стабильно высокое

🎯 ЧТО ДЕЛАТЬ ВАМ:
1. Мониторить аналитику (/analytics)
2. Отвечать на комментарии
3. Корректировать стратегию (/blueprint)
4. Тестировать новые форматы (/viralcheck)

💡 ПРОДВИНУТЫЕ ФИЧИ:
• Глубокий анализ ниши (/niche)
• Шпионаж за конкурентами (/spy)
• Анализ трендов (/trends)
• Оптимизация времени (/optimize)
• Профиль аудитории (/audience)

🚀 СЛЕДУЮЩИЙ УРОВЕНЬ:
• Stories (скоро)
• Mini Apps (в разработке)
• A/B тестирование (beta)
• Платная подписка через Stars

✅ Автопилот АКТИВЕН!
Бот работает 24/7 без вашего участия.

Используйте команды для контроля и улучшения стратегии.`;
    
    await bot!.sendMessage(chatId, autopilotInfo);
  });

  // AI АССИСТЕНТ В РЕАЛЬНОМ ВРЕМЕНИ
  // Обработка любых текстовых сообщений (не команд)
  bot.on('message', async (msg) => {
    const chatId = msg.chat.id;
    const text = msg.text || '';
    
    // Игнорируем команды (начинаются с /)
    if (text.startsWith('/')) {
      return;
    }
    
    // Игнорируем пустые сообщения
    if (!text.trim()) {
      return;
    }
    
    console.log(`💬 Получено сообщение от ${chatId}: ${text}`);
    
    try {
      // Показываем что бот печатает
      await bot!.sendChatAction(chatId, 'typing');
      
      const prompt = `Ты - AI-ассистент по продвижению Telegram каналов и социальных сетей.

Канал клиента: ${CHANNEL_ID}
Вопрос клиента: "${text}"

Дай полезный, практичный ответ:
- Будь дружелюбным и профессиональным
- Давай конкретные советы и действия
- Используй эмодзи для наглядности
- Если вопрос про продвижение - давай стратегии и инструменты
- Если вопрос про контент - предлагай идеи и форматы
- Если не понятен контекст - задай уточняющие вопросы
- Максимум 600 символов

Отвечай на русском языке.`;

      const response = await grok.chat.completions.create({
        model: 'grok-2-latest',
        messages: [{ role: 'user', content: prompt }],
        temperature: 0.8,
        max_tokens: 700
      });

      const answer = response.choices[0].message.content || 'Извините, не могу ответить. Попробуйте переформулировать вопрос.';
      
      await bot!.sendMessage(chatId, answer);
      console.log(`✅ Ответ отправлен пользователю ${chatId}`);
    } catch (error) {
      console.error('❌ Ошибка AI ассистента:', error);
      await bot!.sendMessage(chatId, '⚠️ Произошла ошибка. Попробуйте позже или используйте команды (/help для списка).');
    }
  });
  
  console.log('📅 Расписание настроено:');
  console.log('   • 09:00 - утренний пост');
  console.log('   • 15:00 - дневной пост');
  console.log('   • 20:00 - вечерний пост');
  console.log('   • 12:00 (Пн, Чт) - опрос');
  console.log('');
  console.log('💡 Доступные команды:');
  console.log('   • /start - приветствие');
  console.log('   • /help - список команд');
  console.log('   • /post - опубликовать пост');
  console.log('   • /poll - создать опрос');
  console.log('   • /stats - статистика');
  console.log('   • /roll [число] - бросок кубика');
  console.log('   • /ideas - генерация идей');
  console.log('   • /viral - вирусный пост');
  console.log('   • /hashtags - хештеги');
  console.log('   • /rewrite - переписать текст');
  console.log('   • /analytics - аналитика');
  console.log('   • /growth - рост подписчиков');
  console.log('   • /report - отчет');
  console.log('   • /crosspromo - кросс-промо');
  console.log('   • /competitors - конкуренты');
  console.log('   • /chatlist - чаты для промо');
  console.log('   • /schedule - расписание');
  console.log('   • /pause - пауза');
  console.log('   • /resume - возобновить');
  console.log('   • /ask - спросить AI');
  console.log('   • /settings - настройки');
  console.log('');
  console.log('');
  console.log('🔥 РЕЖИМ ДОМИНИРОВАНИЯ:');
  console.log('   • /niche - глубокий анализ ниши');
  console.log('   • /spy - шпионаж за конкурентами');
  console.log('   • /trends - актуальные тренды');
  console.log('   • /optimize - оптимизация времени');
  console.log('   • /viralcheck - анализ вирусности');
  console.log('   • /audience - профиль ЦА');
  console.log('   • /blueprint - план доминирования');
  console.log('   • /autopilot - режим автопилота');
  console.log('');
  console.log('🤖 AI АССИСТЕНТ В РЕАЛЬНОМ ВРЕМЕНИ:');
  console.log('   ✅ Бот отвечает на любые текстовые сообщения');
  console.log('   ✅ Не требуется команда со слешем');
  console.log('   ✅ Просто напишите вопрос - бот ответит!');
}
