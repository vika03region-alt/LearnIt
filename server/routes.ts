import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { setupAuth, isAuthenticated } from "./replitAuth";
import { aiContentService } from "./services/aiContent";
import { socialMediaService } from "./services/socialMedia";
import { safetyService } from "./services/safety";
import { analyticsService } from "./services/analytics";
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
      
      const result = await aiContentService.generateContent(prompt, contentType, targetPlatforms);
      
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
        status: 'warning',
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

  const httpServer = createServer(app);
  return httpServer;
}
