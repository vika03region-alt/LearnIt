import express from 'express';
import { storage } from '../storage';
import { aiAnalyticsService } from '../services/aiAnalytics';

const router = express.Router();

// Получить метрики платформы
router.get('/platform/:platformId', async (req, res) => {
  try {
    const { platformId } = req.params;
    const userId = req.session?.user?.id;

    if (!userId) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    const days = parseInt(req.query.days as string) || 30;
    const analytics = await storage.getPlatformAnalytics(userId, parseInt(platformId), days);
    
    // Возвращаем последние метрики или дефолтные значения
    const latestMetrics = analytics[0]?.metrics || {
      followers: 0,
      following: 0,
      posts: 0,
      likes: 0,
      comments: 0,
      shares: 0,
      views: 0,
      impressions: 0,
      reach: 0,
      engagement_rate: 0,
      growth_rate: 0,
    };

    res.json(latestMetrics);
  } catch (error) {
    console.error('Ошибка получения метрик платформы:', error);
    res.status(500).json({ error: 'Не удалось получить метрики платформы' });
  }
});

// Получить AI инсайты
router.get('/insights', async (req, res) => {
  try {
    const userId = req.session?.user?.id;

    if (!userId) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    const type = req.query.type as string;
    const insights = await storage.getAIInsights(userId, type);
    
    res.json(insights);
  } catch (error) {
    console.error('Ошибка получения AI инсайтов:', error);
    res.status(500).json({ error: 'Не удалось получить AI инсайты' });
  }
});

// Создать новый AI инсайт
router.post('/insights', async (req, res) => {
  try {
    const userId = req.session?.user?.id;

    if (!userId) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    const insight = await storage.createAIInsight({
      userId,
      ...req.body,
    });

    res.status(201).json(insight);
  } catch (error) {
    console.error('Ошибка создания AI инсайта:', error);
    res.status(500).json({ error: 'Не удалось создать AI инсайт' });
  }
});

// Получить анализ конкурентов
router.get('/competitors/:platformId', async (req, res) => {
  try {
    const { platformId } = req.params;
    const userId = req.session?.user?.id;

    if (!userId) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    const competitors = await storage.getCompetitorAnalyses(userId, parseInt(platformId));
    
    // Преобразуем в формат для frontend
    const competitorData = competitors.map(comp => ({
      handle: comp.competitorHandle,
      name: comp.competitorName || comp.competitorHandle,
      metrics: {
        followers: comp.metrics.followers,
        engagement_rate: comp.metrics.engagement_rate,
        posting_frequency: comp.metrics.posting_frequency,
      },
      insights: [
        `Средняя вовлеченность: ${comp.metrics.engagement_rate.toFixed(1)}%`,
        `Частота публикаций: ${comp.metrics.posting_frequency.toFixed(1)} постов в день`,
        `${comp.metrics.followers.toLocaleString()} подписчиков`,
      ],
    }));

    res.json(competitorData);
  } catch (error) {
    console.error('Ошибка получения анализа конкурентов:', error);
    res.status(500).json({ error: 'Не удалось получить анализ конкурентов' });
  }
});

// Добавить нового конкурента для анализа
router.post('/competitors', async (req, res) => {
  try {
    const userId = req.session?.user?.id;

    if (!userId) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    const { platformId, competitorHandle } = req.body;

    if (!platformId || !competitorHandle) {
      return res.status(400).json({ error: 'Платформа и handle конкурента обязательны' });
    }

    // Анализируем конкурента с помощью AI
    const competitorAnalyses = await aiAnalyticsService.analyzeCompetitors(
      userId,
      platformId,
      [competitorHandle]
    );

    if (competitorAnalyses.length > 0) {
      const analysis = await storage.createCompetitorAnalysis(competitorAnalyses[0]);
      res.status(201).json(analysis);
    } else {
      res.status(400).json({ error: 'Не удалось проанализировать конкурента' });
    }
  } catch (error) {
    console.error('Ошибка добавления конкурента:', error);
    res.status(500).json({ error: 'Не удалось добавить конкурента' });
  }
});

