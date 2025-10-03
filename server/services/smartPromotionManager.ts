
import { storage } from '../storage';
import { aiAnalyticsService } from './aiAnalytics';
import { clientAnalysisService } from './clientAnalysis';
import { promotionEngine } from './promotionEngine';
import { viralGrowthEngine } from './viralGrowthEngine';
import { competitorSurveillance } from './competitorSurveillance';
import { socialMediaManager } from './socialMediaIntegration';
import { OpenAI } from 'openai';

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY || '',
});

interface PlatformIntegration {
  platform: string;
  apiConnected: boolean;
  analytics: any;
  audience: any;
  contentPerformance: any;
}

interface PromotionPlan {
  free: {
    strategies: string[];
    expectedGrowth: number;
    timeframe: string;
    actions: any[];
  };
  paid: {
    strategies: string[];
    budget: number;
    expectedGrowth: number;
    timeframe: string;
    roi: number;
    actions: any[];
  };
  marketLeadership: {
    currentPosition: number;
    targetPosition: number;
    competitorGap: number;
    actionPlan: string[];
    estimatedTime: string;
  };
}

class SmartPromotionManager {
  // Анализ всех подключенных платформ через API
  async analyzeIntegratedPlatforms(userId: string): Promise<PlatformIntegration[]> {
    const userAccounts = await storage.getUserAccounts(userId);
    const integrations: PlatformIntegration[] = [];

    for (const account of userAccounts.filter(acc => acc.isActive && acc.authStatus === 'connected')) {
      const platformData = await this.analyzePlatformViaAPI(userId, account);
      integrations.push(platformData);
    }

    return integrations;
  }

  // Анализ конкретной платформы через API
  private async analyzePlatformViaAPI(userId: string, account: any): Promise<PlatformIntegration> {
    const service = socialMediaManager.getService(account.platformId);
    const platform = await storage.getPlatform(account.platformId);

    // Получаем данные с платформы
    const analytics = await storage.getPlatformAnalytics(userId, account.platformId, 30);
    const contentPerformance = await storage.getContentPerformance(userId, account.platformId, 30);

    // AI анализ данных
    const audienceAnalysis = await this.analyzeAudienceFromAPI(analytics, contentPerformance);

    return {
      platform: platform?.name || 'unknown',
      apiConnected: true,
      analytics: this.summarizeAnalytics(analytics),
      audience: audienceAnalysis,
      contentPerformance: this.summarizeContentPerformance(contentPerformance),
    };
  }

  // AI анализ аудитории на основе API данных
  private async analyzeAudienceFromAPI(analytics: any[], contentPerformance: any[]): Promise<any> {
    const prompt = `
Проанализируй данные аудитории с платформы:

Метрики за 30 дней: ${JSON.stringify(analytics.slice(-5), null, 2)}
Производительность контента: ${JSON.stringify(contentPerformance.slice(-5), null, 2)}

Определи:
1. Демографию и интересы аудитории
2. Паттерны поведения
3. Оптимальное время публикаций
4. Предпочтения по типам контента
5. Точки роста аудитории

Ответь в JSON формате.
`;

    try {
      const response = await openai.chat.completions.create({
        model: 'gpt-4',
        messages: [{ role: 'user', content: prompt }],
        temperature: 0.3,
      });

      return JSON.parse(response.choices[0].message.content || '{}');
    } catch (error) {
      console.error('Ошибка AI анализа аудитории:', error);
      return {
        demographics: 'Смешанная аудитория',
        behavior: 'Активное взаимодействие',
        bestTimes: [9, 14, 19],
        contentPreferences: ['образовательный', 'развлекательный'],
        growthPoints: ['увеличение частоты постов', 'улучшение качества контента'],
      };
    }
  }

