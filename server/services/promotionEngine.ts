import { aiContentService } from './aiContent';
import { socialMediaManager } from './socialMediaIntegration';
import { storage } from '../storage';
import { safetyService } from './safety';
import { aiAnalyticsService } from './aiAnalytics';

interface PromotionStrategy {
  clientId: string;
  platforms: string[];
  contentCalendar: ContentCalendarEntry[];
  targetMetrics: {
    followerGrowth: number;
    engagementIncrease: number;
    reachExpansion: number;
  };
  budget: {
    aiCredits: number;
    paidPromotion?: number;
  };
}

interface ContentCalendarEntry {
  date: string;
  platform: string;
  contentType: string;
  topic: string;
  scheduledTime: string;
  targeting?: {
    hashtags: string[];
    audience: string;
  };
}

class PromotionEngine {
  async createPromotionStrategy(clientProfile: any): Promise<PromotionStrategy> {
    console.log('🎯 Создание стратегии продвижения для:', clientProfile.name);

    // Анализ конкурентов для определения лучших практик
    const competitorInsights = await this.analyzeCompetitorStrategies(clientProfile.niche);

    // Создание контент-календаря на 30 дней
    const contentCalendar = await this.generateContentCalendar(clientProfile, 30);

    // Определение целевых метрик
    const targetMetrics = this.calculateTargetMetrics(clientProfile);

    return {
      clientId: clientProfile.name,
      platforms: Object.keys(clientProfile.platforms),
      contentCalendar,
      targetMetrics,
      budget: {
        aiCredits: 2000, // Примерный бюджет на месяц
        paidPromotion: 500, // USD
      },
    };
  }

  private async analyzeCompetitorStrategies(niche: string) {
    // Анализ стратегий топ-конкурентов в трейдинге
    return {
      bestPostingTimes: {
        youtube: ['09:00', '14:00', '19:00'],
        tiktok: ['08:00', '12:00', '17:00', '21:00'],
        telegram: ['07:00', '12:00', '18:00', '22:00'],
      },
      topHashtags: {
        general: ['#трейдинг', '#форекс', '#криптовалюты', '#сигналы', '#анализ'],
        trending: ['#btc2025', '#tradingview', '#technicalanalysis', '#daytrading'],
        niche: ['#forexsignals', '#cryptosignals', '#fxtrading', '#bitcoinanalysis'],
      },
      contentTypes: {
        educational: 40,
        signals: 30,
        analysis: 20,
        entertainment: 10,
      },
    };
  }

  private async generateContentCalendar(clientProfile: any, days: number): Promise<ContentCalendarEntry[]> {
    const calendar: ContentCalendarEntry[] = [];
    const competitorData = await this.analyzeCompetitorStrategies(clientProfile.niche);

    const contentTypes = [
      'Торговый сигнал',
      'Технический анализ',
      'Обучающий контент',
      'Рыночная аналитика',
      'Психология трейдинга',
      'Разбор сделки',
    ];

    const platforms = ['youtube', 'tiktok', 'telegram'];

    for (let day = 0; day < days; day++) {
      const date = new Date();
      date.setDate(date.getDate() + day);
      const dateStr = date.toISOString().split('T')[0];

      // YouTube - 4-5 видео в неделю
      if ([1, 3, 5, 0].includes(date.getDay())) {
        calendar.push({
          date: dateStr,
          platform: 'youtube',
          contentType: contentTypes[Math.floor(Math.random() * contentTypes.length)],
          topic: this.generateTopicForDate(date, 'youtube'),
          scheduledTime: competitorData.bestPostingTimes.youtube[Math.floor(Math.random() * 3)],
          targeting: {
            hashtags: ['#форекс', '#трейдинг', '#анализ', '#обучение'],
            audience: 'Трейдеры 25-45 лет',
          },
        });
      }

      // TikTok - ежедневно
      calendar.push({
        date: dateStr,
        platform: 'tiktok',
        contentType: 'Короткий сигнал/тренд',
        topic: this.generateTopicForDate(date, 'tiktok'),
        scheduledTime: competitorData.bestPostingTimes.tiktok[Math.floor(Math.random() * 4)],
        targeting: {
          hashtags: ['#форекс', '#трейдинг', '#сигналы', '#crypto', '#fx'],
          audience: 'Молодые трейдеры 18-35 лет',
        },
      });

      // Telegram - 3-5 постов в день
      for (let post = 0; post < 3; post++) {
        calendar.push({
          date: dateStr,
          platform: 'telegram',
          contentType: post === 0 ? 'Утренний анализ' : post === 1 ? 'Дневной сигнал' : 'Вечерний обзор',
          topic: this.generateTopicForDate(date, 'telegram', post),
          scheduledTime: competitorData.bestPostingTimes.telegram[post] || '12:00',
          targeting: {
            hashtags: [],
            audience: 'Подписчики канала',
          },
        });
      }
    }

    return calendar;
  }

