# 🔐 Безопасность и управление секретами

## Используемые секреты

Система использует следующие секреты через безопасное хранилище Replit:

### 1. **HUGGINGFACE_API_KEY** 
- **Назначение**: Генерация бесплатных AI видео через LTX-Video
- **Использование**: `server/services/huggingFaceVideoService.ts`
- **Стоимость**: $0.00 (100% БЕСПЛАТНО)
- **Лимиты**: Без ограничений на количество запросов
- **Безопасность**: Никогда не логируется, передается только в заголовках

### 2. **XAI_API_KEY** (Grok AI)
- **Назначение**: 
  - Анализ трендов и конкурентов
  - Генерация контента
  - Аналитика и прогнозы
  - AI-ассистент в Telegram боте
- **Использование**: 
  - `server/telegramBot.ts` (Grok AI responses)
  - `server/services/masterAutomation.ts` (Trend analysis)
- **Стоимость**: ~$0.01-0.05 за запрос
- **Безопасность**: Хранится в переменной окружения, используется через OpenAI SDK

### 3. **OPENAI_API_KEY**
- **Назначение**: 
  - Генерация текстового контента
  - Создание скриптов для видео
  - Оптимизация постов
- **Использование**: 
  - `server/services/aiContent.ts`
  - `server/services/huggingFaceVideoService.ts`
- **Стоимость**: ~$0.02-0.10 за пост (в зависимости от модели)
- **Безопасность**: Передается через официальный OpenAI SDK

### 4. **BOTTG** (Telegram Bot Token)
- **Назначение**: Telegram бот для автоматизации постов
- **Использование**: `server/telegramBot.ts`
- **Канал**: @IIPRB
- **Безопасность**: 
  - Токен никогда не логируется
  - Доступен только на сервере
  - Webhook очищается при старте

### 5. **DATABASE_URL**
- **Назначение**: Подключение к PostgreSQL (Neon)
- **Использование**: Везде через `storage.ts`
- **Безопасность**: 
  - Автоматически управляется Replit
  - SSL-соединение
  - Rollback support

---

## 🛡️ Принципы безопасности

### 1. **Никогда не логируем секреты**
```typescript
// ✅ Правильно
console.log('✅ Hugging Face API key configured');

// ❌ Неправильно
console.log('API Key:', process.env.HUGGINGFACE_API_KEY);
```

### 2. **Используем переменные окружения**
```typescript
// ✅ Правильно
const HF_API_KEY = process.env.HUGGINGFACE_API_KEY || '';

// ❌ Неправильно
const HF_API_KEY = 'hf_xxxxxxxxxxxxx';
```

### 3. **Проверяем наличие секретов**
```typescript
if (!HF_API_KEY) {
  throw new Error('Hugging Face API key not configured');
}
```

### 4. **Используем официальные SDK**
```typescript
// ✅ Правильно - через OpenAI SDK
const grok = new OpenAI({
  apiKey: process.env.XAI_API_KEY,
  baseURL: 'https://api.x.ai/v1'
});

// ❌ Неправильно - ручные fetch запросы с токенами
```

---

## 💰 Стоимость использования (текущая конфигурация)

### Ежедневные затраты:
- **Hugging Face (LTX-Video)**: $0.00 ✅ БЕСПЛАТНО
- **Grok AI (анализ трендов)**: ~$0.05/день (1-2 запроса)
- **OpenAI (контент)**: ~$0.06/день (3 поста)
- **Telegram Bot**: $0.00 ✅ БЕСПЛАТНО

**Итого: ~$0.11/день = ~$3.30/месяц** 🎉

### Сравнение с альтернативами:
- **Kling AI**: $0.25/видео × 3 = $0.75/день = $22.50/месяц ❌
- **Google Veo 3**: $0.75/сек × 30 сек = $22.50/видео ❌
- **Synthesia**: $30-90/месяц + лимиты ❌

**Экономия: 90%+ благодаря Hugging Face FREE** ✅

---

## 🔄 Автоматическая ротация секретов

### Как обновить секреты:
1. Откройте вкладку **Secrets** в Replit
2. Обновите значение нужного секрета
3. Перезапустите приложение (автоматический restart)

### Рекомендации:
- **Ротация API ключей**: Каждые 3-6 месяцев
- **Telegram Bot Token**: При компрометации
- **Database URL**: Автоматически управляется Replit

---

## 🚨 Что делать при утечке секрета

### 1. **Немедленно**:
```bash
# Удалить секрет из Replit Secrets
# Сгенерировать новый ключ у провайдера
# Добавить новый ключ в Secrets
# Перезапустить приложение
```

### 2. **Hugging Face API Key**:
- Перейти: https://huggingface.co/settings/tokens
- Удалить старый токен
- Создать новый
- Обновить в Replit Secrets

### 3. **Grok/OpenAI Keys**:
- Немедленно отозвать ключ в консоли провайдера
- Сгенерировать новый
- Обновить в Secrets

### 4. **Telegram Bot Token**:
- Связаться с @BotFather
- Использовать `/revoke` для отзыва токена
- Получить новый токен
- Обновить BOTTG секрет

---

## ✅ Checklist безопасности

- [x] Все секреты хранятся в Replit Secrets (не в коде)
- [x] Секреты не логируются в консоль
- [x] Используются официальные SDK
- [x] Проверка наличия секретов при запуске
- [x] SSL для всех внешних API
- [x] Database connection через переменные окружения
- [x] Автоматический restart при обновлении секретов
- [x] Webhook очистка при старте бота

---

## 📊 Мониторинг использования секретов

### Логи безопасности:
```typescript
// Система автоматически логирует:
✅ Webhook очищен
✅ Платформы успешно инициализированы
🤖 Telegram бот запущен!
📊 Grok AI analysis: {count} requests
🎬 Hugging Face video generation: {count} videos
```

### Проверка статуса:
1. Откройте Dashboard
2. Перейдите в **Safety Status**
3. Проверьте **Activity Logs**

---

## 🎯 Best Practices

### 1. **Минимальные права доступа**
- API ключи создаются с минимальными необходимыми правами
- Telegram bot имеет доступ только к конкретному каналу

### 2. **Rate Limiting**
- Автоматическое ограничение запросов к API
- Защита от случайного перерасхода

### 3. **Аудит**
- Все действия логируются в Activity Logs
- Отслеживание стоимости каждого запроса

### 4. **Backup**
- Database автоматически бэкапится Replit
- Поддержка rollback к предыдущим состояниям

---

## 🔗 Полезные ссылки

- [Replit Secrets Documentation](https://docs.replit.com/hosting/secrets-and-environment-variables)
- [Hugging Face Security](https://huggingface.co/docs/hub/security)
- [OpenAI API Best Practices](https://platform.openai.com/docs/guides/safety-best-practices)
- [Telegram Bot Security](https://core.telegram.org/bots/features#security)

---

**Последнее обновление**: Октябрь 2025
**Статус безопасности**: ✅ Все системы защищены
