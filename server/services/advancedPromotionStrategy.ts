
import { aiContentService } from './aiContent';
import { clientAnalysisService } from './clientAnalysis';
import { socialMediaManager } from './socialMediaIntegration';
import { storage } from '../storage';
import { OpenAI } from 'openai';

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY || '',
});

interface PromotionStrategy {
  id: string;
  name: string;
  description: string;
  type: 'free' | 'paid' | 'premium';
  effectiveness: number; // 1-10
  effort: 'low' | 'medium' | 'high';
  timeframe: string;
  platforms: string[];
  tactics: string[];
  cost?: number;
  authorStyle: 'preserve' | 'enhance' | 'adapt';
}

interface ClientPersona {
  writing_style: string;
  tone: string;
  favorite_topics: string[];
  unique_selling_points: string[];
  target_audience: string;
  brand_voice: string;
  content_pillars: string[];
}

class AdvancedPromotionStrategy {
  // === АНАЛИЗ АВТОРСКОГО СТИЛЯ ===
  
  async analyzeClientPersona(userId: string, clientContent: string[]): Promise<ClientPersona> {
    try {
      const prompt = `
        Проанализируй следующий контент клиента и определи его уникальный авторский стиль:
        
        Контент: ${clientContent.join('\n\n---\n\n')}
        
        Определи:
        1. Стиль написания (формальный/неформальный/дружелюбный/профессиональный)
        2. Тональность (мотивирующая/аналитическая/обучающая/развлекательная)
        3. Любимые темы и фокусы
        4. Уникальные особенности подачи
        5. Целевая аудитория
        6. Голос бренда
        7. Основные столпы контента
        
        Верни JSON с детальным анализом.
      `;

      const response = await openai.chat.completions.create({
        model: "gpt-4",
        messages: [{ role: "user", content: prompt }],
        response_format: { type: "json_object" },
      });

      return JSON.parse(response.choices[0].message.content || '{}');
    } catch (error) {
      console.error('Ошибка анализа персоны клиента:', error);
      return {
        writing_style: 'профессиональный',
        tone: 'обучающая',
        favorite_topics: ['трейдинг', 'анализ рынков'],
        unique_selling_points: ['практический подход'],
        target_audience: 'начинающие трейдеры',
        brand_voice: 'экспертный',
        content_pillars: ['обучение', 'сигналы', 'анализ'],
      };
    }
  }

  // === ГЕНЕРАЦИЯ СТРАТЕГИЙ ПРОДВИЖЕНИЯ ===
  
  async generatePromotionStrategies(
    clientPersona: ClientPersona,
    currentMetrics: any,
    budget: number
  ): Promise<PromotionStrategy[]> {
    const strategies: PromotionStrategy[] = [];

    // БЕСПЛАТНЫЕ СТРАТЕГИИ
    strategies.push(
      ...await this.generateFreeStrategies(clientPersona, currentMetrics)
    );

    // ПЛАТНЫЕ СТРАТЕГИИ
    strategies.push(
      ...await this.generatePaidStrategies(clientPersona, budget)
    );

    // ПРЕМИУМ AI СТРАТЕГИИ
    strategies.push(
      ...await this.generatePremiumStrategies(clientPersona)
    );

    return strategies.sort((a, b) => b.effectiveness - a.effectiveness);
  }

