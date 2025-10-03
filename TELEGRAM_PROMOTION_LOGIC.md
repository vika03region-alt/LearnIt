# 🤖 Telegram Bot - Логика продвижения

## 📊 Архитектура компонента

```
┌─────────────────────────────────────────────────────────┐
│              TELEGRAM BOT ECOSYSTEM                      │
│                  (@IIPRB Channel)                        │
└─────────────────────────────────────────────────────────┘
                          │
        ┌─────────────────┴──────────────────┐
        │                                    │
        ▼                                    ▼
┌──────────────────┐              ┌──────────────────┐
│  USER COMMANDS   │              │  AUTO SCHEDULER  │
│  (Interactive)   │              │  (Cron Jobs)     │
└──────────────────┘              └──────────────────┘
        │                                    │
        ├─ Rate Limiting (5/min)             ├─ 09:00 Post
        ├─ AI Assistant (Grok)               ├─ 15:00 Post
        ├─ Cache Layer (1h TTL)              ├─ 20:00 Post
        └─ User Stats Tracking               └─ 12:00 Mon/Thu Polls
                          │
                          ▼
              ┌───────────────────────┐
              │   DATABASE STORAGE    │
              │   (PostgreSQL)        │
              └───────────────────────┘
```

---

## 🔐 Безопасность и Rate Limiting

### 1. Защита от спама

```typescript
// Лимиты
COMMAND_RATE_LIMIT = 5 команд/минуту
AI_RATE_LIMIT = 3 AI запросов/минуту
RATE_LIMIT_WINDOW = 60000ms (1 минута)

// Логика проверки
function checkRateLimit(userId, type: 'command' | 'ai') {
  const timestamps = getTimestamps(userId, type);
  const recentTimestamps = timestamps.filter(
    t => now - t < 60000
  );
  
  if (recentTimestamps.length >= limit) {
    return false; // ❌ Лимит превышен
  }
  
  recentTimestamps.push(now);
  return true; // ✅ Разрешено
}
```

### 2. Кэширование ответов

```typescript
// Кэш для частых вопросов (1 час TTL)
responseCache = Map<string, {
  response: string;
  timestamp: number;
}>

// Автоматическая очистка каждые 2 часа
setInterval(() => {
  clearExpiredCache(); // Удаляет старые записи
}, 7200000);
```

### 3. Аналитика пользователей

```typescript
userStats = Map<userId, {
  commands: number;        // Всего команд
  aiRequests: number;      // AI запросов
  postsCreated: number;    // Созданных постов
  lastActive: Date;        // Последняя активность
}>

// Обновление при каждом действии
updateUserStats(userId, 'command' | 'ai' | 'post');
```

---

## ⏰ Автоматическое планирование постов

### Cron Schedule

```
09:00 ежедневно  → Утренний пост
15:00 ежедневно  → Дневной пост
20:00 ежедневно  → Вечерний пост
12:00 Пн/Чт      → Опросы для вовлечения
```

### Логика публикации (publishPost)

```
START: Cron trigger или ручная команда
    │
    ▼
┌────────────────────────────────────────┐
│ 1. Проверка состояния                  │
│    - bot активен?                      │
│    - isSchedulerPaused = false?        │
└────────────────────────────────────────┘
    │ ✅
    ▼
┌────────────────────────────────────────┐
│ 2. Получение из БД                     │
│    telegramPlatform =                  │
│      storage.getPlatformByName()       │
│    scheduledPosts =                    │
│      storage.getPostsByStatus()        │
└────────────────────────────────────────┘
    │
    ▼
┌────────────────────────────────────────┐
│ 3. Поиск готового поста                │
│    now = new Date()                    │
│    postToPublish = posts.find(         │
│      p => p.scheduledAt <= now         │
│    )                                   │
└────────────────────────────────────────┘
    │
    ├─ Пост найден? ───────────┐
    │  YES                      │ NO
    ▼                           ▼
┌──────────────────┐    ┌──────────────────┐
│ 4a. Публикация   │    │ 4b. Генерация    │
│     из БД        │    │     нового       │
└──────────────────┘    └──────────────────┘
    │                           │
    ├─ Есть mediaUrls?          ├─ Выбор темы
    │  YES         NO            │  (random)
    ▼              ▼             ▼
┌───────────┐ ┌───────┐  ┌──────────────┐
│ sendVideo │ │ send  │  │ generatePost │
│ (caption) │ │Message│  │ (Grok AI)    │
└───────────┘ └───────┘  └──────────────┘
    │              │             │
    └──────────────┴─────────────┘
                   │
                   ▼
┌────────────────────────────────────────┐
│ 5. Обновление статуса                  │
│    storage.updatePostStatus(           │
│      postId, 'published', now          │
│    )                                   │
└────────────────────────────────────────┘
    │
    ▼
┌────────────────────────────────────────┐
│ 6. Логирование                         │
│    console.log(✅ Post published)      │
└────────────────────────────────────────┘
    │
    ▼
  END
```

