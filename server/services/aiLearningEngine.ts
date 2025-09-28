
import { storage } from '../storage';
import { aiContentService } from './aiContent';

interface LearningData {
  contentType: string;
  performance: number;
  engagement: number;
  timeOfPost: number;
  hashtags: string[];
  platform: string;
  success: boolean;
}

class AILearningEngine {
  private learningDatabase: LearningData[] = [];

  // Обучение на основе исторических данных
  async trainOnHistoricalData(userId: string): Promise<void> {
    const activities = await storage.getUserActivityLogs(userId, 90); // 90 дней данных
    const analytics = await storage.getUserAnalytics(userId);

    // Собираем обучающие данные
    for (const activity of activities) {
      if (activity.action === 'Post Created' && activity.metadata) {
        const learningPoint: LearningData = {
          contentType: activity.metadata.contentType || 'general',
          performance: Math.random() * 100, // Заменить на реальные метрики
          engagement: Math.random() * 10,
          timeOfPost: new Date(activity.createdAt).getHours(),
          hashtags: activity.metadata.hashtags || [],
          platform: activity.metadata.platform || 'unknown',
          success: activity.status === 'success',
        };
        
        this.learningDatabase.push(learningPoint);
      }
    }

    console.log(`🧠 AI обучен на ${this.learningDatabase.length} точках данных`);
  }

  // Предсказание успешности контента
  async predictContentSuccess(
    contentType: string,
    timeOfPost: number,
    hashtags: string[],
    platform: string
  ): Promise<{
    successProbability: number;
    recommendations: string[];
    optimizationSuggestions: string[];
  }> {
    // Простой алгоритм предсказания (можно заменить на ML модель)
    const similarPosts = this.learningDatabase.filter(data => 
      data.contentType === contentType && 
      data.platform === platform
    );

    const avgPerformance = similarPosts.length > 0 
      ? similarPosts.reduce((sum, data) => sum + data.performance, 0) / similarPosts.length
      : 50;

    const timeFactors = this.analyzeOptimalTimes(platform);
    const hashtagFactors = this.analyzeHashtagPerformance(hashtags, platform);

    const successProbability = Math.min(
      (avgPerformance + timeFactors + hashtagFactors) / 3,
      100
    );

    return {
      successProbability,
      recommendations: [
        `Лучшее время для ${platform}: ${this.getBestTime(platform)}`,
        `Рекомендуемые хештеги: ${this.getBestHashtags(platform).join(', ')}`,
        `Оптимальная длина контента: ${this.getOptimalLength(platform)} символов`,
      ],
      optimizationSuggestions: [
        successProbability < 70 ? 'Рассмотрите изменение времени публикации' : '',
        hashtagFactors < 50 ? 'Используйте более популярные хештеги' : '',
        avgPerformance < 60 ? 'Попробуйте другой тип контента' : '',
      ].filter(Boolean),
    };
  }

  // Автоматическая оптимизация контента
  async optimizeContent(
    originalContent: string,
    platform: string,
    targetMetrics: { engagement: number; reach: number }
  ): Promise<{
    optimizedContent: string;
    improvements: string[];
    expectedIncrease: number;
  }> {
    const prediction = await this.predictContentSuccess(
      'trading_analysis',
      new Date().getHours(),
      this.extractHashtags(originalContent),
      platform
    );

    let optimizedContent = originalContent;
    const improvements: string[] = [];

    // Оптимизация на основе обученных данных
    if (prediction.successProbability < 80) {
      // Добавляем лучшие хештеги
      const bestHashtags = this.getBestHashtags(platform);
      optimizedContent += '\n\n' + bestHashtags.join(' ');
      improvements.push('Добавлены высокоэффективные хештеги');

      // Оптимизируем структуру
      if (platform === 'tiktok') {
        optimizedContent = this.optimizeForTikTok(optimizedContent);
        improvements.push('Адаптирован для TikTok алгоритма');
      }
    }

    const expectedIncrease = 100 - prediction.successProbability;

    return {
      optimizedContent,
      improvements,
      expectedIncrease,
    };
  }

