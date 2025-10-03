import {
  users,
  platforms,
  userAccounts,
  posts,
  analytics,
  aiContentLogs,
  safetyLogs,
  rateLimits,
  activityLogs,
  platformAnalytics,
  contentPerformance,
  aiInsights,
  competitorAnalysis,
  trendAnalysis,
  aiConversations,
  aiMessages,
  aiVideos,
  brandStyles,
  trendVideos,
  type User,
  type UpsertUser,
  type Platform,
  type UserAccount,
  type InsertUserAccount,
  type Post,
  type InsertPost,
  type Analytics,
  type AIContentLog,
  type InsertAIContentLog,
  type SafetyLog,
  type RateLimit,
  type ActivityLog,
  type PlatformAnalytics,
  type ContentPerformance,
  type AIInsight,
  type CompetitorAnalysis,
  type TrendAnalysis,
  type AIConversation,
  type AIMessage,
  type InsertAIConversation,
  type InsertAIMessage,
  type AIVideo,
  type InsertAIVideo,
  type BrandStyle,
  type InsertBrandStyle,
  type TrendVideo,
  type InsertTrendVideo,
} from "@shared/schema";
import { db } from "./db";
import { eq, desc, and, gte, lte, sql } from "drizzle-orm";
import * as crypto from 'crypto';

// Encryption utilities for sensitive data
class TokenEncryption {
  private readonly key: Buffer;
  private readonly algorithm = 'aes-256-gcm';

  constructor() {
    const secretKey = process.env.SESSION_SECRET || 'fallback-secret-key-please-change';
    this.key = crypto.scryptSync(secretKey, 'salt', 32);
  }

  encrypt(text: string): string {
    const iv = crypto.randomBytes(16);
    const cipher = crypto.createCipher(this.algorithm, this.key);
    cipher.setAAD(Buffer.from('token-data'));

    let encrypted = cipher.update(text, 'utf8', 'hex');
    encrypted += cipher.final('hex');

    const authTag = cipher.getAuthTag();
    return iv.toString('hex') + ':' + encrypted + ':' + authTag.toString('hex');
  }

  decrypt(encryptedText: string): string {
    const parts = encryptedText.split(':');
    if (parts.length !== 3) {
      throw new Error('Invalid encrypted token format');
    }

    const iv = Buffer.from(parts[0], 'hex');
    const encrypted = parts[1];
    const authTag = Buffer.from(parts[2], 'hex');

    const decipher = crypto.createDecipher(this.algorithm, this.key);
    decipher.setAAD(Buffer.from('token-data'));
    decipher.setAuthTag(authTag);

    let decrypted = decipher.update(encrypted, 'hex', 'utf8');
    decrypted += decipher.final('utf8');

    return decrypted;
  }
}

const tokenEncryption = new TokenEncryption();

export interface IStorage {
  // User operations (required for Replit Auth)
  getUser(id: string): Promise<User | undefined>;
  upsertUser(user: UpsertUser): Promise<User>;

  // Platform operations
  getPlatforms(): Promise<Platform[]>;
  getPlatform(id: number): Promise<Platform | undefined>;
  getPlatformByName(name: string): Promise<Platform | undefined>;

  // User account operations
  getUserAccounts(userId: string): Promise<UserAccount[]>;
  getUserAccount(userId: string, platformId: number): Promise<UserAccount | undefined>;
  createUserAccount(account: InsertUserAccount): Promise<UserAccount>;
  updateUserAccount(id: number, updates: Partial<InsertUserAccount>): Promise<UserAccount>;

  // Post operations
  createPost(post: InsertPost & { userId: string }): Promise<Post>;
  getUserPosts(userId: string, limit?: number): Promise<Post[]>;
  getScheduledPosts(userId: string): Promise<Post[]>;
  getPostsByPlatformAndStatus(platformId: number, status: string): Promise<Post[]>;
  updatePost(id: number, updates: Partial<Post>): Promise<Post>;
  updatePostStatus(postId: number, status: string, publishedAt?: Date): Promise<Post>;

  // Analytics operations
  getPostAnalytics(postId: number): Promise<Analytics[]>;
  getUserAnalytics(userId: string, platformId?: number): Promise<Analytics[]>;
  createAnalytics(analytics: Omit<Analytics, 'id' | 'recordedAt'>): Promise<Analytics>;