### Формат публикации

```typescript
// Текст + Видео
if (post.mediaUrls && post.mediaUrls[0]) {
  const caption = post.title 
    ? `${post.title}\n\n${post.content}`
    : post.content;
  
  await bot.sendVideo(CHANNEL_ID, videoUrl, { caption });
}

// Только текст
else {
  const text = post.title 
    ? `${post.title}\n\n${post.content}`
    : post.content;
  
  await bot.sendMessage(CHANNEL_ID, text);
}
```

---

## 💬 Интерактивные команды для продвижения

### Категория 1: AI Video Generation

```
/aivideo <промпт>   - Генерация видео (Kling AI)
                      ├─ Rate limit: 3/min
                      ├─ Стоимость: $0.25/видео
                      ├─ Время: 10-30 сек
                      └─ Автосохранение в БД

Flow:
User: /aivideo bitcoin rocket
    ↓
Bot: "🎬 Генерирую видео..."
    ↓
Kling AI: generateTextToVideo()
    ↓
Polling: checkVideoStatus() каждые 5 сек
    ↓
Bot: sendVideo(videoUrl)
    ↓
Storage: createAIVideo(completed)
```

### Категория 2: Content Creation

```
/viral <тема>       - Вирусный пост
/ideas <ниша>       - 5 идей для контента
/hashtags <тема>    - Популярные хештеги
/hook <тема>        - Цепляющий заголовок
/rewrite <текст>    - Улучшение поста
/contest            - Конкурс для подписчиков
/challenge <тема>   - Челлендж
/quiz <тема>        - Интерактивный квиз

Общий паттерн:
    ↓
Grok AI prompt engineering
    ↓
Cache check (если есть → возврат)
    ↓
API call: grok.chat.completions.create()
    ↓
userPosts.set(chatId, content)  ← Сохранение
    ↓
Bot: "✅ Готов! Команда /publish для публикации"
```

### Категория 3: Analytics & Growth

```
/analytics          - Статистика канала
/growth             - План роста
/spy <конкурент>    - Анализ конкурентов
/trends <ниша>      - Актуальные тренды
/audit              - Аудит контента
/blueprint          - Стратегия продвижения

Flow:
    ↓
Real-time API calls (не кэшируются)
    ↓
Grok AI analysis
    ↓
Структурированный ответ + рекомендации
```

### Категория 4: Visual Content

```
/visual             - Меню визуального контента
/cover <тема>       - Обложка для видео
/meme <текст>       - Генерация мема
/infographic <тема> - Инфографика
/story <тема>       - Stories контент
/voiceover <текст>  - Озвучка текста

Integration: Hugging Face + Stable Diffusion
```

### Категория 5: Management

```
/publish            - Публикация сохранённого поста
/pause              - Пауза автопостинга
/resume             - Возобновление автопостинга
/stats              - Статистика бота
/help               - Список команд
/menu               - Главное меню (категории)

Важно: Только администраторы могут использовать /pause и /resume
```

---

## 🧠 AI Assistant Logic

### Для НЕ-команд (обычный текст)

```
User sends: "Как увеличить охват поста?"
    ↓
┌────────────────────────────────────────┐
│ 1. Проверка на ключевые слова          │
│    publishKeywords = ['опубликуй',     │
│      'публикуй', 'publish']            │
│    if (text includes keyword)          │
│       → execute /publish               │
└────────────────────────────────────────┘
    │ Нет ключевых слов
    ▼
┌────────────────────────────────────────┐
│ 2. Rate Limit Check (AI)               │
│    if (!checkRateLimit(chatId, 'ai'))  │
│       → "⏳ Слишком много запросов"    │
└────────────────────────────────────────┘
    │ ✅ Лимит OK
    ▼
┌────────────────────────────────────────┐
│ 3. Cache Check                         │
│    cacheKey = text.substring(0, 100)   │
│    cachedResponse =                    │
│      getCachedResponse(cacheKey)       │
│    if (cached) → return + "⚡ (кэш)"   │
└────────────────────────────────────────┘
    │ ❌ Не в кэше
    ▼
┌────────────────────────────────────────┐
│ 4. AI Request (Grok)                   │
│    bot.sendChatAction('typing')        │
│    prompt = `AI-ассистент по           │
│      продвижению Telegram.             │
│      Вопрос: "${text}".                │
│      Дай полезный ответ: дружелюбный,  │
│      конкретные советы, макс 500 сим.` │
│                                        │
│    response = grok.chat.create({       │
│      model: 'grok-2-latest',           │
│      temperature: 0.8                  │
│    })                                  │
└────────────────────────────────────────┘
    │
    ▼
┌────────────────────────────────────────┐
│ 5. Кэширование ответа                  │
│    setCachedResponse(cacheKey,         │
│      response)                         │
└────────────────────────────────────────┘
    │
    ▼
┌────────────────────────────────────────┐
│ 6. Отправка пользователю               │
│    bot.sendMessage(chatId, response)   │
└────────────────────────────────────────┘
    │
    ▼
┌────────────────────────────────────────┐
│ 7. Обновление статистики               │
│    updateUserStats(chatId, 'ai')       │
└────────────────────────────────────────┘
```

