import { OpenAI } from 'openai';
import { storage } from '../storage';
import type { 
  PlatformAnalytics, 
  ContentPerformance, 
  AIInsight, 
  AudienceAnalytics,
  CompetitorAnalysis,
  TrendAnalysis 
} from '@shared/schema';

interface AIAnalysisResult {
  sentiment: 'positive' | 'negative' | 'neutral';
  topics: string[];
  trends: string[];
  optimization_suggestions: string[];
  predicted_performance: number;
}

interface TrendData {
  name: string;
  volume: number;
  growth_rate: number;
  confidence: number;
  related_keywords: string[];
}

class AIAnalyticsService {
  private openai: OpenAI;

  constructor() {
    this.openai = new OpenAI({
      apiKey: process.env.OPENAI_API_KEY || '',
    });
  }

  // Анализ контента с помощью AI
  async analyzeContent(content: string, platform: string, historicalData?: ContentPerformance[]): Promise<AIAnalysisResult> {
    try {
      const prompt = `
        Проанализируй следующий контент для ${platform}:
        
        Контент: "${content}"
        
        ${historicalData ? `Исторические данные производительности:\n${JSON.stringify(historicalData.slice(-5), null, 2)}` : ''}
        
        Проведи анализ и верни JSON с:
        - sentiment: тональность контента (positive/negative/neutral)
        - topics: основные темы (массив до 5 тем)
        - trends: соответствие актуальным трендам (массив до 3 трендов)
        - optimization_suggestions: рекомендации по оптимизации (массив до 5 рекомендаций)
        - predicted_performance: прогнозируемая производительность от 0 до 100
        
        Отвечай только валидным JSON.
      `;

      const completion = await this.openai.chat.completions.create({
        model: 'gpt-4',
        messages: [{ role: 'user', content: prompt }],
        temperature: 0.3,
        max_tokens: 800,
      });

      const result = completion.choices[0]?.message?.content;
      if (!result) throw new Error('Не удалось получить ответ от AI');

      return JSON.parse(result);
    } catch (error) {
      console.error('Ошибка AI анализа контента:', error);
      return {
        sentiment: 'neutral',
        topics: ['Общий контент'],
        trends: [],
        optimization_suggestions: ['Добавить больше визуального контента', 'Использовать актуальные хештеги'],
        predicted_performance: 50,
      };
    }
  }

  // Анализ аудитории
  async analyzeAudience(userId: string, platformId: number): Promise<AIInsight> {
    try {
      // Получаем данные аналитики за последние 30 дней
      const analytics = await storage.getPlatformAnalytics(userId, platformId, 30);
      const contentPerformance = await storage.getContentPerformance(userId, platformId, 30);

      if (!analytics.length || !contentPerformance.length) {
        return this.generateDefaultInsight('audience_analysis', 'Недостаточно данных для анализа аудитории');
      }

      const prompt = `
        Проанализируй данные аудитории:
        
        Аналитика платформы (последние 30 дней):
        ${JSON.stringify(analytics, null, 2)}
        
        Производительность контента:
        ${JSON.stringify(contentPerformance.slice(-10), null, 2)}
        
        Создай детальный анализ аудитории с инсайтами о:
        - Демографии и интересах
        - Времени активности
        - Предпочтениях в контенте
        - Рекомендациях по таргетингу
        
        Верни JSON с полями:
        - insights: массив ключевых инсайтов (3-5 пунктов)
        - recommendations: рекомендации по работе с аудиторией (3-5 пунктов)
        - confidence: уровень уверенности в анализе (0-100)
        - impact: потенциальный эффект (low/medium/high)
      `;

      const completion = await this.openai.chat.completions.create({
        model: 'gpt-4',
        messages: [{ role: 'user', content: prompt }],
        temperature: 0.2,
        max_tokens: 1000,
      });

      const analysisResult = JSON.parse(completion.choices[0]?.message?.content || '{}');

      return {
        id: 0,
        userId,
        type: 'audience_analysis',
        platformId,
        title: 'Анализ аудитории с помощью AI',
        description: 'Глубокий анализ вашей аудитории на основе данных активности и вовлеченности',
        data: analysisResult,
        status: 'active',
        createdAt: new Date(),
      };
    } catch (error) {
      console.error('Ошибка анализа аудитории:', error);
      return this.generateDefaultInsight('audience_analysis', 'Ошибка при анализе аудитории');
    }
  }

