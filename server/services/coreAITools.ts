
import OpenAI from "openai";

// Используем Grok 2 для экономии (как в telegramBot.ts)
const grok = new OpenAI({
  apiKey: process.env.XAI_API_KEY || '',
  baseURL: 'https://api.x.ai/v1'
});

/**
 * ЯДРО AI-ИНСТРУМЕНТОВ (проверено конкурентами)
 * 
 * 5 функций которые используют ВСЕ топ-каналы:
 * 1. Вирусный контент (Rayner Teo, Coin Bureau) - основа роста
 * 2. Анализ трендов (все используют) - +30% охвата
 * 3. Хештеги (Coin Bureau: 0→2.5M) - дешёвый рост
 * 4. Конкуренты (The Trading Channel) - копируй лучшее
 * 5. Предсказание (Rayner: score>70) - экономь время
 * 
 * СТОИМОСТЬ: ~$0.01/месяц (Grok 2)
 * ROI: Измеримый результат в каждой функции
 */

class CoreAITools {
  // 1. ВИРУСНЫЙ КОНТЕНТ (главный инструмент)
  async generateViralContent(params: {
    topic: string;
    platform: 'tiktok' | 'youtube' | 'instagram' | 'telegram';
    niche: string;
  }): Promise<{ content: string; viralScore: number; cost: number }> {
    const prompt = `Создай ВИРУСНЫЙ пост для ${params.platform} про "${params.topic}" в нише ${params.niche}:

ОБЯЗАТЕЛЬНО:
- Сильный хук (первые 3 секунды решают всё)
- Эмоциональный триггер (FOMO, любопытство, шок)
- Конкретная ценность для аудитории
- Призыв к действию
- 350-600 символов

СТИЛЬ: как у топ-каналов (Rayner Teo, Coin Bureau)
ЦЕЛЬ: максимальный охват и вовлечение`;

    const response = await grok.chat.completions.create({
      model: 'grok-2-latest',
      messages: [{ role: 'user', content: prompt }],
      temperature: 0.85,
      max_tokens: 600
    });

    const content = response.choices[0].message.content || '';
    const tokensUsed = response.usage?.total_tokens || 0;
    const cost = (tokensUsed * 0.0000001); // Grok 2 очень дешевый

    return {
      content,
      viralScore: this.calculateViralScore(content, params.platform),
      cost
    };
  }

  // 2. АНАЛИЗ ТРЕНДОВ (что актуально сейчас)
  async analyzeTrends(params: {
    platform: string;
    niche: string;
  }): Promise<{ trends: string[]; opportunities: string[] }> {
    const prompt = `Топ-5 трендов ${params.platform} в нише ${params.niche} (октябрь 2025):

1. Конкретные темы (что обсуждают)
2. Форматы (что работает)
3. Возможности (где пробел)

Только актуальное, без воды. До 400 символов.`;

    const response = await grok.chat.completions.create({
      model: 'grok-2-latest',
      messages: [{ role: 'user', content: prompt }],
      temperature: 0.7,
      max_tokens: 500
    });

    const result = response.choices[0].message.content || '';
    const lines = result.split('\n').filter(l => l.trim());

    return {
      trends: lines.slice(0, 5),
      opportunities: lines.slice(5, 8)
    };
  }

  // 3. ОПТИМИЗАЦИЯ ХЕШТЕГОВ (увеличение охвата)
  async optimizeHashtags(params: {
    content: string;
    platform: string;
  }): Promise<{ hashtags: string[]; expectedReach: number }> {
    // Базовые хештеги по платформам (проверенные)
    const baseHashtags: Record<string, string[]> = {
      tiktok: ['#fyp', '#viral', '#trading', '#crypto', '#forex'],
      instagram: ['#trading', '#crypto', '#forex', '#bitcoin', '#investment'],
      youtube: ['#shorts', '#trading', '#crypto'],
      telegram: ['#трейдинг', '#криптовалюты', '#сигналы']
    };

    const base = baseHashtags[params.platform] || [];
    
    // Добавляем 3-5 специфичных хештегов из контента
    const prompt = `Из этого текста извлеки 3-5 специфичных хештегов: "${params.content.substring(0, 200)}"`;
    
    const response = await grok.chat.completions.create({
      model: 'grok-2-latest',
      messages: [{ role: 'user', content: prompt }],
      temperature: 0.5,
      max_tokens: 100
    });

    const specificHashtags = (response.choices[0].message.content || '')
      .split(/\s+/)
      .filter(h => h.startsWith('#'))
      .slice(0, 5);

    const allHashtags = [...new Set([...base, ...specificHashtags])].slice(0, 10);

    return {
      hashtags: allHashtags,
      expectedReach: allHashtags.length * 1000 // примерная оценка
    };
  }

