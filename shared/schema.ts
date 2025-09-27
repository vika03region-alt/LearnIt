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
  isActive: boolean("is_active").default(true),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Content posts
export const posts = pgTable("posts", {
  id: serial("id").primaryKey(),
  userId: varchar("user_id").references(() => users.id).notNull(),
  platformId: integer("platform_id").references(() => platforms.id).notNull(),
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