  // Анализ трендов
  async analyzeTrends(platformId: number, category: 'hashtags' | 'topics' | 'content_types' = 'topics'): Promise<TrendData[]> {
    try {
      // В реальном приложении здесь были бы API вызовы к социальным платформам
      // Сейчас создаем симуляцию на основе AI анализа
      
      const prompt = `
        Проанализируй актуальные тренды для платформы ID ${platformId} в категории ${category}.
        
        Создай список из 10 трендов с данными:
        - name: название тренда
        - volume: объем упоминаний (число от 1000 до 1000000)
        - growth_rate: процент роста за последние 7 дней (-50 до +200)
        - confidence: уверенность в тренде (0-100)
        - related_keywords: связанные ключевые слова (массив 3-5 слов)
        
        Фокус на русскоязычном контенте и актуальных темах для трейдинга и социальных сетей.
        
        Верни только валидный JSON массив.
      `;

      const completion = await this.openai.chat.completions.create({
        model: 'gpt-4',
        messages: [{ role: 'user', content: prompt }],
        temperature: 0.4,
        max_tokens: 1500,
      });

      const trends = JSON.parse(completion.choices[0]?.message?.content || '[]');
      return trends.slice(0, 10);
    } catch (error) {
      console.error('Ошибка анализа трендов:', error);
      return this.getDefaultTrends();
    }
  }

  // Оптимизация хештегов
  async optimizeHashtags(content: string, platform: string, targetAudience?: string): Promise<{
    recommended_hashtags: string[];
    hashtag_analysis: Array<{
      tag: string;
      relevance: number;
      competition: 'low' | 'medium' | 'high';
      potential_reach: number;
    }>;
  }> {
    try {
      const prompt = `
        Оптимизируй хештеги для контента на ${platform}:
        
        Контент: "${content}"
        ${targetAudience ? `Целевая аудитория: ${targetAudience}` : ''}
        
        Создай оптимальный набор хештегов:
        1. recommended_hashtags: массив из 10-15 оптимальных хештегов
        2. hashtag_analysis: детальный анализ каждого хештега с полями:
           - tag: хештег
           - relevance: релевантность (0-100)
           - competition: уровень конкуренции (low/medium/high)
           - potential_reach: потенциальный охват (число от 1000 до 500000)
        
        Включи:
        - Популярные трендовые хештеги (2-3)
        - Нишевые хештеги для точного таргетинга (5-7)
        - Брендовые/уникальные хештеги (2-3)
        - Географические хештеги если актуально (1-2)
        
        Верни только валидный JSON.
      `;

      const completion = await this.openai.chat.completions.create({
        model: 'gpt-4',
        messages: [{ role: 'user', content: prompt }],
        temperature: 0.3,
        max_tokens: 1200,
      });

      return JSON.parse(completion.choices[0]?.message?.content || '{}');
    } catch (error) {
      console.error('Ошибка оптимизации хештегов:', error);
      return {
        recommended_hashtags: ['#трейдинг', '#криптовалюты', '#инвестиции', '#финансы', '#блогер'],
        hashtag_analysis: [],
      };
    }
  }

  // Рекомендации по времени публикации
  async getBestPostingTimes(userId: string, platformId: number): Promise<{
    optimal_times: Array<{
      day: string;
      time: string;
      engagement_score: number;
      audience_activity: number;
    }>;
    timezone: string;
    recommendations: string[];
  }> {
    try {
      // Анализируем историческую производительность
      const contentData = await storage.getContentPerformance(userId, platformId, 60);
      
      const prompt = `
        Проанализируй данные производительности контента для определения лучших времен публикации:
        
        ${JSON.stringify(contentData.slice(-20), null, 2)}
        
        Определи оптимальные времена публикации на основе:
        - Уровня вовлеченности в разное время
        - Активности аудитории
        - Паттернов поведения пользователей
        
        Верни JSON со структурой:
        - optimal_times: массив из 7 слотов (по дням недели) с полями:
          * day: день недели
          * time: время в формате HH:MM
          * engagement_score: ожидаемый уровень вовлеченности (0-100)
          * audience_activity: активность аудитории (0-100)
        - timezone: часовой пояс (Moscow/Europe)
        - recommendations: практические рекомендации (3-5 пунктов)
      `;

      const completion = await this.openai.chat.completions.create({
        model: 'gpt-4',
        messages: [{ role: 'user', content: prompt }],
        temperature: 0.2,
        max_tokens: 800,
      });

      return JSON.parse(completion.choices[0]?.message?.content || '{}');
    } catch (error) {
      console.error('Ошибка анализа времени публикации:', error);
      return this.getDefaultPostingTimes();
    }
  }