  // AI content operations
  createAIContentLog(log: InsertAIContentLog & { userId: string; generatedContent: string; tokensUsed?: number; cost?: number }): Promise<AIContentLog>;
  getUserAIContentLogs(userId: string, limit?: number): Promise<AIContentLog[]>;

  // Safety operations
  createSafetyLog(log: Omit<SafetyLog, 'id' | 'checkTime'>): Promise<SafetyLog>;
  getUserSafetyLogs(userId: string, platformId?: number): Promise<SafetyLog[]>;
  getRateLimits(platformId?: number): Promise<RateLimit[]>;

  // Activity operations
  createActivityLog(log: Omit<ActivityLog, 'id' | 'createdAt'>): Promise<ActivityLog>;
  getUserActivityLogs(userId: string, limit?: number): Promise<ActivityLog[]>;

  // Advanced Analytics Methods
  getPlatformAnalytics(userId: string, platformId: number, days: number): Promise<PlatformAnalytics[]>;
  getContentPerformance(userId: string, platformId: number, days: number): Promise<ContentPerformance[]>;
  createAIInsight(insight: Omit<AIInsight, 'id' | 'createdAt'>): Promise<AIInsight>;
  getAIInsights(userId: string, type?: string): Promise<AIInsight[]>;
  createCompetitorAnalysis(analysis: Omit<CompetitorAnalysis, 'id' | 'createdAt'>): Promise<CompetitorAnalysis>;
  getCompetitorAnalyses(userId: string, platformId: number): Promise<CompetitorAnalysis[]>;
  createTrendAnalysis(trend: Omit<TrendAnalysis, 'id' | 'createdAt'>): Promise<TrendAnalysis>;
  getTrendAnalysis(platformId: number, category?: string, days?: number): Promise<TrendAnalysis[]>;

  // AI Assistant operations
  createAIConversation(conversation: InsertAIConversation): Promise<AIConversation>;
  getUserAIConversations(userId: string): Promise<AIConversation[]>;
  getAIConversation(conversationId: number): Promise<AIConversation>;
  updateAIConversation(conversationId: number, userId: string, updates: Partial<InsertAIConversation>): Promise<AIConversation>;
  deleteAIConversation(conversationId: number, userId: string): Promise<boolean>;
  createAIMessage(message: InsertAIMessage): Promise<AIMessage>;
  getAIConversationMessages(conversationId: number): Promise<AIMessage[]>;
  updateAIConversationMetrics(conversationId: number, tokensUsed: number, cost: number): Promise<void>;

  // AI Video operations
  createAIVideo(video: InsertAIVideo): Promise<AIVideo>;
  getAIVideo(id: number): Promise<AIVideo | undefined>;
  getUserAIVideos(userId: string, limit?: number): Promise<AIVideo[]>;
  updateAIVideo(id: number, updates: Partial<AIVideo>): Promise<AIVideo>;
  getAIVideoByVideoId(videoId: string): Promise<AIVideo | undefined>;
  updateAIVideoStatus(id: number, status: string, videoUrl?: string, thumbnailUrl?: string): Promise<AIVideo>;

  // Brand Style operations
  createBrandStyle(style: InsertBrandStyle & { userId: string }): Promise<BrandStyle>;
  getUserBrandStyles(userId: string): Promise<BrandStyle[]>;
  getDefaultBrandStyle(userId: string): Promise<BrandStyle | undefined>;
  getBrandStyle(id: number): Promise<BrandStyle | undefined>;
  updateBrandStyle(id: number, updates: Partial<InsertBrandStyle>): Promise<BrandStyle>;
  setDefaultBrandStyle(userId: string, styleId: number): Promise<void>;

  // Trend Video operations
  createTrendVideo(trend: InsertTrendVideo): Promise<TrendVideo>;
  getTrendVideos(userId?: string, limit?: number): Promise<TrendVideo[]>;
  getTrendVideo(id: number): Promise<TrendVideo | undefined>;
  updateTrendVideo(id: number, updates: Partial<InsertTrendVideo>): Promise<TrendVideo>;
  updateTrendVideoStatus(id: number, status: string, clonedVideoId?: number, clonedPostId?: number): Promise<TrendVideo>;
  getTopTrends(limit?: number): Promise<TrendVideo[]>;
  
