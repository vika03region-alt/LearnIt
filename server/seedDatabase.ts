
import { db } from "./db";
import { platforms, rateLimits } from "@shared/schema";

export async function seedPlatforms() {
  // Добавляем Instagram как основную платформу
  const [instagram] = await db.insert(platforms).values({
    name: 'instagram',
    displayName: 'Instagram',
    apiBaseUrl: 'https://graph.instagram.com',
    isActive: true,
    requiredScopes: ['instagram_basic', 'instagram_content_publish', 'pages_show_list', 'pages_read_engagement'],
    authUrl: 'https://api.instagram.com/oauth/authorize',
    tokenUrl: 'https://api.instagram.com/oauth/access_token',
    revokeUrl: 'https://graph.instagram.com/revoke',
    features: {
      posting: true,
      analytics: true,
      scheduling: true,
      stories: true,
      reels: true,
      hashtag_research: true,
      competitor_analysis: true
    }
  }).onConflictDoNothing().returning();

  // Добавляем лимиты для Instagram
  if (instagram) {
    await db.insert(rateLimits).values([
      {
        platformId: instagram.id,
        actionType: 'post',
        limitPeriod: 'day',
        maxActions: 25,
        safeThreshold: 0.8,
        warningThreshold: 0.9
      },
      {
        platformId: instagram.id,
        actionType: 'story',
        limitPeriod: 'day',
        maxActions: 100,
        safeThreshold: 0.8,
        warningThreshold: 0.9
      },
      {
        platformId: instagram.id,
        actionType: 'comment',
        limitPeriod: 'hour',
        maxActions: 60,
        safeThreshold: 0.8,
        warningThreshold: 0.9
      },
      {
        platformId: instagram.id,
        actionType: 'like',
        limitPeriod: 'hour',
        maxActions: 350,
        safeThreshold: 0.8,
        warningThreshold: 0.9
      },
      {
        platformId: instagram.id,
        actionType: 'follow',
        limitPeriod: 'hour',
        maxActions: 200,
        safeThreshold: 0.8,
        warningThreshold: 0.9
      }
    ]).onConflictDoNothing();
  }

  console.log('✅ Платформы и лимиты для Instagram успешно добавлены');
  return instagram;
}