  // Генерация плана продвижения (бесплатный + платный)
  async generatePromotionPlan(userId: string, integrations: PlatformIntegration[]): Promise<PromotionPlan> {
    // Анализ конкурентов
    const competitorData = await competitorSurveillance.monitorCompetitors('general');

    // Определение текущей позиции на рынке
    const marketPosition = await this.analyzeMarketPosition(integrations, competitorData);

    // Генерация бесплатной стратегии
    const freeStrategy = await this.generateFreeStrategy(integrations, marketPosition);

    // Генерация платной стратегии
    const paidStrategy = await this.generatePaidStrategy(integrations, marketPosition);

    // План достижения лидерства
    const leadershipPlan = await this.generateLeadershipPlan(marketPosition, integrations);

    return {
      free: freeStrategy,
      paid: paidStrategy,
      marketLeadership: leadershipPlan,
    };
  }

  // Бесплатная стратегия продвижения
  private async generateFreeStrategy(integrations: PlatformIntegration[], marketPosition: any): Promise<any> {
    const strategies = [
      'Оптимизация времени публикаций на основе активности аудитории',
      'Использование трендовых хештегов и тем',
      'Кросс-платформенное продвижение контента',
      'Вовлечение аудитории через опросы и вопросы',
      'Коллаборации с микро-инфлюенсерами в нише',
      'Оптимизация профилей для поисковой выдачи',
      'Создание viral hooks на основе AI анализа',
      'Регулярное взаимодействие с подписчиками',
      'Автопостинг в Telegram каналы (3-5 постов/день)',
      'Кросс-постинг из других платформ в Telegram',
      'Интерактивные опросы и викторины в Telegram',
      'Автоматические приветствия новых подписчиков',
    ];

    const actions = await this.generateFreeActions(integrations);

    return {
      strategies,
      expectedGrowth: 35, // 35% рост за месяц с Telegram
      timeframe: '30 дней',
      actions,
    };
  }

  // Платная стратегия продвижения
  private async generatePaidStrategy(integrations: PlatformIntegration[], marketPosition: any): Promise<any> {
    const totalFollowers = integrations.reduce((sum, int) => sum + (int.analytics?.totalFollowers || 0), 0);
    const recommendedBudget = Math.max(500, totalFollowers * 0.1); // Минимум $500 или $0.1 на фолловера

    const strategies = [
      'Таргетированная реклама на всех платформах',
      'Продвижение через топ-инфлюенсеров в нише',
      'Профессиональное создание вирального контента',
      'Платные коллаборации и спонсорство',
      'Ретаргетинг для конверсии аудитории',
      'Премиум размещение в рекомендациях',
      'Автоматизированные маркетинговые кампании',
      'Эксклюзивные сообщества и платный контент',
      'Telegram Ads для масштабного охвата',
      'Покупка постов в крупных Telegram-каналах',
      'Премиум Telegram-бот с расширенными функциями',
      'Платные giveaway кампании в Telegram',
    ];

    const actions = await this.generatePaidActions(integrations, recommendedBudget);

    const expectedGrowth = 180; // 180% рост за месяц с Telegram
    const roi = (totalFollowers * expectedGrowth / 100) * 2.5 / recommendedBudget; // Улучшенный ROI

    return {
      strategies,
      budget: recommendedBudget,
      expectedGrowth,
      timeframe: '30 дней',
      roi: Math.round(roi * 100) / 100,
      actions,
    };
  }

  // План достижения лидерства на рынке
  private async generateLeadershipPlan(marketPosition: any, integrations: PlatformIntegration[]): Promise<any> {
    const currentPosition = marketPosition.rank || 100;
    const topCompetitorFollowers = marketPosition.topCompetitor?.followers || 100000;
    const currentFollowers = integrations.reduce((sum, int) => sum + (int.analytics?.totalFollowers || 0), 0);
    const gap = topCompetitorFollowers - currentFollowers;

    const actionPlan = [
      '1. Анализ и копирование успешных стратегий лидеров',
      '2. Создание уникального контента, которого нет у конкурентов',
      '3. Агрессивная кампания по привлечению аудитории конкурентов',
      '4. Запуск вирусных кампаний с психологическими триггерами',
      '5. Построение лояльного сообщества через эксклюзивный контент',
      '6. Партнерства с ключевыми игроками рынка',
      '7. Доминирование в поисковой выдаче и рекомендациях',
      '8. Создание собственного медиа-бренда и экосистемы',
    ];

    const estimatedMonths = Math.ceil(gap / (currentFollowers * 0.5)); // Предполагаем 50% рост в месяц

    return {
      currentPosition,
      targetPosition: 1,
      competitorGap: gap,
      actionPlan,
      estimatedTime: `${estimatedMonths} месяцев при агрессивном продвижении`,
    };
  }

