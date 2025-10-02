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

// База данных пользователей (в production использовать DB)
const userDatabase = new Map<number, {
  username?: string;
  firstName?: string;
  joinDate: Date;
  referrals: number;
  points: number;
  isActive: boolean;
}>();

// Реферальная система
const referralLinks = new Map<number, string>();
const referralRewards = new Map<number, number>();

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
    const polls = [
      {
        question: '🎯 Какой AI инструмент вы используете чаще всего?',
        options: ['ChatGPT', 'Claude', 'Midjourney', 'Gemini'],
        prize: 'Бесплатный гайд по AI инструментам'
      },
      {
        question: '💼 В какой сфере вы работаете?',
        options: ['Психология', 'Образование', 'Бизнес', 'IT'],
        prize: 'Персональная консультация'
      },
      {
        question: '🚀 Какую задачу AI помогает вам решить чаще?',
        options: ['Контент', 'Анализ', 'Автоматизация', 'Обучение'],
        prize: 'Доступ к премиум шаблонам'
      }
    ];
    
    const poll = polls[Math.floor(Math.random() * polls.length)];
    
    await bot.sendPoll(CHANNEL_ID, poll.question, poll.options, {
      is_anonymous: false,
      allows_multiple_answers: false
    });
    
    // Отправляем сообщение о призе
    await bot.sendMessage(CHANNEL_ID, 
      `🎁 Участвуй в опросе и получи: ${poll.prize}!\n\n` +
      `Случайный участник будет выбран через 24 часа.`
    );
    
    console.log(`✅ Опрос с призом опубликован: ${new Date().toLocaleString()}`);
  } catch (error) {
    console.error('❌ Ошибка публикации опроса:', error);
  }
}

// Публикация конкурса для вовлечения
async function publishContest() {
  if (!bot) return;
  
  try {
    const contests = [
      {
        title: '🏆 КОНКУРС: Лучший кейс с AI',
        description: 'Поделись своей историей использования AI в работе!',
        prize: '3 победителя получат месяц доступа к премиум AI инструментам',
        rules: [
          '1️⃣ Подпишись на канал',
          '2️⃣ Напиши свой кейс в комментариях',
          '3️⃣ Пригласи 3 друзей в канал'
        ]
      },
      {
        title: '🎯 РОЗЫГРЫШ: AI Консультация',
        description: 'Выиграй персональную консультацию по внедрению AI!',
        prize: '1 час консультации с экспертом',
        rules: [
          '1️⃣ Будь подписчиком канала',
          '2️⃣ Поставь реакцию на этот пост',
          '3️⃣ Напиши в комментариях, какая задача требует AI'
        ]
      }
    ];
    
    const contest = contests[Math.floor(Math.random() * contests.length)];
    
    const message = `
${contest.title}

${contest.description}

🎁 Приз: ${contest.prize}

📋 Условия участия:
${contest.rules.join('\n')}

⏰ Итоги через 7 дней!

#конкурс #AI #розыгрыш
    `;
    
    await bot.sendMessage(CHANNEL_ID, message);
    console.log(`✅ Конкурс опубликован: ${new Date().toLocaleString()}`);
  } catch (error) {
    console.error('❌ Ошибка публикации конкурса:', error);
  }
}