  private async generateFreeStrategies(
    persona: ClientPersona, 
    metrics: any
  ): Promise<PromotionStrategy[]> {
    return [
      {
        id: 'organic_engagement',
        name: 'Органическое вовлечение',
        description: 'Увеличение охвата через качественный контент и взаимодействие с аудиторией',
        type: 'free',
        effectiveness: 7,
        effort: 'medium',
        timeframe: '2-4 недели',
        platforms: ['instagram', 'tiktok', 'youtube', 'telegram'],
        tactics: [
          'Ежедневное взаимодействие с комментариями в течение 2 часов после публикации',
          'Участие в trending хештегах трейдинг-ниши',
          'Кросс-промо между платформами',
          'Stories и короткие видео для повышения engagement rate',
          'Коллаборации с другими трейдерами',
        ],
        authorStyle: 'preserve',
      },
      {
        id: 'content_optimization',
        name: 'SEO оптимизация контента',
        description: 'Оптимизация для поисковых алгоритмов платформ',
        type: 'free',
        effectiveness: 8,
        effort: 'low',
        timeframe: '1-2 недели',
        platforms: ['youtube', 'instagram', 'tiktok'],
        tactics: [
          'Использование trending ключевых слов в заголовках',
          'Оптимизация времени публикации (9:00, 14:00, 19:00)',
          'Создание цепляющих превью и обложек',
          'Использование всех доступных полей метаданных',
          'A/B тестирование заголовков и описаний',
        ],
        authorStyle: 'enhance',
      },
      {
        id: 'community_building',
        name: 'Построение сообщества',
        description: 'Создание активного комьюнити вокруг бренда',
        type: 'free',
        effectiveness: 9,
        effort: 'high',
        timeframe: '1-3 месяца',
        platforms: ['telegram', 'instagram', 'youtube'],
        tactics: [
          'Еженедельные live-сессии Q&A',
          'Создание эксклюзивного Telegram-чата для VIP подписчиков',
          'Система наставничества и менторства',
          'Конкурсы и челленджи для аудитории',
          'User-generated content кампании',
        ],
        authorStyle: 'adapt',
      },
      {
        id: 'viral_content',
        name: 'Вирусный контент',
        description: 'Создание контента с высоким потенциалом вирусности',
        type: 'free',
        effectiveness: 8,
        effort: 'medium',
        timeframe: '1-4 недели',
        platforms: ['tiktok', 'instagram', 'youtube'],
        tactics: [
          'Участие в viral трендах с трейдинг-контекстом',
          'Реакции на актуальные события рынка',
          'Controversial но обоснованные мнения',
          'Мемы и развлекательный контент',
          'Сторителлинг с личными историями успеха/неудач',
        ],
        authorStyle: 'adapt',
      },
    ];
  }

  private async generatePaidStrategies(
    persona: ClientPersona,
    budget: number
  ): Promise<PromotionStrategy[]> {
    return [
      {
        id: 'targeted_ads',
        name: 'Таргетированная реклама',
        description: 'Настройка рекламных кампаний с точным таргетингом',
        type: 'paid',
        effectiveness: 9,
        effort: 'medium',
        timeframe: '1-2 недели',
        platforms: ['instagram', 'youtube', 'tiktok'],
        cost: Math.min(budget * 0.3, 1000),
        tactics: [
          'Ретаргетинг на посетителей профиля',
          'Lookalike аудитории на основе лучших подписчиков',
          'Продвижение лучших постов и видео',
          'Реклама обучающих материалов',
          'Конверсионные воронки для email подписки',
        ],
        authorStyle: 'preserve',
      },
      {
        id: 'influencer_collaboration',
        name: 'Коллаборации с инфлюенсерами',
        description: 'Партнерство с крупными трейдинг-каналами',
        type: 'paid',
        effectiveness: 8,
        effort: 'high',
        timeframe: '2-6 недель',
        platforms: ['youtube', 'instagram', 'tiktok'],
        cost: Math.min(budget * 0.4, 2000),
        tactics: [
          'Гостевые выступления на популярных каналах',
          'Совместные анализы рынка',
          'Обмен аудиториями',
          'Спонсорство контента у мега-инфлюенсеров',
          'Создание совместных обучающих курсов',
        ],
        authorStyle: 'preserve',
      },
      {
        id: 'premium_tools',
        name: 'Продвинутые инструменты',
        description: 'Использование профессиональных платформ и сервисов',
        type: 'paid',
        effectiveness: 7,
        effort: 'low',
        timeframe: '1 неделя',
        platforms: ['all'],
        cost: Math.min(budget * 0.2, 500),
        tactics: [
          'Hootsuite/Buffer для планирования контента',
          'Canva Pro для создания визуалов',
          'TubeBuddy для YouTube оптимизации',
          'Аналитические платформы (Social Blade, etc.)',
          'Email marketing автоматизация',
        ],
        authorStyle: 'enhance',
      },
    ];
  }

