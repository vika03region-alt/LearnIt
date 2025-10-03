import { storage } from '../storage';
import { aiContentService } from './aiContent';
import { realTimeIntegrations } from './realTimeIntegrations';

interface ViralMetrics {
  shareability: number;
  emotionalImpact: number;
  timeliness: number;
  uniqueness: number;
  platformCompatibility: number;
}

interface ViralContent {
  content: string;
  platform: string;
  viralScore: number;
  expectedReach: number;
  hashtags: string[];
  postingTime: Date;
  hooks: string[];
}

class ViralGrowthEngine {
  // === АНАЛИЗ ВИРУСНОГО ПОТЕНЦИАЛА В РЕАЛЬНОМ ВРЕМЕНИ ===
  
  async analyzeViralPotential(content: string, platform: string): Promise<ViralMetrics> {
    // AI анализ вирусности
    const shareability = await this.calculateShareability(content, platform);
    const emotionalImpact = await this.calculateEmotionalImpact(content);
    const timeliness = await this.calculateTimeliness(content);
    const uniqueness = await this.calculateUniqueness(content, platform);
    const platformCompatibility = await this.calculatePlatformCompatibility(content, platform);

    return {
      shareability,
      emotionalImpact,
      timeliness,
      uniqueness,
      platformCompatibility,
    };
  }

  // === АВТОМАТИЧЕСКАЯ ГЕНЕРАЦИЯ ВИРУСНОГО КОНТЕНТА ===
  
  async generateViralContent(
    niche: string, 
    platform: string, 
    targetEmotion: string = 'excitement',
    brandName?: string
  ): Promise<ViralContent> {
    // 1. Анализируем топовые вирусные видео в нише
    const topViralVideos = await this.analyzeTopViralVideos(platform, niche);
    
    // 2. Извлекаем паттерны успеха
    const successPatterns = await this.extractSuccessPatterns(topViralVideos);
    
    // 3. Получаем текущие тренды
    const currentTrends = await this.getCurrentTrends(platform, niche);
    
    // 4. Генерируем вирусные хуки на основе анализа
    const viralHooks = await this.generateViralHooksFromAnalysis(
      targetEmotion, 
      niche, 
      successPatterns
    );
    
    // 5. Определяем оптимальное время публикации
    const optimalTiming = await this.calculateOptimalPostingTime(platform);
    
    // 6. Создаем контент с учетом всех данных и бренда
    const content = await this.createViralContentWithBrand({
      niche,
      platform,
      trends: currentTrends,
      hooks: viralHooks,
      emotion: targetEmotion,
      successPatterns,
      brandName,
      topVideos: topViralVideos,
    });

    const viralScore = await this.calculateViralScore(content, platform);
    const expectedReach = this.estimateReach(viralScore, platform);

    return {
      content: content.text,
      platform,
      viralScore,
      expectedReach,
      hashtags: content.hashtags,
      postingTime: optimalTiming,
      hooks: viralHooks,
    };
  }

  // === АНАЛИЗ ТОПОВЫХ ВИРУСНЫХ ВИДЕО ===
  
  private async analyzeTopViralVideos(platform: string, niche: string): Promise<any[]> {
    // Симуляция анализа топовых видео
    // В production это будет реальный API анализ TikTok/YouTube/Instagram
    return [
      {
        title: 'BITCOIN TO $150K! Here\'s Why...',
        views: 2500000,
        likes: 180000,
        engagement: 7.2,
        hooks: ['Шокирующий прогноз', 'Эксклюзивный анализ', 'Срочная информация'],
        visualElements: ['графики', 'анимация цен', 'эмоциональная реакция'],
        duration: 45,
        viralScore: 95,
      },
      {
        title: '99% Traders DON\'T KNOW This Secret Strategy',
        views: 1800000,
        likes: 120000,
        engagement: 6.7,
        hooks: ['Секретная стратегия', 'Что скрывают трейдеры', 'Проверенный метод'],
        visualElements: ['интрига', 'доказательства', 'результаты'],
        duration: 60,
        viralScore: 92,
      },
      {
        title: 'I Made $50,000 in 7 Days Trading Crypto',
        views: 3200000,
        likes: 250000,
        engagement: 7.8,
        hooks: ['Реальные результаты', 'Proof of earnings', 'Пошаговый план'],
        visualElements: ['скриншоты прибыли', 'личная история', 'эмоции'],
        duration: 90,
        viralScore: 98,
      },
    ];
  }

