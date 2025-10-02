import TelegramBot from 'node-telegram-bot-api';
import cron from 'node-cron';
import OpenAI from 'openai';

const TELEGRAM_TOKEN = process.env.BOTTG || '';
const CHANNEL_ID = '@IIPRB';

// Инициализация AI
const grok = new OpenAI({
  apiKey: process.env.XAI_API_KEY || '',
  baseURL: 'https://api.x.ai/v1'
});

// Создаем бота
const bot = new TelegramBot(TELEGRAM_TOKEN, { polling: true });

// Темы для постов
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

// Генерация поста с помощью AI
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

// Публикация поста
async function publishPost() {
  try {
    const randomTopic = contentTopics[Math.floor(Math.random() * contentTopics.length)];
    const postText = await generatePost(randomTopic);
    
    await bot.sendMessage(CHANNEL_ID, postText);
    console.log(`✅ Пост опубликован: ${new Date().toLocaleString()}`);
    console.log(`📝 Тема: ${randomTopic}`);
  } catch (error) {
    console.error('❌ Ошибка публикации:', error);
  }
}

// Публикация опроса
async function publishPoll() {
  try {
    const question = 'Какой AI инструмент вы используете чаще всего?';
    const options = ['ChatGPT', 'Claude', 'Midjourney', 'Другой'];
    
    await bot.sendPoll(CHANNEL_ID, question, options, {
      is_anonymous: false,
      allows_multiple_answers: false
    });
    
    console.log(`✅ Опрос опубликован: ${new Date().toLocaleString()}`);
  } catch (error) {
    console.error('❌ Ошибка публикации опроса:', error);
  }
}

// Расписание публикаций
export function startTelegramBot() {
  console.log('🤖 Telegram бот запущен!');
  console.log(`📢 Канал: ${CHANNEL_ID}`);
  console.log('');
  
  // Публикация постов 3 раза в день: 9:00, 15:00, 20:00 (Moscow time)
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
  
  // Опрос каждый понедельник и четверг в 12:00
  cron.schedule('0 12 * * 1,4', () => {
    console.log('⏰ Публикация опроса');
    publishPoll();
  });
  
  // Приветствие новых подписчиков
  bot.on('message', async (msg) => {
    if (msg.new_chat_members) {
      const chatId = msg.chat.id;
      await bot.sendMessage(
        chatId,
        '👋 Добро пожаловать! Здесь вы найдете лучшие инсайты про AI и нейросети для вашей работы!'
      );
    }
  });
  
  // Команды бота
  bot.onText(/\/post/, async (msg) => {
    const chatId = msg.chat.id;
    await bot.sendMessage(chatId, '📝 Генерирую пост...');
    await publishPost();
  });
  
  bot.onText(/\/poll/, async (msg) => {
    const chatId = msg.chat.id;
    await bot.sendMessage(chatId, '📊 Создаю опрос...');
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
    await bot.sendMessage(chatId, stats);
  });
  
  console.log('📅 Расписание настроено:');
  console.log('   • 09:00 - утренний пост');
  console.log('   • 15:00 - дневной пост');
  console.log('   • 20:00 - вечерний пост');
  console.log('   • 12:00 (Пн, Чт) - опрос');
  console.log('');
  console.log('💡 Доступные команды:');
  console.log('   • /post - опубликовать пост сейчас');
  console.log('   • /poll - создать опрос');
  console.log('   • /stats - показать статистику');
}

// Тестовая публикация при запуске (опционально)
export async function testPost() {
  console.log('🧪 Тестовая публикация...');
  await publishPost();
}
