# 🔄 Логика системы автоматизации

## 📊 Архитектура системы

```
┌─────────────────────────────────────────────────────────────────┐
│                    LUCIFER TRADING AUTOMATION                    │
│                     Social Media Automation Hub                   │
└─────────────────────────────────────────────────────────────────┘
                              │
                              ▼
        ┌────────────────────────────────────────┐
        │    MASTER AUTOMATION ORCHESTRATOR      │
        │    (masterAutomation.ts)               │
        └────────────────────────────────────────┘
                              │
        ┌─────────────────────┴───────────────────────┐
        │                                             │
        ▼                                             ▼
┌──────────────┐                              ┌──────────────┐
│   СЕКРЕТЫ    │                              │  БАЗА ДАННЫХ │
│   (Replit)   │                              │ (PostgreSQL) │
└──────────────┘                              └──────────────┘
```

---

## 🎯 Главный поток автоматизации (10 шагов)

### Запуск: POST /api/automation/start

```
User clicks "Запустить полную автоматизацию"
           │
           ▼
   masterAutomation.startFullAutomation(userId)
           │
           ▼
   ┌──────────────────────────────────────────┐
   │  Инициализация конфигурации              │
   │  - dailyPostCount: 3                     │
   │  - postTimes: [09:00, 15:00, 20:00]     │
   │  - topics: [trading, crypto, finance]    │
   │  - enableAIVideo: true                   │
   │  - enableGamification: true              │
   └──────────────────────────────────────────┘
           │
           ▼
   runFullCycle(config) → 10 ШАГОВ
```

---

## 🔟 Детальная логика 10 шагов

### ШАГ 1: Сбор данных (Grok AI)

```javascript
collectTrendsData(topics)
    │
    ▼
┌──────────────────────────────────────────┐
│  Grok AI API Call                        │
│  Prompt: "Analyze trends in trading"    │
│  Response Format: JSON                   │
└──────────────────────────────────────────┘
    │
    ▼
{
  trending_topics: ['Bitcoin rally', 'Fed policy', ...],
  viral_patterns: ['short videos', 'memes'],
  best_times: ['09:00', '15:00', '20:00'],
  engagement_tips: ['use hooks', 'add CTAs'],
  formats: ['video', 'image', 'text']
}
    │
    ▼
┌──────────────────────────────────────────┐
│  Кэширование в память                    │
│  trendsData.trending_topics → [5 тем]   │
└──────────────────────────────────────────┘
```

---

### ШАГ 2: Генерация контента (Grok AI)

```javascript
generateDailyContent(config, trendsData)
    │
    ▼
FOR каждого i IN [0...dailyPostCount]
    │
    ▼
    topic = trendsData.trending_topics[i]
    │
    ▼
┌──────────────────────────────────────────┐
│  Grok AI Content Generation              │
│  Prompt: "Create post about {topic}"    │
│  Max: 280 characters                     │
└──────────────────────────────────────────┘
    │
    ▼
{
  topic: 'Bitcoin rally',
  content: '🚀 Bitcoin breaks $60k...',
  format: 'video',
  scheduledTime: '09:00',
  needsVideo: true
}
    │
    ▼
┌──────────────────────────────────────────┐
│  Сохранение в массив contents[]          │
└──────────────────────────────────────────┘
```

---

### ШАГ 3: Генерация AI видео (Kling AI)