// Интерактивный квиз
async function publishQuiz() {
  if (!bot) return;
  
  try {
    const quizzes = [
      {
        question: '🧠 Какая нейросеть создала картину "Портрет Эдмонда де Белами", проданную за $432,500?',
        options: ['DALL-E', 'Midjourney', 'GAN (Generative Adversarial Network)', 'Stable Diffusion'],
        correctOption: 2,
        explanation: 'GAN была первой нейросетью, чья работа была продана на аукционе Christie\'s в 2018 году!'
      },
      {
        question: '💡 Сколько параметров у GPT-4?',
        options: ['175 миллиардов', '1 триллион', 'Точно неизвестно', '500 миллиардов'],
        correctOption: 2,
        explanation: 'OpenAI не раскрывает точное количество параметров GPT-4 по соображениям безопасности.'
      }
    ];
    
    const quiz = quizzes[Math.floor(Math.random() * quizzes.length)];
    
    await bot.sendPoll(CHANNEL_ID, quiz.question, quiz.options, {
      is_anonymous: false,
      type: 'quiz',
      correct_option_id: quiz.correctOption,
      explanation: quiz.explanation
    });
    
    console.log(`✅ Квиз опубликован: ${new Date().toLocaleString()}`);
  } catch (error) {
    console.error('❌ Ошибка публикации квиза:', error);
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
  
  // Конкурсы каждый понедельник в 10:00
  cron.schedule('0 10 * * 1', () => {
    console.log('⏰ Запуск конкурса');
    publishContest();
  });
  
  // Квизы каждую среду и пятницу в 16:00
  cron.schedule('0 16 * * 3,5', () => {
    console.log('⏰ Публикация квиза');
    publishQuiz();
  });
  
  // Напоминание об активности каждый вечер в 21:00
  cron.schedule('0 21 * * *', async () => {
    console.log('⏰ Напоминание о ежедневном бонусе');
    try {
      await bot!.sendMessage(CHANNEL_ID, 
        '🎁 Напоминание!\n\n' +
        'Не забудь получить ежедневный бонус - напиши /daily в личку боту!\n\n' +
        '💰 Каждый день - новые баллы и возможности!'
      );
    } catch (error) {
      console.error('Ошибка отправки напоминания:', error);
    }
  });
  
  // Приветствие новых участников с бонусами
  bot.on('message', async (msg) => {
    const chatId = msg.chat.id;
    const userId = msg.from?.id;
    
    if (msg.new_chat_members) {
      const newMembers = msg.new_chat_members;
      
      for (const member of newMembers) {
        if (!member.is_bot) {
          // Сохраняем пользователя
          if (userId) {
            userDatabase.set(userId, {
              username: msg.from?.username,
              firstName: msg.from?.first_name,
              joinDate: new Date(),
              referrals: 0,
              points: 10, // Приветственные баллы
              isActive: true
            });
          }
          
          const welcomeMessage = `
🎉 Добро пожаловать, ${member.first_name}!

🎁 Ты получил 10 баллов за подписку!

📚 Что тебя ждет в канале:
✅ Ежедневные AI инсайты
✅ Практические кейсы
✅ Эксклюзивные гайды
✅ Конкурсы и розыгрыши

💎 Как получить больше баллов:
• 20 баллов - пригласи друга
• 30 баллов - активность в комментариях
• 50 баллов - участие в конкурсах

🏆 Обменяй баллы на:
• Бесплатные консультации
• Доступ к премиум контенту
• Персональные AI шаблоны

Набери /help для списка команд!
          `;
          
          await bot!.sendMessage(chatId, welcomeMessage);
        }
      }
    }
    
    // Реферальная система
    if (msg.text?.startsWith('/ref_')) {
      const referrerId = parseInt(msg.text.split('_')[1]);
      
      if (referrerId && userId && referrerId !== userId) {
        const referrer = userDatabase.get(referrerId);
        
        if (referrer) {
          // Награждаем реферера
          referrer.referrals += 1;
          referrer.points += 20;
          
          // Награждаем нового пользователя
          const newUser = userDatabase.get(userId);
          if (newUser) {
            newUser.points += 10;
          }
          
          await bot!.sendMessage(chatId, 
            `🎉 Вы присоединились по реферальной ссылке!\n\n` +
            `Вы получили +10 баллов, а ваш друг +20 баллов!`
          );
          
          // Уведомляем реферера
          try {
            await bot!.sendMessage(referrerId, 
              `🎊 Ваш друг присоединился к каналу!\n\n` +
              `Вы получили +20 баллов! Всего рефералов: ${referrer.referrals}`
            );
          } catch (e) {
            console.log('Не удалось уведомить реферера');
          }
        }
      }
    }
  });
  
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
    const userId = msg.from?.id;
    const maxNumber = match && match[1] ? parseInt(match[1]) : 6;
    
    if (maxNumber < 2 || maxNumber > 1000) {
      await bot!.sendMessage(chatId, '❌ Укажите число от 2 до 1000!\nПример: /roll 100');
      return;
    }
    
    const result = Math.floor(Math.random() * maxNumber) + 1;
    
    // Бонусные баллы за удачу
    if (userId && result === maxNumber) {
      const user = userDatabase.get(userId);
      if (user) {
        user.points += 5;
        await bot!.sendMessage(chatId, 
          `🎲 Бросок кубика (1-${maxNumber}):\n\n` +
          `🎯 Выпало: ${result}\n\n` +
          `🎊 ДЖЕКПОТ! +5 баллов за максимальное значение!`
        );
        return;
      }
    }
    
    await bot!.sendMessage(chatId, `🎲 Бросок кубика (1-${maxNumber}):\n\n🎯 Выпало: ${result}`);
  });
  
  // Команда для получения баллов
  bot.onText(/\/balance/, async (msg) => {
    const chatId = msg.chat.id;
    const userId = msg.from?.id;
    
    if (!userId) return;
    
    const user = userDatabase.get(userId);
    
    if (!user) {
      await bot!.sendMessage(chatId, 
        '❌ Вы еще не зарегистрированы в системе баллов.\n\n' +
        'Присоединитесь к каналу, чтобы начать зарабатывать баллы!'
      );
      return;
    }
    
    const message = `
💰 Ваш баланс баллов

👤 Пользователь: ${user.firstName || user.username || 'Участник'}
💎 Баллы: ${user.points}
👥 Рефералов: ${user.referrals}
📅 В канале с: ${user.joinDate.toLocaleDateString()}

🏆 Что можно купить:
• 100 баллов - Гайд по AI инструментам
• 200 баллов - 30 мин консультации
• 500 баллов - Доступ к премиум контенту (месяц)
• 1000 баллов - Личный AI-ассистент на неделю

💡 Как заработать больше:
/referral - получить реферальную ссылку
/daily - ежедневный бонус
    `;
    
    await bot!.sendMessage(chatId, message);
  });
  
  // Реферальная ссылка
  bot.onText(/\/referral/, async (msg) => {
    const chatId = msg.chat.id;
    const userId = msg.from?.id;
    
    if (!userId) return;
    
    const user = userDatabase.get(userId);
    if (!user) {
      await bot!.sendMessage(chatId, 'Сначала присоединитесь к каналу!');
      return;
    }
    
    const referralLink = `https://t.me/${CHANNEL_ID.replace('@', '')}?start=ref_${userId}`;
    
    const message = `
🔗 Ваша реферальная ссылка:

${referralLink}

💰 За каждого друга вы получаете:
• 20 баллов за подписку
• 5 баллов за его активность
• Бонусы за цепочку рефералов

👥 Приглашено: ${user.referrals} друзей
💎 Заработано: ${user.referrals * 20} баллов

Поделись ссылкой с друзьями и зарабатывай больше!
    `;
    
    await bot!.sendMessage(chatId, message);
  });
  
  // Ежедневный бонус
  bot.onText(/\/daily/, async (msg) => {
    const chatId = msg.chat.id;
    const userId = msg.from?.id;
    
    if (!userId) return;
    
    const user = userDatabase.get(userId);
    if (!user) {
      await bot!.sendMessage(chatId, 'Сначала присоединитесь к каналу!');
      return;
    }
    
    // Проверяем, получал ли пользователь бонус сегодня
    const today = new Date().toDateString();
    const lastDaily = (user as any).lastDaily;
    
    if (lastDaily === today) {
      await bot!.sendMessage(chatId, 
        '⏰ Вы уже получили ежедневный бонус сегодня!\n\n' +
        'Возвращайтесь завтра за новыми баллами!'
      );
      return;
    }
    
    // Начисляем бонус
    const bonus = Math.floor(Math.random() * 10) + 5; // 5-15 баллов
    user.points += bonus;
    (user as any).lastDaily = today;
    
    await bot!.sendMessage(chatId, 
      `🎁 Ежедневный бонус получен!\n\n` +
      `+${bonus} баллов\n` +
      `💰 Всего: ${user.points} баллов\n\n` +
      `Возвращайтесь завтра за новыми бонусами!`
    );
  });
  
  // Топ участников
  bot.onText(/\/top/, async (msg) => {
    const chatId = msg.chat.id;
    
    const topUsers = Array.from(userDatabase.entries())
      .sort((a, b) => b[1].points - a[1].points)
      .slice(0, 10);
    
    if (topUsers.length === 0) {
      await bot!.sendMessage(chatId, 'Пока нет участников в рейтинге.');
      return;
    }
    
    let message = '🏆 ТОП-10 УЧАСТНИКОВ\n\n';
    
    topUsers.forEach(([userId, user], index) => {
      const medal = index === 0 ? '🥇' : index === 1 ? '🥈' : index === 2 ? '🥉' : `${index + 1}.`;
      message += `${medal} ${user.firstName || user.username || 'Участник'} - ${user.points} 💎\n`;
    });
    
    message += '\n💡 Набирай баллы и попади в топ!';
    
    await bot!.sendMessage(chatId, message);
  });
  
  // Расширенная помощь
  bot.onText(/\/help/, async (msg) => {
    const chatId = msg.chat.id;
    
    const helpMessage = `
📚 ДОСТУПНЫЕ КОМАНДЫ

🎯 Основные:
/balance - проверить баланс баллов
/referral - получить реферальную ссылку
/daily - ежедневный бонус
/top - топ участников

🎲 Развлечения:
/roll [число] - бросить кубик
/post - опубликовать пост сейчас
/poll - создать опрос
/stats - статистика бота

💡 Система баллов:
• Подписка: +10 баллов
• Реферал: +20 баллов
• Ежедневный бонус: 5-15 баллов
• Участие в конкурсах: до 100 баллов
• Активность: +5 баллов

🏆 Обмен баллов:
• 100 💎 - Гайд по AI
• 200 💎 - Консультация 30 мин
• 500 💎 - Премиум доступ (месяц)
• 1000 💎 - AI-ассистент (неделя)

📢 Канал: ${CHANNEL_ID}
    `;
    
    await bot!.sendMessage(chatId, helpMessage);
  });
  
  console.log('📅 Расписание настроено:');
  console.log('   • 09:00 (ежедневно) - утренний пост');
  console.log('   • 15:00 (ежедневно) - дневной пост');
  console.log('   • 20:00 (ежедневно) - вечерний пост');
  console.log('   • 10:00 (понедельник) - конкурс');
  console.log('   • 12:00 (Пн, Чт) - опрос с призом');
  console.log('   • 16:00 (Ср, Пт) - квиз');
  console.log('   • 21:00 (ежедневно) - напоминание о бонусе');
  console.log('');
  console.log('💡 Команды для пользователей:');
  console.log('   • /balance - баланс баллов');
  console.log('   • /referral - реферальная ссылка');
  console.log('   • /daily - ежедневный бонус');
  console.log('   • /top - топ участников');
  console.log('   • /help - все команды');
  console.log('');
  console.log('🎮 Команды администратора:');
  console.log('   • /post - опубликовать пост сейчас');
  console.log('   • /poll - создать опрос');
  console.log('   • /stats - статистика бота');
  console.log('   • /roll [число] - бросок кубика');
}