// Получить актуальные тренды
router.get('/trends/:platformId', async (req, res) => {
  try {
    const { platformId } = req.params;
    const category = req.query.category as string;
    const days = parseInt(req.query.days as string) || 7;

    const trends = await storage.getTrendAnalysis(parseInt(platformId), category, days);
    
    // Преобразуем в формат для frontend
    const trendData = trends.map(trend => ({
      name: trend.trend_name,
      volume: trend.data.volume,
      growth_rate: trend.data.growth_rate,
      confidence: parseFloat(trend.confidence),
      category: trend.category,
    }));

    res.json(trendData);
  } catch (error) {
    console.error('Ошибка получения трендов:', error);
    res.status(500).json({ error: 'Не удалось получить тренды' });
  }
});

// Анализировать контент с помощью AI
router.post('/analyze-content', async (req, res) => {
  try {
    const userId = req.session?.user?.id;

    if (!userId) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    const { content, platform } = req.body;

    if (!content || !platform) {
      return res.status(400).json({ error: 'Контент и платформа обязательны' });
    }

    // Получаем исторические данные для лучшего анализа
    const platformData = await storage.getUserAccounts(userId);
    const targetPlatform = platformData.find(p => p.platformId.toString() === platform);
    
    let historicalData = [];
    if (targetPlatform) {
      historicalData = await storage.getContentPerformance(userId, targetPlatform.platformId, 30);
    }

    const analysis = await aiAnalyticsService.analyzeContent(content, platform, historicalData);

    res.json(analysis);
  } catch (error) {
    console.error('Ошибка AI анализа контента:', error);
    res.status(500).json({ error: 'Не удалось проанализировать контент' });
  }
});

// Оптимизировать хештеги
router.post('/optimize-hashtags', async (req, res) => {
  try {
    const userId = req.session?.user?.id;

    if (!userId) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    const { content, platform, targetAudience } = req.body;

    if (!content || !platform) {
      return res.status(400).json({ error: 'Контент и платформа обязательны' });
    }

    const hashtagOptimization = await aiAnalyticsService.optimizeHashtags(
      content,
      platform,
      targetAudience
    );

    res.json(hashtagOptimization);
  } catch (error) {
    console.error('Ошибка оптимизации хештегов:', error);
    res.status(500).json({ error: 'Не удалось оптимизировать хештеги' });
  }
});

// Получить рекомендации по времени публикации
router.get('/posting-times/:platformId', async (req, res) => {
  try {
    const { platformId } = req.params;
    const userId = req.session?.user?.id;

    if (!userId) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    const postingTimes = await aiAnalyticsService.getBestPostingTimes(userId, parseInt(platformId));

    res.json(postingTimes);
  } catch (error) {
    console.error('Ошибка получения времени публикации:', error);
    res.status(500).json({ error: 'Не удалось получить рекомендации по времени' });
  }
});

// Провести анализ аудитории
router.post('/audience-analysis/:platformId', async (req, res) => {
  try {
    const { platformId } = req.params;
    const userId = req.session?.user?.id;

    if (!userId) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    const audienceInsight = await aiAnalyticsService.analyzeAudience(userId, parseInt(platformId));
    
    // Сохраняем инсайт
    const savedInsight = await storage.createAIInsight({
      userId: audienceInsight.userId,
      type: audienceInsight.type,
      platformId: audienceInsight.platformId,
      title: audienceInsight.title,
      description: audienceInsight.description,
      data: audienceInsight.data,
      status: audienceInsight.status,
    });

    res.json(savedInsight);
  } catch (error) {
    console.error('Ошибка анализа аудитории:', error);
    res.status(500).json({ error: 'Не удалось провести анализ аудитории' });
  }
});

export default router;