  // === ИЗВЛЕЧЕНИЕ ПАТТЕРНОВ УСПЕХА ===
  
  private async extractSuccessPatterns(topVideos: any[]): Promise<any> {
    const allHooks = topVideos.flatMap(v => v.hooks);
    const allVisuals = topVideos.flatMap(v => v.visualElements);
    
    return {
      commonHooks: [...new Set(allHooks)],
      commonVisuals: [...new Set(allVisuals)],
      avgDuration: Math.round(topVideos.reduce((sum, v) => sum + v.duration, 0) / topVideos.length),
      avgEngagement: topVideos.reduce((sum, v) => sum + v.engagement, 0) / topVideos.length,
      bestPerforming: topVideos[0],
    };
  }

  // === ГЕНЕРАЦИЯ ХУКОВ НА ОСНОВЕ АНАЛИЗА ===
  
  private async generateViralHooksFromAnalysis(
    emotion: string, 
    niche: string, 
    patterns: any
  ): Promise<string[]> {
    const baseHooks = await this.generateViralHooks(emotion, niche);
    
    // Комбинируем базовые хуки с паттернами успеха
    const analysisBasedHooks = patterns.commonHooks.slice(0, 3);
    
    return [...baseHooks, ...analysisBasedHooks];
  }

  // === СОЗДАНИЕ КОНТЕНТА С БРЕНДОМ ===
  
  private async createViralContentWithBrand(params: any): Promise<{text: string, hashtags: string[]}> {
    const brandPrefix = params.brandName ? `[${params.brandName}] ` : '';
    
    // Используем лучшие паттерны из топовых видео
    const bestVideo = params.topVideos[0];
    
    const content = await aiContentService.generateContent(
      `Создай МАКСИМАЛЬНО ВИРУСНЫЙ контент для ${params.niche} на ${params.platform}.
       
       АНАЛИЗ ТОПОВЫХ ВИДЕО:
       - Лучшее видео: "${bestVideo.title}" (${bestVideo.views.toLocaleString()} просмотров, ${bestVideo.viralScore}% вирусности)
       - Успешные хуки: ${params.successPatterns.commonHooks.join(', ')}
       - Визуальные элементы: ${params.successPatterns.commonVisuals.join(', ')}
       - Средняя длительность: ${params.successPatterns.avgDuration}сек
       - Средняя вовлеченность: ${params.successPatterns.avgEngagement.toFixed(1)}%
       
       ТРЕБОВАНИЯ:
       - Используй стиль и структуру топовых видео
       - Добавь бренд: ${params.brandName || 'Trading Expert'}
       - Эмоция: ${params.emotion}
       - Тренды: ${params.trends.join(', ')}
       - Хуки: ${params.hooks.join(', ')}
       
       ЦЕЛЬ: Создать контент, который превзойдет топовые видео по вирусности!`,
      'viral_content_pro',
      [params.platform]
    );

    const hashtags = this.generateHashtagsFromAnalysis(
      params.niche, 
      params.platform, 
      params.trends,
      params.topVideos
    );

    return {
      text: brandPrefix + content.content,
      hashtags,
    };
  }

  // === ГЕНЕРАЦИЯ ХЕШТЕГОВ НА ОСНОВЕ АНАЛИЗА ===
  
  private generateHashtagsFromAnalysis(
    niche: string, 
    platform: string, 
    trends: string[],
    topVideos: any[]
  ): string[] {
    const baseHashtags = ['#трейдинг', '#инвестиции', '#крипто'];
    const trendHashtags = trends.map(trend => '#' + trend.replace(/\s+/g, '').toLowerCase());
    
    // Извлекаем популярные хештеги из топовых видео
    const viralHashtags = ['#viral', '#trending', '#fyp', '#crypto', '#bitcoin'];
    
    const platformHashtags = {
      tiktok: ['#fyp', '#foryou', '#viral'],
      instagram: ['#reels', '#trending', '#explore'],
      youtube: ['#shorts', '#viral', '#trending'],
      telegram: ['#channel', '#vip', '#exclusive'],
    };

    return [
      ...baseHashtags,
      ...trendHashtags,
      ...viralHashtags.slice(0, 3),
      ...(platformHashtags[platform as keyof typeof platformHashtags] || []),
    ].slice(0, 10);
  }

