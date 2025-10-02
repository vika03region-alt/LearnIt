import { sql } from 'drizzle-orm';
import {
  index,
  jsonb,
  pgTable,
  timestamp,
  varchar,
  text,
  integer,
  boolean,
  real,
  serial,
  json,
  date,
  decimal,
} from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

// Session storage table (required for Replit Auth)
export const sessions = pgTable(
  "sessions",
  {
    sid: varchar("sid").primaryKey(),
    sess: jsonb("sess").notNull(),
    expire: timestamp("expire").notNull(),
  },
  (table) => [index("IDX_session_expire").on(table.expire)],
);

// User storage table (required for Replit Auth)
export const users = pgTable("users", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  email: varchar("email").unique(),
  firstName: varchar("first_name"),
  lastName: varchar("last_name"),
  profileImageUrl: varchar("profile_image_url"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Social media platforms
export const platforms = pgTable("platforms", {
  id: serial("id").primaryKey(),
  name: varchar("name", { length: 50 }).notNull().unique(),
  displayName: varchar("display_name", { length: 100 }).notNull(),
  icon: varchar("icon", { length: 50 }).notNull(),
  color: varchar("color", { length: 20 }).notNull(),
  apiEndpoint: varchar("api_endpoint"),
  isActive: boolean("is_active").default(true),
});

// User social media accounts
export const userAccounts = pgTable("user_accounts", {
  id: serial("id").primaryKey(),
  userId: varchar("user_id").references(() => users.id).notNull(),
  platformId: integer("platform_id").references(() => platforms.id).notNull(),
  accountHandle: varchar("account_handle").notNull(),
  accessToken: text("access_token"),
  refreshToken: text("refresh_token"),
  tokenExpiry: timestamp("token_expiry"),
  // Platform-specific configurations
  platformConfig: json('platform_config').$type<{
    // Instagram: business account, facebook page info
    facebookPageId?: string;
    businessAccountId?: string;
    // TikTok: direct post configuration
    directPostEnabled?: boolean;
    // YouTube: channel info
    channelId?: string;
    uploadPermissions?: string[];
    // Telegram: bot info
    botToken?: string;
    channelUsername?: string;
  }>(),
  authStatus: varchar('auth_status').default('pending'), // 'pending', 'connected', 'expired', 'error'
  isActive: boolean("is_active").default(true),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Content posts
export const posts = pgTable("posts", {
  id: serial("id").primaryKey(),
  userId: varchar("user_id").references(() => users.id).notNull(),
  platformId: integer("platform_id").references(() => platforms.id).notNull(),
  title: text("title"),
  content: text("content").notNull(),
  mediaUrls: text("media_urls").array(),
  scheduledAt: timestamp("scheduled_at"),
  publishedAt: timestamp("published_at"),
  status: varchar("status", { length: 20 }).notNull().default('draft'), // draft, scheduled, published, failed
  externalPostId: varchar("external_post_id"),
  aiGenerated: boolean("ai_generated").default(false),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Analytics data
export const analytics = pgTable("analytics", {
  id: serial("id").primaryKey(),
  postId: integer("post_id").references(() => posts.id).notNull(),
  likes: integer("likes").default(0),
  comments: integer("comments").default(0),
  shares: integer("shares").default(0),
  views: integer("views").default(0),
  reach: integer("reach").default(0),
  engagementRate: real("engagement_rate").default(0),
  recordedAt: timestamp("recorded_at").defaultNow(),
});

// AI content generation logs
export const aiContentLogs = pgTable("ai_content_logs", {
  id: serial("id").primaryKey(),
  userId: varchar("user_id").references(() => users.id).notNull(),
  prompt: text("prompt").notNull(),
  generatedContent: text("generated_content").notNull(),
  contentType: varchar("content_type", { length: 50 }).notNull(),
  targetPlatforms: text("target_platforms").array(),
  tokensUsed: integer("tokens_used"),
  cost: real("cost"),
  createdAt: timestamp("created_at").defaultNow(),
});

// Safety monitoring
export const safetyLogs = pgTable("safety_logs", {
  id: serial("id").primaryKey(),
  userId: varchar("user_id").references(() => users.id).notNull(),
  platformId: integer("platform_id").references(() => platforms.id).notNull(),
  actionType: varchar("action_type", { length: 50 }).notNull(), // post, comment, like, follow
  actionCount: integer("action_count").default(1),
  rateLimitUsed: real("rate_limit_used"),
  rateLimitMax: real("rate_limit_max"),
  status: varchar("status", { length: 20 }).notNull(), // safe, warning, critical
  checkTime: timestamp("check_time").defaultNow(),
});

// Platform rate limits configuration
export const rateLimits = pgTable("rate_limits", {
  id: serial("id").primaryKey(),
  platformId: integer("platform_id").references(() => platforms.id).notNull(),
  actionType: varchar("action_type", { length: 50 }).notNull(),
  limitPeriod: varchar("limit_period", { length: 20 }).notNull(), // hour, day, week
  maxActions: integer("max_actions").notNull(),
  safeThreshold: real("safe_threshold").default(0.8), // 80% of limit
  warningThreshold: real("warning_threshold").default(0.9), // 90% of limit
});

// Activity logs
export const activityLogs = pgTable("activity_logs", {
  id: serial("id").primaryKey(),
  userId: varchar("user_id").references(() => users.id).notNull(),
  action: varchar("action", { length: 100 }).notNull(),
  description: text("description"),
  platformId: integer("platform_id").references(() => platforms.id),
  status: varchar("status", { length: 20 }).notNull(), // success, warning, error
  metadata: jsonb("metadata"),
  createdAt: timestamp("created_at").defaultNow(),
});

// Insert schemas
export const insertUserSchema = createInsertSchema(users).pick({
  email: true,
  firstName: true,
  lastName: true,
  profileImageUrl: true,
});

export const insertPostSchema = createInsertSchema(posts).pick({
  platformId: true,
  title: true,
  content: true,
  mediaUrls: true,
  scheduledAt: true,
});

export const insertAIContentLogSchema = createInsertSchema(aiContentLogs).pick({
  prompt: true,
  contentType: true,
  targetPlatforms: true,
});

// Types
export type UpsertUser = z.infer<typeof insertUserSchema>;
export type User = typeof users.$inferSelect;
export type Platform = typeof platforms.$inferSelect;
export type UserAccount = typeof userAccounts.$inferSelect;
export type InsertUserAccount = typeof userAccounts.$inferInsert;
export type Post = typeof posts.$inferSelect;
export type InsertPost = z.infer<typeof insertPostSchema>;
export type Analytics = typeof analytics.$inferSelect;
export type AIContentLog = typeof aiContentLogs.$inferSelect;
export type InsertAIContentLog = z.infer<typeof insertAIContentLogSchema>;
export type SafetyLog = typeof safetyLogs.$inferSelect;
export type RateLimit = typeof rateLimits.$inferSelect;
export type ActivityLog = typeof activityLogs.$inferSelect;

// Deep Analytics Tables for Advanced AI Platform
export const platformAnalytics = pgTable('platform_analytics', {
  id: serial('id').primaryKey(),
  userId: varchar('user_id').notNull(),
  platformId: integer('platform_id').notNull().references(() => platforms.id),
  date: date('date').notNull(),
  metrics: json('metrics').$type<{
    followers: number;
    following: number;
    posts: number;
    likes: number;
    comments: number;
    shares: number;
    views: number;
    impressions: number;
    reach: number;
    engagement_rate: number;
    growth_rate: number;
  }>().notNull(),
  createdAt: timestamp('created_at').defaultNow(),
});

export const contentPerformance = pgTable('content_performance', {
  id: serial('id').primaryKey(),
  userId: varchar('user_id').notNull(),
  platformId: integer('platform_id').notNull().references(() => platforms.id),
  postId: varchar('post_id').notNull(),
  title: text('title'),
  content: text('content'),
  hashtags: json('hashtags').$type<string[]>(),
  postType: varchar('post_type'), // 'image', 'video', 'carousel', 'story'
  publishedAt: timestamp('published_at'),
  metrics: json('metrics').$type<{
    likes: number;
    comments: number;
    shares: number;
    views: number;
    saves: number;
    clicks: number;
    engagement_rate: number;
    reach: number;
    impressions: number;
  }>().notNull(),
  aiAnalysis: json('ai_analysis').$type<{
    sentiment: 'positive' | 'negative' | 'neutral';
    topics: string[];
    trends: string[];
    optimization_suggestions: string[];
    predicted_performance: number;
  }>(),
  createdAt: timestamp('created_at').defaultNow(),
});

export const aiInsights = pgTable('ai_insights', {
  id: serial('id').primaryKey(),
  userId: varchar('user_id').notNull(),
  type: varchar('type').notNull(), // 'trend_analysis', 'audience_analysis', 'content_optimization'
  platformId: integer('platform_id').references(() => platforms.id),
  title: varchar('title').notNull(),
  description: text('description').notNull(),
  data: json('data').$type<{
    insights: string[];
    recommendations: string[];
    confidence: number;
    impact: 'low' | 'medium' | 'high';
  }>().notNull(),
  status: varchar('status').default('active'), // 'active', 'dismissed', 'applied'
  createdAt: timestamp('created_at').defaultNow(),
});

export const audienceAnalytics = pgTable('audience_analytics', {
  id: serial('id').primaryKey(),
  userId: varchar('user_id').notNull(),
  platformId: integer('platform_id').notNull().references(() => platforms.id),
  date: date('date').notNull(),
  demographics: json('demographics').$type<{
    age_groups: Record<string, number>;
    gender: Record<string, number>;
    locations: Record<string, number>;
    interests: Record<string, number>;
    devices: Record<string, number>;
    peak_hours: Record<string, number>;
  }>().notNull(),
  engagement_patterns: json('engagement_patterns').$type<{
    best_posting_times: string[];
    content_preferences: Record<string, number>;
    interaction_types: Record<string, number>;
  }>().notNull(),
  createdAt: timestamp('created_at').defaultNow(),
});

export const competitorAnalysis = pgTable('competitor_analysis', {
  id: serial('id').primaryKey(),
  userId: varchar('user_id').notNull(),
  platformId: integer('platform_id').notNull().references(() => platforms.id),
  competitorHandle: varchar('competitor_handle').notNull(),
  competitorName: varchar('competitor_name'),
  metrics: json('metrics').$type<{
    followers: number;
    following: number;
    posts: number;
    avg_likes: number;
    avg_comments: number;
    engagement_rate: number;
    posting_frequency: number;
  }>().notNull(),
  content_analysis: json('content_analysis').$type<{
    common_hashtags: Record<string, number>;
    content_types: Record<string, number>;
    posting_times: Record<string, number>;
    top_performing_posts: Array<{
      id: string;
      type: string;
      likes: number;
      comments: number;
      content: string;
    }>;
  }>(),
  lastAnalyzed: timestamp('last_analyzed').defaultNow(),
  createdAt: timestamp('created_at').defaultNow(),
});

export const abTests = pgTable('ab_tests', {
  id: serial('id').primaryKey(),
  userId: varchar('user_id').notNull(),
  name: varchar('name').notNull(),
  description: text('description'),
  platformIds: json('platform_ids').$type<number[]>().notNull(),
  variants: json('variants').$type<Array<{
    id: string;
    name: string;
    content: string;
    hashtags?: string[];
    media_type?: string;
  }>>().notNull(),
  status: varchar('status').default('draft'), // 'draft', 'running', 'completed', 'paused'
  metrics: json('metrics').$type<{
    total_impressions: number;
    total_engagement: number;
    conversion_rate: number;
    winner?: string;
    statistical_significance?: number;
  }>(),
  startDate: timestamp('start_date'),
  endDate: timestamp('end_date'),
  createdAt: timestamp('created_at').defaultNow(),
});

export const trendAnalysis = pgTable('trend_analysis', {
  id: serial('id').primaryKey(),
  platformId: integer('platform_id').notNull().references(() => platforms.id),
  category: varchar('category').notNull(), // 'hashtags', 'topics', 'content_types'
  trend_name: varchar('trend_name').notNull(),
  data: json('data').$type<{
    volume: number;
    growth_rate: number;
    related_keywords: string[];
    peak_times: string[];
    demographics: Record<string, number>;
    sentiment: Record<string, number>;
  }>().notNull(),
  confidence: decimal('confidence', { precision: 5, scale: 2 }).notNull(),
  region: varchar('region').default('global'),
  date: date('date').notNull(),
  createdAt: timestamp('created_at').defaultNow(),
});

// AI Content Generation Tables
export const aiGeneratedContent = pgTable('ai_generated_content', {
  id: serial('id').primaryKey(),
  userId: varchar('user_id').references(() => users.id).notNull(),
  contentType: varchar('content_type').notNull(), // 'viral_tiktok', 'youtube_analysis', 'live_signal', etc.
  title: varchar('title').notNull(),
  content: text('content').notNull(),
  platforms: json('platforms').$type<string[]>().notNull(),
  hashtags: json('hashtags').$type<string[]>(),
  aiPrompt: text('ai_prompt').notNull(),
  tokensUsed: integer('tokens_used').notNull(),
  cost: decimal('cost', { precision: 8, scale: 6 }).notNull(),
  metadata: json('metadata').$type<{
    style?: string;
    target_audience?: string;
    confidence_rating?: number;
    engagement_prediction?: number;
    trending_topics?: string[];
    competitor_references?: string[];
  }>(),
  status: varchar('status').default('draft'), // 'draft', 'published', 'scheduled', 'archived'
  publishedAt: timestamp('published_at'),
  scheduledFor: timestamp('scheduled_for'),
  createdAt: timestamp('created_at').defaultNow(),
  updatedAt: timestamp('updated_at').defaultNow(),
});

export const contentTemplates = pgTable('content_templates', {
  id: serial('id').primaryKey(),
  userId: varchar('user_id').references(() => users.id).notNull(),
  name: varchar('name').notNull(),
  category: varchar('category').notNull(), // 'signal', 'education', 'analysis', 'viral'
  template: text('template').notNull(),
  variables: json('variables').$type<Record<string, string>>(),
  platforms: json('platforms').$type<string[]>().notNull(),
  usageCount: integer('usage_count').default(0),
  isPublic: boolean('is_public').default(false),
  createdAt: timestamp('created_at').defaultNow(),
});

export const hashtagAnalysis = pgTable('hashtag_analysis', {
  id: serial('id').primaryKey(),
  hashtag: varchar('hashtag').notNull(),
  platform: varchar('platform').notNull(),
  metrics: json('metrics').$type<{
    total_posts: number;
    total_views: number;
    avg_engagement: number;
    trending_score: number;
    competition_level: 'LOW' | 'MEDIUM' | 'HIGH' | 'EXTREME';
    best_posting_times: string[];
  }>().notNull(),
  niche: varchar('niche').notNull(), // 'crypto', 'forex', 'stocks', 'trading'
  lastUpdated: timestamp('last_updated').defaultNow(),
  createdAt: timestamp('created_at').defaultNow(),
});

export const aiUsageMetrics = pgTable('ai_usage_metrics', {
  id: serial('id').primaryKey(),
  userId: varchar('user_id').references(() => users.id).notNull(),
  date: date('date').notNull(),
  totalTokens: integer('total_tokens').default(0),
  totalCost: decimal('total_cost', { precision: 10, scale: 6 }).default('0'),
  contentCount: integer('content_count').default(0),
  contentTypes: json('content_types').$type<Record<string, number>>(),
  platforms: json('platforms').$type<Record<string, number>>(),
  successfulGenerations: integer('successful_generations').default(0),
  failedGenerations: integer('failed_generations').default(0),
});

// AI Content Generation Insert/Select Schemas
export const insertAIGeneratedContent = createInsertSchema(aiGeneratedContent).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const insertContentTemplate = createInsertSchema(contentTemplates).omit({
  id: true,
  createdAt: true,
  usageCount: true,
});

export const insertHashtagAnalysis = createInsertSchema(hashtagAnalysis).omit({
  id: true,
  createdAt: true,
  lastUpdated: true,
});

export const insertAIUsageMetrics = createInsertSchema(aiUsageMetrics).omit({
  id: true,
});

// Advanced AI Analytics Types
export type PlatformAnalytics = typeof platformAnalytics.$inferSelect;
export type ContentPerformance = typeof contentPerformance.$inferSelect;
export type AIInsight = typeof aiInsights.$inferSelect;
export type AudienceAnalytics = typeof audienceAnalytics.$inferSelect;
export type CompetitorAnalysis = typeof competitorAnalysis.$inferSelect;
export type ABTest = typeof abTests.$inferSelect;
export type TrendAnalysis = typeof trendAnalysis.$inferSelect;

// AI Content Types
export type AIGeneratedContent = typeof aiGeneratedContent.$inferSelect;
export type ContentTemplate = typeof contentTemplates.$inferSelect;
export type HashtagAnalysis = typeof hashtagAnalysis.$inferSelect;
export type AIUsageMetrics = typeof aiUsageMetrics.$inferSelect;

export type InsertAIGeneratedContent = z.infer<typeof insertAIGeneratedContent>;
export type InsertContentTemplate = z.infer<typeof insertContentTemplate>;
export type InsertHashtagAnalysis = z.infer<typeof insertHashtagAnalysis>;
export type InsertAIUsageMetrics = z.infer<typeof insertAIUsageMetrics>;

// AI Assistant Tables
export const aiConversations = pgTable('ai_conversations', {
  id: serial('id').primaryKey(),
  userId: varchar('user_id').references(() => users.id).notNull(),
  title: varchar('title').notNull().default('Новый разговор'),
  status: varchar('status').default('active'), // 'active', 'archived', 'deleted'
  context: text('context'), // Контекст разговора для AI
  metadata: json('metadata').$type<{
    model?: string;
    temperature?: number;
    tokens_used?: number;
    cost?: number;
  }>(),
  createdAt: timestamp('created_at').defaultNow(),
  updatedAt: timestamp('updated_at').defaultNow(),
});

export const aiMessages = pgTable('ai_messages', {
  id: serial('id').primaryKey(),
  conversationId: integer('conversation_id').references(() => aiConversations.id).notNull(),
  role: varchar('role').notNull(), // 'user', 'assistant', 'system'
  content: text('content').notNull(),
  tokensUsed: integer('tokens_used').default(0),
  cost: decimal('cost', { precision: 8, scale: 6 }).default('0'),
  metadata: json('metadata').$type<{
    model?: string;
    response_time?: number;
    error?: string;
  }>(),
  createdAt: timestamp('created_at').defaultNow(),
});

// AI Assistant Insert/Select Schemas
export const insertAIConversation = createInsertSchema(aiConversations).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const insertAIMessage = createInsertSchema(aiMessages).omit({
  id: true,
  createdAt: true,
});

// AI Assistant Types
export type AIConversation = typeof aiConversations.$inferSelect;
export type AIMessage = typeof aiMessages.$inferSelect;
export type InsertAIConversation = z.infer<typeof insertAIConversation>;
export type InsertAIMessage = z.infer<typeof insertAIMessage>;