  private generateTopicForDate(date: Date, platform: string, postIndex?: number): string {
    const topics = {
      youtube: [
        'Полный анализ EUR/USD на неделю',
        'Как читать японские свечи: практический урок',
        'Топ-5 ошибок начинающих трейдеров',
        'Торговые сигналы на золото: стратегия',
        'Психология трейдинга: как не сливать депозит',
      ],
      tiktok: [
        'Сигнал дня: BTC готовится к росту',
        'Простая стратегия для новичков',
        'Почему 90% трейдеров теряют деньги',
        'Криптовалюты сегодня: что покупать',
        'Секрет профитной торговли',
      ],
      telegram: [
        'Утренний обзор рынков и план на день',
        'СИГНАЛ: EUR/USD покупка от поддержки',
        'Вечерний разбор торговых идей',
      ],
    };

    const platformTopics = topics[platform as keyof typeof topics] || topics.telegram;
    if (postIndex !== undefined && platform === 'telegram') {
      return platformTopics[postIndex] || platformTopics[0];
    }

    return platformTopics[Math.floor(Math.random() * platformTopics.length)];
  }

  private calculateTargetMetrics(clientProfile: any) {
    const current = clientProfile.growthMetrics.currentReach;
    const target = clientProfile.growthMetrics.targetReach;

    return {
      followerGrowth: Math.round((target - current) * 0.15), // 15% в месяц
      engagementIncrease: 25, // +25% вовлечение
      reachExpansion: Math.round((target - current) * 0.12), // +12% охват
    };
  }

  // Автоматическое выполнение стратегии продвижения
  async executePromotionStrategy(
    userId: string, 
    strategy: PromotionStrategy
  ): Promise<{ executed: number; scheduled: number; errors: string[] }> {
    console.log('🚀 Запуск автоматического продвижения...');

    let executed = 0;
    let scheduled = 0;
    const errors: string[] = [];

    // Получаем задачи на сегодня
    const today = new Date().toISOString().split('T')[0];
    const todayTasks = strategy.contentCalendar.filter(task => task.date === today);

    for (const task of todayTasks) {
      try {
        // Проверяем безопасность
        const safetyCheck = await safetyService.performSafetyCheck(userId);
        if (safetyCheck.issues.length > 0) {
          errors.push(`Безопасность: ${safetyCheck.issues.join(', ')}`);
          continue;
        }

        // Генерируем контент с AI
        const content = await this.generateContentForTask(task);
        if (!content) {
          errors.push(`Не удалось сгенерировать контент для ${task.platform}`);
          continue;
        }

        // Проверяем время публикации
        const currentTime = new Date();
        const scheduledTime = new Date(`${task.date}T${task.scheduledTime}:00`);

        if (scheduledTime <= currentTime) {
          // Публикуем сейчас
          const result = await this.publishContent(userId, task.platform, content);
          if (result.success) {
            executed++;
            await this.logPromotionActivity(userId, task, 'executed', content);
          } else {
            errors.push(`Ошибка публикации ${task.platform}: ${result.error}`);
          }
        } else {
          // Планируем на будущее
          await this.scheduleContent(userId, task, content);
          scheduled++;
          await this.logPromotionActivity(userId, task, 'scheduled', content);
        }

      } catch (error) {
        errors.push(`Ошибка обработки задачи ${task.platform}: ${error.message}`);
      }
    }

    console.log(`✅ Продвижение выполнено: ${executed} опубликовано, ${scheduled} запланировано`);
    return { executed, scheduled, errors };
  }