  // === МУЛЬТИПЛАТФОРМЕННАЯ ВИРУСНАЯ КАМПАНИЯ ===
  
  async launchViralCampaign(
    userId: string,
    campaignType: 'challenge' | 'trend' | 'controversy' | 'educational' | 'emotional',
    niche: string
  ): Promise<{
    campaignId: string;
    platforms: any[];
    expectedReach: number;
    timeline: any[];
  }> {
    const campaignId = `viral_${Date.now()}`;
    const platforms = ['tiktok', 'instagram', 'youtube', 'telegram'];
    
    const viralContents = await Promise.all(
      platforms.map(platform => this.generateViralContent(niche, platform, campaignType))
    );

    // Создаем синхронизированную кампанию
    const timeline = this.createCampaignTimeline(viralContents);
    const totalExpectedReach = viralContents.reduce((sum, content) => sum + content.expectedReach, 0);

    // Запускаем кампанию
    await this.executeCampaign(userId, campaignId, viralContents, timeline);

    return {
      campaignId,
      platforms: viralContents.map((content, index) => ({
        platform: platforms[index],
        viralScore: content.viralScore,
        expectedReach: content.expectedReach,
        content: content.content.substring(0, 100) + '...',
      })),
      expectedReach: totalExpectedReach,
      timeline,
    };
  }

  // === ПСИХОЛОГИЧЕСКИЕ ТРИГГЕРЫ ===
  
  async generatePsychologicalTriggers(audience: string, goal: string): Promise<{
    fomo: string[];
    social_proof: string[];
    authority: string[];
    scarcity: string[];
    reciprocity: string[];
  }> {
    return {
      fomo: [
        'Только сегодня! Эксклюзивные сигналы',
        '99% трейдеров упускают эту возможность',
        'Последний шанс войти в рынок',
        'Пока другие спят, мы зарабатываем',
      ],
      social_proof: [
        '+1247 трейдеров уже следуют этому сигналу',
        'Более 15K подписчиков доверяют нашему анализу',
        'Топ-трейдеры используют эту стратегию',
        '89% наших подписчиков в плюсе',
      ],
      authority: [
        '10+ лет на рынке. Проверенные стратегии',
        'Сертифицированный аналитик международного уровня',
        'Партнер ведущих брокеров',
        'Эксперт на Bloomberg и CNBC',
      ],
      scarcity: [
        'Только 50 мест в VIP канале',
        'Предложение действует 48 часов',
        'Эксклюзивный анализ для первых 100',
        'Ограниченное количество персональных консультаций',
      ],
      reciprocity: [
        'Бесплатный курс стоимостью $297',
        'Подарок за подписку: готовая торговая система',
        'Эксклюзивные материалы для наших подписчиков',
        'Делюсь своими лучшими стратегиями бесплатно',
      ],
    };
  }

  // === ЭМОЦИОНАЛЬНЫЙ AI ===
  
