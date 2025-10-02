
import OpenAI from "openai";

// the newest OpenAI model is "gpt-5" which was released August 7, 2025. do not change this unless explicitly requested by the user
const openai = new OpenAI({ 
  apiKey: process.env.OPENAI_API_KEY || process.env.OPENAI_API_KEY_ENV_VAR || "default_key"
});

interface ContentOptimizationResult {
  original: string;
  optimized: string;
  improvements: string[];
  seoScore: number;
  readabilityScore: number;
  grammarIssues: GrammarIssue[];
  suggestions: string[];
}

interface GrammarIssue {
  text: string;
  suggestion: string;
  type: 'grammar' | 'style' | 'spelling' | 'tone';
  position: { start: number; end: number };
}

interface SEOOptimization {
  keywords: string[];
  metaDescription: string;
  title: string;
  score: number;
  recommendations: string[];
}

interface TLDRResult {
  summary: string;
  keyPoints: string[];
  readingTime: string;
}

class ContentOptimizationService {
  /**
   * Проверка грамматики и стиля (Grammarly-подобная функция)
   */
  async checkGrammarAndStyle(
    text: string,
    targetAudience: 'formal' | 'casual' | 'professional' = 'professional'
  ): Promise<ContentOptimizationResult> {
    try {
      const prompt = `Проанализируй текст на русском языке как профессиональный редактор:

Текст: "${text}"

Целевая аудитория: ${targetAudience}

Проверь:
1. Грамматические ошибки
2. Стилистические недочеты
3. Орфографию
4. Тон и соответствие аудитории
5. Читаемость
6. SEO-потенциал

Верни JSON:
{
  "optimized": "исправленный текст",
  "improvements": ["список улучшений"],
  "seoScore": 0-100,
  "readabilityScore": 0-100,
  "grammarIssues": [
    {
      "text": "проблемный фрагмент",
      "suggestion": "исправление",
      "type": "grammar/style/spelling/tone",
      "position": {"start": 0, "end": 10}
    }
  ],
  "suggestions": ["дополнительные рекомендации"]
}`;

      const response = await openai.chat.completions.create({
        model: "gpt-5",
        messages: [
          { 
            role: "system", 
            content: "Ты профессиональный редактор и корректор русского языка с экспертизой в SEO и digital-маркетинге."
          },
          { role: "user", content: prompt }
        ],
        response_format: { type: "json_object" },
      });

      const result = JSON.parse(response.choices[0].message.content || '{}');
      
      return {
        original: text,
        optimized: result.optimized || text,
        improvements: result.improvements || [],
        seoScore: result.seoScore || 0,
        readabilityScore: result.readabilityScore || 0,
        grammarIssues: result.grammarIssues || [],
        suggestions: result.suggestions || [],
      };
    } catch (error) {
      throw new Error(`Failed to check grammar: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * SEO-оптимизация контента (NeuronWriter-подобная функция)
   */
  async optimizeForSEO(
    content: string,
    targetKeywords: string[],
    platform: 'telegram' | 'blog' | 'social'
  ): Promise<SEOOptimization> {
    try {
      const prompt = `Оптимизируй контент для SEO:

Контент: "${content}"
Целевые ключевые слова: ${targetKeywords.join(', ')}
Платформа: ${platform}

Создай SEO-оптимизированную версию с:
1. Естественной интеграцией ключевых слов
2. Meta-описанием (150-160 символов)
3. SEO-заголовком
4. Оценкой оптимизации (0-100)
5. Рекомендациями по улучшению

JSON формат:
{
  "keywords": ["список ключевых слов с частотностью"],
  "metaDescription": "описание",
  "title": "SEO заголовок",
  "score": 0-100,
  "recommendations": ["рекомендации"]
}`;

      const response = await openai.chat.completions.create({
        model: "gpt-5",
        messages: [
          { 
            role: "system", 
            content: "Ты SEO-эксперт, специализирующийся на русскоязычном контенте для соцсетей и блогов."
          },
          { role: "user", content: prompt }
        ],
        response_format: { type: "json_object" },
      });

      return JSON.parse(response.choices[0].message.content || '{}');
    } catch (error) {
      throw new Error(`Failed to optimize for SEO: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * TLDR - краткое содержание (для длинных статей)
   */
  async generateTLDR(
    text: string,
    maxLength: number = 200
  ): Promise<TLDRResult> {
    try {
      const prompt = `Создай краткое содержание (TLDR) текста:

Текст: "${text}"
Максимальная длина резюме: ${maxLength} символов

Верни JSON:
{
  "summary": "краткое содержание",
  "keyPoints": ["ключевые пункты списком"],
  "readingTime": "время чтения полного текста"
}`;

      const response = await openai.chat.completions.create({
        model: "gpt-5",
        messages: [
          { 
            role: "system", 
            content: "Ты эксперт по созданию кратких и ёмких резюме текстов, сохраняющих суть."
          },
          { role: "user", content: prompt }
        ],
        response_format: { type: "json_object" },
      });

      return JSON.parse(response.choices[0].message.content || '{}');
    } catch (error) {
      throw new Error(`Failed to generate TLDR: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Анализ тональности контента
   */
  async analyzeSentiment(
    text: string
  ): Promise<{
    sentiment: 'positive' | 'negative' | 'neutral';
    score: number;
    emotions: string[];
    suggestions: string[];
  }> {
    try {
      const prompt = `Проанализируй тональность текста:

"${text}"

Определи:
1. Общую тональность (positive/negative/neutral)
2. Оценку от -1 (негативная) до +1 (позитивная)
3. Присутствующие эмоции
4. Рекомендации по улучшению тональности для вовлечения

JSON:
{
  "sentiment": "positive/negative/neutral",
  "score": -1 to +1,
  "emotions": ["список эмоций"],
  "suggestions": ["рекомендации"]
}`;

      const response = await openai.chat.completions.create({
        model: "gpt-5",
        messages: [
          { 
            role: "system", 
            content: "Ты эксперт по анализу тональности и эмоций в текстах для соцсетей."
          },
          { role: "user", content: prompt }
        ],
        response_format: { type: "json_object" },
      });

      return JSON.parse(response.choices[0].message.content || '{}');
    } catch (error) {
      throw new Error(`Failed to analyze sentiment: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Генерация геймификационного контента
   */
  async generateGameContent(
    type: 'quiz' | 'puzzle' | 'challenge' | 'daily_mission',
    topic: string,
    difficulty: 'easy' | 'medium' | 'hard'
  ): Promise<{
    content: string;
    questions?: Array<{
      question: string;
      options: string[];
      correctAnswer: number;
      explanation: string;
    }>;
    reward: string;
    points?: number;
    badge?: string;
  }> {
    try {
      const prompt = `Создай ${type} для геймификации канала:

Тема: ${topic}
Сложность: ${difficulty}

Создай интерактивный контент с:
1. Вопросами (если quiz) или заданиями
2. Вариантами ответов (4 варианта для quiz)
3. Правильными ответами
4. Объяснениями (почему правильный ответ верный)
5. Наградой за выполнение (очки и бейджи)
6. Мотивирующим текстом

JSON формат:
{
  "content": "описание задания",
  "questions": [{"question": "", "options": [], "correctAnswer": 0, "explanation": ""}],
  "reward": "текст награды",
  "points": 10-100,
  "badge": "название бейджа"
}`;

      const response = await openai.chat.completions.create({
        model: "gpt-5",
        messages: [
          { 
            role: "system", 
            content: "Ты эксперт по созданию вовлекающего геймифицированного контента для Telegram с глубоким пониманием психологии мотивации."
          },
          { role: "user", content: prompt }
        ],
        response_format: { type: "json_object" },
      });

      return JSON.parse(response.choices[0].message.content || '{}');
    } catch (error) {
      throw new Error(`Failed to generate game content: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Создание AI-персонажа для бота (Character.AI стиль)
   */
  async createBotPersonality(
    personality: 'дружелюбный_эксперт' | 'мотивирующий_коуч' | 'строгий_аналитик' | 'веселый_гуру',
    niche: string
  ): Promise<{
    systemPrompt: string;
    greeting: string;
    catchphrases: string[];
    responseStyle: string;
  }> {
    try {
      const prompt = `Создай уникальную личность для Telegram-бота:

Тип личности: ${personality}
Ниша: ${niche}

Создай:
1. System prompt для настройки AI (300-500 символов)
2. Приветственное сообщение
3. 5 крылатых фраз персонажа
4. Описание стиля ответов

JSON:
{
  "systemPrompt": "детальное описание личности для AI",
  "greeting": "приветственное сообщение",
  "catchphrases": ["фраза 1", "фраза 2", ...],
  "responseStyle": "как отвечать на вопросы"
}`;

      const response = await openai.chat.completions.create({
        model: "gpt-5",
        messages: [
          { 
            role: "system", 
            content: "Ты креативный писатель, создающий запоминающиеся персонажи для AI-ботов."
          },
          { role: "user", content: prompt }
        ],
        response_format: { type: "json_object" },
      });

      return JSON.parse(response.choices[0].message.content || '{}');
    } catch (error) {
      throw new Error(`Failed to create bot personality: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }
}

export const contentOptimizationService = new ContentOptimizationService();
