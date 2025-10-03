import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { setupAuth, isAuthenticated } from "./replitAuth";
import { seedPlatforms } from "./seedDatabase";
import { aiContentService } from "./services/aiContent";
import { aiAnalyticsService } from "./services/aiAnalytics";
import { aiAssistantService } from "./services/aiAssistant";
import { klingAIService } from "./services/klingAIService";
import { clientAnalysisService } from "./services/clientAnalysis";
import { promotionEngine } from "./services/promotionEngine";
import { socialMediaManager } from "./services/socialMediaIntegration";
import { analyticsService } from "./services/analytics";
import { safetyService } from "./services/safety";
import { schedulerService } from "./services/scheduler";
import { masterAutomation } from "./services/masterAutomation";
import { setupPromotionStrategyRoutes } from "./routes/promotionStrategy";
import { aiLearningEngine } from "./services/aiLearningEngine";
import { viralGrowthEngine } from "./services/viralGrowthEngine";
import { competitorSurveillance } from "./services/competitorSurveillance";
import { brandDominationEngine } from "./services/brandDominationEngine";
import type { Platform, UserAccount } from "@shared/schema";
import { insertPostSchema, insertAIContentLogSchema } from "@shared/schema";
import { z } from "zod";
import { ObjectStorageService, ObjectNotFoundError } from "./objectStorage";
import { ObjectPermission } from "./objectAcl";

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

  // === ВИЗУАЛЬНЫЙ AI-КОНТЕНТ ===

  // Генерация обложки канала
  app.post('/api/ai/channel-cover', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const { niche, style } = req.body;

      if (!niche || !style) {
        return res.status(400).json({ message: "Niche and style are required" });
      }

      const result = await (await import('./services/visualContentAI')).visualContentAI.generateChannelCover(niche, style);

      await storage.createActivityLog({
        userId,
        action: 'AI Channel Cover Generated',
        description: `Generated channel cover for ${niche} in ${style} style`,
        platformId: null,
        status: 'success',
        metadata: { niche, style, cost: result.cost },
      });

      res.json(result);
    } catch (error) {
      console.error("Error generating channel cover:", error);
      res.status(500).json({ message: "Failed to generate channel cover" });
    }
  });

  // Генерация иллюстрации для поста
  app.post('/api/ai/post-illustration', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const { topic, mood } = req.body;

      if (!topic || !mood) {
        return res.status(400).json({ message: "Topic and mood are required" });
      }

      const result = await (await import('./services/visualContentAI')).visualContentAI.generatePostIllustration(topic, mood);

      await storage.createActivityLog({
        userId,
        action: 'AI Post Illustration Generated',
        description: `Generated illustration for ${topic}`,
        platformId: null,
        status: 'success',
        metadata: { topic, mood, cost: result.cost },
      });

      res.json(result);
    } catch (error) {
      console.error("Error generating illustration:", error);
      res.status(500).json({ message: "Failed to generate illustration" });
    }
  });

  // Генерация мема
  app.post('/api/ai/meme', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const { scenario, humor } = req.body;

      if (!scenario || !humor) {
        return res.status(400).json({ message: "Scenario and humor type are required" });
      }

      const result = await (await import('./services/visualContentAI')).visualContentAI.generateMeme(scenario, humor);

      await storage.createActivityLog({
        userId,
        action: 'AI Meme Generated',
        description: `Generated meme about ${scenario}`,
        platformId: null,
        status: 'success',
        metadata: { scenario, humor, cost: result.cost },
      });

      res.json(result);
    } catch (error) {
      console.error("Error generating meme:", error);
      res.status(500).json({ message: "Failed to generate meme" });
    }
  });

  // Генерация инфографики
  app.post('/api/ai/infographic', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const { title, keyPoints, statistics } = req.body;

      if (!title || !keyPoints || !statistics) {
        return res.status(400).json({ message: "Title, key points and statistics are required" });
      }

      const result = await (await import('./services/visualContentAI')).visualContentAI.generateInfographic({
        title,
        keyPoints,
        statistics
      });

      await storage.createActivityLog({
        userId,
        action: 'AI Infographic Generated',
        description: `Generated infographic: ${title}`,
        platformId: null,
        status: 'success',
        metadata: { title, cost: result.cost },
      });

      res.json(result);
    } catch (error) {
      console.error("Error generating infographic:", error);
      res.status(500).json({ message: "Failed to generate infographic" });
    }
  });

  // Генерация озвучки
  app.post('/api/ai/voiceover', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const { text, voice, speed } = req.body;

      if (!text) {
        return res.status(400).json({ message: "Text is required" });
      }

      const result = await (await import('./services/visualContentAI')).visualContentAI.generateVoiceover(text, voice, speed);

      await storage.createActivityLog({
        userId,
        action: 'AI Voiceover Generated',
        description: `Generated voiceover (${text.length} chars)`,
        platformId: null,
        status: 'success',
        metadata: { voice, speed, cost: result.cost },
      });

      res.json(result);
    } catch (error) {
      console.error("Error generating voiceover:", error);
      res.status(500).json({ message: "Failed to generate voiceover" });
    }
  });

  // Генерация видео-скрипта
  app.post('/api/ai/video-script', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const { topic, duration, tone } = req.body;

      if (!topic) {
        return res.status(400).json({ message: "Topic is required" });
      }

      const result = await (await import('./services/visualContentAI')).visualContentAI.generateVideoScript(topic, duration, tone);

      await storage.createActivityLog({
        userId,
        action: 'AI Video Script Generated',
        description: `Generated video script for ${topic}`,
        platformId: null,
        status: 'success',
        metadata: { topic, duration, tone },
      });

      res.json(result);
    } catch (error) {
      console.error("Error generating video script:", error);
      res.status(500).json({ message: "Failed to generate video script" });
    }
  });

  // Генерация дизайн-шаблона
  app.post('/api/ai/design-template', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const { platform, content } = req.body;

      if (!platform || !content) {
        return res.status(400).json({ message: "Platform and content are required" });
      }

      const result = await (await import('./services/visualContentAI')).visualContentAI.generateDesignTemplate(platform, content);

      await storage.createActivityLog({
        userId,
        action: 'AI Design Template Generated',
        description: `Generated design template for ${platform}`,
        platformId: null,
        status: 'success',
        metadata: { platform, content },
      });

      res.json(result);
    } catch (error) {
      console.error("Error generating design template:", error);
      res.status(500).json({ message: "Failed to generate design template" });
    }
  });

  // Генерация геймификационного контента
  app.post('/api/ai/game-content', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const { type, topic, difficulty } = req.body;

      if (!type || !topic || !difficulty) {
        return res.status(400).json({ message: "Type, topic, and difficulty are required" });
      }

      const { contentOptimizationService } = await import('./services/contentOptimization');
      const result = await contentOptimizationService.generateGameContent(type, topic, difficulty);

      await storage.createActivityLog({
        userId,
        action: 'Game Content Generated',
        description: `Generated ${type} game content on ${topic}`,
        platformId: null,
        status: 'success',
        metadata: { type, difficulty, points: result.points },
      });

      res.json(result);
    } catch (error) {
      console.error("Error generating game content:", error);
      res.status(500).json({ message: "Failed to generate game content" });
    }
  });

  // Создание личности для бота
  app.post('/api/ai/bot-personality', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const { personality, niche } = req.body;

      if (!personality || !niche) {
        return res.status(400).json({ message: "Personality and niche are required" });
      }

      const { contentOptimizationService } = await import('./services/contentOptimization');
      const result = await contentOptimizationService.createBotPersonality(personality, niche);

      await storage.createActivityLog({
        userId,
        action: 'Bot Personality Created',
        description: `Created ${personality} personality for ${niche}`,
        platformId: null,
        status: 'success',
        metadata: { personality, niche },
      });

      res.json(result);
    } catch (error) {
      console.error("Error creating bot personality:", error);
      res.status(500).json({ message: "Failed to create bot personality" });
    }
  });

  // Массовая генерация контент-пака
  app.post('/api/ai/content-pack', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const { niche, posts, style } = req.body;

      if (!niche || !posts) {
        return res.status(400).json({ message: "Niche and posts count are required" });
      }

      const result = await (await import('./services/visualContentAI')).visualContentAI.generateContentPack({
        niche,
        posts,
        style: style || 'профессионал'
      });

      await storage.createActivityLog({
        userId,
        action: 'AI Content Pack Generated',
        description: `Generated content pack: ${result.covers.length} covers, ${result.illustrations.length} illustrations, ${result.memes.length} memes`,
        platformId: null,
        status: 'success',
        metadata: { niche, posts, totalCost: result.totalCost },
      });

      res.json(result);
    } catch (error) {
      console.error("Error generating content pack:", error);
      res.status(500).json({ message: "Failed to generate content pack" });
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

  // === ОПТИМИЗАЦИЯ КОНТЕНТА (Grammarly-подобная) ===

  // Проверка грамматики и стиля
  app.post('/api/ai/check-grammar', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const { text, targetAudience } = req.body;

      if (!text) {
        return res.status(400).json({ message: "Text is required" });
      }

      const { contentOptimizationService } = await import('./services/contentOptimization');
      const result = await contentOptimizationService.checkGrammarAndStyle(
        text,
        targetAudience || 'professional'
      );

      await storage.createActivityLog({
        userId,
        action: 'Grammar Check Completed',
        description: `Checked ${text.length} characters, found ${result.grammarIssues.length} issues`,
        platformId: null,
        status: 'success',
        metadata: { seoScore: result.seoScore, readabilityScore: result.readabilityScore },
      });

      res.json(result);
    } catch (error) {
      console.error("Error checking grammar:", error);
      res.status(500).json({ message: "Failed to check grammar" });
    }
  });

  // Анализ тональности контента
  app.post('/api/ai/analyze-sentiment', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const { text } = req.body;

      if (!text) {
        return res.status(400).json({ message: "Text is required" });
      }

      const { contentOptimizationService } = await import('./services/contentOptimization');
      const result = await contentOptimizationService.analyzeSentiment(text);

      await storage.createActivityLog({
        userId,
        action: 'Sentiment Analysis Completed',
        description: `Analyzed sentiment: ${result.sentiment} (${result.score})`,
        platformId: null,
        status: 'success',
        metadata: { sentiment: result.sentiment, emotions: result.emotions },
      });

      res.json(result);
    } catch (error) {
      console.error("Error analyzing sentiment:", error);
      res.status(500).json({ message: "Failed to analyze sentiment" });
    }
  });

  // TLDR генерация
  app.post('/api/ai/generate-tldr', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const { text, maxLength } = req.body;

      if (!text) {
        return res.status(400).json({ message: "Text is required" });
      }

      const { contentOptimizationService } = await import('./services/contentOptimization');
      const result = await contentOptimizationService.generateTLDR(text, maxLength || 200);

      await storage.createActivityLog({
        userId,
        action: 'TLDR Generated',
        description: `Generated TLDR for ${text.length} characters`,
        platformId: null,
        status: 'success',
        metadata: { keyPoints: result.keyPoints.length },
      });

      res.json(result);
    } catch (error) {
      console.error("Error generating TLDR:", error);
      res.status(500).json({ message: "Failed to generate TLDR" });
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

  // === AI VIDEO GENERATION (KLING AI) ===

  // Генерация видео-скрипта
  app.post('/api/ai-video/generate-script', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const { topic, duration, tone } = req.body;

      if (!topic) {
        return res.status(400).json({ message: "Topic is required" });
      }

      const { klingAIService } = await import('./services/klingAIService');
      const script = await klingAIService.generateVideoScript(
        topic,
        duration || 10,
        tone || 'professional'
      );

      await storage.createActivityLog({
        userId,
        action: 'AI Video Script Generated',
        description: `Generated video script for: ${topic}`,
        platformId: null,
        status: 'success',
        metadata: { topic, duration, tone },
      });

      res.json(script);
    } catch (error) {
      console.error("Error generating video script:", error);
      res.status(500).json({ 
        message: error instanceof Error ? error.message : "Failed to generate video script" 
      });
    }
  });

  // Генерация видео (Text-to-Video)
  app.post('/api/ai-video/generate', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const { prompt, config, postId } = req.body;

      if (!prompt) {
        return res.status(400).json({ message: "Prompt is required" });
      }

      const { klingAIService } = await import('./services/klingAIService');
      const videoResult = await klingAIService.generateTextToVideo(prompt, config);

      // Сохранить в базу данных
      const aiVideo = await storage.createAIVideo({
        userId,
        postId: postId || null,
        videoId: videoResult.taskId,
        prompt,
        config: config || {},
        status: 'processing',
        provider: videoResult.provider,
        cost: videoResult.cost
      });

      await storage.createActivityLog({
        userId,
        action: 'AI Video Generation Started',
        description: `Video generation started: ${prompt.substring(0, 50)}...`,
        platformId: null,
        status: 'success',
        metadata: { aiVideoId: aiVideo.id, taskId: videoResult.taskId },
      });

      res.json({
        ...videoResult,
        id: aiVideo.id
      });
    } catch (error) {
      console.error("Error generating video:", error);
      res.status(500).json({ 
        message: error instanceof Error ? error.message : "Failed to generate video" 
      });
    }
  });

  // Генерация видео из изображения (Image-to-Video)
  app.post('/api/ai-video/generate-from-image', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const { imageUrl, prompt, config, postId } = req.body;

      if (!imageUrl || !prompt) {
        return res.status(400).json({ message: "Image URL and prompt are required" });
      }

      const videoResult = await klingAIService.generateImageToVideo(imageUrl, prompt, config);

      const aiVideo = await storage.createAIVideo({
        userId,
        postId: postId || null,
        videoId: videoResult.taskId,
        prompt,
        config: { ...config, imageUrl },
        status: 'processing',
        provider: videoResult.provider,
        cost: videoResult.cost
      });

      await storage.createActivityLog({
        userId,
        action: 'AI Image-to-Video Started',
        description: `Image-to-video generation started`,
        platformId: null,
        status: 'success',
        metadata: { aiVideoId: aiVideo.id, taskId: videoResult.taskId },
      });

      res.json({
        ...videoResult,
        id: aiVideo.id
      });
    } catch (error) {
      console.error("Error generating video from image:", error);
      res.status(500).json({ 
        message: error instanceof Error ? error.message : "Failed to generate video from image" 
      });
    }
  });

  // === PRO PLAN ACTIVATION ===
  app.post('/api/subscription/activate-pro', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const { monetizationService } = await import('./services/monetization');
      
      const result = await monetizationService.activateProPlan(userId);

      await storage.createActivityLog({
        userId,
        action: 'Pro Features Unlocked',
        description: '🚀 Все премиум-функции разблокированы',
        status: 'success',
        metadata: {
          payment: 50,
          features: [
            '10,000 AI кредитов/месяц',
            'Неограниченные посты',
            '5 платформ',
            'Продвинутая аналитика',
            'Вирусный движок',
            'Автопродвижение',
            'Конкурентная разведка',
            'AI обучение'
          ]
        }
      });

      res.json({
        success: true,
        message: '🎉 PRO ПЛАН АКТИВИРОВАН!',
        plan: result.plan,
        features: result.features,
        unlocked: [
          '✅ Unlimited AI контент',
          '✅ Viral Growth Engine',
          '✅ Brand Domination',
          '✅ Competitor Surveillance',
          '✅ Auto Promotion Bot',
          '✅ Deep Analytics',
          '✅ AI Learning System',
          '✅ Priority Support'
        ]
      });
    } catch (error) {
      console.error('Ошибка активации Pro:', error);
      res.status(500).json({ error: 'Не удалось активировать Pro план' });
    }
  });

  // Проверка статуса подписки
  app.get('/api/subscription/status', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      
      res.json({
        active: true,
        plan: 'pro',
        credits: 10000,
        features: {
          unlimitedPosts: true,
          platforms: 5,
          advancedAI: true,
          viralEngine: true,
          analytics: true,
          autoPromotion: true
        },
        expiresAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000)
      });
    } catch (error) {
      res.status(500).json({ error: 'Не удалось получить статус подписки' });
    }
  });

  // Автоматическая генерация: Тема → Скрипт → Видео
  app.post('/api/ai-video/auto-generate', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const { topic, config, postId } = req.body;

      if (!topic) {
        return res.status(400).json({ message: "Topic is required" });
      }

      const { klingAIService } = await import('./services/klingAIService');
      const result = await klingAIService.autoGenerateVideo(topic, config);

      const aiVideo = await storage.createAIVideo({
        userId,
        postId: postId || null,
        videoId: result.video.taskId,
        prompt: topic,
        config: { ...config, script: result.script },
        status: 'processing',
        provider: result.video.provider,
        cost: result.video.cost
      });

      await storage.createActivityLog({
        userId,
        action: 'AI Auto Video Generation',
        description: `Auto video generation for topic: ${topic}`,
        platformId: null,
        status: 'success',
        metadata: { aiVideoId: aiVideo.id, taskId: result.video.taskId },
      });

      res.json({
        script: result.script,
        video: {
          ...result.video,
          id: aiVideo.id
        }
      });
    } catch (error) {
      console.error("Error in auto video generation:", error);
      res.status(500).json({ 
        message: error instanceof Error ? error.message : "Failed to auto-generate video" 
      });
    }
  });

  // Проверка статуса видео
  app.get('/api/ai-video/status/:id', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const aiVideo = await storage.getAIVideo(parseInt(req.params.id));

      if (!aiVideo || aiVideo.userId !== userId) {
        return res.status(404).json({ message: "Video not found" });
      }

      // Проверить статус у Kling AI если еще не завершен
      if (aiVideo.status === 'processing') {
        const { klingAIService } = await import('./services/klingAIService');
        const status = await klingAIService.checkVideoStatus(aiVideo.videoId);

        if (status.status === 'completed') {
          await storage.updateAIVideoStatus(
            aiVideo.id,
            'completed',
            status.videoUrl,
            status.thumbnailUrl
          );
          aiVideo.status = 'completed';
          aiVideo.videoUrl = status.videoUrl || null;
          aiVideo.thumbnailUrl = status.thumbnailUrl || null;
        } else if (status.status === 'failed') {
          await storage.updateAIVideoStatus(aiVideo.id, 'failed');
          aiVideo.status = 'failed';
        }
      }

      res.json(aiVideo);
    } catch (error) {
      console.error("Error checking video status:", error);
      res.status(500).json({ 
        message: error instanceof Error ? error.message : "Failed to check video status" 
      });
    }
  });

  // Получить все AI видео пользователя
  app.get('/api/ai-video/user-videos', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const limit = req.query.limit ? parseInt(req.query.limit as string) : 50;

      const videos = await storage.getUserAIVideos(userId, limit);
      res.json(videos);
    } catch (error) {
      console.error("Error fetching user videos:", error);
      res.status(500).json({ message: "Failed to fetch user videos" });
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

  // Master Automation routes
  app.post('/api/automation/start', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      await masterAutomation.startFullAutomation(userId);

      res.json({ 
        message: 'Full automation started',
        status: 'running'
      });
    } catch (error) {
      console.error("Error starting master automation:", error);
      res.status(500).json({ message: "Failed to start automation" });
    }
  });

  app.post('/api/automation/stop', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      await masterAutomation.stopAutomation(userId);

      res.json({ 
        message: 'Automation stopped',
        status: 'stopped'
      });
    } catch (error) {
      console.error("Error stopping master automation:", error);
      res.status(500).json({ message: "Failed to stop automation" });
    }
  });

  app.get('/api/automation/status', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const status = await masterAutomation.getAutomationStatus(userId);

      res.json(status);
    } catch (error) {
      console.error("Error getting automation status:", error);
      res.status(500).json({ message: "Failed to get automation status" });
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

  // Setup advanced promotion strategy routes
  setupPromotionStrategyRoutes(app);

  // === АВТОМАТИЧЕСКАЯ ГЕНЕРАЦИЯ ВИЗУАЛА ===

  // Автоматическая генерация визуала для поста
  app.post('/api/auto-visual/generate', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const { postText, platform } = req.body;

      if (!postText || !platform) {
        return res.status(400).json({ error: 'Post text and platform are required' });
      }

      const { autoVisualGenerator } = await import('./services/autoVisualGenerator');
      const result = await autoVisualGenerator.generateVisualForPost(
        postText,
        platform,
        userId
      );

      res.json({
        success: true,
        visual: result,
        message: 'Визуал автоматически создан'
      });
    } catch (error) {
      console.error('Ошибка автогенерации визуала:', error);
      res.status(500).json({ error: 'Не удалось создать визуал' });
    }
  });

  // Пакетная генерация визуалов
  app.post('/api/auto-visual/batch', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const { posts } = req.body;

      if (!posts || !Array.isArray(posts)) {
        return res.status(400).json({ error: 'Posts array is required' });
      }

      const { autoVisualGenerator } = await import('./services/autoVisualGenerator');
      const results = await autoVisualGenerator.generateVisualsForMultiplePosts(
        posts,
        userId
      );

      res.json({
        success: true,
        visuals: results,
        count: results.length,
        totalCost: results.reduce((sum, r) => sum + r.cost, 0)
      });
    } catch (error) {
      console.error('Ошибка пакетной генерации:', error);
      res.status(500).json({ error: 'Не удалось создать визуалы' });
    }
  });

  // Генерация вирусного визуала
  app.post('/api/auto-visual/viral', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const { contentType, topic, platform } = req.body;

      if (!contentType || !topic || !platform) {
        return res.status(400).json({ error: 'Content type, topic, and platform are required' });
      }

      const { autoVisualGenerator } = await import('./services/autoVisualGenerator');
      const result = await autoVisualGenerator.generateViralVisual(
        contentType,
        topic,
        platform,
        userId
      );

      res.json({
        success: true,
        visual: result,
        message: `Вирусный ${contentType} визуал создан`
      });
    } catch (error) {
      console.error('Ошибка создания вирусного визуала:', error);
      res.status(500).json({ error: 'Не удалось создать вирусный визуал' });
    }
  });

  // === TELEGRAM PROMO BOT ROUTES ===

  // Запуск промо-бота
  app.post('/api/promo-bot/start', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const { channelId } = req.body;

      if (!channelId) {
        return res.status(400).json({ error: 'Channel ID обязателен' });
      }

      const { TelegramPromoBot } = await import('./services/telegramPromoBot');
      const bot = new TelegramPromoBot(userId, channelId);
      const result = await bot.initialize();

      await storage.createActivityLog({
        userId,
        action: 'Promo Bot Started',
        description: `Telegram промо-бот запущен для канала ${channelId}`,
        status: 'success',
        metadata: { channelId },
      });

      res.json({
        success: true,
        message: 'Промо-бот успешно запущен',
        channelId,
      });
    } catch (error) {
      console.error('Ошибка запуска промо-бота:', error);
      res.status(500).json({ error: 'Не удалось запустить промо-бот' });
    }
  });

  // Статус промо-бота
  app.get('/api/promo-bot/status', isAuthenticated, async (req: any, res) => {
    try {
      const { isActive } = await import('./services/telegramPromoBot');

      res.json({
        active: isActive,
        features: [
          'Вирусный контент с AI',
          'Автоматические публикации 3x/день',
          'Анализ конкурентов',
          'Персональные рекомендации',
          'Трендовый анализ',
          'Режим автопилота'
        ],
        cost: '$0.01/день (~$0.30/месяц)',
      });
    } catch (error) {
      res.status(500).json({ error: 'Не удалось получить статус' });
    }
  });

  // Остановка промо-бота
  app.post('/api/promo-bot/stop', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const { promoBot } = await import('./services/telegramPromoBot');

      if (promoBot) {
        await promoBot.stopPolling({ cancel: true });
      }

      await storage.createActivityLog({
        userId,
        action: 'Promo Bot Stopped',
        description: 'Telegram промо-бот остановлен',
        status: 'success',
        metadata: {},
      });

      res.json({ success: true, message: 'Промо-бот остановлен' });
    } catch (error) {
      res.status(500).json({ error: 'Не удалось остановить промо-бот' });
    }
  });

  // === ОПТИМИЗАЦИЯ КОНТЕНТА ===

  // Проверка грамматики и стиля
  app.post('/api/content/check-grammar', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const { text, targetAudience } = req.body;

      if (!text) {
        return res.status(400).json({ error: 'Текст обязателен' });
      }

      const { contentOptimizationService } = await import('./services/contentOptimization');
      const result = await contentOptimizationService.checkGrammarAndStyle(text, targetAudience);

      await storage.createActivityLog({
        userId,
        action: 'Grammar Check',
        description: 'Проверка грамматики и стиля контента',
        status: 'success',
        metadata: { issuesFound: result.grammarIssues.length },
      });

      res.json(result);
    } catch (error) {
      console.error('Ошибка проверки грамматики:', error);
      res.status(500).json({ error: 'Не удалось проверить грамматику' });
    }
  });

  // SEO оптимизация
  app.post('/api/content/optimize-seo', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const { content, targetKeywords, platform } = req.body;

      if (!content || !targetKeywords) {
        return res.status(400).json({ error: 'Контент и ключевые слова обязательны' });
      }

      const { contentOptimizationService } = await import('./services/contentOptimization');
      const result = await contentOptimizationService.optimizeForSEO(
        content,
        targetKeywords,
        platform || 'telegram'
      );

      await storage.createActivityLog({
        userId,
        action: 'SEO Optimization',
        description: 'SEO оптимизация контента',
        status: 'success',
        metadata: { score: result.score },
      });

      res.json(result);
    } catch (error) {
      console.error('Ошибка SEO оптимизации:', error);
      res.status(500).json({ error: 'Не удалось оптимизировать для SEO' });
    }
  });

  // Генерация TLDR
  app.post('/api/content/generate-tldr', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const { text, maxLength } = req.body;

      if (!text) {
        return res.status(400).json({ error: 'Текст обязателен' });
      }

      const { contentOptimizationService } = await import('./services/contentOptimization');
      const result = await contentOptimizationService.generateTLDR(text, maxLength);

      await storage.createActivityLog({
        userId,
        action: 'TLDR Generated',
        description: 'Создано краткое содержание',
        status: 'success',
        metadata: { originalLength: text.length, summaryLength: result.summary.length },
      });

      res.json(result);
    } catch (error) {
      console.error('Ошибка генерации TLDR:', error);
      res.status(500).json({ error: 'Не удалось создать краткое содержание' });
    }
  });

  // Анализ тональности
  app.post('/api/content/analyze-sentiment', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const { text } = req.body;

      if (!text) {
        return res.status(400).json({ error: 'Текст обязателен' });
      }

      const { contentOptimizationService } = await import('./services/contentOptimization');
      const result = await contentOptimizationService.analyzeSentiment(text);

      res.json(result);
    } catch (error) {
      console.error('Ошибка анализа тональности:', error);
      res.status(500).json({ error: 'Не удалось проанализировать тональность' });
    }
  });

  // Генерация геймификационного контента
  app.post('/api/content/generate-game', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const { type, topic, difficulty } = req.body;

      if (!type || !topic) {
        return res.status(400).json({ error: 'Тип и тема обязательны' });
      }

      const { contentOptimizationService } = await import('./services/contentOptimization');
      const result = await contentOptimizationService.generateGameContent(
        type,
        topic,
        difficulty || 'medium'
      );

      await storage.createActivityLog({
        userId,
        action: 'Game Content Generated',
        description: `Создан ${type} контент для геймификации`,
        status: 'success',
        metadata: { type, topic, difficulty },
      });

      res.json(result);
    } catch (error) {
      console.error('Ошибка генерации игрового контента:', error);
      res.status(500).json({ error: 'Не удалось создать игровой контент' });
    }
  });

  // Object Storage routes (referenced from javascript_object_storage integration)
  app.post('/api/objects/upload', isAuthenticated, async (req, res) => {
    try {
      const objectStorageService = new ObjectStorageService();
      const uploadURL = await objectStorageService.getObjectEntityUploadURL();
      res.json({ uploadURL });
    } catch (error) {
      console.error("Error getting upload URL:", error);
      res.status(500).json({ error: "Failed to get upload URL" });
    }
  });

  app.get('/objects/:objectPath(*)', isAuthenticated, async (req: any, res) => {
    const userId = req.user?.claims?.sub;
    const objectStorageService = new ObjectStorageService();
    try {
      const objectFile = await objectStorageService.getObjectEntityFile(req.path);
      const canAccess = await objectStorageService.canAccessObjectEntity({
        objectFile,
        userId: userId,
        requestedPermission: ObjectPermission.READ,
      });
      if (!canAccess) {
        return res.sendStatus(401);
      }
      objectStorageService.downloadObject(objectFile, res);
    } catch (error) {
      console.error("Error checking object access:", error);
      if (error instanceof ObjectNotFoundError) {
        return res.sendStatus(404);
      }
      return res.sendStatus(500);
    }
  });

  app.put('/api/telegram/media', isAuthenticated, async (req: any, res) => {
    if (!req.body.mediaURL) {
      return res.status(400).json({ error: "mediaURL is required" });
    }

    const userId = req.user?.claims?.sub;

    try {
      const objectStorageService = new ObjectStorageService();
      const objectPath = await objectStorageService.trySetObjectEntityAclPolicy(
        req.body.mediaURL,
        {
          owner: userId,
          visibility: "public",
        }
      );

      res.status(200).json({
        objectPath: objectPath,
      });
    } catch (error) {
      console.error("Error setting media:", error);
      res.status(500).json({ error: "Internal server error" });
    }
  });

  // Brand Style endpoints
  app.post('/api/brand-styles', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const style = await storage.createBrandStyle({ ...req.body, userId });
      res.json(style);
    } catch (error) {
      console.error('Error creating brand style:', error);
      res.status(500).json({ error: 'Failed to create brand style' });
    }
  });

  app.get('/api/brand-styles', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const styles = await storage.getUserBrandStyles(userId);
      res.json(styles);
    } catch (error) {
      console.error('Error fetching brand styles:', error);
      res.status(500).json({ error: 'Failed to fetch brand styles' });
    }
  });

  app.get('/api/brand-styles/default', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const style = await storage.getDefaultBrandStyle(userId);
      res.json(style || null);
    } catch (error) {
      console.error('Error fetching default brand style:', error);
      res.status(500).json({ error: 'Failed to fetch default brand style' });
    }
  });

  app.get('/api/brand-styles/:id', isAuthenticated, async (req: any, res) => {
    try {
      const id = parseInt(req.params.id);
      const style = await storage.getBrandStyle(id);
      if (!style) {
        return res.status(404).json({ error: 'Brand style not found' });
      }
      res.json(style);
    } catch (error) {
      console.error('Error fetching brand style:', error);
      res.status(500).json({ error: 'Failed to fetch brand style' });
    }
  });

  app.put('/api/brand-styles/:id', isAuthenticated, async (req: any, res) => {
    try {
      const id = parseInt(req.params.id);
      const style = await storage.updateBrandStyle(id, req.body);
      res.json(style);
    } catch (error) {
      console.error('Error updating brand style:', error);
      res.status(500).json({ error: 'Failed to update brand style' });
    }
  });

  app.post('/api/brand-styles/:id/set-default', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const id = parseInt(req.params.id);
      await storage.setDefaultBrandStyle(userId, id);
      res.json({ success: true });
    } catch (error) {
      console.error('Error setting default brand style:', error);
      res.status(500).json({ error: 'Failed to set default brand style' });
    }
  });

  // Trend Video endpoints
  app.post('/api/trends', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const trend = await storage.createTrendVideo({ ...req.body, userId });
      res.json(trend);
    } catch (error) {
      console.error('Error creating trend:', error);
      res.status(500).json({ error: 'Failed to create trend' });
    }
  });

  app.get('/api/trends', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const limit = parseInt(req.query.limit as string) || 50;
      const trends = await storage.getTrendVideos(userId, limit);
      res.json(trends);
    } catch (error) {
      console.error('Error fetching trends:', error);
      res.status(500).json({ error: 'Failed to fetch trends' });
    }
  });

  app.get('/api/trends/top', isAuthenticated, async (req: any, res) => {
    try {
      const limit = parseInt(req.query.limit as string) || 10;
      const trends = await storage.getTopTrends(limit);
      res.json(trends);
    } catch (error) {
      console.error('Error fetching top trends:', error);
      res.status(500).json({ error: 'Failed to fetch top trends' });
    }
  });

  app.get('/api/trends/:id', isAuthenticated, async (req: any, res) => {
    try {
      const id = parseInt(req.params.id);
      const trend = await storage.getTrendVideo(id);
      if (!trend) {
        return res.status(404).json({ error: 'Trend not found' });
      }
      res.json(trend);
    } catch (error) {
      console.error('Error fetching trend:', error);
      res.status(500).json({ error: 'Failed to fetch trend' });
    }
  });

  app.get('/api/trends/:id/with-style', isAuthenticated, async (req: any, res) => {
    try {
      const id = parseInt(req.params.id);
      const result = await storage.getTrendWithBrandStyle(id);
      res.json(result);
    } catch (error) {
      console.error('Error fetching trend with style:', error);
      res.status(500).json({ error: 'Failed to fetch trend with style' });
    }
  });

  app.put('/api/trends/:id', isAuthenticated, async (req: any, res) => {
    try {
      const id = parseInt(req.params.id);
      const trend = await storage.updateTrendVideo(id, req.body);
      res.json(trend);
    } catch (error) {
      console.error('Error updating trend:', error);
      res.status(500).json({ error: 'Failed to update trend' });
    }
  });

  app.put('/api/trends/:id/status', isAuthenticated, async (req: any, res) => {
    try {
      const id = parseInt(req.params.id);
      const { status, clonedVideoId, clonedPostId } = req.body;
      const trend = await storage.updateTrendVideoStatus(id, status, clonedVideoId, clonedPostId);
      res.json(trend);
    } catch (error) {
      console.error('Error updating trend status:', error);
      res.status(500).json({ error: 'Failed to update trend status' });
    }
  });

  app.get('/api/trends/pending/with-style', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const limit = parseInt(req.query.limit as string) || 10;
      const trends = await storage.getPendingTrendsWithDefaultStyle(userId, limit);
      res.json(trends);
    } catch (error) {
      console.error('Error fetching pending trends with style:', error);
      res.status(500).json({ error: 'Failed to fetch pending trends' });
    }
  });

  const httpServer = createServer(app);
  return httpServer;
}