  async createEmotionalContent(
    emotion: 'fear' | 'greed' | 'hope' | 'excitement' | 'trust' | 'curiosity',
    niche: string,
    platform: string
  ): Promise<string> {
    const emotionalMaps = {
      fear: {
        keywords: ['упустить', 'потерять', 'опасность', 'риск', 'крах', 'предупреждение'],
        structure: 'ПРОБЛЕМА → ПОСЛЕДСТВИЯ → РЕШЕНИЕ',
        tone: 'срочный и серьезный',
      },
      greed: {
        keywords: ['прибыль', 'заработать', 'богатство', 'успех', 'доход', 'миллион'],
        structure: 'ВОЗМОЖНОСТЬ → ВЫГОДА → ДЕЙСТВИЕ',
        tone: 'мотивирующий и амбициозный',
      },
      hope: {
        keywords: ['возможность', 'шанс', 'будущее', 'мечта', 'цель', 'достижение'],
        structure: 'МЕЧТА → ПУТЬ → НАДЕЖДА',
        tone: 'вдохновляющий и поддерживающий',
      },
      excitement: {
        keywords: ['невероятно', 'потрясающе', 'революция', 'прорыв', 'сенсация'],
        structure: 'ОТКРЫТИЕ → ВОСТОРГ → ПРИГЛАШЕНИЕ',
        tone: 'энергичный и восторженный',
      },
      trust: {
        keywords: ['проверено', 'надежно', 'гарантия', 'опыт', 'репутация'],
        structure: 'ДОКАЗАТЕЛЬСТВО → ИСТОРИЯ → ДОВЕРИЕ',
        tone: 'уверенный и профессиональный',
      },
      curiosity: {
        keywords: ['секрет', 'неизвестно', 'открытие', 'тайна', 'удивительно'],
        structure: 'ЗАГАДКА → ИНТРИГА → РАЗГАДКА',
        tone: 'загадочный и интригующий',
      },
    };

    const emotionMap = emotionalMaps[emotion];
    
    // Генерируем контент на основе эмоциональной карты
    const result = await aiContentService.generateContent(
      `Создай ${emotion} контент для ${niche} на ${platform}. 
       Используй структуру: ${emotionMap.structure}. 
       Тон: ${emotionMap.tone}. 
       Ключевые слова: ${emotionMap.keywords.join(', ')}`,
      'emotional_content',
      [platform]
    );

    return result.content;
  }

  // === НЕЙРОМАРКЕТИНГ ===
  
  async applyNeuroMarketingPrinciples(content: string): Promise<string> {
    const principles = [
      'Правило 7 секунд: захватить внимание с первых слов',
      'Принцип контраста: использовать противопоставления',
      'Эффект якорения: устанавливать точку отсчета',
      'Принцип социального доказательства: показывать результаты других',
      'Эффект дефицита: создавать ощущение ограниченности',
      'Принцип взаимности: давать ценность перед просьбой',
    ];

    // Применяем нейромаркетинговые принципы к контенту
    let enhancedContent = content;

    // Добавляем hook на основе принципов нейромаркетинга
    const hooks = [
      '🚨 ВНИМАНИЕ! То, что вы узнаете дальше, изменит ваш взгляд на трейдинг...',
      '💡 Секрет, который скрывают 99% "успешных" трейдеров...',
      '⚡ Пока вы читаете это, кто-то уже зарабатывает по моей стратегии...',
      '🎯 Эта ошибка стоила мне $50,000. Не повторяйте её...',
    ];

    const randomHook = hooks[Math.floor(Math.random() * hooks.length)];
    enhancedContent = `${randomHook}\n\n${enhancedContent}`;

    return enhancedContent;
  }

  // === ВСПОМОГАТЕЛЬНЫЕ МЕТОДЫ ===
  
  private async calculateShareability(content: string, platform: string): Promise<number> {
    // Анализ элементов, делающих контент «шарабельным»
    const factors = {
      hasEmoji: /[\u{1F600}-\u{1F64F}]|[\u{1F300}-\u{1F5FF}]|[\u{1F680}-\u{1F6FF}]|[\u{1F1E0}-\u{1F1FF}]/u.test(content) ? 15 : 0,
      hasNumbers: /\d+%|\$\d+|\d+x/.test(content) ? 20 : 0,
      hasQuestion: content.includes('?') ? 10 : 0,
      hasCallToAction: /(подпишись|лайк|репост|поделись|комментируй)/i.test(content) ? 15 : 0,
      optimalLength: this.checkOptimalLength(content, platform) ? 20 : 0,
      hasUrgency: /(сегодня|сейчас|срочно|скоро|последний)/i.test(content) ? 20 : 0,
    };

    return Object.values(factors).reduce((sum, score) => sum + score, 0);
  }