  private async generateContentForTask(task: ContentCalendarEntry): Promise<string | null> {
    try {
      let contentType = 'market_analysis';

      if (task.contentType.includes('сигнал') || task.contentType.includes('СИГНАЛ')) {
        contentType = 'live_signal';
      } else if (task.contentType.includes('обучающий') || task.contentType.includes('урок')) {
        contentType = 'forex_education';
      } else if (task.platform === 'tiktok') {
        contentType = 'viral_tiktok';
      }

      const result = await aiContentService.generateContent(
        `Создай ${task.contentType.toLowerCase()} на тему: ${task.topic}. 
         Платформа: ${task.platform}. 
         Целевая аудитория: ${task.targeting?.audience || 'трейдеры'}.`,
        contentType,
        [task.platform]
      );

      return result.content;
    } catch (error) {
      console.error('Ошибка генерации контента:', error);
      return null;
    }
  }

  private async publishContent(userId: string, platform: string, content: string) {
    try {
      // Публикуем через социальные сети
      const result = await socialMediaManager.postToAllPlatforms(userId, {
        content,
        mediaUrls: [],
      });

      return { success: true, result };
    } catch (error) {
      return { success: false, error: error.message };
    }
  }

  private async scheduleContent(userId: string, task: ContentCalendarEntry, content: string) {
    // Планируем контент через планировщик
    // Здесь бы использовался schedulerService для отложенной публикации
    console.log(`📅 Запланировано: ${task.platform} на ${task.date} ${task.scheduledTime}`);
  }

  private async logPromotionActivity(
    userId: string, 
    task: ContentCalendarEntry, 
    status: string, 
    content: string
  ) {
    await storage.createActivityLog({
      userId,
      action: `Promotion ${status}`,
      description: `${task.platform}: ${task.contentType} - ${task.topic.substring(0, 50)}...`,
      status: status === 'executed' ? 'success' : 'warning',
      metadata: { task, content: content.substring(0, 100) },
    });
  }

  // Анализ эффективности продвижения
  async analyzePromotionResults(userId: string, days: number = 7) {
    try {
      // Получаем аналитику за период
      const analytics = await analyticsService.getEngagementAnalytics(userId, days);
      const activities = await storage.getUserActivities(userId, days);

      const promotionActivities = activities.filter(a => 
        a.action.includes('Promotion') || a.action.includes('Post')
      );

      // Анализ с AI
      const aiAnalysis = await aiAnalyticsService.analyzeAudience(userId, 1); // Instagram как пример

      return {
        summary: {
          totalPosts: promotionActivities.length,
          avgEngagement: analytics.reduce((sum, a) => sum + a.totalEngagement, 0) / analytics.length,
          reachGrowth: this.calculateReachGrowth(analytics),
          topPerforming: this.findTopPerformingContent(analytics),
        },
        recommendations: [
          'Увеличить частоту постинга в TikTok',
          'Сосредоточиться на сигналах в Telegram',
          'Добавить больше обучающего контента на YouTube',
        ],
        nextSteps: [
          'Оптимизировать время публикации',
          'Адаптировать контент под аудиторию',
          'Увеличить интерактивность постов',
        ],
      };
    } catch (error) {
      console.error('Ошибка анализа результатов:', error);
      throw error;
    }
  }

  private calculateReachGrowth(analytics: any[]): number {
    if (analytics.length < 2) return 0;
    const latest = analytics[analytics.length - 1];
    const previous = analytics[analytics.length - 2];
    return ((latest.totalEngagement - previous.totalEngagement) / previous.totalEngagement) * 100;
  }

  private findTopPerformingContent(analytics: any[]) {
    return analytics
      .sort((a, b) => b.totalEngagement - a.totalEngagement)
      .slice(0, 3)
      .map(a => ({
        platform: a.platform,
        engagement: a.totalEngagement,
        type: 'Высокая вовлеченность',
      }));
  }
}

export const promotionEngine = new PromotionEngine();