```javascript
generateVideosForContent(userId, contents)
    │
    ▼
FOR каждого content IN contents
    │
    IF content.needsVideo == false
    │   SKIP
    │
    ▼
┌──────────────────────────────────────────┐
│  Формирование промпта                    │
│  "{topic}. {content}. Professional..."   │
└──────────────────────────────────────────┘
    │
    ▼
┌──────────────────────────────────────────┐
│  Kling AI API Call                       │
│  POST https://api.piapi.ai/api/kling    │
│  Headers: x-api-key: KLING_API_KEY       │
│  Body: {                                 │
│    prompt: videoPrompt,                  │
│    duration: 5,                          │
│    mode: 'std',                          │
│    aspect_ratio: '16:9'                  │
│  }                                       │
└──────────────────────────────────────────┘
    │
    ▼
Response: { task_id: "xxx", status: "queued" }
    │
    ▼
┌──────────────────────────────────────────┐
│  Сохранение в БД                         │
│  storage.createAIVideo({                 │
│    userId,                               │
│    provider: 'kling',                    │
│    videoId: task_id,                     │
│    status: 'queued',                     │
│    cost: 0.25                            │
│  })                                      │
└──────────────────────────────────────────┘
    │
    ▼
┌──────────────────────────────────────────┐
│  Polling для проверки статуса            │
│  LOOP до status == 'completed'           │
│    checkVideoStatus(task_id)             │
│    WAIT 5 seconds                        │
│  END LOOP                                │
└──────────────────────────────────────────┘
    │
    ▼
Response: { status: "completed", video_url: "https://..." }
    │
    ▼
┌──────────────────────────────────────────┐
│  Обновление БД                           │
│  updateAIVideoStatus(aiVideo.id,         │
│    'completed', video_url)               │
└──────────────────────────────────────────┘
    │
    ▼
┌──────────────────────────────────────────┐
│  Сохранение URL в Map                    │
│  videos.set(i, video_url)                │
└──────────────────────────────────────────┘
```

---

### ШАГ 4: Планирование постов (Scheduler)

```javascript
scheduleAutoPosts(config, contents, videos)
    │
    ▼
platform = storage.getPlatformByName('telegram')
    │
    ▼
FOR каждого i IN contents
    │
    ▼
┌──────────────────────────────────────────┐
│  Расчёт времени публикации               │
│  scheduledTime = content.scheduledTime   │
│  scheduledDate = new Date()              │
│  scheduledDate.setHours(09, 00, 0, 0)    │
│  IF scheduledDate < now                  │
│    scheduledDate += 1 day                │
└──────────────────────────────────────────┘
    │
    ▼
┌──────────────────────────────────────────┐
│  Создание поста в БД                     │
│  storage.createPost({                    │
│    userId,                               │
│    platformId: telegram.id,              │
│    content: content.content,             │
│    title: content.topic,                 │
│    mediaUrls: [videos.get(i)],           │
│    scheduledAt: scheduledDate,           │
│    aiGenerated: true                     │
│  })                                      │
└──────────────────────────────────────────┘
    │
    ▼
┌──────────────────────────────────────────┐
│  Регистрация в Scheduler                 │
│  schedulerService.schedulePost(          │
│    userId, post.id,                      │
│    scheduledDate, telegram.id            │
│  )                                       │
└──────────────────────────────────────────┘
    │
    ▼
┌──────────────────────────────────────────┐
│  Создание таймера                        │
│  delay = scheduledDate - now             │
│  setTimeout(() => {                      │
│    executeJob(jobId)                     │
│  }, delay)                               │
└──────────────────────────────────────────┘
```

---

### ШАГ 5: Геймификация

```javascript
setupGamification(userId)
    │
    ▼
┌──────────────────────────────────────────┐
│  Создание Activity Log                   │
│  metadata: {                             │
│    features: ['points', 'levels',        │
│               'achievements',            │
│               'leaderboard'],            │
│    bonuses: ['daily_quiz',               │
│              'referral_rewards',         │
│              'engagement_points']        │
│  }                                       │
└──────────────────────────────────────────┘
    │
    ▼
🎮 Система очков активирована
```

---

### ШАГ 6: Виральные механики

```javascript
setupViralMechanics(userId)
    │
    ▼
┌──────────────────────────────────────────┐
│  Реферальная система                     │
│  mechanics: [                            │
│    'referral_links',                     │
│    'challenges',                         │
│    'contests',                           │
│    'viral_content'                       │
│  ]                                       │
│  rewards: [                              │
│    'bonus_videos',                       │
│    'premium_access',                     │
│    'exclusive_content'                   │
│  ]                                       │
└──────────────────────────────────────────┘
    │
    ▼
🔥 Виральность активирована
```

---

### ШАГ 7: Монетизация

```javascript
setupMonetization(userId)
    │
    ▼
┌──────────────────────────────────────────┐
│  VIP тарифы                              │
│  tiers: ['free', 'basic', 'premium',     │
│          'vip']                          │
│  pricing: {                              │
│    basic: $9.99,                         │
│    premium: $29.99,                      │
│    vip: $99.99                           │
│  }                                       │
└──────────────────────────────────────────┘
    │
    ▼
💰 Монетизация настроена
```