  private async calculateEmotionalImpact(content: string): Promise<number> {
    const emotionalWords = {
      high: ['невероятно', 'потрясающе', 'шокирующе', 'революционно', 'эксклюзивно'],
      medium: ['интересно', 'важно', 'полезно', 'ценно', 'эффективно'],
      low: ['возможно', 'обычно', 'стандартно', 'типично', 'нормально'],
    };

    let score = 50; // базовый уровень

    emotionalWords.high.forEach(word => {
      if (content.toLowerCase().includes(word)) score += 15;
    });

    emotionalWords.medium.forEach(word => {
      if (content.toLowerCase().includes(word)) score += 5;
    });

    emotionalWords.low.forEach(word => {
      if (content.toLowerCase().includes(word)) score -= 5;
    });

    return Math.min(Math.max(score, 0), 100);
  }

  private async calculateTimeliness(content: string): Promise<number> {
    const timelyKeywords = [
      'сегодня', 'сейчас', 'актуально', 'тренд', 'новости', 
      'breaking', 'срочно', 'важно', 'только что', 'live'
    ];

    let score = 0;
    timelyKeywords.forEach(keyword => {
      if (content.toLowerCase().includes(keyword)) score += 10;
    });

    return Math.min(score, 100);
  }

  private async calculateUniqueness(content: string, platform: string): Promise<number> {
    // В реальном приложении сравнивали бы с базой существующего контента
    const uniqueElements = [
      content.length > 50 && content.length < 200, // оптимальная длина
      /[a-zA-Z]/.test(content) && /[а-яё]/i.test(content), // микс языков
      /\d/.test(content), // содержит цифры
      /[!?]/.test(content), // эмоциональная пунктуация
    ];

    return uniqueElements.filter(Boolean).length * 25;
  }

  private async calculatePlatformCompatibility(content: string, platform: string): Promise<number> {
    const platformRules = {
      tiktok: {
        idealLength: [20, 100],
        needsHashtags: true,
        needsHook: true,
        visualFriendly: true,
      },
      instagram: {
        idealLength: [50, 150],
        needsHashtags: true,
        needsEmoji: true,
        visualFriendly: true,
      },
      youtube: {
        idealLength: [100, 500],
        needsDescription: true,
        needsKeywords: true,
        educational: true,
      },
      telegram: {
        idealLength: [100, 300],
        needsFormatting: true,
        needsLinks: false,
        informative: true,
      },
    };

    const rules = platformRules[platform as keyof typeof platformRules];
    if (!rules) return 50;

    let score = 0;
    const contentLength = content.length;

    if (contentLength >= rules.idealLength[0] && contentLength <= rules.idealLength[1]) {
      score += 30;
    }

    if (rules.needsHashtags && content.includes('#')) score += 20;
    if (rules.needsEmoji && /[\u{1F600}-\u{1F64F}]/u.test(content)) score += 20;
    if (rules.needsHook && content.startsWith('🚨') || content.startsWith('💡')) score += 30;

    return score;
  }

  private checkOptimalLength(content: string, platform: string): boolean {
    const optimalLengths = {
      tiktok: [20, 100],
      instagram: [50, 150],
      youtube: [100, 500],
      telegram: [100, 300],
    };

    const range = optimalLengths[platform as keyof typeof optimalLengths];
    return range ? content.length >= range[0] && content.length <= range[1] : true;
  }

  private async getCurrentTrends(platform: string, niche: string): Promise<string[]> {
    // В реальном приложении получали бы из API трендов
    const tradingTrends = [
      'AI трейдинг', 'Криптовалюты 2025', 'NFT инвестиции', 
      'DeFi протоколы', 'Мемкоины', 'Форекс стратегии'
    ];
    return tradingTrends.slice(0, 3);
  }

  private async generateViralHooks(emotion: string, niche: string): Promise<string[]> {
    const hooks = {
      excitement: [
        '🚨 ЭТО ВЗОРВЕТ ВАШ МОЗГ!',
        '💥 НИКТО ОБ ЭТОМ НЕ ГОВОРИТ, НО...',
        '⚡ СЕЙЧАС ВЫ УВИДИТЕ НЕЧТО НЕВЕРОЯТНОЕ...',
      ],
      fear: [
        '🚨 ОПАСНОСТЬ! 99% трейдеров делают эту ошибку...',
        '⚠️ ЕСЛИ ВЫ НЕ ЗНАЕТЕ ЭТОГО, ВЫ ПОТЕРЯЕТЕ ВСЕ...',
        '💀 РЫНОК ГОТОВИТСЯ К КРАХУ? МОЙ АНАЛИЗ...',
      ],
      greed: [
        '💰 КАК Я ЗАРАБОТАЛ $50K ЗА НЕДЕЛЮ...',
        '🤑 СЕКРЕТНАЯ СТРАТЕГИЯ МИЛЛИОНЕРОВ...',
        '💎 ЭТОТ АКТИВ СДЕЛАЕТ ВАС БОГАТЫМИ...',
      ],
    };

    return hooks[emotion as keyof typeof hooks] || hooks.excitement;
  }