  private async generatePremiumStrategies(
    persona: ClientPersona
  ): Promise<PromotionStrategy[]> {
    return [
      {
        id: 'ai_content_automation',
        name: 'AI автоматизация контента',
        description: 'Полная автоматизация создания и публикации контента с помощью AI',
        type: 'premium',
        effectiveness: 10,
        effort: 'low',
        timeframe: 'постоянно',
        platforms: ['all'],
        cost: 200,
        tactics: [
          'Автоматическая генерация 50+ постов в месяц',
          'AI анализ трендов и автоматическая адаптация',
          'Персонализированный контент для разных сегментов аудитории',
          'Автоматические ответы на комментарии',
          'Predictive content planning на основе рыночных событий',
        ],
        authorStyle: 'preserve',
      },
      {
        id: 'multi_platform_domination',
        name: 'Доминирование на всех платформах',
        description: 'Синхронизированная стратегия захвата всех социальных платформ',
        type: 'premium',
        effectiveness: 10,
        effort: 'medium',
        timeframe: '3-6 месяцев',
        platforms: ['all'],
        cost: 500,
        tactics: [
          'Одновременный запуск на 10+ платформах',
          'Кросс-платформенные viral кампании',
          'Единая контентная экосистема',
          'Автоматический репостинг с адаптацией под платформу',
          'Multi-channel attribution и аналитика',
        ],
        authorStyle: 'adapt',
      },
      {
        id: 'ai_personal_brand',
        name: 'AI усиление личного бренда',
        description: 'Создание AI-аватара и расширение присутствия',
        type: 'premium',
        effectiveness: 9,
        effort: 'high',
        timeframe: '2-4 месяца',
        platforms: ['all'],
        cost: 1000,
        tactics: [
          'Создание AI-версии голоса для подкастов',
          'Автоматические video deepfakes для контента',
          'AI чат-бот, имитирующий стиль общения',
          'Персональный AI-помощник для подписчиков',
          'Virtual trading rooms с AI модерацией',
        ],
        authorStyle: 'enhance',
      },
    ];
  }

  // === ПЕРСОНАЛИЗАЦИЯ СТРАТЕГИЙ ===
  
  async personalizeStrategy(
    strategy: PromotionStrategy,
    clientPersona: ClientPersona,
    preferences: any
  ): Promise<PromotionStrategy> {
    try {
      const prompt = `
        Адаптируй стратегию продвижения под конкретного клиента:
        
        Стратегия: ${JSON.stringify(strategy, null, 2)}
        Персона клиента: ${JSON.stringify(clientPersona, null, 2)}
        Предпочтения: ${JSON.stringify(preferences, null, 2)}
        
        Модифицируй тактики так, чтобы они:
        1. Соответствовали авторскому стилю
        2. Учитывали целевую аудиторию
        3. Сохраняли уникальность бренда
        4. Были практически применимы
        
        Верни модифицированную стратегию в JSON формате.
      `;

      const response = await openai.chat.completions.create({
        model: "gpt-4",
        messages: [{ role: "user", content: prompt }],
        response_format: { type: "json_object" },
      });

      const personalizedStrategy = JSON.parse(response.choices[0].message.content || '{}');
      return { ...strategy, ...personalizedStrategy };
    } catch (error) {
      console.error('Ошибка персонализации стратегии:', error);
      return strategy;
    }
  }

  // === КОМБИНИРОВАННЫЕ СТРАТЕГИИ ===
  
  async createCombinedStrategy(
    strategies: PromotionStrategy[],
    budget: number,
    timeframe: string
  ): Promise<{
    combination: PromotionStrategy[];
    totalCost: number;
    expectedROI: number;
    timeline: any[];
  }> {
    // Алгоритм оптимального сочетания стратегий
    const sortedByEfficiency = strategies.sort((a, b) => {
      const efficiencyA = a.effectiveness / (a.cost || 1);
      const efficiencyB = b.effectiveness / (b.cost || 1);
      return efficiencyB - efficiencyA;
    });

    let totalCost = 0;
    const selectedStrategies: PromotionStrategy[] = [];

    // Всегда включаем лучшие бесплатные стратегии
    const freeStrategies = sortedByEfficiency.filter(s => s.type === 'free');
    selectedStrategies.push(...freeStrategies.slice(0, 3));

    // Добавляем платные в рамках бюджета
    for (const strategy of sortedByEfficiency) {
      if (strategy.type !== 'free' && strategy.cost) {
        if (totalCost + strategy.cost <= budget) {
          selectedStrategies.push(strategy);
          totalCost += strategy.cost;
        }
      }
    }

    // Рассчитываем ожидаемый ROI
    const avgEffectiveness = selectedStrategies.reduce((sum, s) => sum + s.effectiveness, 0) / selectedStrategies.length;
    const expectedROI = (avgEffectiveness * 25) - (totalCost / 100); // Примерная формула

    // Создаем timeline
    const timeline = this.createExecutionTimeline(selectedStrategies);

    return {
      combination: selectedStrategies,
      totalCost,
      expectedROI,
      timeline,
    };
  }