  // Combined Trend + Brand Style queries
  getTrendWithBrandStyle(trendId: number): Promise<{ trend: TrendVideo; brandStyle: BrandStyle | null }>;
  getTrendsForBrandStyle(brandStyleId: number, limit?: number): Promise<TrendVideo[]>;
  getPendingTrendsWithDefaultStyle(userId: string, limit?: number): Promise<{ trend: TrendVideo; brandStyle: BrandStyle | null }[]>;
}

export class DatabaseStorage implements IStorage {
  // User operations
  async getUser(id: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.id, id));
    return user;
  }

  async upsertUser(userData: UpsertUser): Promise<User> {
    const [user] = await db
      .insert(users)
      .values(userData)
      .onConflictDoUpdate({
        target: users.id,
        set: {
          ...userData,
          updatedAt: new Date(),
        },
      })
      .returning();
    return user;
  }

  // Platform operations
  async getPlatforms(): Promise<Platform[]> {
    return await db.select().from(platforms).where(eq(platforms.isActive, true));
  }

  async getPlatform(id: number): Promise<Platform | undefined> {
    const [platform] = await db.select().from(platforms).where(eq(platforms.id, id));
    return platform;
  }

  async getPlatformByName(name: string): Promise<Platform | undefined> {
    const [platform] = await db.select().from(platforms).where(eq(platforms.name, name));
    return platform;
  }

  // User account operations
  async getUserAccounts(userId: string): Promise<UserAccount[]> {
    const accounts = await db.select().from(userAccounts).where(eq(userAccounts.userId, userId));

    // Decrypt sensitive tokens when retrieving
    return accounts.map(account => ({
      ...account,
      accessToken: account.accessToken ? (() => {
        try {
          return tokenEncryption.decrypt(account.accessToken!);
        } catch {
          return account.accessToken; // Return as-is if not encrypted (legacy data)
        }
      })() : null,
      refreshToken: account.refreshToken ? (() => {
        try {
          return tokenEncryption.decrypt(account.refreshToken!);
        } catch {
          return account.refreshToken; // Return as-is if not encrypted (legacy data)
        }
      })() : null,
    }));
  }

  async getUserAccount(userId: string, platformId: number): Promise<UserAccount | undefined> {
    const [account] = await db
      .select()
      .from(userAccounts)
      .where(and(eq(userAccounts.userId, userId), eq(userAccounts.platformId, platformId)));
    return account;
  }

  async createUserAccount(account: InsertUserAccount): Promise<UserAccount> {
    // Encrypt sensitive tokens before storing
    const encryptedAccount = { ...account };
    if (account.accessToken) {
      encryptedAccount.accessToken = tokenEncryption.encrypt(account.accessToken);
    }
    if (account.refreshToken) {
      encryptedAccount.refreshToken = tokenEncryption.encrypt(account.refreshToken);
    }

    const [newAccount] = await db.insert(userAccounts).values(encryptedAccount).returning();
    return newAccount;
  }

  async updateUserAccount(id: number, updates: Partial<InsertUserAccount>): Promise<UserAccount> {
    // Encrypt sensitive tokens before updating
    const encryptedUpdates = { ...updates };
    if (updates.accessToken) {
      encryptedUpdates.accessToken = tokenEncryption.encrypt(updates.accessToken);
    }
    if (updates.refreshToken) {
      encryptedUpdates.refreshToken = tokenEncryption.encrypt(updates.refreshToken);
    }

    const [updatedAccount] = await db
      .update(userAccounts)
      .set({ ...encryptedUpdates, updatedAt: new Date() })
      .where(eq(userAccounts.id, id))
      .returning();
    return updatedAccount;
  }

  // Post operations
  async createPost(post: InsertPost & { userId: string }): Promise<Post> {
    const [newPost] = await db.insert(posts).values(post).returning();
    return newPost;
  }

  async getUserPosts(userId: string, limit = 50): Promise<Post[]> {
    return await db
      .select()
      .from(posts)
      .where(eq(posts.userId, userId))
      .orderBy(desc(posts.createdAt))
      .limit(limit);
  }

  async getScheduledPosts(userId: string): Promise<Post[]> {
    return await db
      .select()
      .from(posts)
      .where(and(eq(posts.userId, userId), eq(posts.status, 'scheduled')))
      .orderBy(posts.scheduledAt);
  }

  async updatePost(id: number, updates: Partial<Post>): Promise<Post> {
    const [updatedPost] = await db
      .update(posts)
      .set({ ...updates, updatedAt: new Date() })
      .where(eq(posts.id, id))
      .returning();
    return updatedPost;
  }

  async getPostsByPlatformAndStatus(platformId: number, status: string): Promise<Post[]> {
    return await db
      .select()
      .from(posts)
      .where(and(eq(posts.platformId, platformId), eq(posts.status, status)))
      .orderBy(posts.scheduledAt);
  }

  async updatePostStatus(postId: number, status: string, publishedAt?: Date): Promise<Post> {
    const updates: any = { status, updatedAt: new Date() };
    if (publishedAt) {
      updates.publishedAt = publishedAt;
    }
    
    const [updatedPost] = await db
      .update(posts)
      .set(updates)
      .where(eq(posts.id, postId))
      .returning();
    return updatedPost;
  }

  // Analytics operations
  async getPostAnalytics(postId: number): Promise<Analytics[]> {
    return await db
      .select()
      .from(analytics)
      .where(eq(analytics.postId, postId))
      .orderBy(desc(analytics.recordedAt));
  }

  async getUserAnalytics(userId: string, platformId?: number): Promise<Analytics[]> {
    const baseQuery = db
      .select({
        analytics: analytics,
        post: posts,
      })
      .from(analytics)
      .innerJoin(posts, eq(analytics.postId, posts.id));

    const query = platformId
      ? baseQuery.where(and(eq(posts.userId, userId), eq(posts.platformId, platformId)))
      : baseQuery.where(eq(posts.userId, userId));

    const results = await query.orderBy(desc(analytics.recordedAt));
    return results.map(r => r.analytics);
  }

  async createAnalytics(analyticsData: Omit<Analytics, 'id' | 'recordedAt'>): Promise<Analytics> {
    const [newAnalytics] = await db.insert(analytics).values(analyticsData).returning();
    return newAnalytics;
  }

  // AI content operations
  async createAIContentLog(log: InsertAIContentLog & { userId: string; generatedContent: string; tokensUsed?: number; cost?: number }): Promise<AIContentLog> {
    const [newLog] = await db.insert(aiContentLogs).values(log).returning();
    return newLog;
  }

  async getUserAIContentLogs(userId: string, limit = 50): Promise<AIContentLog[]> {
    return await db
      .select()
      .from(aiContentLogs)
      .where(eq(aiContentLogs.userId, userId))
      .orderBy(desc(aiContentLogs.createdAt))
      .limit(limit);
  }

  // Safety operations
  async createSafetyLog(log: Omit<SafetyLog, 'id' | 'checkTime'>): Promise<SafetyLog> {
    const [newLog] = await db.insert(safetyLogs).values(log).returning();
    return newLog;
  }

  async getUserSafetyLogs(userId: string, platformId?: number): Promise<SafetyLog[]> {
    const baseQuery = db.select().from(safetyLogs);
    const query = platformId
      ? baseQuery.where(and(eq(safetyLogs.userId, userId), eq(safetyLogs.platformId, platformId)))
      : baseQuery.where(eq(safetyLogs.userId, userId));

    return await query.orderBy(desc(safetyLogs.checkTime));
  }

  async getRateLimits(platformId?: number): Promise<RateLimit[]> {
    const query = platformId
      ? db.select().from(rateLimits).where(eq(rateLimits.platformId, platformId))
      : db.select().from(rateLimits);

    return await query;
  }

  // Activity operations
  async createActivityLog(log: Omit<ActivityLog, 'id' | 'createdAt'>): Promise<ActivityLog> {
    const [newLog] = await db.insert(activityLogs).values(log).returning();
    return newLog;
  }

  async getUserActivityLogs(userId: string, limit = 50): Promise<ActivityLog[]> {
    try {
      const result = await db
        .select()
        .from(activityLogs)
        .where(eq(activityLogs.userId, userId))
        .orderBy(desc(activityLogs.createdAt))
        .limit(limit);

      return result;
    } catch (error) {
      console.error('Error fetching user activity logs:', error);
      return [];
    }
  }

  // Advanced Analytics Methods Implementation
  async getPlatformAnalytics(userId: string, platformId: number, days: number): Promise<PlatformAnalytics[]> {
    // Временная реализация с моковыми данными пока таблицы не созданы
    const mockAnalytics: PlatformAnalytics[] = [
      {
        id: 1,
        userId,
        platformId,
        date: new Date().toISOString().split('T')[0],
        metrics: {
          followers: 12500,
          following: 1250,
          posts: 156,
          likes: 25000,
          comments: 3200,
          shares: 890,
          views: 125000,
          impressions: 187500,
          reach: 98500,
          engagement_rate: 4.8,
          growth_rate: 12.3,
        },
        createdAt: new Date(),
      },
    ];
    return mockAnalytics;
  }

  async getContentPerformance(userId: string, platformId: number, days: number): Promise<ContentPerformance[]> {
    // Временная реализация с моковыми данными
    const mockPerformance: ContentPerformance[] = [
      {
        id: 1,
        userId,
        platformId,
        postId: 'post_123',
        title: 'AI анализ рынка криптовалют',
        content: 'Подробный анализ текущих трендов в криптосфере...',
        hashtags: ['#криптовалюты', '#ai', '#анализ', '#трейдинг'],
        postType: 'image',
        publishedAt: new Date(),
        metrics: {
          likes: 450,
          comments: 89,
          shares: 23,
          views: 2300,
          saves: 67,
          clicks: 123,
          engagement_rate: 5.2,
          reach: 1850,
          impressions: 2650,
        },
        aiAnalysis: {
          sentiment: 'positive',
          topics: ['криптовалюты', 'искусственный интеллект', 'анализ рынка'],
          trends: ['AI в финансах', 'Криптоаналитика'],
          optimization_suggestions: [
            'Добавить больше визуальных элементов',
            'Использовать более популярные хештеги',
            'Оптимизировать время публикации',
          ],
          predicted_performance: 78,
        },
        createdAt: new Date(),
      },
    ];
    return mockPerformance;
  }

  async createAIInsight(insight: Omit<AIInsight, 'id' | 'createdAt'>): Promise<AIInsight> {
    const newInsight: AIInsight = {
      ...insight,
      id: Math.floor(Math.random() * 10000),
      createdAt: new Date(),
    };
    return newInsight;
  }

  async getAIInsights(userId: string, type?: string): Promise<AIInsight[]> {
    const mockInsights: AIInsight[] = [
      {
        id: 1,
        userId,
        type: 'audience_analysis',
        platformId: 1,
        title: 'Анализ аудитории Instagram',
        description: 'Глубокий анализ вашей аудитории показывает высокую активность в вечерние часы',
        data: {
          insights: [
            'Ваша аудитория наиболее активна с 18:00 до 22:00',
            '65% подписчиков из России, 20% из Украины',
            'Основной возраст аудитории: 25-34 года',
            'Высокий интерес к финансовым темам и технологиям',
          ],
          recommendations: [
            'Публикуйте основной контент в 19:00-20:00',
            'Создавайте больше образовательного контента о трейдинге',
            'Используйте русскоязычные хештеги для лучшего охвата',
            'Добавляйте больше интерактивных элементов (опросы, вопросы)',
          ],
          confidence: 87,
          impact: 'high',
        },
        status: 'active',
        createdAt: new Date(),
      },
      {
        id: 2,
        userId,
        type: 'content_optimization',
        platformId: 1,
        title: 'Оптимизация контента',
        description: 'AI рекомендации по улучшению производительности ваших постов',
        data: {
          insights: [
            'Посты с изображениями получают на 40% больше лайков',
            'Контент с вопросами увеличивает комментарии на 60%',
            'Использование трендовых хештегов повышает охват на 25%',
          ],
          recommendations: [
            'Добавляйте качественные изображения к каждому посту',
            'Заканчивайте посты вопросом к аудитории',
            'Анализируйте и используйте актуальные хештеги',
          ],
          confidence: 92,
          impact: 'medium',
        },
        status: 'active',
        createdAt: new Date(),
      },
    ];

    return type ? mockInsights.filter(insight => insight.type === type) : mockInsights;
  }

  async createCompetitorAnalysis(analysis: Omit<CompetitorAnalysis, 'id' | 'createdAt'>): Promise<CompetitorAnalysis> {
    const newAnalysis: CompetitorAnalysis = {
      ...analysis,
      id: Math.floor(Math.random() * 10000),
      createdAt: new Date(),
    };
    return newAnalysis;
  }

  async getCompetitorAnalyses(userId: string, platformId: number): Promise<CompetitorAnalysis[]> {
    const mockCompetitors: CompetitorAnalysis[] = [
      {
        id: 1,
        userId,
        platformId,
        competitorHandle: 'trading_expert_ru',
        competitorName: 'Эксперт по трейдингу',
        metrics: {
          followers: 25000,
          following: 1200,
          posts: 340,
          avg_likes: 850,
          avg_comments: 65,
          engagement_rate: 3.7,
          posting_frequency: 1.2,
        },
        content_analysis: {
          common_hashtags: {
            '#трейдинг': 45,
            '#форекс': 32,
            '#криптовалюты': 28,
            '#инвестиции': 38,
            '#финансы': 41,
          },
          content_types: {
            'образовательные': 40,
            'прогнозы': 30,
            'новости': 20,
            'личное': 10,
          },
          posting_times: {
            '09:00': 15,
            '14:00': 25,
            '19:00': 35,
            '21:00': 25,
          },
          top_performing_posts: [
            {
              id: 'post1',
              type: 'прогноз',
              likes: 1200,
              comments: 89,
              content: 'Прогноз по BTC на следующую неделю',
            },
          ],
        },
        lastAnalyzed: new Date(),
        createdAt: new Date(),
      },
    ];

    return mockCompetitors;
  }

  async createTrendAnalysis(trend: Omit<TrendAnalysis, 'id' | 'createdAt'>): Promise<TrendAnalysis> {
    const newTrend: TrendAnalysis = {
      ...trend,
      id: Math.floor(Math.random() * 10000),
      createdAt: new Date(),
    };
    return newTrend;
  }

  async getTrendAnalysis(platformId: number, category?: string, days?: number): Promise<TrendAnalysis[]> {
    const mockTrends: TrendAnalysis[] = [
      {
        id: 1,
        platformId,
        category: 'hashtags',
        trend_name: 'AI в трейдинге',
        data: {
          volume: 180000,
          growth_rate: 67,
          related_keywords: ['искусственный интеллект', 'автоматизация', 'алготрейдинг'],
          peak_times: ['19:00', '21:00'],
          demographics: { '25-34': 40, '35-44': 30, '18-24': 20, '45+': 10 },
          sentiment: { 'positive': 70, 'neutral': 25, 'negative': 5 },
        },
        confidence: '78',
        region: 'Russia',
        date: new Date().toISOString().split('T')[0],
        createdAt: new Date(),
      },
      {
        id: 2,
        platformId,
        category: 'topics',
        trend_name: 'Криптовалюты 2025',
        data: {
          volume: 250000,
          growth_rate: 45,
          related_keywords: ['btc', 'ethereum', 'crypto', 'блокчейн'],
          peak_times: ['10:00', '16:00', '20:00'],
          demographics: { '18-24': 35, '25-34': 35, '35-44': 20, '45+': 10 },
          sentiment: { 'positive': 60, 'neutral': 30, 'negative': 10 },
        },
        confidence: '85',
        region: 'global',
        date: new Date().toISOString().split('T')[0],
        createdAt: new Date(),
      },
    ];

    return category ? mockTrends.filter(trend => trend.category === category) : mockTrends;
  }

  // AI Assistant operations
  async createAIConversation(conversation: InsertAIConversation): Promise<AIConversation> {
    const [created] = await db
      .insert(aiConversations)
      .values(conversation)
      .returning();
    return created;
  }

  async getUserAIConversations(userId: string): Promise<AIConversation[]> {
    return await db
      .select()
      .from(aiConversations)
      .where(and(eq(aiConversations.userId, userId), eq(aiConversations.status, 'active')))
      .orderBy(desc(aiConversations.updatedAt));
  }

  async getAIConversation(conversationId: number): Promise<AIConversation> {
    const [conversation] = await db
      .select()
      .from(aiConversations)
      .where(eq(aiConversations.id, conversationId));
    return conversation;
  }

  async updateAIConversation(conversationId: number, userId: string, updates: Partial<InsertAIConversation>): Promise<AIConversation> {
    const [updated] = await db
      .update(aiConversations)
      .set({ ...updates, updatedAt: new Date() })
      .where(and(eq(aiConversations.id, conversationId), eq(aiConversations.userId, userId)))
      .returning();
    return updated;
  }

  async deleteAIConversation(conversationId: number, userId: string): Promise<boolean> {
    const result = await db
      .update(aiConversations)
      .set({ status: 'deleted', updatedAt: new Date() })
      .where(and(eq(aiConversations.id, conversationId), eq(aiConversations.userId, userId)));
    return result.rowCount > 0;
  }

  async createAIMessage(message: InsertAIMessage): Promise<AIMessage> {
    const [created] = await db
      .insert(aiMessages)
      .values(message)
      .returning();
    return created;
  }

  async getAIConversationMessages(conversationId: number): Promise<AIMessage[]> {
    return await db
      .select()
      .from(aiMessages)
      .where(eq(aiMessages.conversationId, conversationId))
      .orderBy(aiMessages.createdAt);
  }

  async updateAIConversationMetrics(conversationId: number, tokensUsed: number, cost: number): Promise<void> {
    await db
      .update(aiConversations)
      .set({
        metadata: sql`
          COALESCE(metadata, '{}'::jsonb) || 
          jsonb_build_object(
            'tokens_used', COALESCE((metadata->>'tokens_used')::int, 0) + ${tokensUsed},
            'cost', COALESCE((metadata->>'cost')::numeric, 0) + ${cost}
          )
        `,
        updatedAt: new Date()
      })
      .where(eq(aiConversations.id, conversationId));
  }

  // AI Video operations
  async createAIVideo(video: InsertAIVideo): Promise<AIVideo> {
    const [created] = await db
      .insert(aiVideos)
      .values(video)
      .returning();
    return created;
  }

  async getAIVideo(id: number): Promise<AIVideo | undefined> {
    const [video] = await db
      .select()
      .from(aiVideos)
      .where(eq(aiVideos.id, id));
    return video;
  }

  async getUserAIVideos(userId: string, limit: number = 50): Promise<AIVideo[]> {
    return await db
      .select()
      .from(aiVideos)
      .where(eq(aiVideos.userId, userId))
      .orderBy(desc(aiVideos.createdAt))
      .limit(limit);
  }

  async updateAIVideo(id: number, updates: Partial<AIVideo>): Promise<AIVideo> {
    const [updated] = await db
      .update(aiVideos)
      .set(updates)
      .where(eq(aiVideos.id, id))
      .returning();
    return updated;
  }

  async getAIVideoByVideoId(videoId: string): Promise<AIVideo | undefined> {
    const [video] = await db
      .select()
      .from(aiVideos)
      .where(eq(aiVideos.videoId, videoId));
    return video;
  }

  async updateAIVideoStatus(
    id: number, 
    status: string, 
    videoUrl?: string, 
    thumbnailUrl?: string
  ): Promise<AIVideo> {
    const updates: Partial<AIVideo> = { status };
    if (videoUrl) updates.videoUrl = videoUrl;
    if (thumbnailUrl) updates.thumbnailUrl = thumbnailUrl;
    if (status === 'completed') updates.completedAt = new Date();

    const [updated] = await db
      .update(aiVideos)
      .set(updates)
      .where(eq(aiVideos.id, id))
      .returning();
    return updated;
  }

  // Brand Style operations
  async createBrandStyle(style: InsertBrandStyle & { userId: string }): Promise<BrandStyle> {
    const [created] = await db
      .insert(brandStyles)
      .values(style)
      .returning();
    return created;
  }

  async getUserBrandStyles(userId: string): Promise<BrandStyle[]> {
    return await db
      .select()
      .from(brandStyles)
      .where(eq(brandStyles.userId, userId))
      .orderBy(desc(brandStyles.createdAt));
  }

  async getDefaultBrandStyle(userId: string): Promise<BrandStyle | undefined> {
    const [style] = await db
      .select()
      .from(brandStyles)
      .where(and(
        eq(brandStyles.userId, userId),
        eq(brandStyles.isDefault, true)
      ))
      .limit(1);
    return style;
  }

  async getBrandStyle(id: number): Promise<BrandStyle | undefined> {
    const [style] = await db
      .select()
      .from(brandStyles)
      .where(eq(brandStyles.id, id));
    return style;
  }

  async updateBrandStyle(id: number, updates: Partial<InsertBrandStyle>): Promise<BrandStyle> {
    const [updated] = await db
      .update(brandStyles)
      .set({ ...updates, updatedAt: new Date() })
      .where(eq(brandStyles.id, id))
      .returning();
    return updated;
  }

  async setDefaultBrandStyle(userId: string, styleId: number): Promise<void> {
    // Сначала снимаем флаг default со всех стилей пользователя
    await db
      .update(brandStyles)
      .set({ isDefault: false })
      .where(eq(brandStyles.userId, userId));

    // Затем устанавливаем новый стиль как default
    await db
      .update(brandStyles)
      .set({ isDefault: true })
      .where(eq(brandStyles.id, styleId));
  }

  // Trend Video operations
  async createTrendVideo(trend: InsertTrendVideo): Promise<TrendVideo> {
    const [created] = await db
      .insert(trendVideos)
      .values(trend)
      .returning();
    return created;
  }

  async getTrendVideos(userId?: string, limit: number = 50): Promise<TrendVideo[]> {
    const query = db.select().from(trendVideos);
    
    if (userId) {
      return await query
        .where(eq(trendVideos.userId, userId))
        .orderBy(desc(trendVideos.createdAt))
        .limit(limit);
    }
    
    return await query
      .orderBy(desc(trendVideos.createdAt))
      .limit(limit);
  }

  async getTrendVideo(id: number): Promise<TrendVideo | undefined> {
    const [trend] = await db
      .select()
      .from(trendVideos)
      .where(eq(trendVideos.id, id));
    return trend;
  }

  async updateTrendVideo(id: number, updates: Partial<InsertTrendVideo>): Promise<TrendVideo> {
    const [updated] = await db
      .update(trendVideos)
      .set(updates)
      .where(eq(trendVideos.id, id))
      .returning();
    return updated;
  }

  async updateTrendVideoStatus(
    id: number, 
    status: string, 
    clonedVideoId?: number,
    clonedPostId?: number
  ): Promise<TrendVideo> {
    const updates: Partial<TrendVideo> = { status };
    if (clonedVideoId) updates.clonedVideoId = clonedVideoId;
    if (clonedPostId) updates.clonedPostId = clonedPostId;
    if (status === 'analyzed') updates.analyzedAt = new Date();
    if (status === 'cloned') updates.clonedAt = new Date();
    
    const [updated] = await db
      .update(trendVideos)
      .set(updates)
      .where(eq(trendVideos.id, id))
      .returning();
    return updated;
  }

  async getTopTrends(limit: number = 10): Promise<TrendVideo[]> {
    return await db
      .select()
      .from(trendVideos)
      .where(eq(trendVideos.status, 'pending'))
      .orderBy(desc(trendVideos.trendScore))
      .limit(limit);
  }

  // Combined Trend + Brand Style queries
  async getTrendWithBrandStyle(trendId: number): Promise<{ trend: TrendVideo; brandStyle: BrandStyle | null }> {
    const [trend] = await db
      .select()
      .from(trendVideos)
      .where(eq(trendVideos.id, trendId));
    
    if (!trend) {
      throw new Error('Trend not found');
    }

    let brandStyle: BrandStyle | null = null;
    
    if (trend.brandStyleId) {
      [brandStyle] = await db
        .select()
        .from(brandStyles)
        .where(eq(brandStyles.id, trend.brandStyleId));
    }

    return { trend, brandStyle };
  }

  async getTrendsForBrandStyle(brandStyleId: number, limit: number = 50): Promise<TrendVideo[]> {
    return await db
      .select()
      .from(trendVideos)
      .where(eq(trendVideos.brandStyleId, brandStyleId))
      .orderBy(desc(trendVideos.createdAt))
      .limit(limit);
  }

  async getPendingTrendsWithDefaultStyle(
    userId: string, 
    limit: number = 10
  ): Promise<{ trend: TrendVideo; brandStyle: BrandStyle | null }[]> {
    // Получаем default стиль пользователя
    const defaultStyle = await this.getDefaultBrandStyle(userId);

    // Получаем pending тренды пользователя
    const trends = await db
      .select()
      .from(trendVideos)
      .where(and(
        eq(trendVideos.userId, userId),
        eq(trendVideos.status, 'pending')
      ))
      .orderBy(desc(trendVideos.trendScore))
      .limit(limit);

    // Комбинируем результаты
    return trends.map(trend => ({
      trend,
      brandStyle: trend.brandStyleId 
        ? null // Если у тренда уже есть стиль, его нужно отдельно загрузить
        : defaultStyle || null
    }));
  }
}

export const storage = new DatabaseStorage();