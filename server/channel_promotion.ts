import OpenAI from "openai";

const channelInfo = {
  name: "NEUROПРОВОДНИК",
  handle: "@IIPRB",
  subscribers: 193,
  niche: "AI/нейросети, образование, саморазвитие",
  target: "IT-специалисты, психологи, коучи, преподаватели 25-45 лет",
  strengths: "Уникальный подход, качественный контент",
  weaknesses: "Малая аудитория, низкая видимость"
};

async function generatePromotionStrategy() {
  const apiKey = process.env.XAI_API_KEY;
  if (!apiKey) {
    console.error("XAI_API_KEY не найден");
    process.exit(1);
  }

  const grok = new OpenAI({
    apiKey,
    baseURL: 'https://api.x.ai/v1'
  });

  console.log("🚀 ЗАПУСК КОМПЛЕКСНОГО ПРОДВИЖЕНИЯ КАНАЛА...\n");
  console.log("=" .repeat(60));

  // 1. КОНТЕНТ-ПЛАН НА МЕСЯЦ
  console.log("\n📅 ГЕНЕРАЦИЯ КОНТЕНТ-ПЛАНА НА МЕСЯЦ...\n");
  
  const contentPlanPrompt = `Создай детальный контент-план на месяц для Telegram канала "${channelInfo.name}".

Ниша: ${channelInfo.niche}
Аудитория: ${channelInfo.target}
Текущие подписчики: ${channelInfo.subscribers}

Создай план с 12-16 постами (3-4 в неделю) в формате JSON:

{
  "month": "ноябрь 2025",
  "goal": "цель на месяц",
  "posts": [
    {
      "day": "понедельник, 4 ноября",
      "time": "12:00",
      "type": "образовательный/кейс/опрос/практика",
      "topic": "тема поста",
      "hook": "цепляющий заголовок",
      "description": "краткое описание контента"
    }
  ]
}

Ответь ТОЛЬКО JSON.`;

  const contentPlanResponse = await grok.chat.completions.create({
    model: "grok-2-latest",
    messages: [
      { role: "system", content: "Ты эксперт по контент-маркетингу в Telegram. Отвечай только JSON." },
      { role: "user", content: contentPlanPrompt }
    ],
    temperature: 0.8
  });

  const contentPlan = JSON.parse(contentPlanResponse.choices[0].message.content?.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim() || "{}");
  console.log(JSON.stringify(contentPlan, null, 2));

  // 2. ГОТОВЫЕ ПОСТЫ
  console.log("\n\n" + "=".repeat(60));
  console.log("\n✍️ ГЕНЕРАЦИЯ 10 ГОТОВЫХ ПОСТОВ...\n");

  const postsPrompt = `Создай 10 готовых постов для Telegram канала "${channelInfo.name}".

Ниша: ${channelInfo.niche}
Формат: Короткие (300-500 символов), цепляющие, с эмодзи и призывом к действию.

Темы постов:
1. Кейс применения ChatGPT в работе
2. 5 лучших нейросетей для творчества
3. Как ИИ помогает в саморазвитии
4. Ошибки новичков при работе с ИИ
5. Практика: создаем контент-план с ИИ
6. Будущее нейросетей в 2025
7. ИИ для коучей и психологов
8. Инструменты для автоматизации рутины
9. Опрос: какую нейросеть используете?
10. Истории успеха: как ИИ изменил мою жизнь

JSON формат:
{
  "posts": [
    {
      "number": 1,
      "topic": "тема",
      "text": "полный текст поста с эмодзи",
      "hashtags": ["хештег1", "хештег2"],
      "cta": "призыв к действию"
    }
  ]
}

Ответь ТОЛЬКО JSON.`;

  const postsResponse = await grok.chat.completions.create({
    model: "grok-2-latest",
    messages: [
      { role: "system", content: "Ты копирайтер для Telegram. Пиши живо, с эмодзи. Отвечай только JSON." },
      { role: "user", content: postsPrompt }
    ],
    temperature: 0.9
  });

  const posts = JSON.parse(postsResponse.choices[0].message.content?.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim() || "{}");
  console.log(JSON.stringify(posts, null, 2));

  // 3. СТРАТЕГИЯ ХЕШТЕГОВ
  console.log("\n\n" + "=".repeat(60));
  console.log("\n#️⃣ ОПТИМИЗАЦИЯ ХЕШТЕГОВ...\n");

  const hashtagsPrompt = `Создай стратегию хештегов для канала "${channelInfo.name}".

Ниша: ${channelInfo.niche}
Цель: Увеличить охват и видимость

JSON формат:
{
  "core_hashtags": ["основные хештеги для каждого поста"],
  "trending_hashtags": ["трендовые хештеги 2025"],
  "niche_hashtags": ["узкоспециализированные"],
  "growth_hashtags": ["для роста аудитории"],
  "strategy": "как использовать хештеги"
}

Ответь ТОЛЬКО JSON.`;

  const hashtagsResponse = await grok.chat.completions.create({
    model: "grok-2-latest",
    messages: [
      { role: "system", content: "Ты эксперт по хештегам в Telegram. Отвечай только JSON." },
      { role: "user", content: hashtagsPrompt }
    ],
    temperature: 0.7
  });

  const hashtags = JSON.parse(hashtagsResponse.choices[0].message.content?.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim() || "{}");
  console.log(JSON.stringify(hashtags, null, 2));

  // 4. СТРАТЕГИЯ ВОВЛЕЧЕНИЯ
  console.log("\n\n" + "=".repeat(60));
  console.log("\n💬 СТРАТЕГИЯ ВОВЛЕЧЕНИЯ АУДИТОРИИ...\n");

  const engagementPrompt = `Создай стратегию повышения вовлеченности для канала с ${channelInfo.subscribers} подписчиками.

JSON формат:
{
  "daily_actions": ["ежедневные действия"],
  "weekly_activities": ["еженедельные активности"],
  "engagement_tactics": ["тактики вовлечения"],
  "community_building": ["создание комьюнити"],
  "response_templates": ["шаблоны ответов на комментарии"]
}

Ответь ТОЛЬКО JSON.`;

  const engagementResponse = await grok.chat.completions.create({
    model: "grok-2-latest",
    messages: [
      { role: "system", content: "Ты эксперт по комьюнити-менеджменту. Отвечай только JSON." },
      { role: "user", content: engagementPrompt }
    ],
    temperature: 0.7
  });

  const engagement = JSON.parse(engagementResponse.choices[0].message.content?.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim() || "{}");
  console.log(JSON.stringify(engagement, null, 2));

  // 5. ВИРУСНАЯ СТРАТЕГИЯ
  console.log("\n\n" + "=".repeat(60));
  console.log("\n🔥 СТРАТЕГИЯ ВИРУСНОГО РОСТА...\n");

  const viralPrompt = `Создай стратегию вирусного роста для канала "${channelInfo.name}".

Цель: Рост с 193 до 1000 подписчиков за 3 месяца

JSON формат:
{
  "viral_content_ideas": ["идея 1 с потенциалом вирусности", "..."],
  "collaboration_strategy": ["план коллабораций с другими каналами"],
  "giveaway_ideas": ["идеи конкурсов и розыгрышей"],
  "cross_promotion": ["кросс-промо тактики"],
  "milestones": ["цели на каждый месяц"]
}

Ответь ТОЛЬКО JSON.`;

  const viralResponse = await grok.chat.completions.create({
    model: "grok-2-latest",
    messages: [
      { role: "system", content: "Ты эксперт по вирусному маркетингу. Отвечай только JSON." },
      { role: "user", content: viralPrompt }
    ],
    temperature: 0.8
  });

  const viral = JSON.parse(viralResponse.choices[0].message.content?.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim() || "{}");
  console.log(JSON.stringify(viral, null, 2));

  console.log("\n\n" + "=".repeat(60));
  console.log("\n✅ СТРАТЕГИЯ ПРОДВИЖЕНИЯ СОЗДАНА!\n");
}

generatePromotionStrategy().catch(err => {
  console.error('\n❌ Ошибка:', err.message);
  process.exit(1);
});
