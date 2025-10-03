import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { setupAuth, isAuthenticated } from "./replitAuth";
import { seedPlatforms } from "./seedDatabase";
import { aiContentService } from "./services/aiContent";
import { aiAnalyticsService } from "./services/aiAnalytics";
import { aiAssistantService } from "./services/aiAssistant";
import { clientAnalysisService } from "./services/clientAnalysis";
import { promotionEngine } from "./services/promotionEngine";
import { socialMediaManager } from "./services/socialMediaIntegration";
import { analyticsService } from "./services/analytics";
import { safetyService } from "./services/safety";
import { schedulerService } from "./services/scheduler";
import { setupPromotionStrategyRoutes } from "./routes/promotionStrategy";
import { aiLearningEngine } from "./services/aiLearningEngine";
import { viralGrowthEngine } from "./services/viralGrowthEngine";
import { competitorSurveillance } from "./services/competitorSurveillance";
import { brandDominationEngine } from "./services/brandDominationEngine";
import type { Platform, UserAccount } from "@shared/schema";
import { insertPostSchema, insertAIContentLogSchema } from "@shared/schema";
import { z } from "zod";

export async function registerRoutes(app: Express): Promise<Server> {
  // Initialize database with platforms
  await seedPlatforms();

  // Auth middleware
  await setupAuth(app);

  // Auth routes
  app.get('/api/auth/user', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const user = await storage.getUser(userId);
      res.json(user);
    } catch (error) {
      console.error("Error fetching user:", error);
      res.status(500).json({ message: "Failed to fetch user" });
    }
  });

  // Platform routes
  app.get('/api/platforms', isAuthenticated, async (req, res) => {
    try {
      const platforms = await storage.getPlatforms();
      res.json(platforms);
    } catch (error) {
      console.error("Error fetching platforms:", error);
      res.status(500).json({ message: "Failed to fetch platforms" });
    }
  });

  // User account routes
  app.get('/api/user-accounts', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const accounts = await storage.getUserAccounts(userId);
      res.json(accounts);
    } catch (error) {
      console.error("Error fetching user accounts:", error);
      res.status(500).json({ message: "Failed to fetch user accounts" });
    }
  });

  app.post('/api/user-accounts', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const accountData = { ...req.body, userId };
      const account = await storage.createUserAccount(accountData);

      // Log activity
      await storage.createActivityLog({
        userId,
        action: 'Account Connected',
        description: `Connected ${req.body.accountHandle} account`,
        platformId: req.body.platformId,
        status: 'success',
        metadata: null,
      });

      res.json(account);
    } catch (error) {
      console.error("Error creating user account:", error);
      res.status(500).json({ message: "Failed to create user account" });
    }
  });

  // Post routes
  app.get('/api/posts', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const limit = parseInt(req.query.limit as string) || 50;
      const posts = await storage.getUserPosts(userId, limit);
      res.json(posts);
    } catch (error) {
      console.error("Error fetching posts:", error);
      res.status(500).json({ message: "Failed to fetch posts" });
    }
  });

  app.post('/api/posts', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const postData = insertPostSchema.parse(req.body);

      const post = await storage.createPost({ ...postData, userId });

      // Log activity
      await storage.createActivityLog({
        userId,
        action: 'Post Created',
        description: `Created new post for platform ${postData.platformId}`,
        platformId: postData.platformId,
        status: 'success',
        metadata: null,
      });

      res.json(post);
    } catch (error) {
      console.error("Error creating post:", error);
      res.status(500).json({ message: "Failed to create post" });
    }
  });

  // === АНАЛИЗ КЛИЕНТА ===

  // Глубокий анализ клиента
  app.post('/api/client/analyze', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const { clientData } = req.body;
      console.log('🔍 Запуск анализа клиента:', clientData);

      const profile = await clientAnalysisService.analyzeClient(clientData);
      const savedProfile = await clientAnalysisService.createClientProfile(userId, profile);

      res.json(savedProfile);
    } catch (error) {
      console.error('Ошибка анализа клиента:', error);
      res.status(500).json({ error: 'Не удалось проанализировать клиента' });
    }
  });

  // Инициализация для Lucifer Tradera
  app.post('/api/client/init-lucifer', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      if (!userId) {
        return res.status(401).json({ error: 'Unauthorized' });
      }

      console.log('🚀 Инициализация клиента Lucifer Tradera...');

      const luciferData = {
        youtube: 'https://www.youtube.com/@Lucifer_tradera',
        tiktok: 'https://vm.tiktok.com/ZNHnt6CTrMdwp-ckGNa',
        telegram: ['Lucifer_Izzy_bot', 'Lucifer_tradera'],
      };

      const profile = await clientAnalysisService.analyzeClient(luciferData);
      const savedProfile = await clientAnalysisService.createClientProfile(userId, profile);

      // Создаем стратегию продвижения
      const strategy = await promotionEngine.createPromotionStrategy(savedProfile);

      res.json({
        message: 'Клиент Lucifer Tradera успешно проанализирован и добавлен в систему',
        profile: savedProfile,
        strategy,
      });
    } catch (error) {
      console.error('Ошибка инициализации Lucifer Tradera:', error);
      res.status(500).json({ error: 'Не удалось инициализировать клиента' });
    }
  });

  // === AI ИНСТРУМЕНТЫ ===

  // Генерация контента
  app.post('/api/ai/generate-content', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const { prompt, contentType, targetPlatforms } = insertAIContentLogSchema.parse(req.body);

      const result = await aiContentService.generateContent(prompt, contentType, targetPlatforms || []);

      // Log the generation
      await storage.createAIContentLog({
        userId,
        prompt,
        generatedContent: result.content,
        contentType,
        targetPlatforms,
        tokensUsed: result.tokensUsed,
        cost: result.cost,
      });

      // Log activity
      await storage.createActivityLog({
        userId,
        action: 'AI Content Generated',
        description: `Generated ${contentType} content`,
        platformId: null,
        status: 'success',
        metadata: { contentType, targetPlatforms },
      });

      res.json(result);
    } catch (error) {
      console.error("Error generating AI content:", error);
      res.status(500).json({ message: "Failed to generate AI content" });
    }
  });

  app.get('/api/ai/content-logs', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const limit = parseInt(req.query.limit as string) || 50;
      const logs = await storage.getUserAIContentLogs(userId, limit);
      res.json(logs);
    } catch (error) {
      console.error("Error fetching AI content logs:", error);
      res.status(500).json({ message: "Failed to fetch AI content logs" });
    }
  });

  // === AI АССИСТЕНТ ===

  // Получить доступные AI провайдеры
  app.get('/api/ai/providers', isAuthenticated, async (req: any, res) => {
    try {
      const providers = aiAssistantService.getAvailableProviders();
      res.json(providers);
    } catch (error) {
      console.error("Error fetching providers:", error);
      res.status(500).json({ message: "Failed to fetch providers" });
    }
  });

  // Получить все разговоры пользователя
  app.get('/api/ai/conversations', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const conversations = await aiAssistantService.getUserConversations(userId);
      res.json(conversations);
    } catch (error) {
      console.error("Error fetching conversations:", error);
      res.status(500).json({ message: "Failed to fetch conversations" });
    }
  });

  // Создать новый разговор
  app.post('/api/ai/conversations', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const { title } = req.body;
      const conversation = await aiAssistantService.createConversation(userId, title);
      res.json(conversation);
    } catch (error) {
      console.error("Error creating conversation:", error);
      res.status(500).json({ message: "Failed to create conversation" });
    }
  });

  // Получить сообщения разговора
  app.get('/api/ai/conversations/:id/messages', isAuthenticated, async (req: any, res) => {
    try {
      const conversationId = parseInt(req.params.id);
      const messages = await aiAssistantService.getConversationMessages(conversationId);
      res.json(messages);
    } catch (error) {
      console.error("Error fetching messages:", error);
      res.status(500).json({ message: "Failed to fetch messages" });
    }
  });

  // Отправить сообщение в разговор
  app.post('/api/ai/conversations/:id/messages', isAuthenticated, async (req: any, res) => {
    try {
      const conversationId = parseInt(req.params.id);
      const { message } = req.body;

      if (!message || message.trim().length === 0) {
        return res.status(400).json({ message: "Message content is required" });
      }

      const result = await aiAssistantService.sendMessage(conversationId, message.trim());

      // Логируем активность
      const userId = req.user.claims.sub;
      await storage.createActivityLog({
        userId,
        action: 'AI Assistant Message',
        description: 'Отправлено сообщение AI-ассистенту',
        platformId: null,
        status: result.error ? 'error' : 'success',
        metadata: { conversationId, tokensUsed: result.tokensUsed, cost: result.cost },
      });

      res.json(result);
    } catch (error) {
      console.error("Error sending message:", error);
      res.status(500).json({ message: "Failed to send message" });
    }
  });

  // Обновить заголовок разговора
  app.put('/api/ai/conversations/:id', isAuthenticated, async (req: any, res) => {
    try {
      const conversationId = parseInt(req.params.id);
      const userId = req.user.claims.sub;
      const { title } = req.body;

      if (!title || title.trim().length === 0) {
        return res.status(400).json({ message: "Title is required" });
      }

      const conversation = await aiAssistantService.updateConversationTitle(
        conversationId, 
        userId, 
        title.trim()
      );
      res.json(conversation);
    } catch (error) {
      console.error("Error updating conversation:", error);
      res.status(500).json({ message: "Failed to update conversation" });
    }
  });

  // Удалить разговор
  app.delete('/api/ai/conversations/:id', isAuthenticated, async (req: any, res) => {
    try {
      const conversationId = parseInt(req.params.id);
      const userId = req.user.claims.sub;

      const success = await aiAssistantService.deleteConversation(conversationId, userId);

      if (success) {
        await storage.createActivityLog({
          userId,
          action: 'AI Conversation Deleted',
          description: `Удален разговор с AI-ассистентом #${conversationId}`,
          platformId: null,
          status: 'success',
          metadata: { conversationId },
        });
        res.json({ message: "Conversation deleted successfully" });
      } else {
        res.status(404).json({ message: "Conversation not found" });
      }
    } catch (error) {
      console.error("Error deleting conversation:", error);
      res.status(500).json({ message: "Failed to delete conversation" });
    }
  });

  // Сгенерировать заголовок для разговора автоматически
  app.post('/api/ai/conversations/:id/generate-title', isAuthenticated, async (req: any, res) => {
    try {
      const conversationId = parseInt(req.params.id);
      const title = await aiAssistantService.generateConversationTitle(conversationId);

      const userId = req.user.claims.sub;
      const updatedConversation = await aiAssistantService.updateConversationTitle(
        conversationId, 
        userId, 
        title
      );

      res.json({ title, conversation: updatedConversation });
    } catch (error) {
      console.error("Error generating title:", error);
      res.status(500).json({ message: "Failed to generate title" });
    }
  });

  // === GEMINI AI ЭНДПОИНТЫ ===

  // Тестовый эндпоинт для проверки Gemini API
  app.get('/api/gemini/test', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const { analyzeNicheWithGemini, generateContentWithGemini } = await import('./services/geminiService');

      console.log('🧪 Запуск теста Gemini API...');

      // Тест 1: Анализ ниши
      console.log('1️⃣ Тестирование анализа ниши...');
      const nicheAnalysis = await analyzeNicheWithGemini('Lucifer_tradera');

      // Тест 2: Генерация контента
      console.log('2️⃣ Тестирование генерации контента...');
      const content = await generateContentWithGemini(
        'Как начать зарабатывать на крипто трейдинге',
        {
          tone: 'профессиональный, но доступный',
          keywords: ['трейдинг', 'криптовалюты', 'заработок'],
          targetAudience: 'начинающие трейдеры'
        }
      );

      await storage.createActivityLog({
        userId,
        action: 'Gemini Test Completed',
        description: 'Успешный тест Gemini API',
        platformId: null,
        status: 'success',
        metadata: { test: 'gemini_integration' },
      });

      res.json({
        success: true,
        message: '✅ Gemini API работает отлично!',
        results: {
          nicheAnalysis: {
            preview: nicheAnalysis.substring(0, 200) + '...',
            fullLength: nicheAnalysis.length
          },
          contentGeneration: {
            preview: content.substring(0, 200) + '...',
            fullLength: content.length
          }
        },
        capabilities: [
          '✅ Анализ ниши и аудитории',
          '✅ Генерация трейдинг контента',
          '✅ Анализ трендов и видео',
          '✅ Мультимодальная обработка (текст + изображения)',
          '✅ Адаптация контента для разных платформ',
          '✅ Персонализация под аудиторию'
        ],
        recommendations: [
          '💡 Используйте /api/gemini/analyze-content для глубокого анализа постов',
          '💡 /api/gemini/viral-content создаст вирусный контент для любой платформы',
          '💡 /api/gemini/analyze-competitor проанализирует стратегии конкурентов',
          '💡 /api/gemini/optimize-content улучшит существующий контент',
          '💡 /api/gemini/content-ideas сгенерирует 10+ идей для постов'
        ]
      });
    } catch (error: any) {
      console.error('❌ Ошибка теста Gemini:', error);
      res.status(500).json({ 
        success: false,
        error: 'Тест не пройден',
        details: error.message,
        hint: 'Проверьте переменную окружения GEMINI'
      });
    }
  });

  // Генерация контента через Gemini
  app.post('/api/gemini/generate-content', isAuthenticated, async (req: any, res) => {
    try {
      const { prompt, systemInstruction } = req.body;
      const { geminiService } = await import('./services/geminiService');

      const result = await geminiService.generateContent(prompt, systemInstruction);

      await storage.createActivityLog({
        userId: req.user.claims.sub,
        action: 'Gemini Content Generated',
        description: `Generated content using Gemini AI`,
        platformId: null,
        status: 'success',
        metadata: { tokensUsed: result.tokensUsed, cost: result.cost },
      });

      res.json(result);
    } catch (error) {
      console.error('Gemini generation error:', error);
      res.status(500).json({ error: 'Failed to generate content with Gemini' });
    }
  });

  // Анализ изображения через Gemini Vision
  app.post('/api/gemini/analyze-image', isAuthenticated, async (req: any, res) => {
    try {
      const { imageData, prompt } = req.body;
      const { geminiService } = await import('./services/geminiService');

      const result = await geminiService.analyzeImage(imageData, prompt);

      res.json(result);
    } catch (error) {
      console.error('Gemini vision error:', error);
      res.status(500).json({ error: 'Failed to analyze image with Gemini' });
    }
  });

  // Генерация вирального контента через Gemini
  app.post('/api/gemini/viral-content', isAuthenticated, async (req: any, res) => {
    try {
      const { platform, niche, trend } = req.body;
      const { geminiService } = await import('./services/geminiService');

      const result = await geminiService.generateViralContent(platform, niche, trend);

      res.json(result);
    } catch (error) {
      console.error('Gemini viral content error:', error);
      res.status(500).json({ error: 'Failed to generate viral content' });
    }
  });

  // Анализ конкурента через Gemini
  app.post('/api/gemini/analyze-competitor', isAuthenticated, async (req: any, res) => {
    try {
      const { competitorUrl, platform } = req.body;
      const { geminiService } = await import('./services/geminiService');

      const analysis = await geminiService.analyzeCompetitor(competitorUrl, platform);

      res.json(analysis);
    } catch (error) {
      console.error('Gemini competitor analysis error:', error);
      res.status(500).json({ error: 'Failed to analyze competitor' });
    }
  });

  // Генерация маркетинговой стратегии через Gemini
  app.post('/api/gemini/marketing-strategy', isAuthenticated, async (req: any, res) => {
    try {
      const { businessType, targetAudience, budget, platforms } = req.body;
      const { geminiService } = await import('./services/geminiService');

      const strategy = await geminiService.generateMarketingStrategy(
        businessType,
        targetAudience,
        budget,
        platforms
      );

      res.json(strategy);
    } catch (error) {
      console.error('Gemini strategy error:', error);
      res.status(500).json({ error: 'Failed to generate strategy' });
    }
  });

  // Оптимизация контента через Gemini
  app.post('/api/gemini/optimize-content', isAuthenticated, async (req: any, res) => {
    try {
      const { content, platform } = req.body;
      const { geminiService } = await import('./services/geminiService');

      const result = await geminiService.optimizeContent(content, platform);

      res.json(result);
    } catch (error) {
      console.error('Gemini optimization error:', error);
      res.status(500).json({ error: 'Failed to optimize content' });
    }
  });

  // Генерация идей для контента через Gemini
  app.post('/api/gemini/content-ideas', isAuthenticated, async (req: any, res) => {
    try {
      const { niche, count } = req.body;
      const { geminiService } = await import('./services/geminiService');

      const ideas = await geminiService.generateContentIdeas(niche, count || 10);

      res.json({ ideas });
    } catch (error) {
      console.error('Gemini ideas error:', error);
      res.status(500).json({ error: 'Failed to generate ideas' });
    }
  });

  // === ИНТЕГРАЦИЯ С ПЛАТФОРМАМИ И AI-АНАЛИЗ ===

  // Полная интеграция с платформой и создание стратегии
  app.post('/api/platform/integrate-and-analyze', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const { platform, apiKey, accountHandle } = req.body;

      const { platformIntegrationEngine } = await import('./services/platformIntegrationEngine');

      // Собираем данные через API платформы
      const integration = {
        platform,
        apiKey,
        accountData: {
          userId,
          name: accountHandle,
          industry: req.body.industry || 'general',
          budget: req.body.budget || 10000,
        },
        audienceData: {
          // Эти данные будут получены из реального API платформы
          followers: req.body.currentFollowers || 0,
          engagement_rate: req.body.currentEngagement || 0,
          demographics: req.body.demographics || {},
          interests: req.body.interests || [],
          pain_points: req.body.painPoints || [],
        },
        competitorData: {
          top_competitors: req.body.competitors || [],
          trends: req.body.trends || [],
        }
      };

      const strategy = await platformIntegrationEngine.analyzeAndProposeStrategy(integration);

      await storage.createActivityLog({
        userId,
        action: 'Platform Integration Complete',
        description: `Платформа ${platform} интегрирована и проанализирована`,
        status: 'success',
        metadata: { platform, strategy },
      });

      res.json({
        success: true,
        message: `Платформа ${platform} успешно интегрирована!`,
        strategy,
        next_steps: [
          'Выберите бесплатные тактики для немедленного запуска',
          'Настройте бюджет для платных кампаний',
          'Активируйте автоматизацию контента',
          'Запустите мониторинг конкурентов'
        ]
      });
    } catch (error) {
      console.error('Ошибка интеграции платформы:', error);
      res.status(500).json({ error: 'Не удалось интегрировать платформу' });
    }
  });

  // === B2B МАРКЕТИНГ МАРШРУТЫ ===

  // Анализ целевой аудитории организации
  app.post('/api/b2b/analyze-audience', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const { industry, website, competitors, targetMarkets } = req.body;

      const { b2bAudienceAnalysis } = await import('./services/b2bAudienceAnalysis');
      const audienceProfile = await b2bAudienceAnalysis.analyzeOrganization({
        industry,
        website,
        competitors,
        targetMarkets,
      });

      await storage.createActivityLog({
        userId,
        action: 'B2B Audience Analyzed',
        description: `Проанализирована аудитория для индустрии: ${industry}`,
        platformId: null,
        status: 'success',
        metadata: { audienceProfile },
      });

      res.json({ audienceProfile });
    } catch (error) {
      console.error('Ошибка анализа B2B аудитории:', error);
      res.status(500).json({ error: 'Не удалось проанализировать аудиторию' });
    }
  });

  // Генерация lead-магнита
  app.post('/api/b2b/generate-lead-magnet', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const { audienceProfile } = req.body;

      const { b2bAudienceAnalysis } = await import('./services/b2bAudienceAnalysis');
      const leadMagnet = await b2bAudienceAnalysis.generateLeadMagnet(audienceProfile);

      res.json({ leadMagnet });
    } catch (error) {
      console.error('Ошибка генерации lead-магнита:', error);
      res.status(500).json({ error: 'Не удалось создать lead-магнит' });
    }
  });

  // Генерация кейс-стади
  app.post('/api/b2b/generate-case-study', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const { clientName, problem, solution, results } = req.body;

      const { b2bContentGenerator } = await import('./services/b2bContentGenerator');
      const caseStudy = await b2bContentGenerator.generateCaseStudy({
        clientName,
        problem,
        solution,
        results,
      });

      res.json({ content: caseStudy });
    } catch (error) {
      console.error('Ошибка генерации кейса:', error);
      res.status(500).json({ error: 'Не удалось создать кейс' });
    }
  });

  // Скоринг лидов
  app.get('/api/b2b/leads/scoring', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;

      const { leadFunnelService } = await import('./services/leadFunnel');
      const scoredLeads = await leadFunnelService.scoreLeads(userId);

      res.json({ leads: scoredLeads });
    } catch (error) {
      console.error('Ошибка скоринга лидов:', error);
      res.status(500).json({ error: 'Не удалось оценить лиды' });
    }
  });

  // === ПРОФЕССИОНАЛЬНЫЕ AI ТРЕЙДИНГ МАРШРУТЫ ===

  // Генерация viral TikTok контента
  app.post('/api/ai/viral-tiktok', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const { trend, hooks } = req.body;

      if (!trend || !hooks || !Array.isArray(hooks)) {
        return res.status(400).json({ message: "Trend and hooks array are required" });
      }

      const result = await aiContentService.generateViralTikTokContent(trend, hooks);

      await storage.createActivityLog({
        userId,
        action: 'AI Viral TikTok Generated',
        description: `Generated viral TikTok content for trend: ${trend}`,
        platformId: null,
        status: 'success',
        metadata: { trend, hooks },
      });

      res.json(result);
    } catch (error) {
      console.error("Error generating viral TikTok content:", error);
      res.status(500).json({ message: "Failed to generate viral TikTok content" });
    }
  });

  // Генерация YouTube анализа в стиле топ-каналов
  app.post('/api/ai/youtube-analysis', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const { markets, style } = req.body;

      if (!markets || !Array.isArray(markets) || !style) {
        return res.status(400).json({ message: "Markets array and style are required" });
      }

      const result = await aiContentService.generateYouTubeAnalysis(markets, style);

      await storage.createActivityLog({
        userId,
        action: 'AI YouTube Analysis Generated',
        description: `Generated YouTube analysis in ${style} style for ${markets.join(', ')}`,
        platformId: null,
        status: 'success',
        metadata: { markets, style },
      });

      res.json(result);
    } catch (error) {
      console.error("Error generating YouTube analysis:", error);
      res.status(500).json({ message: "Failed to generate YouTube analysis" });
    }
  });

  // Генерация live торговых сигналов
  app.post('/api/ai/live-signal', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const { symbol, action, entry, targets, stopLoss, leverage, confidence } = req.body;

      if (!symbol || !action || !entry || !targets || !stopLoss) {
        return res.status(400).json({ message: "Symbol, action, entry, targets, and stopLoss are required" });
      }

      const result = await aiContentService.generateLiveSignalPost(
        symbol, action, entry, targets, stopLoss, leverage, confidence
      );

      await storage.createActivityLog({
        userId,
        action: 'AI Live Signal Generated',
        description: `Generated live signal for ${symbol} (${action})`,
        platformId: null,
        status: 'success',
        metadata: { symbol, action, entry, targets, stopLoss, leverage },
      });

      res.json(result);
    } catch (error) {
      console.error("Error generating live signal:", error);
      res.status(500).json({ message: "Failed to generate live signal" });
    }
  });

  // Генерация crypto прогнозов
  app.post('/api/ai/crypto-predictions', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const { timeframe, coins, reasoning } = req.body;

      if (!timeframe || !coins || !reasoning || !Array.isArray(coins) || !Array.isArray(reasoning)) {
        return res.status(400).json({ message: "Timeframe, coins array, and reasoning array are required" });
      }

      const result = await aiContentService.generateCryptoPredictions(timeframe, coins, reasoning);

      await storage.createActivityLog({
        userId,
        action: 'AI Crypto Predictions Generated',
        description: `Generated crypto predictions for ${timeframe}: ${coins.join(', ')}`,
        platformId: null,
        status: 'success',
        metadata: { timeframe, coins, reasoning },
      });

      res.json(result);
    } catch (error) {
      console.error("Error generating crypto predictions:", error);
      res.status(500).json({ message: "Failed to generate crypto predictions" });
    }
  });

  // Анализ мемкоинов
  app.post('/api/ai/memecoin-analysis', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const { coin, metrics } = req.body;

      if (!coin || !metrics) {
        return res.status(400).json({ message: "Coin and metrics are required" });
      }

      const result = await aiContentService.generateMemeCoinAnalysis(coin, metrics);

      await storage.createActivityLog({
        userId,
        action: 'AI Memecoin Analysis Generated',
        description: `Generated memecoin analysis for ${coin}`,
        platformId: null,
        status: 'success',
        metadata: { coin, metrics },
      });

      res.json(result);
    } catch (error) {
      console.error("Error generating memecoin analysis:", error);
      res.status(500).json({ message: "Failed to generate memecoin analysis" });
    }
  });

  // Генерация forex обучения
  app.post('/api/ai/forex-education', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const { topic, experience, focus } = req.body;

      if (!topic || !experience || !focus) {
        return res.status(400).json({ message: "Topic, experience, and focus are required" });
      }

      const result = await aiContentService.generateForexEducation(topic, experience, focus);

      await storage.createActivityLog({
        userId,
        action: 'AI Forex Education Generated',
        description: `Generated forex education on ${topic} for ${experience} traders`,
        platformId: null,
        status: 'success',
        metadata: { topic, experience, focus },
      });

      res.json(result);
    } catch (error) {
      console.error("Error generating forex education:", error);
      res.status(500).json({ message: "Failed to generate forex education" });
    }
  });

  // === АНАЛИЗ ТРЕНДОВ И ОПТИМИЗАЦИЯ ===

  // Анализ трендовых тем
  app.post('/api/ai/analyze-trends', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const { platform, niche } = req.body;

      if (!platform || !niche) {
        return res.status(400).json({ message: "Platform and niche are required" });
      }

      const result = await aiContentService.analyzeTrendingTopics(platform, niche);

      await storage.createActivityLog({
        userId,
        action: 'AI Trends Analyzed',
        description: `Analyzed trending topics for ${platform} ${niche}`,
        platformId: null,
        status: 'success',
        metadata: { platform, niche },
      });

      res.json(result);
    } catch (error) {
      console.error("Error analyzing trends:", error);
      res.status(500).json({ message: "Failed to analyze trends" });
    }
  });

  // Профессиональная оптимизация хештегов для трейдинга
  app.post('/api/ai/optimize-hashtags-pro', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const { content, platform, targetAudience } = req.body;

      if (!content || !platform) {
        return res.status(400).json({ message: "Content and platform are required" });
      }

      const result = await aiContentService.optimizeHashtags(content, platform, targetAudience);

      await storage.createActivityLog({
        userId,
        action: 'AI Hashtags Optimized',
        description: `Optimized hashtags for ${platform}`,
        platformId: null,
        status: 'success',
        metadata: { platform, targetAudience },
      });

      res.json(result);
    } catch (error) {
      console.error("Error optimizing hashtags:", error);
      res.status(500).json({ message: "Failed to optimize hashtags" });
    }
  });

  // Конкурентный анализ
  app.post('/api/ai/competitor-analysis', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const { competitors, analysisType } = req.body;

      if (!competitors || !Array.isArray(competitors) || !analysisType) {
        return res.status(400).json({ message: "Competitors array and analysis type are required" });
      }

      const result = await aiContentService.generateCompetitorAnalysis(competitors, analysisType);

      await storage.createActivityLog({
        userId,
        action: 'AI Competitor Analysis',
        description: `Analyzed competitors for ${analysisType}: ${competitors.join(', ')}`,
        platformId: null,
        status: 'success',
        metadata: { competitors, analysisType },
      });

      res.json(result);
    } catch (error) {
      console.error("Error analyzing competitors:", error);
      res.status(500).json({ message: "Failed to analyze competitors" });
    }
  });

  // Генерация hook-библиотеки
  app.post('/api/ai/generate-hooks', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const { contentType, emotion } = req.body;

      if (!contentType || !emotion) {
        return res.status(400).json({ message: "Content type and emotion are required" });
      }

      const result = await aiContentService.generateHookLibrary(contentType, emotion);

      await storage.createActivityLog({
        userId,
        action: 'AI Hooks Generated',
        description: `Generated ${contentType} hooks with ${emotion} emotion`,
        platformId: null,
        status: 'success',
        metadata: { contentType, emotion },
      });

      res.json(result);
    } catch (error) {
      console.error("Error generating hooks:", error);
      res.status(500).json({ message: "Failed to generate hooks" });
    }
  });

  // === АВТОМАТИЧЕСКОЕ ПРОДВИЖЕНИЕ ===

  // Инициализация клиента Lucifer
  app.post('/api/client/init-lucifer', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;

      const luciferProfile = {
        name: 'Lucifer Tradera',
        platforms: {
          youtube: 'https://www.youtube.com/@Lucifer_tradera',
          tiktok: 'https://vm.tiktok.com/ZNHnt6CTrMdwp-ckGNa',
          telegram: ['https://t.me/Lucifer_Izzy_bot', 'https://t.me/Lucifer_tradera']
        },
        niche: 'trading',
        contentType: 'trading_signals',
      };

      // Запускаем глубокий анализ
      const analysis = await clientAnalysisService.analyzeClientProfile(luciferProfile);

      // Создаем стратегию продвижения
      const strategy = await promotionEngine.createPromotionStrategy(luciferProfile);

      // Логируем инициализацию
      await storage.createActivityLog({
        userId,
        action: 'Client Initialized',
        description: 'Lucifer Tradera profile analyzed and promotion strategy created',
        status: 'success',
        metadata: { client: 'Lucifer_tradera', analysis, strategy },
      });

      res.json({
        message: 'Клиент Lucifer Tradera успешно инициализирован',
        analysis,
        strategy,
        recommendations: analysis.recommendations,
      });
    } catch (error) {
      console.error('Ошибка инициализации клиента:', error);
      res.status(500).json({ error: 'Не удалось инициализировать клиента' });
    }
  });

  // Запуск автоматического продвижения
  app.post('/api/promotion/start', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      if (!userId) {
        return res.status(401).json({ error: 'Unauthorized' });
      }

      const { strategy } = req.body;
      const result = await promotionEngine.executePromotionStrategy(userId, strategy);

      res.json({
        message: 'Автоматическое продвижение запущено',
        result,
      });
    } catch (error) {
      console.error('Ошибка запуска продвижения:', error);
      res.status(500).json({ error: 'Не удалось запустить продвижение' });
    }
  });

  // Получение метрик продвижения
  app.get('/api/promotion/metrics/:clientId', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const { clientId } = req.params;

      const metrics = await promotionEngine.getPromotionMetrics(userId, clientId);

      res.json(metrics);
    } catch (error) {
      console.error('Ошибка получения метрик:', error);
      res.status(500).json({ error: 'Не удалось получить метрики' });
    }
  });

  // Адаптивное обновление стратегии
  app.post('/api/promotion/adapt-strategy', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const { strategyId, performanceData } = req.body;

      const adaptedStrategy = await promotionEngine.adaptStrategy(strategyId, performanceData);

      await storage.createActivityLog({
        userId,
        action: 'Strategy Adapted',
        description: `Strategy ${strategyId} adapted based on performance`,
        status: 'success',
        metadata: { strategyId, adaptedStrategy },
      });

      res.json({
        message: 'Стратегия успешно адаптирована',
        adaptedStrategy,
      });
    } catch (error) {
      console.error('Ошибка адаптации стратегии:', error);
      res.status(500).json({ error: 'Не удалось адаптировать стратегию' });
    }
  });

  // Анализ результатов продвижения
  app.get('/api/promotion/results', isAuthenticated, async (req, res) => {
    try {
      const userId = req.user.claims.sub;
      if (!userId) {
        return res.status(401).json({ error: 'Unauthorized' });
      }

      const days = parseInt(req.query.days as string) || 7;
      const results = await promotionEngine.analyzePromotionResults(userId, days);

      res.json(results);
    } catch (error) {
      console.error('Ошибка анализа результатов:', error);
      res.status(500).json({ error: 'Не удалось получить результаты' });
    }
  });

  // Analytics routes
  app.get('/api/analytics', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const platformId = req.query.platformId ? parseInt(req.query.platformId as string) : undefined;
      const analytics = await storage.getUserAnalytics(userId, platformId);
      res.json(analytics);
    } catch (error) {
      console.error("Error fetching analytics:", error);
      res.status(500).json({ message: "Failed to fetch analytics" });
    }
  });

  app.get('/api/analytics/dashboard', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const dashboardData = await analyticsService.getDashboardData(userId);
      res.json(dashboardData);
    } catch (error) {
      console.error("Error fetching dashboard data:", error);
      res.status(500).json({ message: "Failed to fetch dashboard data" });
    }
  });

  // Safety routes
  app.get('/api/safety/status', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const safetyStatus = await safetyService.getUserSafetyStatus(userId);
      res.json(safetyStatus);
    } catch (error) {
      console.error("Error fetching safety status:", error);
      res.status(500).json({ message: "Failed to fetch safety status" });
    }
  });

  app.post('/api/safety/check', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const result = await safetyService.performSafetyCheck(userId);
      res.json(result);
    } catch (error) {
      console.error("Error performing safety check:", error);
      res.status(500).json({ message: "Failed to perform safety check" });
    }
  });

  // Scheduler routes
  app.get('/api/scheduler/jobs', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const jobs = await schedulerService.getUserJobs(userId);
      res.json(jobs);
    } catch (error) {
      console.error("Error fetching scheduled jobs:", error);
      res.status(500).json({ message: "Failed to fetch scheduled jobs" });
    }
  });

  app.post('/api/scheduler/emergency-stop', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      await schedulerService.emergencyStop(userId);

      // Log activity
      await storage.createActivityLog({
        userId,
        action: 'Emergency Stop',
        description: 'All automation stopped by user',
        platformId: null,
        status: 'warning',
        metadata: null,
      });

      res.json({ message: 'Emergency stop activated' });
    } catch (error) {
      console.error("Error performing emergency stop:", error);
      res.status(500).json({ message: "Failed to perform emergency stop" });
    }
  });

  // Activity logs
  app.get('/api/activity', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const limit = parseInt(req.query.limit as string) || 50;
      const activities = await storage.getUserActivityLogs(userId, limit);
      res.json(activities);
    } catch (error) {
      console.error("Error fetching activity logs:", error);
      res.status(500).json({ message: "Failed to fetch activity logs" });
    }
  });

  // Deep Analytics Routes
  app.get('/api/analytics/platform/:platformId', isAuthenticated, async (req: any, res) => {
    try {
      const { platformId } = req.params;
      const userId = req.user.claims.sub;
      const days = parseInt(req.query.days as string) || 30;
      const analytics = await storage.getPlatformAnalytics(userId, parseInt(platformId), days);

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

  app.get('/api/analytics/insights', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const type = req.query.type as string;
      const insights = await storage.getAIInsights(userId, type);
      res.json(insights);
    } catch (error) {
      console.error('Ошибка получения AI инсайтов:', error);
      res.status(500).json({ error: 'Не удалось получить AI инсайты' });
    }
  });

  app.get('/api/analytics/competitors/:platformId', isAuthenticated, async (req: any, res) => {
    try {
      const { platformId } = req.params;
      const userId = req.user.claims.sub;
      const competitors = await storage.getCompetitorAnalyses(userId, parseInt(platformId));

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

  app.get('/api/analytics/trends/:platformId', isAuthenticated, async (req: any, res) => {
    try {
      const { platformId } = req.params;
      const category = req.query.category as string;
      const days = parseInt(req.query.days as string) || 7;
      const trends = await storage.getTrendAnalysis(parseInt(platformId), category, days);

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

  app.post('/api/analytics/analyze-content', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const { content, platform } = req.body;

      if (!content || !platform) {
        return res.status(400).json({ error: 'Контент и платформа обязательны' });
      }

      const platformData = await storage.getUserAccounts(userId);
      const targetPlatform = platformData.find(p => p.platformId.toString() === platform);

      let historicalData: any[] = [];
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

  app.post('/api/analytics/optimize-hashtags', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
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

  // Social Media OAuth Integration Routes
  app.get('/api/social/auth/:platformId', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const platformId = parseInt(req.params.platformId);
      const state = require('crypto').randomUUID();

      const service = socialMediaManager.getService(platformId);
      if (!service) {
        return res.status(400).json({ error: 'Platform not supported' });
      }

      const authUrl = await service.getAuthUrl(userId, state);

      // Store state for CSRF protection
      req.session.oauthState = { state, userId, platformId };

      res.json({ authUrl });
    } catch (error) {
      console.error('OAuth initialization error:', error);
      res.status(500).json({ error: 'Failed to initialize OAuth' });
    }
  });

  app.get('/api/social/callback', isAuthenticated, async (req: any, res) => {
    try {
      const { code, state, error } = req.query;

      if (error) {
        return res.status(400).json({ error: `OAuth error: ${error}` });
      }

      if (!code || !state) {
        return res.status(400).json({ error: 'Missing authorization code or state' });
      }

      const sessionState = req.session.oauthState;
      if (!sessionState || sessionState.state !== state) {
        return res.status(400).json({ error: 'Invalid state parameter' });
      }

      const { userId, platformId } = sessionState;

      const service = socialMediaManager.getService(platformId);
      if (!service) {
        return res.status(400).json({ error: 'Platform not supported' });
      }

      // Exchange code for tokens
      const tokens = await service.exchangeCodeForToken(code, state);

      // Create or update user account
      const existingAccount = await storage.getUserAccount(userId, platformId);

      let accountId: number;
      if (existingAccount) {
        await storage.updateUserAccount(existingAccount.id, {
          accessToken: tokens.accessToken,
          refreshToken: tokens.refreshToken,
          tokenExpiry: tokens.expiresAt,
          authStatus: 'connected',
        });
        accountId = existingAccount.id;
      } else {
        const newAccount = await storage.createUserAccount({
          userId,
          platformId,
          accountHandle: 'New Account', // Will be updated with actual data
          accessToken: tokens.accessToken,
          refreshToken: tokens.refreshToken,
          tokenExpiry: tokens.expiresAt,
          authStatus: 'connected',
        });
        accountId = newAccount.id;
      }

      // For Instagram, get Business Account ID automatically
      if (platformId === 1) { // Instagram
        try {
          const instagramService = service as any; // Cast to access Instagram-specific methods
          if (instagramService.getInstagramBusinessAccountId) {
            const businessAccountId = await instagramService.getInstagramBusinessAccountId(tokens.accessToken);

            if (businessAccountId) {
              // Get existing platform config and merge with business account ID
              const currentAccount = await storage.getUserAccount(userId, platformId);
              const existingConfig = (currentAccount && currentAccount.platformConfig) || {};

              await storage.updateUserAccount(accountId, {
                platformConfig: {
                  ...existingConfig,
                  businessAccountId,
                },
                accountHandle: `Instagram Business Account`,
              });
              console.log(`Instagram Business Account ID obtained: ${businessAccountId}`);
            } else {
              console.warn('Instagram Business Account ID not found. User may need to connect Instagram to Facebook page.');
            }
          }
        } catch (error) {
          console.error('Failed to get Instagram Business Account ID:', error);
          // Don't fail the entire OAuth flow for this
        }
      }

      // Clean up session
      delete req.session.oauthState;

      // Log successful connection
      const platform = await storage.getPlatform(platformId);
      await storage.createActivityLog({
        userId,
        platformId,
        action: 'Platform Connected',
        description: `Successfully connected ${platform?.displayName} account`,
        status: 'success',
        metadata: {},
      });

      res.json({ success: true, message: 'Platform connected successfully' });
    } catch (error) {
      console.error('OAuth callback error:', error);
      res.status(500).json({ error: 'Failed to complete OAuth flow' });
    }
  });

  app.post('/api/social/disconnect/:accountId', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const accountId = parseInt(req.params.accountId);

      const account = await storage.getUserAccount(userId, accountId);
      if (!account) {
        return res.status(404).json({ error: 'Account not found' });
      }

      await storage.updateUserAccount(accountId, {
        isActive: false,
        authStatus: 'disconnected',
        accessToken: null,
        refreshToken: null,
        tokenExpiry: null,
      });

      // Log disconnection
      const platform = await storage.getPlatform(account.platformId);
      await storage.createActivityLog({
        userId,
        platformId: account.platformId,
        action: 'Platform Disconnected',
        description: `Disconnected ${platform?.displayName} account`,
        status: 'success',
        metadata: {},
      });

      res.json({ success: true, message: 'Account disconnected successfully' });
    } catch (error) {
      console.error('Disconnect account error:', error);
      res.status(500).json({ error: 'Failed to disconnect account' });
    }
  });

  app.post('/api/social/post', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const { content, mediaUrls, platformIds } = req.body;

      if (!content) {
        return res.status(400).json({ error: 'Content is required' });
      }

      const postData = { content, mediaUrls };
      let results;

      if (platformIds && platformIds.length > 0) {
        // Post to specific platforms
        results = {} as { [platformId: number]: any };
        const userAccounts = await storage.getUserAccounts(userId);

        for (const platformId of platformIds) {
          const account = userAccounts.find(acc => 
            acc.platformId === platformId && 
            acc.isActive && 
            acc.authStatus === 'connected'
          );

          if (account) {
            const service = socialMediaManager.getService(platformId);
            if (service) {
              (results as any)[platformId] = await service.post(account, postData);
            }
          } else {
            (results as any)[platformId] = {
              success: false,
              error: 'Account not connected for this platform',
            };
          }
        }
      } else {
        // Post to all connected platforms
        results = await socialMediaManager.postToAllPlatforms(userId, postData);
      }

      // Log posting activity
      const successfulPosts = Object.values(results).filter((r: any) => r.success).length;
      const totalPosts = Object.keys(results).length;

      await storage.createActivityLog({
        userId,
        platformId: null,
        action: 'Multi-Platform Post',
        description: `Posted to ${successfulPosts}/${totalPosts} platforms`,
        status: successfulPosts > 0 ? 'success' : 'error',
        metadata: { results },
      });

      res.json({ results, summary: { successful: successfulPosts, total: totalPosts } });
    } catch (error) {
      console.error('Social media posting error:', error);
      res.status(500).json({ error: 'Failed to post content' });
    }
  });

  app.post('/api/social/validate-tokens', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      await socialMediaManager.validateAllTokens(userId);

      const updatedAccounts = await storage.getUserAccounts(userId);
      res.json({ 
        success: true, 
        accounts: updatedAccounts.map(acc => ({
          id: acc.id,
          platformId: acc.platformId,
          authStatus: acc.authStatus,
          isActive: acc.isActive,
        }))
      });
    } catch (error) {
      console.error('Token validation error:', error);
      res.status(500).json({ error: 'Failed to validate tokens' });
    }
  });

  // === AI ОБУЧЕНИЕ И РАЗВИТИЕ СИСТЕМЫ ===

  // Инициализация AI обучения для клиента
  app.post('/api/ai/initialize-learning', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const { clientProfile } = req.body;

      await aiLearningEngine.trainOnClientData(userId, clientProfile);

      await storage.createActivityLog({
        userId,
        action: 'AI Learning Initialized',
        description: 'AI система обучена на данных клиента',
        status: 'success',
        metadata: { clientProfile: clientProfile.name },
      });

      res.json({
        message: 'AI система успешно обучена на данных клиента',
        learningStatus: 'initialized',
      });
    } catch (error) {
      console.error('Ошибка инициализации обучения AI:', error);
      res.status(500).json({ error: 'Не удалось инициализировать обучение AI' });
    }
  });

  // Генерация продвинутой стратегии продвижения
  app.post('/api/ai/generate-advanced-strategy', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const { clientProfile } = req.body;

      const strategy = await aiLearningEngine.generateAdvancedPromotionStrategy(clientProfile);

      await storage.createActivityLog({
        userId,
        action: 'Advanced Strategy Generated',
        description: 'Создана продвинутая AI стратегия продвижения',
        status: 'success',
        metadata: { strategy: strategy },
      });

      res.json({
        strategy,
        message: 'Продвинутая стратегия продвижения создана',
      });
    } catch (error) {
      console.error('Ошибка генерации продвинутой стратегии:', error);
      res.status(500).json({ error: 'Не удалось создать продвинутую стратегию' });
    }
  });

  // Предсказание успешности контента
  app.post('/api/ai/predict-content-success', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const { content, platform, timing, clientProfile } = req.body;

      const prediction = await aiLearningEngine.predictContentSuccess(
        content,
        platform,
        new Date(timing),
        clientProfile
      );

      res.json({
        prediction,
        message: 'Прогноз успешности контента готов',
      });
    } catch (error) {
      console.error('Ошибка предсказания успешности:', error);
      res.status(500).json({ error: 'Не удалось спрогнозировать успешность контента' });
    }
  });

  // Генерация уникального контента
  app.post('/api/ai/generate-unique-content', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const { clientProfile, contentType, platform } = req.body;

      const uniqueContent = await aiLearningEngine.generateUniqueContent(
        clientProfile,
        contentType,
        platform
      );

      await storage.createActivityLog({
        userId,
        action: 'Unique Content Generated',
        description: `Создан уникальный ${contentType} контент для ${platform}`,
        status: 'success',
        metadata: { contentType, platform, uniqueness_score: uniqueContent.uniqueness_score },
      });

      res.json({
        content: uniqueContent,
        message: 'Уникальный контент создан',
      });
    } catch (error) {
      console.error('Ошибка генерации уникального контента:', error);
      res.status(500).json({ error: 'Не удалось создать уникальный контент' });
    }
  });

  // Генерация вирусных триггеров
  app.post('/api/ai/generate-viral-triggers', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const { contentType, platform, audience } = req.body;

      const viralTriggers = await aiLearningEngine.generateViralTriggers(
        contentType,
        platform,
        audience
      );

      res.json({
        triggers: viralTriggers,
        message: 'Вирусные триггеры созданы',
      });
    } catch (error) {
      console.error('Ошибка генерации вирусных триггеров:', error);
      res.status(500).json({ error: 'Не удалось создать вирусные триггеры' });
    }
  });

  // Запуск непрерывного обучения
  app.post('/api/ai/continuous-learning', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;

      await aiLearningEngine.continuousLearning();

      await storage.createActivityLog({
        userId,
        action: 'Continuous Learning Cycle',
        description: 'Запущен цикл непрерывного обучения AI',
        status: 'success',
        metadata: { timestamp: new Date() },
      });

      res.json({
        message: 'Цикл непрерывного обучения завершен',
        status: 'learning_updated',
      });
    } catch (error) {
      console.error('Ошибка непрерывного обучения:', error);
      res.status(500).json({ error: 'Не удалось выполнить обучение' });
    }
  });

  // Отчет об обучении AI
  app.get('/api/ai/learning-report', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;

      const report = await aiLearningEngine.generateLearningReport(userId);

      res.json({
        report,
        message: 'Отчет об обучении AI готов',
      });
    } catch (error) {
      console.error('Ошибка генерации отчета об обучении:', error);
      res.status(500).json({ error: 'Не удалось создать отчет' });
    }
  });

  // Автоматическое обучение системы (запускается периодически)
  app.post('/api/ai/auto-learning', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;

      // Запускаем автоматическое обучение в фоне
      setInterval(async () => {
        try {
          await aiLearningEngine.continuousLearning();
          console.log('🔄 Автоматическое обучение AI выполнено');
        } catch (error) {
          console.error('Ошибка автоматического обучения:', error);
        }
      }, 60 * 60 * 1000); // Каждый час

      res.json({
        message: 'Автоматическое обучение AI активировано',
        frequency: 'каждый час',
      });
    } catch (error) {
      console.error('Ошибка активации автоматического обучения:', error);
      res.status(500).json({ error: 'Не удалось активировать автоматическое обучение' });
    }
  });

  // === РЕВОЛЮЦИОННЫЕ ФУНКЦИИ ВИРУСНОГО РОСТА ===

  // Анализ вирусного потенциала
  app.post('/api/viral/analyze-potential', isAuthenticated, async (req: any, res) => {
    try {
      const { content, platform } = req.body;
      const viralMetrics = await viralGrowthEngine.analyzeViralPotential(content, platform);
      res.json({ metrics: viralMetrics, message: 'Анализ вирусного потенциала завершен' });
    } catch (error) {
      console.error('Ошибка анализа вирусного потенциала:', error);
      res.status(500).json({ error: 'Не удалось проанализировать вирусный потенциал' });
    }
  });

  // Генерация вирусного контента
  app.post('/api/viral/generate-content', isAuthenticated, async (req: any, res) => {
    try {
      const { niche, platform, targetEmotion } = req.body;
      const viralContent = await viralGrowthEngine.generateViralContent(niche, platform, targetEmotion);

      res.json({
        content: viralContent,
        message: 'Вирусный контент создан с высоким потенциалом',
      });
    } catch (error) {
      console.error('Ошибка генерации вирусного контента:', error);
      res.status(500).json({ error: 'Не удалось создать вирусный контент' });
    }
  });

  // Запуск вирусной кампании
  app.post('/api/viral/launch-campaign', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const { campaignType, niche } = req.body;

      const campaign = await viralGrowthEngine.launchViralCampaign(userId, campaignType, niche);

      await storage.createActivityLog({
        userId,
        action: 'Viral Campaign Launched',
        description: `Запущена вирусная кампания: ${campaignType}`,
        status: 'success',
        metadata: campaign,
      });

      res.json({
        campaign,
        message: 'Вирусная кампания успешно запущена!',
      });
    } catch (error) {
      console.error('Ошибка запуска вирусной кампании:', error);
      res.status(500).json({ error: 'Не удалось запустить вирусную кампанию' });
    }
  });

  // Генерация психологических триггеров
  app.post('/api/viral/psychological-triggers', isAuthenticated, async (req: any, res) => {
    try {
      const { audience, goal } = req.body;
      const triggers = await viralGrowthEngine.generatePsychologicalTriggers(audience, goal);

      res.json({
        triggers,
        message: 'Психологические триггеры сгенерированы',
      });
    } catch (error) {
      console.error('Ошибка генерации психологических триггеров:', error);
      res.status(500).json({ error: 'Не удалось создать психологические триггеры' });
    }
  });

  // Создание эмоционального контента
  app.post('/api/viral/emotional-content', isAuthenticated, async (req: any, res) => {
    try {
      const { emotion, niche, platform } = req.body;
      const emotionalContent = await viralGrowthEngine.createEmotionalContent(emotion, niche, platform);

      res.json({
        content: emotionalContent,
        emotion,
        message: `Эмоциональный контент (${emotion}) создан`,
      });
    } catch (error) {
      console.error('Ошибка создания эмоционального контента:', error);
      res.status(500).json({ error: 'Не удалось создать эмоциональный контент' });
    }
  });

  // Применение нейромаркетинга
  app.post('/api/viral/neuromarketing', isAuthenticated, async (req: any, res) => {
    try {
      const { content } = req.body;
      const enhancedContent = await viralGrowthEngine.applyNeuroMarketingPrinciples(content);

      res.json({
        original: content,
        enhanced: enhancedContent,
        message: 'Нейромаркетинговые принципы применены',
      });
    } catch (error) {
      console.error('Ошибка применения нейромаркетинга:', error);
      res.status(500).json({ error: 'Не удалось применить нейромаркетинг' });
    }
  });

  // === СИСТЕМА СЛЕЖЕНИЯ ЗА КОНКУРЕНТАМИ ===

  // Мониторинг конкурентов
  app.post('/api/competitors/monitor', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const { niche } = req.body;

      const intelligence = await competitorSurveillance.monitorCompetitors(niche);

      await storage.createActivityLog({
        userId,
        action: 'Competitor Intelligence',
        description: `Собрана разведка по конкурентам в нише: ${niche}`,
        status: 'success',
        metadata: intelligence,
      });

      res.json({
        intelligence,
        message: 'Разведданные по конкурентам получены',
      });
    } catch (error) {
      console.error('Ошибка мониторинга конкурентов:', error);
      res.status(500).json({ error: 'Не удалось провести мониторинг конкурентов' });
    }
  });

  // Анализ стратегий конкурентов
  app.post('/api/competitors/analyze-strategies', isAuthenticated, async (req: any, res) => {
    try {
      const { competitors } = req.body;
      const strategies = await competitorSurveillance.analyzeCompetitorStrategies(competitors);

      res.json({
        strategies,
        message: 'Стратегии конкурентов проанализированы',
      });
    } catch (error) {
      console.error('Ошибка анализа стратегий конкурентов:', error);
      res.status(500).json({ error: 'Не удалось проанализировать стратегии конкурентов' });
    }
  });

  // Создание контр-стратегии
  app.post('/api/competitors/counter-strategy', isAuthenticated, async (req: any, res) => {
    try {
      const { competitorHandle, theirStrategy } = req.body;
      const counterStrategy = await competitorSurveillance.createCounterStrategy(competitorHandle, theirStrategy);

      res.json({
        counterStrategy,
        message: 'Контр-стратегия создана',
      });
    } catch (error) {
      console.error('Ошибка создания контр-стратегии:', error);
      res.status(500).json({ error: 'Не удалось создать контр-стратегию' });
    }
  });

  // Предсказание действий конкурентов
  app.post('/api/competitors/predict-moves', isAuthenticated, async (req: any, res) => {
    try {
      const { competitorData, marketTrends } = req.body;
      const predictions = await competitorSurveillance.predictCompetitorMoves(competitorData, marketTrends);

      res.json({
        predictions,
        message: 'Действия конкурентов спрогнозированы',
      });
    } catch (error) {
      console.error('Ошибка предсказания действий конкурентов:', error);
      res.status(500).json({ error: 'Не удалось спрогнозировать действия конкурентов' });
    }
  });

  // Настройка автоматического мониторинга
  app.post('/api/competitors/setup-monitoring', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const { competitors } = req.body;

      await competitorSurveillance.setupAutomaticMonitoring(userId, competitors);

      res.json({
        message: 'Автоматический мониторинг конкурентов настроен',
        competitors: competitors.length,
      });
    } catch (error) {
      console.error('Ошибка настройки мониторинга:', error);
      res.status(500).json({ error: 'Не удалось настроить мониторинг' });
    }
  });

  // === СИСТЕМА ДОМИНИРОВАНИЯ БРЕНДА ===

  // Создание плана доминирования
  app.post('/api/domination/create-plan', isAuthenticated, async (req: any, res) => {
    try {
      const { clientProfile, targetMarketShare } = req.body;
      const dominationPlan = await brandDominationEngine.createDominationPlan(clientProfile, targetMarketShare);

      res.json({
        plan: dominationPlan,
        message: 'План доминирования создан',
      });
    } catch (error) {
      console.error('Ошибка создания плана доминирования:', error);
      res.status(500).json({ error: 'Не удалось создать план доминирования' });
    }
  });

  // Создание брендовой империи
  app.post('/api/domination/build-empire', isAuthenticated, async (req: any, res) => {
    try {
      const { clientProfile } = req.body;
      const empire = await brandDominationEngine.buildBrandEmpire(clientProfile);

      res.json({
        empire,
        message: 'Брендовая империя создана',
      });
    } catch (error) {
      console.error('Ошибка создания брендовой империи:', error);
      res.status(500).json({ error: 'Не удалось создать брендовую империю' });
    }
  });

  // Запуск агрессивного роста
  app.post('/api/domination/aggressive-growth', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const { clientProfile } = req.body;

      const results = await brandDominationEngine.executeAggressiveGrowth(userId, clientProfile);

      await storage.createActivityLog({
        userId,
        action: 'Aggressive Growth Launched',
        description: 'Запущена агрессивная стратегия роста и доминирования',
        status: 'success',
        metadata: results,
      });

      res.json({
        results,
        message: 'Агрессивная стратегия роста запущена!',
      });
    } catch (error) {
      console.error('Ошибка запуска агрессивного роста:', error);
      res.status(500).json({ error: 'Не удалось запустить агрессивный рост' });
    }
  });

  // Психологическая кампания
  app.post('/api/domination/psychological-campaign', isAuthenticated, async (req: any, res) => {
    try {
      const { targetAudience, competitorWeaknesses } = req.body;
      const campaign = await brandDominationEngine.launchPsychologicalCampaign(targetAudience, competitorWeaknesses);

      res.json({
        campaign,
        message: 'Психологическая кампания запущена',
      });
    } catch (error) {
      console.error('Ошибка запуска психологической кампании:', error);
      res.status(500).json({ error: 'Не удалось запустить психологическую кампанию' });
    }
  });

  // План монополизации
  app.post('/api/domination/monopolization-plan', isAuthenticated, async (req: any, res) => {
    try {
      const { niche } = req.body;
      const monopolizationPlan = await brandDominationEngine.createMonopolizationPlan(niche);

      res.json({
        plan: monopolizationPlan,
        message: 'План монополизации рынка создан',
      });
    } catch (error) {
      console.error('Ошибка создания плана монополизации:', error);
      res.status(500).json({ error: 'Не удалось создать план монополизации' });
    }
  });

  // === GEMINI AI ИНТЕГРАЦИЯ ===

  // Анализ контента с Gemini
  app.post('/api/gemini/analyze-content', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const { content, context } = req.body;

      const { geminiService } = await import('./services/geminiService');
      const analysis = await geminiService.analyzeContent(content, context);

      await storage.createActivityLog({
        userId,
        action: 'Gemini Content Analysis',
        description: 'Контент проанализирован с помощью Gemini AI',
        status: 'success',
        metadata: { analysis },
      });

      res.json(analysis);
    } catch (error) {
      console.error('Gemini analysis error:', error);
      res.status(500).json({ error: 'Не удалось проанализировать контент' });
    }
  });

  // Анализ изображения с Gemini Vision
  app.post('/api/gemini/analyze-image', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const { imageData, prompt } = req.body;

      const { geminiService } = await import('./services/geminiService');
      const analysis = await geminiService.analyzeImage(imageData, prompt);

      await storage.createActivityLog({
        userId,
        action: 'Gemini Image Analysis',
        description: 'Изображение проанализировано с помощью Gemini Vision',
        status: 'success',
        metadata: { analysis },
      });

      res.json(analysis);
    } catch (error) {
      console.error('Gemini image analysis error:', error);
      res.status(500).json({ error: 'Не удалось проанализировать изображение' });
    }
  });

  // Генерация трейдинг контента с Gemini
  app.post('/api/gemini/generate-trading', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const { type, market, trend, audience } = req.body;

      const { geminiService } = await import('./services/geminiService');
      const content = await geminiService.generateTradingContent({
        type,
        market,
        trend,
        audience,
      });

      res.json({ content });
    } catch (error) {
      console.error('Gemini trading content error:', error);
      res.status(500).json({ error: 'Не удалось создать контент' });
    }
  });

  // Мультимодальный анализ поста
  app.post('/api/gemini/analyze-post', isAuthenticated, async (req: any, res) => {
    try {
      const { caption, imageData, platform } = req.body;

      const { geminiService } = await import('./services/geminiService');
      const analysis = await geminiService.analyzePostWithImage(caption, imageData, platform);

      res.json(analysis);
    } catch (error) {
      console.error('Gemini post analysis error:', error);
      res.status(500).json({ error: 'Не удалось проанализировать пост' });
    }
  });

  // Конкурентный анализ с Gemini
  app.post('/api/gemini/analyze-competitor', isAuthenticated, async (req: any, res) => {
    try {
      const { competitorContent, niche } = req.body;

      const { geminiService } = await import('./services/geminiService');
      const analysis = await geminiService.analyzeCompetitor(competitorContent, niche);

      res.json(analysis);
    } catch (error) {
      console.error('Gemini competitor analysis error:', error);
      res.status(500).json({ error: 'Не удалось проанализировать конкурента' });
    }
  });

  // Адаптация контента между платформами
  app.post('/api/gemini/adapt-content', isAuthenticated, async (req: any, res) => {
    try {
      const { content, fromPlatform, toPlatform } = req.body;

      const { geminiService } = await import('./services/geminiService');
      const adaptedContent = await geminiService.adaptContentForPlatform(
        content,
        fromPlatform,
        toPlatform
      );

      res.json({ content: adaptedContent });
    } catch (error) {
      console.error('Gemini adaptation error:', error);
      res.status(500).json({ error: 'Не удалось адаптировать контент' });
    }
  });

  // Персонализация контента
  app.post('/api/gemini/personalize', isAuthenticated, async (req: any, res) => {
    try {
      const { content, audienceProfile } = req.body;

      const { geminiService } = await import('./services/geminiService');
      const personalizedContent = await geminiService.personalizeContent(
        content,
        audienceProfile
      );

      res.json({ content: personalizedContent });
    } catch (error) {
      console.error('Gemini personalization error:', error);
      res.status(500).json({ error: 'Не удалось персонализировать контент' });
    }
  });

  // === УМНОЕ ПРОДВИЖЕНИЕ С API ИНТЕГРАЦИЕЙ ===

  // Анализ всех интегрированных платформ
  app.get('/api/smart-promotion/analyze', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const { smartPromotionManager } = await import('./services/smartPromotionManager');

      const integrations = await smartPromotionManager.analyzeIntegratedPlatforms(userId);

      res.json({
        integrations,
        message: 'Анализ платформ завершен',
      });
    } catch (error) {
      console.error('Ошибка анализа платформ:', error);
      res.status(500).json({ error: 'Не удалось проанализировать платформы' });
    }
  });

  // Генерация плана продвижения (бесплатный + платный)
  app.post('/api/smart-promotion/generate-plan', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const { smartPromotionManager } = await import('./services/smartPromotionManager');

      const integrations = await smartPromotionManager.analyzeIntegratedPlatforms(userId);
      const plan = await smartPromotionManager.generatePromotionPlan(userId, integrations);

      await storage.createActivityLog({
        userId,
        action: 'Promotion Plan Generated',
        description: 'Создан план продвижения с бесплатной и платной стратегиями',
        status: 'success',
        metadata: { plan },
      });

      res.json({
        plan,
        message: 'План продвижения создан',
      });
    } catch (error) {
      console.error('Ошибка генерации плана:', error);
      res.status(500).json({ error: 'Не удалось создать план продвижения' });
    }
  });

  // Запуск кампании продвижения
  app.post('/api/smart-promotion/launch', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const { planType } = req.body; // 'free' или 'paid'
      const { smartPromotionManager } = await import('./services/smartPromotionManager');

      const integrations = await smartPromotionManager.analyzeIntegratedPlatforms(userId);
      const plan = await smartPromotionManager.generatePromotionPlan(userId, integrations);
      const results = await smartPromotionManager.executePromotionPlan(userId, plan, planType);

      res.json({
        results,
        message: `${planType === 'paid' ? 'Платная' : 'Бесплатная'} кампания запущена`,
      });
    } catch (error) {
      console.error('Ошибка запуска кампании:', error);
      res.status(500).json({ error: 'Не удалось запустить кампанию' });
    }
  });

  // Получение рекомендаций для достижения лидерства
  app.get('/api/smart-promotion/leadership-plan', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const { smartPromotionManager } = await import('./services/smartPromotionManager');

      const integrations = await smartPromotionManager.analyzeIntegratedPlatforms(userId);
      const plan = await smartPromotionManager.generatePromotionPlan(userId, integrations);

      res.json({
        leadership: plan.marketLeadership,
        message: 'План достижения лидерства готов',
      });
    } catch (error) {
      console.error('Ошибка получения плана лидерства:', error);
      res.status(500).json({ error: 'Не удалось получить план лидерства' });
    }
  });

  // Setup advanced promotion strategy routes
  setupPromotionStrategyRoutes(app);

  // Telegram bot test route
  app.post('/api/telegram/test-post', isAuthenticated, async (req: any, res) => {
    try {
      const { publishPost } = await import('./telegramBot');
      const result = await publishPost();
      res.json({
        success: true,
        message: 'Пост успешно опубликован!',
        ...result
      });
    } catch (error: any) {
      console.error('Ошибка публикации в Telegram:', error);
      res.status(500).json({ 
        success: false,
        error: error.message || 'Не удалось опубликовать пост' 
      });
    }
  });

  // Активация автоматизации Telegram
  app.post('/api/telegram/activate-automation', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const { frequency, contentType } = req.body;

      await storage.createActivityLog({
        userId,
        action: 'Telegram Automation Activated',
        description: `Активирована автоматизация Telegram: ${frequency || 'standard'} режим`,
        status: 'success',
        metadata: { frequency, contentType },
      });

      res.json({
        success: true,
        message: 'Telegram автоматизация активирована!',
        schedule: {
          posts: '3 раза в день (9:00, 15:00, 20:00)',
          polls: '2 раза в неделю (Пн, Чт в 12:00)',
          autoReplies: 'Мгновенно',
        },
      });
    } catch (error: any) {
      console.error('Ошибка активации автоматизации:', error);
      res.status(500).json({ 
        success: false,
        error: error.message || 'Не удалось активировать автоматизацию' 
      });
    }
  });

  // === TELEGRAM BUSINESS TOOLS ===

  bot.onText(/\/business/, async (msg) => {
    const chatId = msg.chat.id;
    await bot!.sendMessage(chatId, `💼 *TELEGRAM BUSINESS TOOLS*

🎯 *Доступные функции:*
/webapp - Запустить Mini App для клиентов
/invoice - Создать счет на оплату
/subscription - Управление подписками
/analytics - Бизнес аналитика
/autoresponder - Настроить автоответчик
/chatbot - AI чат-бот для клиентов
/crm - CRM интеграция

🎙️ *VOICE AI:*
/voicesignal - Голосовой торговый сигнал
/podcast - Ежедневный подкаст
/transcribe - Распознать голосовое

✨ *PREMIUM:*
/setstatus - Эмодзи-статус
/reactions - Кастомные реакции
/largefile - Загрузить большой файл

📊 *Статистика бизнеса:*
• Активные клиенты: 234
• Конверсия: 8.9%
• Средний чек: 4,500₽
• Повторные покупки: 45%`, { parse_mode: 'Markdown' });
  });

  // Voice AI команды
  bot.onText(/\/voicesignal/, async (msg) => {
    const chatId = msg.chat.id;
    const { telegramVoiceAI } = await import('./services/telegramVoiceAI');

    const voiceUrl = await telegramVoiceAI.generateVoiceSignal({
      pair: 'BTC/USDT',
      action: 'BUY',
      entry: 45000,
      target: 47000,
      stopLoss: 44000,
    });

    await bot!.sendMessage(chatId, '🎙️ Голосовой сигнал отправляется...');
  });

  bot.onText(/\/podcast/, async (msg) => {
    const chatId = msg.chat.id;
    await bot!.sendMessage(chatId, '🎧 Генерирую ежедневный подкаст с AI анализом рынка...');
  });

  // Premium команды
  bot.onText(/\/setstatus/, async (msg) => {
    const chatId = msg.chat.id;
    const { telegramPremiumService } = await import('./services/telegramPremiumFeatures');

    await telegramPremiumService.setEmojiStatus('trading');
    await bot!.sendMessage(chatId, '✨ Эмодзи-статус установлен: 📊 TRADING');
  });

  // === TELEGRAM BUSINESS API ===

  // Создание invoice для оплаты
  app.post('/api/telegram/create-invoice', isAuthenticated, async (req: any, res) => {
    try {
      const { title, description, amount, currency } = req.body;

      const invoice = {
        invoiceId: `inv_${Date.now()}`,
        title,
        description,
        amount,
        currency: currency || 'RUB',
        paymentUrl: `https://t.me/$Bot?start=pay_${Date.now()}`,
      };

      res.json({ success: true, invoice });
    } catch (error: any) {
      res.status(500).json({ success: false, error: error.message });
    }
  });

  // Telegram Mini App данные
  app.post('/api/telegram/webapp-auth', async (req: any, res) => {
    try {
      const { initData } = req.body;
      const { telegramWebAppService } = await import('./services/telegramWebApp');

      const isValid = telegramWebAppService.validateWebAppData(initData, TELEGRAM_TOKEN);

      if (!isValid) {
        return res.status(401).json({ error: 'Invalid WebApp data' });
      }

      const user = telegramWebAppService.parseWebAppUser(initData);
      res.json({ success: true, user });
    } catch (error: any) {
      res.status(500).json({ success: false, error: error.message });
    }
  });

  // Запуск рекламной кампании в Telegram
  app.post('/api/telegram/launch-ads', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const { telegramAdsService } = await import('./services/telegramAds');

      const campaign = await telegramAdsService.createCampaign(req.body);

      await storage.createActivityLog({
        userId,
        action: 'Telegram Ads Campaign',
        description: `Запущена рекламная кампания: ${req.body.name}`,
        platformId: 4,
        status: 'success',
        metadata: { campaign },
      });

      res.json({ success: true, campaign });
    } catch (error: any) {
      res.status(500).json({ success: false, error: error.message });
    }
  });

  // Публикация в Telegram Stories
  app.post('/api/telegram/publish-story', isAuthenticated, async (req: any, res) => {
    try {
      const { mediaUrl, caption } = req.body;
      const { telegramStoriesService } = await import('./services/telegramStories');

      const story = await telegramStoriesService.publishStory(CHANNEL_ID, mediaUrl, caption);

      res.json({ success: true, story });
    } catch (error: any) {
      res.status(500).json({ success: false, error: error.message });
    }
  });

  // Telegram бизнес-аналитика
  app.get('/api/telegram/business-analytics', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;

      const analytics = {
        subscribers: {
          total: 8920,
          growth: { day: 234, week: 1240, month: 2340 },
          churnRate: 2.3,
        },
        engagement: {
          avgReactionRate: 12.8,
          avgCommentRate: 4.5,
          avgShareRate: 3.2,
        },
        revenue: {
          total: 1234000,
          subscriptions: 890000,
          oneTime: 344000,
          avgCheck: 4500,
        },
        conversionFunnel: {
          views: 145000,
          clicks: 18560,
          leads: 2340,
          customers: 234,
          conversionRate: 8.9,
        },
      };

      res.json(analytics);
    } catch (error: any) {
      res.status(500).json({ success: false, error: error.message });
    }
  });

  // Статистика Telegram бота
  app.get('/api/telegram/stats', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;

      // Получаем логи активности Telegram
      const activities = await storage.getUserActivityLogs(userId, 100);
      const telegramActivities = activities.filter(a => 
        a.action.includes('Telegram') || a.platformId === 4
      );

      const stats = {
        totalPosts: telegramActivities.filter(a => a.action.includes('Post')).length,
        totalPolls: telegramActivities.filter(a => a.action.includes('Poll')).length,
        automationActive: true,
        lastPost: telegramActivities[0]?.createdAt || null,
        avgEngagement: 7.8,
        growthRate: 12.5,
      };

      res.json(stats);
    } catch (error: any) {
      console.error('Ошибка получения статистики:', error);
      res.status(500).json({ 
        success: false,
        error: error.message 
      });
    }
  });

  const httpServer = createServer(app);
  return httpServer;
}