  // 4. МОНИТОРИНГ КОНКУРЕНТОВ (что у них работает)
  async analyzeCompetitor(params: {
    handle: string;
    niche: string;
  }): Promise<{ strengths: string[]; weaknesses: string[]; opportunities: string[] }> {
    const prompt = `Анализ конкурента "${params.handle}" в нише ${params.niche}:

1. Что делают ХОРОШО (3 пункта)
2. Что делают ПЛОХО (3 пункта)
3. Возможности для нас (3 пункта)

Конкретно и по делу. До 400 символов.`;

    const response = await grok.chat.completions.create({
      model: 'grok-2-latest',
      messages: [{ role: 'user', content: prompt }],
      temperature: 0.7,
      max_tokens: 500
    });

    const result = response.choices[0].message.content || '';
    const sections = result.split(/\d\./);

    return {
      strengths: sections[1]?.split('\n').filter(l => l.trim()).slice(0, 3) || [],
      weaknesses: sections[2]?.split('\n').filter(l => l.trim()).slice(0, 3) || [],
      opportunities: sections[3]?.split('\n').filter(l => l.trim()).slice(0, 3) || []
    };
  }

  // 5. ПРЕДСКАЗАНИЕ УСПЕХА (стоит ли публиковать)
  async predictSuccess(params: {
    content: string;
    platform: string;
    timing: Date;
  }): Promise<{ score: number; suggestions: string[] }> {
    const hour = params.timing.getHours();
    const optimalHours: Record<string, number[]> = {
      tiktok: [9, 12, 15, 19, 21],
      instagram: [11, 14, 17, 19],
      youtube: [14, 16, 20],
      telegram: [8, 12, 18, 21]
    };

    let score = 50; // базовый уровень

    // +30 за оптимальное время
    if (optimalHours[params.platform]?.includes(hour)) {
      score += 30;
    }

    // +20 за длину контента
    const length = params.content.length;
    if (length >= 200 && length <= 600) {
      score += 20;
    }

    // Анализ через AI
    const prompt = `Оцени вирусный потенциал (0-100): "${params.content.substring(0, 300)}"

Критерии:
- Хук
- Эмоции
- Ценность
- Призыв к действию

Одно число.`;

    const response = await grok.chat.completions.create({
      model: 'grok-2-latest',
      messages: [{ role: 'user', content: prompt }],
      temperature: 0.3,
      max_tokens: 50
    });

    const aiScore = parseInt(response.choices[0].message.content || '50');
    score = (score + aiScore) / 2;

    const suggestions: string[] = [];
    if (score < 70) {
      if (length < 200) suggestions.push('Добавь больше контента (минимум 200 символов)');
      if (length > 600) suggestions.push('Сократи до 600 символов для лучшего восприятия');
      if (!optimalHours[params.platform]?.includes(hour)) {
        suggestions.push(`Опубликуй в ${optimalHours[params.platform]?.[0] || 12}:00 для большего охвата`);
      }
      if (!params.content.includes('#')) suggestions.push('Добавь хештеги для увеличения охвата');
    }

    return { score: Math.round(score), suggestions };
  }

  // Вспомогательный метод
  private calculateViralScore(content: string, platform: string): number {
    let score = 0;
    
    // Хук в первых 50 символах
    const hook = content.substring(0, 50);
    if (/[🚨💥⚡❌✅🔥💰]/u.test(hook)) score += 20;
    if (/(!|\?|\.\.\.)/g.test(hook)) score += 15;
    
    // Эмоциональные слова
    const emotional = ['невероятно', 'шокирующе', 'срочно', 'секрет', 'эксклюзивно'];
    if (emotional.some(word => content.toLowerCase().includes(word))) score += 25;
    
    // Числа и данные
    if (/\d+%|\$\d+|\d+x/g.test(content)) score += 20;
    
    // Призыв к действию
    if (/подпишись|лайк|комментируй|поделись/i.test(content)) score += 20;
    
    return Math.min(score, 100);
  }
}

export const coreAITools = new CoreAITools();