---

## 📈 Оптимизация производительности

### 1. Кэширование (1-часовой TTL)

```typescript
// Типы кэшируемых запросов
✅ Часто задаваемые вопросы
✅ Популярные темы контента
✅ Общие советы по продвижению
❌ Персональная аналитика
❌ Real-time статистика
❌ Генерация уникального контента

// Пример
Key: "как увеличить охват"
Value: {
  response: "5 способов увеличить охват: 1. Постинг в...",
  timestamp: 1696344000000
}
```

### 2. Batch Processing

```typescript
// Очистка данных каждые 2 часа
setInterval(() => {
  // 1. Удаление старого кэша
  cleanExpiredCache();
  
  // 2. Очистка timestamps для rate limiting
  cleanOldTimestamps();
  
  // 3. Архивация статистики
  archiveUserStats();
}, 7200000);
```

### 3. Memory Management

```typescript
// Ограничения на хранилище
userPosts: Map (макс 1000 записей)
responseCache: Map (макс 500 записей)
userStats: Map (макс 10000 пользователей)

// Auto-cleanup при превышении
if (userPosts.size > 1000) {
  const oldestEntries = Array.from(userPosts.entries())
    .sort((a, b) => a.timestamp - b.timestamp)
    .slice(0, 200);
  
  oldestEntries.forEach(([key]) => userPosts.delete(key));
}
```

---

## 🎯 Метрики эффективности

### Tracking (commandStats)

```typescript
commandStats = {
  '/start': 1523,
  '/viral': 892,
  '/ideas': 456,
  '/analytics': 234,
  '/publish': 678,
  '/aivideo': 145,
  'ai_assistant': 2341
}

// Вычисление популярности
function getTopCommands(limit = 5) {
  return Array.from(commandStats.entries())
    .sort((a, b) => b[1] - a[1])
    .slice(0, limit);
}

// Результат
[
  ['ai_assistant', 2341],  ← Самое популярное
  ['/start', 1523],
  ['/viral', 892],
  ['/publish', 678],
  ['/ideas', 456]
]
```

### User Engagement Metrics

```typescript
// Для каждого пользователя
userStats.get(userId) = {
  commands: 45,         // Активность
  aiRequests: 23,       // Использование AI
  postsCreated: 12,     // Контент-генерация
  lastActive: Date      // Retention
}

// Сегментация пользователей
Active: commands > 20 && lastActive < 7 days
Engaged: postsCreated > 5
Power User: aiRequests > 15 && postsCreated > 10
Dormant: lastActive > 30 days
```

---

## 🔄 Integration с Master Automation

```
Master Automation (10 steps)
    │
    │ ШАГ 3: Генерация видео (Kling AI)
    ↓
┌────────────────────────────────────────┐
│ klingAIService.generateTextToVideo()   │
│    ↓                                   │
│ storage.createAIVideo() ← DB           │
│    ↓                                   │
│ videos.set(i, videoUrl)                │
└────────────────────────────────────────┘
    │
    │ ШАГ 4: Планирование постов
    ↓
┌────────────────────────────────────────┐
│ schedulerService.schedulePost()        │
│    ↓                                   │
│ storage.createPost({                   │
│   platformId: telegram.id,             │
│   mediaUrls: [videoUrl],               │
│   scheduledAt: scheduledDate           │
│ })                                     │
└────────────────────────────────────────┘
    │
    │ Автоматическое выполнение
    ↓
┌────────────────────────────────────────┐
│ Telegram Bot: publishPost()            │
│    ↓                                   │
│ bot.sendVideo(CHANNEL_ID, videoUrl)    │
│    ↓                                   │
│ storage.updatePostStatus('published')  │
└────────────────────────────────────────┘
```

---

## 🚀 Best Practices для продвижения

### 1. Timing Strategy