  // Непрерывное обучение на новых данных
  async updateLearningModel(
    postId: string,
    actualPerformance: number,
    actualEngagement: number
  ): Promise<void> {
    // Обновляем модель на основе реальных результатов
    const relevantData = this.learningDatabase.find(data => 
      data.performance === actualPerformance
    );

    if (relevantData) {
      relevantData.performance = actualPerformance;
      relevantData.engagement = actualEngagement;
      relevantData.success = actualPerformance > 70;
    }

    // Логируем улучшение точности
    await storage.createActivityLog({
      userId: 'system',
      action: 'AI Model Updated',
      description: `Модель обновлена на основе реальных данных поста ${postId}`,
      status: 'success',
      metadata: { actualPerformance, actualEngagement },
    });
  }

  // Вспомогательные методы
  private analyzeOptimalTimes(platform: string): number {
    const optimalTimes = {
      tiktok: [9, 12, 15, 19],
      youtube: [14, 16, 20],
      telegram: [8, 12, 18, 21],
      instagram: [11, 14, 17, 19],
    };

    const currentHour = new Date().getHours();
    const platformTimes = optimalTimes[platform as keyof typeof optimalTimes] || [12, 18];
    
    return platformTimes.includes(currentHour) ? 80 : 40;
  }

  private analyzeHashtagPerformance(hashtags: string[], platform: string): number {
    const topHashtags = {
      tiktok: ['#trading', '#forex', '#crypto', '#money', '#investment'],
      youtube: ['#technicalanalysis', '#trading', '#cryptocurrency', '#investing'],
      telegram: ['#signals', '#trading', '#forex', '#crypto'],
      instagram: ['#trader', '#forex', '#investment', '#crypto', '#trading'],
    };

    const platformHashtags = topHashtags[platform as keyof typeof topHashtags] || [];
    const matches = hashtags.filter(tag => platformHashtags.includes(tag)).length;
    
    return (matches / Math.max(hashtags.length, 1)) * 100;
  }

  private getBestTime(platform: string): string {
    const times = {
      tiktok: '9:00, 15:00, 19:00',
      youtube: '14:00, 20:00',
      telegram: '8:00, 18:00',
      instagram: '11:00, 17:00',
    };

    return times[platform as keyof typeof times] || '12:00, 18:00';
  }

  private getBestHashtags(platform: string): string[] {
    const hashtags = {
      tiktok: ['#trading', '#forex', '#crypto', '#money'],
      youtube: ['#technicalanalysis', '#trading', '#investing'],
      telegram: ['#signals', '#trading', '#forex'],
      instagram: ['#trader', '#forex', '#investment', '#crypto'],
    };

    return hashtags[platform as keyof typeof hashtags] || ['#trading', '#forex'];
  }

  private getOptimalLength(platform: string): number {
    const lengths = {
      tiktok: 150,
      youtube: 500,
      telegram: 300,
      instagram: 200,
    };

    return lengths[platform as keyof typeof lengths] || 250;
  }

  private extractHashtags(content: string): string[] {
    return content.match(/#\w+/g) || [];
  }

  private optimizeForTikTok(content: string): string {
    // Добавляем hook для TikTok
    const hooks = [
      '🚨 СРОЧНО! ',
      '💰 ЭТО ИЗМЕНИТ ВСЁ! ',
      '⚡ ПРЯМО СЕЙЧАС! ',
      '🔥 НЕ ПРОПУСТИ! ',
    ];
    
    const randomHook = hooks[Math.floor(Math.random() * hooks.length)];
    return randomHook + content;
  }
}

export const aiLearningEngine = new AILearningEngine();

// Экспорт интерфейсов для использования в других модулях
export type { LearningData };
export { AILearningEngine };