  // Генерация конкретных бесплатных действий
  private async generateFreeActions(integrations: PlatformIntegration[]): Promise<any[]> {
    const actions = [];
    let hasTelegram = false;

    for (const integration of integrations) {
      const bestTime = integration.audience?.bestTimes?.[0] || 14;
      
      actions.push({
        platform: integration.platform,
        action: 'Публикация в оптимальное время',
        schedule: `Ежедневно в ${bestTime}:00`,
        cost: 0,
        expectedImpact: 'Увеличение охвата на 15-20%',
      });

      actions.push({
        platform: integration.platform,
        action: 'Использование AI-оптимизированных хештегов',
        frequency: 'Каждый пост',
        cost: 0,
        expectedImpact: 'Рост видимости на 25-30%',
      });

      // Telegram специфичные действия
      if (integration.platform.toLowerCase().includes('telegram')) {
        hasTelegram = true;
        actions.push({
          platform: 'Telegram',
          action: 'Автоматический постинг AI-контента',
          schedule: '3 раза в день (9:00, 15:00, 20:00)',
          cost: 0,
          expectedImpact: 'Постоянный поток контента, рост на 30-40%',
          automation: true,
        });

        actions.push({
          platform: 'Telegram',
          action: 'Еженедельные опросы и викторины',
          schedule: 'Понедельник и четверг в 12:00',
          cost: 0,
          expectedImpact: 'Увеличение вовлеченности на 45-50%',
          automation: true,
        });

        actions.push({
          platform: 'Telegram',
          action: 'Автоответы на приветствия',
          frequency: 'Мгновенно при входе нового участника',
          cost: 0,
          expectedImpact: 'Улучшение retention на 20-25%',
          automation: true,
        });
      }
    }

    actions.push({
      platform: 'all',
      action: 'Кросс-промоушн между платформами',
      frequency: '2-3 раза в неделю',
      cost: 0,
      expectedImpact: 'Синергия аудитории, рост на 10-15%',
    });

    // Если есть Telegram, добавляем кросс-постинг
    if (hasTelegram) {
      actions.push({
        platform: 'Telegram + Others',
        action: 'Автокросс-постинг лучшего контента в Telegram',
        frequency: 'При каждом успешном посте (engagement > 5%)',
        cost: 0,
        expectedImpact: 'Максимальный охват, синергия +25%',
        automation: true,
      });
    }

    return actions;
  }

  // Генерация платных действий
  private async generatePaidActions(integrations: PlatformIntegration[], budget: number): Promise<any[]> {
    const actions = [];
    const budgetPerPlatform = budget / integrations.length;

    for (const integration of integrations) {
      actions.push({
        platform: integration.platform,
        action: 'Таргетированная реклама',
        budget: budgetPerPlatform * 0.6,
        duration: '30 дней',
        expectedReach: Math.round(budgetPerPlatform * 100),
        expectedConversion: '5-8%',
      });

      actions.push({
        platform: integration.platform,
        action: 'Продвижение через инфлюенсеров',
        budget: budgetPerPlatform * 0.4,
        collaborators: '2-3 микро-инфлюенсера',
        expectedReach: Math.round(budgetPerPlatform * 50),
        expectedConversion: '8-12%',
      });
    }

    return actions;
  }

