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
} from "@shared/schema";
import { db } from "./db";
import { eq, desc, and, gte, lte, sql } from "drizzle-orm";

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
    return await db.select().from(userAccounts).where(eq(userAccounts.userId, userId));
  }

  async getUserAccount(userId: string, platformId: number): Promise<UserAccount | undefined> {
    const [account] = await db
      .select()
      .from(userAccounts)
      .where(and(eq(userAccounts.userId, userId), eq(userAccounts.platformId, platformId)));
    return account;
  }

  async createUserAccount(account: InsertUserAccount): Promise<UserAccount> {
    const [newAccount] = await db.insert(userAccounts).values(account).returning();
    return newAccount;
  }

  async updateUserAccount(id: number, updates: Partial<InsertUserAccount>): Promise<UserAccount> {
    const [updatedAccount] = await db
      .update(userAccounts)
      .set({ ...updates, updatedAt: new Date() })
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
    let query = db
      .select({
        analytics: analytics,
        post: posts,
      })
      .from(analytics)
      .innerJoin(posts, eq(analytics.postId, posts.id))
      .where(eq(posts.userId, userId));

    if (platformId) {
      query = query.where(eq(posts.platformId, platformId));
    }

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
    let query = db
      .select()
      .from(safetyLogs)
      .where(eq(safetyLogs.userId, userId));

    if (platformId) {
      query = query.where(eq(safetyLogs.platformId, platformId));
    }

    return await query.orderBy(desc(safetyLogs.checkTime));
  }

  async getRateLimits(platformId?: number): Promise<RateLimit[]> {
    let query = db.select().from(rateLimits);
    
    if (platformId) {
      query = query.where(eq(rateLimits.platformId, platformId));
    }

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
}

export const storage = new DatabaseStorage();