```
09:00 - Утренний пост (высокая активность)
    ├─ Формат: образовательный + кофе эмодзи ☕
    └─ Длина: 300-400 символов

15:00 - Дневной пост (обеденный перерыв)
    ├─ Формат: вирусный + эмоции
    └─ Длина: 150-300 символов (быстрое чтение)

20:00 - Вечерний пост (вечернее чтение)
    ├─ Формат: мотивационный + инсайты
    └─ Длина: 400-600 символов

12:00 Пн/Чт - Опросы (engagement boost)
    └─ Формат: интерактивный + простой вопрос
```

### 2. Content Mix (70-20-10 Rule)

```
70% - Образовательный контент
    ├─ /ideas
    ├─ /blueprint
    └─ Grok AI советы

20% - Развлекательный
    ├─ /meme
    ├─ /contest
    └─ /challenge

10% - Промо
    ├─ Платные услуги
    ├─ VIP доступ
    └─ Партнёрские программы
```

### 3. Engagement Tactics

```
🎣 Hook (первые 2 строки)
    ├─ Вопрос
    ├─ Статистика
    ├─ Провокация
    └─ Обещание

💎 Value (основная часть)
    ├─ Конкретная информация
    ├─ Практические советы
    └─ Пошаговые инструкции

📢 CTA (призыв к действию)
    ├─ Комментарий
    ├─ Репост
    ├─ Подписка
    └─ Сохранение поста
```

### 4. Hashtag Strategy

```
3-5 хештегов на пост:
    ├─ 1 брендовый (#LuciferTrading)
    ├─ 2-3 нишевых (#крипта #трейдинг)
    └─ 1 общий (#финансы)

Избегать:
    ❌ Спам (>10 хештегов)
    ❌ Нерелевантные теги
    ❌ Только популярные (конкуренция)
```

---

## 🎨 Visual Content Strategy

### Kling AI Videos (Master Automation)

```
Формат: 5-10 секунд, 16:9, 1080p
Контент: Bitcoin, торговые сигналы, аналитика
Частота: 2-3 видео/день (в основных постах)
Стоимость: $0.25/видео = $0.75/день
```

### User-Generated Videos (/aivideo)

```
Доступ: Любой пользователь бота
Лимит: 3 запроса/минуту
Сохранение: Автоматически в userPosts
Публикация: /publish или "опубликуй"
```

---

## 💰 Монетизация через бота

### Freemium Model

```
FREE tier:
    ├─ Все команды доступны
    ├─ Rate limits: 5 команд/мин, 3 AI/мин
    ├─ Генерация контента: базовая
    └─ /aivideo: 3 запроса/день

PREMIUM tier ($29.99/мес):
    ├─ Unlimited команды
    ├─ Priority AI responses
    ├─ /aivideo: unlimited
    ├─ Персональная аналитика
    └─ Продвинутые стратегии

VIP tier ($99.99/мес):
    ├─ Всё из Premium
    ├─ Личный AI-стратег
    ├─ Автоматизация постов
    ├─ Кастомные интеграции
    └─ Приоритетная поддержка
```

---

## 📊 Success Metrics

```
Engagement Rate = (Commands + AI Requests) / Total Users
Content Creation Rate = Posts Created / Active Users
Retention = Users active in last 7 days / Total Users
Conversion = Premium Users / Total Users
Viral Coefficient = New Users from Referrals / Active Users

Targets:
✅ Engagement Rate > 40%
✅ Content Creation Rate > 15%
✅ 7-day Retention > 60%
✅ Conversion > 5%
✅ Viral Coefficient > 0.3
```

---

## 🔧 Troubleshooting

### Common Issues

```
1. "⏳ Слишком много команд"
   → Rate limit reached
   → Wait 60 seconds
   → Solution: Upgrade to Premium

2. "❌ Ошибка публикации"
   → Bot lacks permissions
   → Check @IIPRB admin list
   → Solution: Add bot as admin

3. "🎬 Видео не сгенерировано"
   → Kling AI timeout
   → Check KLING_API_KEY
   → Solution: Retry or check balance

4. Cache not working
   → TTL expired
   → Check cache size
   → Solution: Automatic cleanup
```

---

## 🎯 Roadmap

### Phase 1 (Current) ✅
- [x] Basic commands
- [x] AI Assistant (Grok)
- [x] Auto-posting (3x/day)
- [x] Rate limiting
- [x] Kling AI integration

### Phase 2 (Next)
- [ ] Voice message support
- [ ] Image generation (Stable Diffusion)
- [ ] Advanced analytics dashboard
- [ ] A/B testing for posts
- [ ] Multi-language support

### Phase 3 (Future)
- [ ] Telegram Ads integration
- [ ] Chatbot for channel subscribers
- [ ] AI-powered moderation
- [ ] Community management tools
- [ ] Monetization widgets

---

**Статус**: ✅ Production Ready
**Channel**: @IIPRB
**Bot Token**: Безопасно хранится в BOTTG secret
**Последнее обновление**: October 2025
