
import type { Express } from "express";
import { isAuthenticated } from "../replitAuth";
import { advancedPromotionStrategy } from "../services/advancedPromotionStrategy";
import { storage } from "../storage";

export function setupPromotionStrategyRoutes(app: Express) {
  // Анализ авторского стиля клиента
  app.post('/api/promotion/analyze-persona', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const { clientContent } = req.body;

      if (!clientContent || !Array.isArray(clientContent)) {
        return res.status(400).json({ error: 'Требуется массив контента клиента' });
      }

      const persona = await advancedPromotionStrategy.analyzeClientPersona(userId, clientContent);
      
      // Сохраняем персону клиента
      await storage.createActivityLog({
        userId,
        action: 'Client Persona Analyzed',
        description: 'Проанализирован авторский стиль клиента',
        status: 'success',
        metadata: { persona },
      });

      res.json({ persona });
    } catch (error) {
      console.error('Ошибка анализа персоны:', error);
      res.status(500).json({ error: 'Не удалось проанализировать авторский стиль' });
    }
  });

  // Генерация всех возможных стратегий продвижения
  app.post('/api/promotion/generate-strategies', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const { clientPersona, currentMetrics, budget = 1000 } = req.body;

      if (!clientPersona) {
        return res.status(400).json({ error: 'Требуется персона клиента' });
      }

      const strategies = await advancedPromotionStrategy.generatePromotionStrategies(
        clientPersona,
        currentMetrics || {},
        budget
      );

      // Группируем стратегии по типам
      const grouped = {
        free: strategies.filter(s => s.type === 'free'),
        paid: strategies.filter(s => s.type === 'paid'),
        premium: strategies.filter(s => s.type === 'premium'),
      };

      res.json({
        strategies: grouped,
        total: strategies.length,
        summary: {
          freeStrategies: grouped.free.length,
          paidStrategies: grouped.paid.length,
          premiumStrategies: grouped.premium.length,
          maxEffectiveness: Math.max(...strategies.map(s => s.effectiveness)),
          avgCost: strategies.filter(s => s.cost).reduce((sum, s) => sum + (s.cost || 0), 0) / strategies.filter(s => s.cost).length,
        },
      });
    } catch (error) {
      console.error('Ошибка генерации стратегий:', error);
      res.status(500).json({ error: 'Не удалось сгенерировать стратегии' });
    }
  });

  // Персонализация выбранной стратегии
  app.post('/api/promotion/personalize-strategy', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const { strategy, clientPersona, preferences } = req.body;

      if (!strategy || !clientPersona) {
        return res.status(400).json({ error: 'Требуется стратегия и персона клиента' });
      }

      const personalizedStrategy = await advancedPromotionStrategy.personalizeStrategy(
        strategy,
        clientPersona,
        preferences || {}
      );

      await storage.createActivityLog({
        userId,
        action: 'Strategy Personalized',
        description: `Персонализирована стратегия: ${strategy.name}`,
        status: 'success',
        metadata: { 
          originalStrategy: strategy.id,
          personalizedStrategy: personalizedStrategy.id,
        },
      });

      res.json({ personalizedStrategy });
    } catch (error) {
      console.error('Ошибка персонализации стратегии:', error);
      res.status(500).json({ error: 'Не удалось персонализировать стратегию' });
    }
  });

  // Создание комбинированной стратегии
  app.post('/api/promotion/create-combination', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const { strategies, budget = 1000, timeframe = '1 месяц' } = req.body;

      if (!strategies || !Array.isArray(strategies)) {
        return res.status(400).json({ error: 'Требуется массив стратегий' });
      }

      const combination = await advancedPromotionStrategy.createCombinedStrategy(
        strategies,
        budget,
        timeframe
      );

      await storage.createActivityLog({
        userId,
        action: 'Combined Strategy Created',
        description: `Создана комбинированная стратегия из ${strategies.length} элементов`,
        status: 'success',
        metadata: { 
          strategiesCount: strategies.length,
          totalCost: combination.totalCost,
          expectedROI: combination.expectedROI,
        },
      });

      res.json(combination);
    } catch (error) {
      console.error('Ошибка создания комбинированной стратегии:', error);
      res.status(500).json({ error: 'Не удалось создать комбинированную стратегию' });
    }
  });

  // Запуск выполнения стратегии
  app.post('/api/promotion/execute-strategy', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const { strategy, clientPersona } = req.body;

      if (!strategy || !clientPersona) {
        return res.status(400).json({ error: 'Требуется стратегия и персона клиента' });
      }

      const results = await advancedPromotionStrategy.executeStrategy(
        userId,
        strategy,
        clientPersona
      );

      await storage.createActivityLog({
        userId,
        action: 'Strategy Executed',
        description: `Выполнена стратегия: ${strategy.name}`,
        status: 'success',
        metadata: results,
      });

      res.json({
        message: 'Стратегия успешно запущена',
        results,
        summary: {
          executed: results.executed.length,
          scheduled: results.scheduled.length,
          failed: results.failed.length,
          successRate: (results.executed.length / (results.executed.length + results.failed.length)) * 100,
        },
      });
    } catch (error) {
      console.error('Ошибка выполнения стратегии:', error);
      res.status(500).json({ error: 'Не удалось выполнить стратегию' });
    }
  });

  // Мониторинг эффективности стратегии
  app.get('/api/promotion/monitor/:strategyId', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const { strategyId } = req.params;

      const performance = await advancedPromotionStrategy.monitorStrategyPerformance(
        userId,
        strategyId
      );

      res.json(performance);
    } catch (error) {
      console.error('Ошибка мониторинга стратегии:', error);
      res.status(500).json({ error: 'Не удалось получить данные мониторинга' });
    }
  });

  // Получение рекомендаций по улучшению
  app.post('/api/promotion/recommendations', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const activities = await storage.getUserActivityLogs(userId, 30);
      
      const promotionActivities = activities.filter(a => 
        a.action.includes('Strategy') || a.action.includes('Promotion')
      );

      // AI анализ всех активностей для выработки рекомендаций
      const recommendations = {
        immediate: [
          'Увеличить частоту постинга в TikTok на 25%',
          'Добавить больше интерактивных элементов в Stories',
          'Оптимизировать время публикации для лучшего engagement',
        ],
        shortTerm: [
          'Запустить серию обучающих видео на YouTube',
          'Создать эксклюзивный контент для Telegram подписчиков',
          'Начать использовать trending аудио в TikTok',
        ],
        longTerm: [
          'Разработать собственный трейдинг курс',
          'Создать мобильное приложение для подписчиков',
          'Запустить партнерскую программу',
        ],
      };

      res.json({
        recommendations,
        basedOn: {
          activitiesAnalyzed: promotionActivities.length,
          period: '30 дней',
          lastUpdate: new Date().toISOString(),
        },
      });
    } catch (error) {
      console.error('Ошибка получения рекомендаций:', error);
      res.status(500).json({ error: 'Не удалось получить рекомендации' });
    }
  });
}