---

### ШАГ 8: Аналитика (Grok AI)

```javascript
analyzePerformance(userId, trendsData)
    │
    ▼
posts = storage.getUserPosts(userId, 30)
recentPosts = posts.filter(last 7 days)
    │
    ▼
┌──────────────────────────────────────────┐
│  Grok AI Analysis                        │
│  Prompt: "Analyze performance:          │
│    Total posts: X                        │
│    AI-generated: Y                       │
│    Trends: [...]"                        │
└──────────────────────────────────────────┘
    │
    ▼
{
  score: 85,
  top_content: ['videos', 'memes'],
  recommendations: ['post at 15:00'],
  predictions: { growth: '+20%' }
}
    │
    ▼
┌──────────────────────────────────────────┐
│  Сохранение в Activity Log               │
│  description: "Оценка: 85/100"           │
└──────────────────────────────────────────┘
```

---

### ШАГ 9: A/B тестирование

```javascript
setupABTesting(userId, contents)
    │
    ▼
variants = contents.map((c, i) => ({
  id: `variant_${i}`,
  topic: c.topic,
  format: c.format
}))
    │
    ▼
┌──────────────────────────────────────────┐
│  Регистрация тестов                      │
│  metrics: ['engagement', 'reach',        │
│            'conversions']                │
│  duration: '7 days'                      │
└──────────────────────────────────────────┘
```

---

### ШАГ 10: Масштабирование

```javascript
optimizeAndScale(userId, trendsData)
    │
    ▼
┌──────────────────────────────────────────┐
│  План расширения                         │
│  Week 1: telegram_automation             │
│  Week 2: instagram_integration           │
│  Week 3: tiktok_expansion                │
│  Week 4: multi_channel_sync              │
└──────────────────────────────────────────┘
```

---

## 🔄 Scheduler Logic (Выполнение постов)

```
schedulerService.executeJob(jobId)
    │
    ▼
┌──────────────────────────────────────────┐
│  Проверки перед публикацией              │
│  1. emergencyStopUsers.has(userId)?      │
│     YES → Cancel job                     │
│  2. safetyCheck(userId)                  │
│     CRITICAL issues? → Cancel job        │
└──────────────────────────────────────────┘
    │
    ▼
job.status = 'running'
    │
    ▼
┌──────────────────────────────────────────┐
│  Получение данных поста                  │
│  post = storage.getPost(job.postId)      │
│  userAccounts = storage.getUserAccounts  │
└──────────────────────────────────────────┘
    │
    ▼
┌──────────────────────────────────────────┐
│  Публикация в Telegram                   │
│  socialMediaService.postContent(         │
│    'telegram',                           │
│    post.content,                         │
│    post.mediaUrls                        │
│  )                                       │
└──────────────────────────────────────────┘
    │
    ▼
Result: { id: 'msg_123', url: 'https://t.me/...' }
    │
    ▼
┌──────────────────────────────────────────┐
│  Обновление статуса                      │
│  storage.updatePost(postId, {            │
│    status: 'published',                  │
│    publishedAt: new Date(),              │
│    externalPostId: result.id             │
│  })                                      │
└──────────────────────────────────────────┘
    │
    ▼
┌──────────────────────────────────────────┐
│  Логирование действия                    │
│  safetyService.recordAction(             │
│    userId, platformId, 'post'            │
│  )                                       │
└──────────────────────────────────────────┘
    │
    ▼
job.status = 'completed'
```

---

## 🤖 Telegram Bot Logic

```
User sends message to bot
    │
    ▼
┌──────────────────────────────────────────┐
│  Проверка команды                        │
│  /start → Welcome message                │
│  /menu → Show categories                 │
│  /aivideo → Generate video               │
│  /help → Instructions                    │
│  Другое → Grok AI response               │
└──────────────────────────────────────────┘
```

### Команда /aivideo