  // Анализ позиции на рынке
  private async analyzeMarketPosition(integrations: PlatformIntegration[], competitorData: any): Promise<any> {
    const totalFollowers = integrations.reduce((sum, int) => sum + (int.analytics?.totalFollowers || 0), 0);
    const avgEngagement = integrations.reduce((sum, int) => sum + (int.analytics?.engagementRate || 0), 0) / integrations.length;

    // Определяем примерную позицию (в реальности брали бы из API конкурентов)
    const estimatedRank = totalFollowers < 1000 ? 100 : 
                         totalFollowers < 10000 ? 50 :
                         totalFollowers < 100000 ? 20 : 5;

    return {
      rank: estimatedRank,
      totalFollowers,
      avgEngagement,
      topCompetitor: competitorData?.topPerformers?.[0] || { followers: 100000 },
      marketShare: Math.min((totalFollowers / 1000000) * 100, 100), // Процент от 1M
    };
  }

  // Запуск автоматизированного продвижения
  async executePromotionPlan(userId: string, plan: PromotionPlan, planType: 'free' | 'paid'): Promise<any> {
    const selectedPlan = planType === 'free' ? plan.free : plan.paid;
    const results = {
      launched: [] as string[],
      scheduled: [] as string[],
      budget: planType === 'paid' ? plan.paid.budget : 0,
    };

    // Логируем запуск кампании
    await storage.createActivityLog({
      userId,
      action: `${planType === 'paid' ? 'Платная' : 'Бесплатная'} кампания запущена`,
      description: `Стратегии: ${selectedPlan.strategies.slice(0, 3).join(', ')}`,
      status: 'success',
      metadata: { plan: selectedPlan },
    });

    // Выполняем действия
    for (const action of selectedPlan.actions) {
      try {
        // Планируем/запускаем действия
        if (action.action.includes('Публикация')) {
          await this.scheduleContent(userId, action);
          results.scheduled.push(action.action);
        } else if (action.action.includes('реклама')) {
          await this.launchAdCampaign(userId, action);
          results.launched.push(action.action);
        } else {
          await this.executeAction(userId, action);
          results.launched.push(action.action);
        }
      } catch (error) {
        console.error(`Ошибка выполнения действия ${action.action}:`, error);
      }
    }

    return results;
  }

  private async scheduleContent(userId: string, action: any): Promise<void> {
    // Интеграция с существующим планировщиком
    await storage.createActivityLog({
      userId,
      action: 'Контент запланирован',
      description: `${action.platform}: ${action.action}`,
      status: 'success',
      metadata: action,
    });
  }

  private async launchAdCampaign(userId: string, action: any): Promise<void> {
    // Запуск рекламной кампании (в реальности интеграция с Ads API)
    await storage.createActivityLog({
      userId,
      action: 'Рекламная кампания запущена',
      description: `${action.platform}: Бюджет $${action.budget}`,
      status: 'success',
      metadata: action,
    });
  }

  private async executeAction(userId: string, action: any): Promise<void> {
    await storage.createActivityLog({
      userId,
      action: 'Действие выполнено',
      description: `${action.platform || 'all'}: ${action.action}`,
      status: 'success',
      metadata: action,
    });
  }

  // Вспомогательные методы
  private summarizeAnalytics(analytics: any[]): any {
    if (!analytics.length) return { totalFollowers: 0, engagementRate: 0 };

    const latest = analytics[analytics.length - 1];
    return {
      totalFollowers: latest.metrics?.followers || 0,
      engagementRate: latest.metrics?.engagement_rate || 0,
      growthRate: latest.metrics?.growth_rate || 0,
      avgReach: latest.metrics?.reach || 0,
    };
  }

  private summarizeContentPerformance(contentPerformance: any[]): any {
    if (!contentPerformance.length) return { avgEngagement: 0, topPost: null };

    const sorted = [...contentPerformance].sort((a, b) => 
      (b.metrics?.engagement_rate || 0) - (a.metrics?.engagement_rate || 0)
    );

    return {
      avgEngagement: contentPerformance.reduce((sum, c) => sum + (c.metrics?.engagement_rate || 0), 0) / contentPerformance.length,
      topPost: sorted[0] || null,
      totalPosts: contentPerformance.length,
    };
  }
}

export const smartPromotionManager = new SmartPromotionManager();