  // Конкурентный анализ
  async analyzeCompetitors(userId: string, platformId: number, competitorHandles: string[]): Promise<CompetitorAnalysis[]> {
    const analyses: CompetitorAnalysis[] = [];

    for (const handle of competitorHandles) {
      try {
        // В реальном приложении здесь был бы API вызов для получения данных конкурента
        // Симулируем анализ с помощью AI
        
        const mockData = this.generateMockCompetitorData(handle);
        
        const prompt = `
          Проанализируй конкурента с handle "${handle}" на основе следующих данных:
          ${JSON.stringify(mockData, null, 2)}
          
          Создай детальный анализ контентной стратегии:
          - Основные темы и типы контента
          - Частота публикаций
          - Успешные хештеги
          - Лучшие времена публикации
          - Ключевые факторы успеха
          
          Верни JSON с анализом content_analysis содержащим:
          - common_hashtags: популярные хештеги с весами
          - content_types: типы контента с процентами
          - posting_times: активные часы публикации
          - top_performing_posts: топ 5 постов с метриками
        `;

        const completion = await this.openai.chat.completions.create({
          model: 'gpt-4',
          messages: [{ role: 'user', content: prompt }],
          temperature: 0.3,
          max_tokens: 1000,
        });

        const contentAnalysis = JSON.parse(completion.choices[0]?.message?.content || '{}');

        analyses.push({
          id: 0,
          userId,
          platformId,
          competitorHandle: handle,
          competitorName: `${handle} Analysis`,
          metrics: mockData.metrics,
          content_analysis: contentAnalysis,
          lastAnalyzed: new Date(),
          createdAt: new Date(),
        });
      } catch (error) {
        console.error(`Ошибка анализа конкурента ${handle}:`, error);
      }
    }

    return analyses;
  }

  private generateDefaultInsight(type: string, description: string): AIInsight {
    return {
      id: 0,
      userId: '',
      type,
      platformId: null,
      title: 'AI Инсайт',
      description,
      data: {
        insights: ['Накапливаем данные для более точного анализа'],
        recommendations: ['Продолжайте публиковать контент для сбора данных'],
        confidence: 30,
        impact: 'low' as const,
      },
      status: 'active',
      createdAt: new Date(),
    };
  }

  private getDefaultTrends(): TrendData[] {
    return [
      { name: 'Криптовалюты 2025', volume: 250000, growth_rate: 45, confidence: 85, related_keywords: ['btc', 'eth', 'crypto'] },
      { name: 'AI в трейдинге', volume: 180000, growth_rate: 67, confidence: 78, related_keywords: ['искусственный интеллект', 'автоматизация', 'алготрейдинг'] },
      { name: 'Финтех инновации', volume: 120000, growth_rate: 23, confidence: 72, related_keywords: ['финтех', 'блокчейн', 'платежи'] },
      { name: 'Инвестиции для молодежи', volume: 95000, growth_rate: 34, confidence: 68, related_keywords: ['молодые инвесторы', 'образование', 'стартапы'] },
      { name: 'ESG инвестирование', volume: 75000, growth_rate: 89, confidence: 81, related_keywords: ['устойчивость', 'экология', 'социальная ответственность'] },
    ];
  }

  private getDefaultPostingTimes() {
    return {
      optimal_times: [
        { day: 'Понедельник', time: '09:00', engagement_score: 75, audience_activity: 68 },
        { day: 'Вторник', time: '14:00', engagement_score: 82, audience_activity: 79 },
        { day: 'Среда', time: '11:00', engagement_score: 78, audience_activity: 72 },
        { day: 'Четверг', time: '16:00', engagement_score: 85, audience_activity: 81 },
        { day: 'Пятница', time: '10:00', engagement_score: 71, audience_activity: 65 },
        { day: 'Суббота', time: '12:00', engagement_score: 68, audience_activity: 71 },
        { day: 'Воскресенье', time: '15:00', engagement_score: 74, audience_activity: 69 },
      ],
      timezone: 'Europe/Moscow',
      recommendations: [
        'Лучшие результаты в будние дни с 10:00 до 16:00',
        'Избегайте публикации в поздние вечерние часы',
        'Выходные подходят для развлекательного контента',
      ],
    };
  }

  private generateMockCompetitorData(handle: string) {
    const baseFollowers = Math.floor(Math.random() * 50000) + 10000;
    return {
      metrics: {
        followers: baseFollowers,
        following: Math.floor(baseFollowers * 0.1) + Math.floor(Math.random() * 1000),
        posts: Math.floor(Math.random() * 500) + 100,
        avg_likes: Math.floor(baseFollowers * 0.02) + Math.floor(Math.random() * 100),
        avg_comments: Math.floor(baseFollowers * 0.005) + Math.floor(Math.random() * 20),
        engagement_rate: Math.random() * 5 + 2,
        posting_frequency: Math.random() * 3 + 1,
      },
    };
  }
}

export const aiAnalyticsService = new AIAnalyticsService();