```
/aivideo bitcoin rocket to the moon
    │
    ▼
┌──────────────────────────────────────────┐
│  Rate Limiting Check                     │
│  AI_RATE_LIMIT = 3 req/min               │
│  userAIRequestTimestamps.get(userId)     │
│  IF limit exceeded → Error message       │
└──────────────────────────────────────────┘
    │
    ▼
┌──────────────────────────────────────────┐
│  Отправка статуса                        │
│  bot.sendMessage(chatId,                 │
│    "🎬 Генерирую видео...")              │
└──────────────────────────────────────────┘
    │
    ▼
┌──────────────────────────────────────────┐
│  Kling AI Generation                     │
│  klingAIService.generateTextToVideo(     │
│    prompt, { duration: 5 }               │
│  )                                       │
└──────────────────────────────────────────┘
    │
    ▼
┌──────────────────────────────────────────┐
│  Polling (max 5 min)                     │
│  LOOP до completed                       │
│    status = checkVideoStatus(taskId)     │
│    WAIT 5 seconds                        │
│  END LOOP                                │
└──────────────────────────────────────────┘
    │
    ▼
┌──────────────────────────────────────────┐
│  Отправка видео                          │
│  bot.sendVideo(chatId, videoUrl, {       │
│    caption: prompt                       │
│  })                                      │
└──────────────────────────────────────────┘
```

---

## 💾 Секреты и безопасность

```
Replit Secrets Store
    │
    ▼
┌──────────────────────────────────────────┐
│  Environment Variables                   │
│  - KLING_API_KEY                         │
│  - XAI_API_KEY (Grok)                    │
│  - OPENAI_API_KEY                        │
│  - BOTTG (Telegram)                      │
│  - DATABASE_URL                          │
└──────────────────────────────────────────┘
    │
    ▼
process.env.KLING_API_KEY → Никогда не логируется
    │
    ▼
Используется только в API headers
```

---

## 📈 Стоимость операций

```
┌────────────────────────┬──────────────┬─────────────┐
│ Операция               │ Провайдер    │ Стоимость   │
├────────────────────────┼──────────────┼─────────────┤
│ Анализ трендов         │ Grok AI      │ ~$0.02      │
│ Генерация контента (3x)│ Grok AI      │ ~$0.06      │
│ Генерация видео (3x)   │ Kling AI     │ $0.75       │
│ Telegram публикация    │ FREE         │ $0.00       │
│ Database операции      │ FREE         │ $0.00       │
├────────────────────────┼──────────────┼─────────────┤
│ ИТОГО в день           │              │ ~$0.83      │
│ ИТОГО в месяц          │              │ ~$24.90     │
└────────────────────────┴──────────────┴─────────────┘
```

---

## 🎯 Критические точки

### Safety Checks

```
ПЕРЕД каждой публикацией:
    │
    ▼
1. Emergency Stop активен?
    YES → ОТМЕНА
    NO → Continue
    │
    ▼
2. Rate Limit превышен?
    YES → ОТМЕНА
    NO → Continue
    │
    ▼
3. Safety Status == CRITICAL?
    YES → ОТМЕНА
    NO → Continue
    │
    ▼
✅ Публикация разрешена
```

### Error Handling

```
TRY
    │
    ▼
  Операция (API call, DB query, etc.)
    │
    ├─ SUCCESS → Continue
    │
    └─ ERROR
        │
        ▼
    ┌──────────────────────────────────────┐
    │  1. Log error                        │
    │  2. Update job status = 'failed'     │
    │  3. Create Activity Log              │
    │  4. Notify user (если критично)     │
    └──────────────────────────────────────┘
```

---

## 🔄 Data Flow

```
User Input (Dashboard/Telegram)
    ↓
API Endpoint (routes.ts)
    ↓
Service Layer (masterAutomation, klingAI, etc.)
    ↓
External APIs (Kling, Grok, OpenAI)
    ↓
Storage Layer (storage.ts)
    ↓
PostgreSQL Database
    ↓
Response to User
```

---

## ⚡ Оптимизации

1. **Кэширование**: 
   - Grok AI responses (1 час TTL)
   - User rate limits (memory)
   
2. **Параллельность**:
   - Генерация 3 видео одновременно
   - Multiple API calls в параллель

3. **Retry Logic**:
   - Auto-retry на API failures
   - Exponential backoff

4. **Cleanup**:
   - Автоматическая очистка кэша (2 часа)
   - Удаление старых timestamps

---

**Статус**: ✅ Полностью функционально
**Последнее обновление**: October 2025