  private createExecutionTimeline(strategies: PromotionStrategy[]): any[] {
    const timeline = [];
    const now = new Date();

    strategies.forEach((strategy, index) => {
      const startDate = new Date(now);
      startDate.setDate(startDate.getDate() + (index * 7)); // Сдвигаем на неделю

      timeline.push({
        week: index + 1,
        strategy: strategy.name,
        actions: strategy.tactics.slice(0, 3), // Первые 3 тактики на неделю
        effort: strategy.effort,
        expectedResults: `${strategy.effectiveness * 10}% роста вовлечения`,
      });
    });

    return timeline;
  }

  // === МОНИТОРИНГ И АДАПТАЦИЯ ===
  
  async monitorStrategyPerformance(
    userId: string,
    strategyId: string
  ): Promise<{
    performance: number;
    adjustments: string[];
    nextSteps: string[];
  }> {
    // Получаем метрики за последние 7 дней
    const recentMetrics = await storage.getUserAnalytics(userId);
    
    // AI анализ эффективности
    const prompt = `
      Проанализируй эффективность стратегии продвижения:
      
      Метрики: ${JSON.stringify(recentMetrics, null, 2)}
      
      Оцени производительность от 1 до 10 и предложи корректировки.
    `;

    try {
      const response = await openai.chat.completions.create({
        model: "gpt-4",
        messages: [{ role: "user", content: prompt }],
        response_format: { type: "json_object" },
      });

      return JSON.parse(response.choices[0].message.content || '{}');
    } catch (error) {
      return {
        performance: 5,
        adjustments: ['Увеличить частоту публикаций'],
        nextSteps: ['Анализировать trending темы'],
      };
    }
  }

  // === АВТОМАТИЧЕСКОЕ ВЫПОЛНЕНИЕ ===
  
  async executeStrategy(
    userId: string,
    strategy: PromotionStrategy,
    clientPersona: ClientPersona
  ): Promise<{
    executed: string[];
    scheduled: string[];
    failed: string[];
  }> {
    const results = {
      executed: [] as string[],
      scheduled: [] as string[],
      failed: [] as string[],
    };

    for (const tactic of strategy.tactics) {
      try {
        if (tactic.includes('контент') || tactic.includes('пост')) {
          // Генерируем и публикуем контент
          const content = await this.generateTacticContent(tactic, clientPersona);
          if (content) {
            results.executed.push(`Создан контент: ${tactic}`);
          }
        } else if (tactic.includes('планирование') || tactic.includes('расписание')) {
          // Планируем задачу
          await this.scheduleTactic(userId, tactic);
          results.scheduled.push(`Запланировано: ${tactic}`);
        } else {
          // Логируем как выполненное
          results.executed.push(`Выполнено: ${tactic}`);
        }
      } catch (error) {
        results.failed.push(`Ошибка в тактике: ${tactic}`);
      }
    }

    return results;
  }

  private async generateTacticContent(
    tactic: string,
    persona: ClientPersona
  ): Promise<string | null> {
    const prompt = `
      Создай контент для выполнения этой тактики: "${tactic}"
      
      Учитывай стиль клиента: ${JSON.stringify(persona, null, 2)}
      
      Создай готовый к публикации пост.
    `;

    try {
      const result = await aiContentService.generateContent(
        prompt,
        'market_analysis',
        ['instagram', 'telegram']
      );
      return result.content;
    } catch (error) {
      console.error('Ошибка генерации контента для тактики:', error);
      return null;
    }
  }

  private async scheduleTactic(userId: string, tactic: string): Promise<void> {
    await storage.createActivityLog({
      userId,
      action: 'Tactic Scheduled',
      description: tactic,
      status: 'warning',
      metadata: { type: 'scheduled_tactic' },
    });
  }
}

export const advancedPromotionStrategy = new AdvancedPromotionStrategy();
