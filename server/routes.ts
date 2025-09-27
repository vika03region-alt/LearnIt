import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { setupAuth, isAuthenticated } from "./replitAuth";
import { aiContentService } from "./services/aiContent";
import { socialMediaService } from "./services/socialMedia";
import { socialMediaManager } from "./services/socialMediaIntegration";
import { safetyService } from "./services/safety";
import { analyticsService } from "./services/analytics";
import { aiAnalyticsService } from "./services/aiAnalytics";
import { schedulerService } from "./services/scheduler";
import { insertPostSchema, insertAIContentLogSchema } from "@shared/schema";
import { z } from "zod";

export async function registerRoutes(app: Express): Promise<Server> {
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

  // AI Content routes
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

  const httpServer = createServer(app);
  return httpServer;
}
