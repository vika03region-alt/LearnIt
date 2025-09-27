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
  
  // User account operations
  getUserAccounts(userId: string): Promise<UserAccount[]>;
  getUserAccount(userId: string, platformId: number): Promise<UserAccount | undefined>;
  createUserAccount(account: InsertUserAccount): Promise<UserAccount>;
  updateUserAccount(id: number, updates: Partial<InsertUserAccount>): Promise<UserAccount>;
  
  // Post operations
  createPost(post: InsertPost & { userId: string }): Promise<Post>;
  getUserPosts(userId: string, limit?: number): Promise<Post[]>;
  getScheduledPosts(userId: string): Promise<Post[]>;
  updatePost(id: number, updates: Partial<Post>): Promise<Post>;
  
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
    return await db
      .select()
      .from(activityLogs)
      .where(eq(activityLogs.userId, userId))
      .orderBy(desc(activityLogs.createdAt))
      .limit(limit);
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
}

export const storage = new DatabaseStorage();