  private async calculateOptimalPostingTime(platform: string): Promise<Date> {
    const optimalHours = {
      tiktok: [19, 21, 9],
      instagram: [11, 14, 17, 19],
      youtube: [14, 16, 20],
      telegram: [8, 12, 18, 21],
    };

    const hours = optimalHours[platform as keyof typeof optimalHours] || [12, 18];
    const randomHour = hours[Math.floor(Math.random() * hours.length)];
    
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    tomorrow.setHours(randomHour, 0, 0, 0);
    
    return tomorrow;
  }

  private async createViralContent(params: any): Promise<{text: string, hashtags: string[]}> {
    const content = await aiContentService.generateContent(
      `Создай вирусный контент для ${params.niche} на ${params.platform}. 
       Тренды: ${params.trends.join(', ')}. 
       Эмоция: ${params.emotion}. 
       Используй хуки: ${params.hooks.join(', ')}`,
      'viral_content',
      [params.platform]
    );

    const hashtags = this.generateHashtags(params.niche, params.platform, params.trends);

    return {
      text: content.content,
      hashtags,
    };
  }

  private generateHashtags(niche: string, platform: string, trends: string[]): string[] {
    const baseHashtags = ['#трейдинг', '#инвестиции', '#финансы'];
    const trendHashtags = trends.map(trend => '#' + trend.replace(/\s+/g, '').toLowerCase());
    const platformHashtags = {
      tiktok: ['#fyp', '#viral', '#forex'],
      instagram: ['#reels', '#trading', '#crypto'],
      youtube: ['#shorts', '#analysis', '#signals'],
      telegram: ['#channel', '#vip', '#exclusive'],
    };

    return [
      ...baseHashtags,
      ...trendHashtags,
      ...(platformHashtags[platform as keyof typeof platformHashtags] || []),
    ].slice(0, 8);
  }

  private async calculateViralScore(content: string, platform: string): Promise<number> {
    const metrics = await this.analyzeViralPotential(content, platform);
    const weights = {
      shareability: 0.3,
      emotionalImpact: 0.25,
      timeliness: 0.2,
      uniqueness: 0.15,
      platformCompatibility: 0.1,
    };

    return Object.entries(metrics).reduce((score, [key, value]) => {
      const weight = weights[key as keyof typeof weights];
      return score + (value * weight);
    }, 0);
  }

  private estimateReach(viralScore: number, platform: string): number {
    const basReach = {
      tiktok: 10000,
      instagram: 5000,
      youtube: 8000,
      telegram: 2000,
    };

    const base = basReach[platform as keyof typeof basReach] || 5000;
    const multiplier = viralScore / 100;
    
    return Math.round(base * multiplier * (1 + Math.random()));
  }

  private createCampaignTimeline(viralContents: ViralContent[]): any[] {
    return viralContents.map((content, index) => ({
      phase: index + 1,
      platform: content.platform,
      scheduledTime: content.postingTime,
      viralScore: content.viralScore,
      expectedReach: content.expectedReach,
      action: `Публикация вирусного контента`,
    }));
  }

  private async executeCampaign(
    userId: string, 
    campaignId: string, 
    viralContents: ViralContent[], 
    timeline: any[]
  ): Promise<void> {
    await storage.createActivityLog({
      userId,
      action: 'Viral Campaign Launched',
      description: `Запущена вирусная кампания ${campaignId}`,
      status: 'success',
      metadata: { campaignId, contents: viralContents.length, timeline },
    });
  }
}

export const viralGrowthEngine = new ViralGrowthEngine();
