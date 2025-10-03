CREATE TABLE "ab_tests" (
	"id" serial PRIMARY KEY NOT NULL,
	"user_id" varchar NOT NULL,
	"name" varchar NOT NULL,
	"description" text,
	"platform_ids" json NOT NULL,
	"variants" json NOT NULL,
	"status" varchar DEFAULT 'draft',
	"metrics" json,
	"start_date" timestamp,
	"end_date" timestamp,
	"created_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "activity_logs" (
	"id" serial PRIMARY KEY NOT NULL,
	"user_id" varchar NOT NULL,
	"action" varchar(100) NOT NULL,
	"description" text,
	"platform_id" integer,
	"status" varchar(20) NOT NULL,
	"metadata" jsonb,
	"created_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "ai_content_logs" (
	"id" serial PRIMARY KEY NOT NULL,
	"user_id" varchar NOT NULL,
	"prompt" text NOT NULL,
	"generated_content" text NOT NULL,
	"content_type" varchar(50) NOT NULL,
	"target_platforms" text[],
	"tokens_used" integer,
	"cost" real,
	"created_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "ai_conversations" (
	"id" serial PRIMARY KEY NOT NULL,
	"user_id" varchar NOT NULL,
	"title" varchar DEFAULT 'Новый разговор' NOT NULL,
	"status" varchar DEFAULT 'active',
	"context" text,
	"metadata" json,
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "ai_generated_content" (
	"id" serial PRIMARY KEY NOT NULL,
	"user_id" varchar NOT NULL,
	"content_type" varchar NOT NULL,
	"title" varchar NOT NULL,
	"content" text NOT NULL,
	"platforms" json NOT NULL,
	"hashtags" json,
	"ai_prompt" text NOT NULL,
	"tokens_used" integer NOT NULL,
	"cost" numeric(8, 6) NOT NULL,
	"metadata" json,
	"status" varchar DEFAULT 'draft',
	"published_at" timestamp,
	"scheduled_for" timestamp,
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "ai_insights" (
	"id" serial PRIMARY KEY NOT NULL,
	"user_id" varchar NOT NULL,
	"type" varchar NOT NULL,
	"platform_id" integer,
	"title" varchar NOT NULL,
	"description" text NOT NULL,
	"data" json NOT NULL,
	"status" varchar DEFAULT 'active',
	"created_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "ai_messages" (
	"id" serial PRIMARY KEY NOT NULL,
	"conversation_id" integer NOT NULL,
	"role" varchar NOT NULL,
	"content" text NOT NULL,
	"tokens_used" integer DEFAULT 0,
	"cost" numeric(8, 6) DEFAULT '0',
	"metadata" json,
	"created_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "ai_usage_metrics" (
	"id" serial PRIMARY KEY NOT NULL,
	"user_id" varchar NOT NULL,
	"date" date NOT NULL,
	"total_tokens" integer DEFAULT 0,
	"total_cost" numeric(10, 6) DEFAULT '0',
	"content_count" integer DEFAULT 0,
	"content_types" json,
	"platforms" json,
	"successful_generations" integer DEFAULT 0,
	"failed_generations" integer DEFAULT 0
);
--> statement-breakpoint
CREATE TABLE "ai_videos" (
	"id" serial PRIMARY KEY NOT NULL,
	"user_id" varchar NOT NULL,
	"post_id" integer,
	"provider" varchar(50) NOT NULL,
	"video_id" varchar NOT NULL,
	"prompt" text,
	"script" text,
	"scenes" json,
	"config" json,
	"status" varchar(20) DEFAULT 'queued' NOT NULL,
	"video_url" text,
	"thumbnail_url" text,
	"duration" integer,
	"cost" real DEFAULT 0,
	"estimated_time" varchar,
	"error_message" text,
	"created_at" timestamp DEFAULT now(),
	"completed_at" timestamp
);
--> statement-breakpoint
CREATE TABLE "analytics" (
	"id" serial PRIMARY KEY NOT NULL,
	"post_id" integer NOT NULL,
	"likes" integer DEFAULT 0,
	"comments" integer DEFAULT 0,
	"shares" integer DEFAULT 0,
	"views" integer DEFAULT 0,
	"reach" integer DEFAULT 0,
	"engagement_rate" real DEFAULT 0,
	"recorded_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "audience_analytics" (
	"id" serial PRIMARY KEY NOT NULL,
	"user_id" varchar NOT NULL,
	"platform_id" integer NOT NULL,
	"date" date NOT NULL,
	"demographics" json NOT NULL,
	"engagement_patterns" json NOT NULL,
	"created_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "brand_styles" (
	"id" serial PRIMARY KEY NOT NULL,
	"user_id" varchar NOT NULL,
	"name" varchar(100) NOT NULL,
	"description" text,
	"primary_color" varchar(20),
	"secondary_color" varchar(20),
	"font_style" varchar(50),
	"visual_style" varchar(50),
	"tone" varchar(50) NOT NULL,
	"voice" text,
	"keywords" text[],
	"hashtags" text[],
	"video_style" text,
	"scene_preferences" json,
	"aspect_ratio" varchar(20) DEFAULT '9:16',
	"duration" integer DEFAULT 30,
	"logo_url" varchar(500),
	"logo_position" varchar(50) DEFAULT 'bottom-right',
	"cta_text" varchar(200),
	"cta_url" varchar(500),
	"video_prompt_template" text,
	"post_prompt_template" text,
	"target_audience" text,
	"is_active" boolean DEFAULT true,
	"is_default" boolean DEFAULT false,
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "competitor_analysis" (
	"id" serial PRIMARY KEY NOT NULL,
	"user_id" varchar NOT NULL,
	"platform_id" integer NOT NULL,
	"competitor_handle" varchar NOT NULL,
	"competitor_name" varchar,
	"metrics" json NOT NULL,
	"content_analysis" json,
	"last_analyzed" timestamp DEFAULT now(),
	"created_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "content_performance" (
	"id" serial PRIMARY KEY NOT NULL,
	"user_id" varchar NOT NULL,
	"platform_id" integer NOT NULL,
	"post_id" varchar NOT NULL,
	"title" text,
	"content" text,
	"hashtags" json,
	"post_type" varchar,
	"published_at" timestamp,
	"metrics" json NOT NULL,
	"ai_analysis" json,
	"created_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "content_templates" (
	"id" serial PRIMARY KEY NOT NULL,
	"user_id" varchar NOT NULL,
	"name" varchar NOT NULL,
	"category" varchar NOT NULL,
	"template" text NOT NULL,
	"variables" json,
	"platforms" json NOT NULL,
	"usage_count" integer DEFAULT 0,
	"is_public" boolean DEFAULT false,
	"created_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "hashtag_analysis" (
	"id" serial PRIMARY KEY NOT NULL,
	"hashtag" varchar NOT NULL,
	"platform" varchar NOT NULL,
	"metrics" json NOT NULL,
	"niche" varchar NOT NULL,
	"last_updated" timestamp DEFAULT now(),
	"created_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "platform_analytics" (
	"id" serial PRIMARY KEY NOT NULL,
	"user_id" varchar NOT NULL,
	"platform_id" integer NOT NULL,
	"date" date NOT NULL,
	"metrics" json NOT NULL,
	"created_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "platforms" (
	"id" serial PRIMARY KEY NOT NULL,
	"name" varchar(50) NOT NULL,
	"display_name" varchar(100) NOT NULL,
	"icon" varchar(50) NOT NULL,
	"color" varchar(20) NOT NULL,
	"api_endpoint" varchar,
	"is_active" boolean DEFAULT true,
	CONSTRAINT "platforms_name_unique" UNIQUE("name")
);
--> statement-breakpoint
CREATE TABLE "posts" (
	"id" serial PRIMARY KEY NOT NULL,
	"user_id" varchar NOT NULL,
	"platform_id" integer NOT NULL,
	"title" text,
	"content" text NOT NULL,
	"media_urls" text[],
	"scheduled_at" timestamp,
	"published_at" timestamp,
	"status" varchar(20) DEFAULT 'draft' NOT NULL,
	"external_post_id" varchar,
	"ai_generated" boolean DEFAULT false,
	"ai_video_id" integer,
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "rate_limits" (
	"id" serial PRIMARY KEY NOT NULL,
	"platform_id" integer NOT NULL,
	"action_type" varchar(50) NOT NULL,
	"limit_period" varchar(20) NOT NULL,
	"max_actions" integer NOT NULL,
	"safe_threshold" real DEFAULT 0.8,
	"warning_threshold" real DEFAULT 0.9
);
--> statement-breakpoint
CREATE TABLE "safety_logs" (
	"id" serial PRIMARY KEY NOT NULL,
	"user_id" varchar NOT NULL,
	"platform_id" integer NOT NULL,
	"action_type" varchar(50) NOT NULL,
	"action_count" integer DEFAULT 1,
	"rate_limit_used" real,
	"rate_limit_max" real,
	"status" varchar(20) NOT NULL,
	"check_time" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "sessions" (
	"sid" varchar PRIMARY KEY NOT NULL,
	"sess" jsonb NOT NULL,
	"expire" timestamp NOT NULL
);
--> statement-breakpoint
CREATE TABLE "trend_analysis" (
	"id" serial PRIMARY KEY NOT NULL,
	"platform_id" integer NOT NULL,
	"category" varchar NOT NULL,
	"trend_name" varchar NOT NULL,
	"data" json NOT NULL,
	"confidence" numeric(5, 2) NOT NULL,
	"region" varchar DEFAULT 'global',
	"date" date NOT NULL,
	"created_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "trend_videos" (
	"id" serial PRIMARY KEY NOT NULL,
	"user_id" varchar,
	"brand_style_id" integer,
	"source" varchar(50) NOT NULL,
	"source_url" text,
	"title" text,
	"description" text,
	"concept" text,
	"visual_elements" text[],
	"trend_score" real,
	"views" integer,
	"likes" integer,
	"engagement" real,
	"adapted_prompt" text,
	"adapted_script" text,
	"asset_urls" json,
	"status" varchar(20) DEFAULT 'pending',
	"cloned_video_id" integer,
	"cloned_post_id" integer,
	"created_at" timestamp DEFAULT now(),
	"analyzed_at" timestamp,
	"cloned_at" timestamp
);
--> statement-breakpoint
CREATE TABLE "user_accounts" (
	"id" serial PRIMARY KEY NOT NULL,
	"user_id" varchar NOT NULL,
	"platform_id" integer NOT NULL,
	"account_handle" varchar NOT NULL,
	"access_token" text,
	"refresh_token" text,
	"token_expiry" timestamp,
	"platform_config" json,
	"auth_status" varchar DEFAULT 'pending',
	"is_active" boolean DEFAULT true,
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "users" (
	"id" varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"email" varchar,
	"first_name" varchar,
	"last_name" varchar,
	"profile_image_url" varchar,
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp DEFAULT now(),
	CONSTRAINT "users_email_unique" UNIQUE("email")
);
--> statement-breakpoint
ALTER TABLE "activity_logs" ADD CONSTRAINT "activity_logs_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "activity_logs" ADD CONSTRAINT "activity_logs_platform_id_platforms_id_fk" FOREIGN KEY ("platform_id") REFERENCES "public"."platforms"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "ai_content_logs" ADD CONSTRAINT "ai_content_logs_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "ai_conversations" ADD CONSTRAINT "ai_conversations_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "ai_generated_content" ADD CONSTRAINT "ai_generated_content_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "ai_insights" ADD CONSTRAINT "ai_insights_platform_id_platforms_id_fk" FOREIGN KEY ("platform_id") REFERENCES "public"."platforms"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "ai_messages" ADD CONSTRAINT "ai_messages_conversation_id_ai_conversations_id_fk" FOREIGN KEY ("conversation_id") REFERENCES "public"."ai_conversations"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "ai_usage_metrics" ADD CONSTRAINT "ai_usage_metrics_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "ai_videos" ADD CONSTRAINT "ai_videos_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "ai_videos" ADD CONSTRAINT "ai_videos_post_id_posts_id_fk" FOREIGN KEY ("post_id") REFERENCES "public"."posts"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "analytics" ADD CONSTRAINT "analytics_post_id_posts_id_fk" FOREIGN KEY ("post_id") REFERENCES "public"."posts"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "audience_analytics" ADD CONSTRAINT "audience_analytics_platform_id_platforms_id_fk" FOREIGN KEY ("platform_id") REFERENCES "public"."platforms"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "brand_styles" ADD CONSTRAINT "brand_styles_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "competitor_analysis" ADD CONSTRAINT "competitor_analysis_platform_id_platforms_id_fk" FOREIGN KEY ("platform_id") REFERENCES "public"."platforms"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "content_performance" ADD CONSTRAINT "content_performance_platform_id_platforms_id_fk" FOREIGN KEY ("platform_id") REFERENCES "public"."platforms"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "content_templates" ADD CONSTRAINT "content_templates_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "platform_analytics" ADD CONSTRAINT "platform_analytics_platform_id_platforms_id_fk" FOREIGN KEY ("platform_id") REFERENCES "public"."platforms"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "posts" ADD CONSTRAINT "posts_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "posts" ADD CONSTRAINT "posts_platform_id_platforms_id_fk" FOREIGN KEY ("platform_id") REFERENCES "public"."platforms"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "rate_limits" ADD CONSTRAINT "rate_limits_platform_id_platforms_id_fk" FOREIGN KEY ("platform_id") REFERENCES "public"."platforms"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "safety_logs" ADD CONSTRAINT "safety_logs_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "safety_logs" ADD CONSTRAINT "safety_logs_platform_id_platforms_id_fk" FOREIGN KEY ("platform_id") REFERENCES "public"."platforms"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "trend_analysis" ADD CONSTRAINT "trend_analysis_platform_id_platforms_id_fk" FOREIGN KEY ("platform_id") REFERENCES "public"."platforms"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "trend_videos" ADD CONSTRAINT "trend_videos_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "trend_videos" ADD CONSTRAINT "trend_videos_brand_style_id_brand_styles_id_fk" FOREIGN KEY ("brand_style_id") REFERENCES "public"."brand_styles"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "trend_videos" ADD CONSTRAINT "trend_videos_cloned_video_id_ai_videos_id_fk" FOREIGN KEY ("cloned_video_id") REFERENCES "public"."ai_videos"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "trend_videos" ADD CONSTRAINT "trend_videos_cloned_post_id_posts_id_fk" FOREIGN KEY ("cloned_post_id") REFERENCES "public"."posts"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "user_accounts" ADD CONSTRAINT "user_accounts_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "user_accounts" ADD CONSTRAINT "user_accounts_platform_id_platforms_id_fk" FOREIGN KEY ("platform_id") REFERENCES "public"."platforms"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "IDX_session_expire" ON "sessions" USING btree ("expire");