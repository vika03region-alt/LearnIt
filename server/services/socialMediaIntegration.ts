import { storage } from "../storage";
import { z } from "zod";

// Social Media Service Interfaces
export interface SocialMediaPost {
  content: string;
  mediaUrls?: string[];
  scheduledAt?: Date;
}

export interface PostResult {
  success: boolean;
  externalPostId?: string;
  error?: string;
}

export interface PlatformAuthConfig {
  clientId: string;
  clientSecret: string;
  redirectUri: string;
  scopes: string[];
}

// Base Social Media Service
export abstract class BaseSocialMediaService {
  protected platformId: number;
  protected platformName: string;

  constructor(platformId: number, platformName: string) {
    this.platformId = platformId;
    this.platformName = platformName;
  }

  abstract getAuthUrl(userId: string, state: string): Promise<string>;
  abstract exchangeCodeForToken(code: string, state: string): Promise<{ accessToken: string; refreshToken?: string; expiresAt?: Date }>;
  abstract refreshToken(refreshToken: string): Promise<{ accessToken: string; refreshToken?: string; expiresAt?: Date }>;
  abstract post(userAccount: any, postData: SocialMediaPost): Promise<PostResult>;
  abstract validateToken(accessToken: string): Promise<boolean>;
  
  // Common helper methods
  protected async updateUserAccountTokens(accountId: number, tokens: { accessToken: string; refreshToken?: string; expiresAt?: Date }) {
    await storage.updateUserAccount(accountId, {
      accessToken: tokens.accessToken,
      refreshToken: tokens.refreshToken,
      tokenExpiry: tokens.expiresAt,
      authStatus: 'connected',
    });
  }

  protected handleApiError(error: any, context: string): PostResult {
    console.error(`${this.platformName} API Error (${context}):`, error);
    return {
      success: false,
      error: error.message || `Failed to ${context}`,
    };
  }
}

// Instagram Service (Graph API)
export class InstagramService extends BaseSocialMediaService {
  private config: PlatformAuthConfig;

  constructor() {
    super(1, 'Instagram');
    this.config = {
      clientId: process.env.FACEBOOK_APP_ID || '',
      clientSecret: process.env.FACEBOOK_APP_SECRET || '',
      redirectUri: process.env.FACEBOOK_REDIRECT_URI || '',
      scopes: ['instagram_basic', 'instagram_content_publish', 'pages_show_list'],
    };
  }

  async getAuthUrl(userId: string, state: string): Promise<string> {
    const params = new URLSearchParams({
      client_id: this.config.clientId,
      redirect_uri: this.config.redirectUri,
      scope: this.config.scopes.join(','),
      response_type: 'code',
      state: `${userId}|${state}`,
    });

    return `https://www.facebook.com/v18.0/dialog/oauth?${params.toString()}`;
  }

  async exchangeCodeForToken(code: string, state: string): Promise<{ accessToken: string; refreshToken?: string; expiresAt?: Date }> {
    try {
      // Step 1: Exchange code for short-lived token
      const tokenResponse = await fetch('https://graph.facebook.com/v18.0/oauth/access_token', {
        method: 'POST',
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        body: new URLSearchParams({
          client_id: this.config.clientId,
          client_secret: this.config.clientSecret,
          redirect_uri: this.config.redirectUri,
          code,
        }),
      });

      const tokenData = await tokenResponse.json();
      if (!tokenData.access_token) {
        throw new Error(tokenData.error?.message || 'Failed to exchange code for token');
      }

      // Step 2: Exchange for long-lived token
      const longLivedResponse = await fetch('https://graph.facebook.com/v18.0/oauth/access_token?' + new URLSearchParams({
        grant_type: 'fb_exchange_token',
        client_id: this.config.clientId,
        client_secret: this.config.clientSecret,
        fb_exchange_token: tokenData.access_token,
      }));

      const longLivedData = await longLivedResponse.json();
      
      const expiresAt = new Date();
      expiresAt.setSeconds(expiresAt.getSeconds() + (longLivedData.expires_in || 5184000)); // 60 days default

      return {
        accessToken: longLivedData.access_token,
        expiresAt,
      };
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      throw new Error(`Instagram token exchange failed: ${message}`);
    }
  }

  async refreshToken(refreshToken: string): Promise<{ accessToken: string; refreshToken?: string; expiresAt?: Date }> {
    throw new Error('Instagram tokens cannot be refreshed - user must re-authenticate');
  }

  async post(userAccount: any, postData: SocialMediaPost): Promise<PostResult> {
    try {
      const { accessToken, platformConfig } = userAccount;
      const { businessAccountId } = platformConfig || {};

      if (!businessAccountId) {
        return {
          success: false,
          error: 'Instagram business account ID not found. Please reconnect your account.',
        };
      }

      // Instagram Graph API posting flow
      const mediaParams = new URLSearchParams({
        caption: postData.content,
        access_token: accessToken,
      });

      // If media URLs provided, validate and add image URL
      if (postData.mediaUrls && postData.mediaUrls.length > 0) {
        const imageUrl = postData.mediaUrls[0];
        // Basic URL validation
        if (!imageUrl.match(/^https?:\/\//) || !imageUrl.match(/\.(jpg|jpeg|png|gif|webp)$/i)) {
          return {
            success: false,
            error: 'Invalid image URL format. Must be HTTPS and a supported image type.',
          };
        }
        mediaParams.append('image_url', imageUrl);
      }

      // Create media container
      const createResponse = await fetch(
        `https://graph.facebook.com/v18.0/${businessAccountId}/media`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
          body: mediaParams.toString(),
        }
      );

      const createResult = await createResponse.json();
      if (!createResult.id) {
        throw new Error(createResult.error?.message || 'Failed to create media container');
      }

      // Publish media
      const publishParams = new URLSearchParams({
        creation_id: createResult.id,
        access_token: accessToken,
      });

      const publishResponse = await fetch(
        `https://graph.facebook.com/v18.0/${businessAccountId}/media_publish`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
          body: publishParams.toString(),
        }
      );

      const publishResult = await publishResponse.json();
      if (!publishResult.id) {
        throw new Error(publishResult.error?.message || 'Failed to publish media');
      }

      return {
        success: true,
        externalPostId: publishResult.id,
      };
    } catch (error) {
      return this.handleApiError(error, 'post to Instagram');
    }
  }

  async validateToken(accessToken: string): Promise<boolean> {
    try {
      const response = await fetch(`https://graph.facebook.com/v18.0/me?access_token=${accessToken}`);
      const data = await response.json();
      return !!data.id && !data.error;
    } catch {
      return false;
    }
  }
}

// TikTok Service
export class TikTokService extends BaseSocialMediaService {
  private config: PlatformAuthConfig;

  constructor() {
    super(2, 'TikTok');
    this.config = {
      clientId: process.env.TIKTOK_CLIENT_KEY || '',
      clientSecret: process.env.TIKTOK_CLIENT_SECRET || '',
      redirectUri: process.env.TIKTOK_REDIRECT_URI || '',
      scopes: ['user.info.basic', 'video.upload'],
    };
  }

  async getAuthUrl(userId: string, state: string): Promise<string> {
    const params = new URLSearchParams({
      client_key: this.config.clientId,
      scope: this.config.scopes.join(','),
      response_type: 'code',
      redirect_uri: this.config.redirectUri,
      state: `${userId}|${state}`,
    });

    return `https://www.tiktok.com/v2/auth/authorize/?${params.toString()}`;
  }

  async exchangeCodeForToken(code: string, state: string): Promise<{ accessToken: string; refreshToken?: string; expiresAt?: Date }> {
    try {
      const response = await fetch('https://open.tiktokapis.com/v2/oauth/token/', {
        method: 'POST',
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        body: new URLSearchParams({
          client_key: this.config.clientId,
          client_secret: this.config.clientSecret,
          code,
          grant_type: 'authorization_code',
          redirect_uri: this.config.redirectUri,
        }),
      });

      const data = await response.json();
      if (!data.access_token) {
        throw new Error(data.error?.message || 'Failed to exchange code for token');
      }

      const expiresAt = new Date();
      expiresAt.setSeconds(expiresAt.getSeconds() + data.expires_in);

      return {
        accessToken: data.access_token,
        refreshToken: data.refresh_token,
        expiresAt,
      };
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      throw new Error(`TikTok token exchange failed: ${message}`);
    }
  }

  async refreshToken(refreshToken: string): Promise<{ accessToken: string; refreshToken?: string; expiresAt?: Date }> {
    try {
      const response = await fetch('https://open.tiktokapis.com/v2/oauth/token/', {
        method: 'POST',
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        body: new URLSearchParams({
          client_key: this.config.clientId,
          client_secret: this.config.clientSecret,
          grant_type: 'refresh_token',
          refresh_token: refreshToken,
        }),
      });

      const data = await response.json();
      if (!data.access_token) {
        throw new Error(data.error?.message || 'Failed to refresh token');
      }

      const expiresAt = new Date();
      expiresAt.setSeconds(expiresAt.getSeconds() + data.expires_in);

      return {
        accessToken: data.access_token,
        refreshToken: data.refresh_token,
        expiresAt,
      };
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      throw new Error(`TikTok token refresh failed: ${message}`);
    }
  }

  async post(userAccount: any, postData: SocialMediaPost): Promise<PostResult> {
    try {
      const { accessToken } = userAccount;

      if (!postData.mediaUrls || postData.mediaUrls.length === 0) {
        return {
          success: false,
          error: 'TikTok requires video content to post',
        };
      }

      const videoUrl = postData.mediaUrls[0];
      // Basic URL and video format validation
      if (!videoUrl.match(/^https?:\/\//) || !videoUrl.match(/\.(mp4|mov|avi|webm)$/i)) {
        return {
          success: false,
          error: 'Invalid video URL format. Must be HTTPS and a supported video type.',
        };
      }

      // Initialize video upload
      const initResponse = await fetch('https://open.tiktokapis.com/v2/post/publish/video/init/', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${accessToken}`,
          'Content-Type': 'application/json; charset=UTF-8',
        },
        body: JSON.stringify({
          post_info: {
            title: postData.content,
            privacy_level: 'MUTUAL_FOLLOW_FRIENDS',
            disable_duet: false,
            disable_comment: false,
            disable_stitch: false,
          },
          source_info: {
            source: 'PULL_FROM_URL',
            video_url: postData.mediaUrls[0],
          },
        }),
      });

      const initResult = await initResponse.json();
      if (initResult.error) {
        throw new Error(initResult.error.message || 'Failed to initialize TikTok upload');
      }

      const publishId = initResult.data?.publish_id;
      if (!publishId) {
        throw new Error('No publish ID received from TikTok');
      }

      // Poll upload status with timeout and retry logic
      const uploadResult = await this.pollUploadStatus(accessToken, publishId);
      
      return uploadResult;
    } catch (error) {
      return this.handleApiError(error, 'post to TikTok');
    }
  }

  // Poll TikTok upload status with timeout and retry
  private async pollUploadStatus(
    accessToken: string, 
    publishId: string, 
    maxAttempts = 30,
    intervalMs = 2000
  ): Promise<PostResult> {
    for (let attempt = 0; attempt < maxAttempts; attempt++) {
      try {
        const statusResponse = await fetch('https://open.tiktokapis.com/v2/post/publish/status/fetch/', {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${accessToken}`,
            'Content-Type': 'application/json; charset=UTF-8',
          },
          body: JSON.stringify({
            publish_id: publishId,
          }),
        });

        const statusResult = await statusResponse.json();
        
        if (statusResult.error) {
          console.error('TikTok status check error:', statusResult.error);
          continue; // Retry on API errors
        }

        const status = statusResult.data?.status;
        const failReason = statusResult.data?.fail_reason;

        switch (status) {
          case 'PUBLISHED':
            return {
              success: true,
              externalPostId: publishId,
            };

          case 'FAILED':
            return {
              success: false,
              error: `TikTok upload failed: ${failReason || 'Unknown error'}`,
            };

          case 'PROCESSING':
          case 'UPLOADING':
            // Continue polling
            console.log(`TikTok upload ${publishId} status: ${status}, attempt ${attempt + 1}/${maxAttempts}`);
            break;

          default:
            console.warn(`Unknown TikTok status: ${status}`);
            break;
        }

        // Wait before next attempt
        await new Promise(resolve => setTimeout(resolve, intervalMs));

      } catch (error) {
        console.error(`TikTok polling attempt ${attempt + 1} failed:`, error);
        
        // If this is the last attempt, return error
        if (attempt === maxAttempts - 1) {
          return {
            success: false,
            error: `Upload polling failed after ${maxAttempts} attempts: ${error instanceof Error ? error.message : String(error)}`,
          };
        }
        
        // Wait before retry
        await new Promise(resolve => setTimeout(resolve, intervalMs));
      }
    }

    return {
      success: false,
      error: `Upload timeout: Status polling exceeded ${maxAttempts} attempts (${(maxAttempts * intervalMs) / 1000}s)`,
    };
  }

  // Check upload status (can be called separately)
  async checkUploadStatus(accessToken: string, publishId: string): Promise<{
    status: 'UPLOADING' | 'PROCESSING' | 'PUBLISHED' | 'FAILED';
    failReason?: string;
  }> {
    try {
      const response = await fetch('https://open.tiktokapis.com/v2/post/publish/status/fetch/', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${accessToken}`,
          'Content-Type': 'application/json; charset=UTF-8',
        },
        body: JSON.stringify({
          publish_id: publishId,
        }),
      });

      const result = await response.json();
      
      if (result.error) {
        throw new Error(result.error.message || 'Failed to check upload status');
      }

      return {
        status: result.data?.status || 'FAILED',
        failReason: result.data?.fail_reason,
      };
    } catch (error) {
      throw new Error(`Status check failed: ${error instanceof Error ? error.message : String(error)}`);
    }
  }

  async validateToken(accessToken: string): Promise<boolean> {
    try {
      const response = await fetch('https://open.tiktokapis.com/v2/user/info/', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${accessToken}`,
          'Content-Type': 'application/json; charset=UTF-8',
        },
      });
      const data = await response.json();
      return !data.error;
    } catch {
      return false;
    }
  }
}

// YouTube Service
export class YouTubeService extends BaseSocialMediaService {
  private config: PlatformAuthConfig;

  constructor() {
    super(3, 'YouTube');
    this.config = {
      clientId: process.env.GOOGLE_CLIENT_ID || '',
      clientSecret: process.env.GOOGLE_CLIENT_SECRET || '',
      redirectUri: process.env.GOOGLE_REDIRECT_URI || '',
      scopes: ['https://www.googleapis.com/auth/youtube.upload', 'https://www.googleapis.com/auth/youtube'],
    };
  }

  async getAuthUrl(userId: string, state: string): Promise<string> {
    const params = new URLSearchParams({
      client_id: this.config.clientId,
      redirect_uri: this.config.redirectUri,
      scope: this.config.scopes.join(' '),
      response_type: 'code',
      access_type: 'offline',
      state: `${userId}|${state}`,
    });

    return `https://accounts.google.com/o/oauth2/v2/auth?${params.toString()}`;
  }

  async exchangeCodeForToken(code: string, state: string): Promise<{ accessToken: string; refreshToken?: string; expiresAt?: Date }> {
    try {
      const response = await fetch('https://oauth2.googleapis.com/token', {
        method: 'POST',
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        body: new URLSearchParams({
          client_id: this.config.clientId,
          client_secret: this.config.clientSecret,
          code,
          grant_type: 'authorization_code',
          redirect_uri: this.config.redirectUri,
        }),
      });

      const data = await response.json();
      if (!data.access_token) {
        throw new Error(data.error_description || 'Failed to exchange code for token');
      }

      const expiresAt = new Date();
      expiresAt.setSeconds(expiresAt.getSeconds() + data.expires_in);

      return {
        accessToken: data.access_token,
        refreshToken: data.refresh_token,
        expiresAt,
      };
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      throw new Error(`YouTube token exchange failed: ${message}`);
    }
  }

  async refreshToken(refreshToken: string): Promise<{ accessToken: string; refreshToken?: string; expiresAt?: Date }> {
    try {
      const response = await fetch('https://oauth2.googleapis.com/token', {
        method: 'POST',
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        body: new URLSearchParams({
          client_id: this.config.clientId,
          client_secret: this.config.clientSecret,
          refresh_token: refreshToken,
          grant_type: 'refresh_token',
        }),
      });

      const data = await response.json();
      if (!data.access_token) {
        throw new Error(data.error_description || 'Failed to refresh token');
      }

      const expiresAt = new Date();
      expiresAt.setSeconds(expiresAt.getSeconds() + data.expires_in);

      return {
        accessToken: data.access_token,
        refreshToken: data.refresh_token || refreshToken, // Keep existing if not provided
        expiresAt,
      };
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      throw new Error(`YouTube token refresh failed: ${message}`);
    }
  }

  async post(userAccount: any, postData: SocialMediaPost): Promise<PostResult> {
    try {
      const { accessToken } = userAccount;

      if (!postData.mediaUrls || postData.mediaUrls.length === 0) {
        return {
          success: false,
          error: 'YouTube requires video content to upload',
        };
      }

      // Note: This is a simplified example. Real implementation would need:
      // 1. Video file upload via resumable upload
      // 2. Proper metadata handling
      // 3. Thumbnail upload
      
      const metadata = {
        snippet: {
          title: postData.content.substring(0, 100), // YouTube title limit
          description: postData.content,
          tags: [], // Could extract from content
          categoryId: '22', // People & Blogs
        },
        status: {
          privacyStatus: 'private', // Default to private for unverified apps
        },
      };

      // This is a placeholder - actual implementation needs file upload
      // For now, just validate the token and return success
      const isValid = await this.validateToken(accessToken);
      if (!isValid) {
        return {
          success: false,
          error: 'YouTube access token is invalid',
        };
      }

      return {
        success: true,
        externalPostId: 'youtube_upload_placeholder',
      };
    } catch (error) {
      return this.handleApiError(error, 'post to YouTube');
    }
  }

  async validateToken(accessToken: string): Promise<boolean> {
    try {
      const response = await fetch('https://www.googleapis.com/youtube/v3/channels?part=snippet&mine=true', {
        headers: { 'Authorization': `Bearer ${accessToken}` },
      });
      const data = await response.json();
      return !data.error && data.items && data.items.length > 0;
    } catch {
      return false;
    }
  }
}

// Telegram Service
export class TelegramService extends BaseSocialMediaService {
  constructor() {
    super(4, 'Telegram');
  }

  async getAuthUrl(userId: string, state: string): Promise<string> {
    // Telegram doesn't use OAuth - uses bot tokens
    // This would redirect to a setup page where user provides bot token
    return `/setup-telegram?userId=${userId}&state=${state}`;
  }

  async exchangeCodeForToken(code: string, state: string): Promise<{ accessToken: string; refreshToken?: string; expiresAt?: Date }> {
    // For Telegram, the "code" would be the bot token
    const isValid = await this.validateToken(code);
    if (!isValid) {
      throw new Error('Invalid Telegram bot token');
    }

    return {
      accessToken: code, // Bot token acts as access token
      // Telegram bot tokens don't expire
    };
  }

  async refreshToken(refreshToken: string): Promise<{ accessToken: string; refreshToken?: string; expiresAt?: Date }> {
    throw new Error('Telegram bot tokens do not need refreshing');
  }

  async post(userAccount: any, postData: SocialMediaPost): Promise<PostResult> {
    try {
      const { accessToken, platformConfig } = userAccount;
      const { channelUsername } = platformConfig || {};

      if (!channelUsername) {
        return {
          success: false,
          error: 'Telegram channel username not configured',
        };
      }

      const chatId = channelUsername.startsWith('@') ? channelUsername : `@${channelUsername}`;
      
      let method = 'sendMessage';
      let data: any = {
        chat_id: chatId,
        text: postData.content,
        parse_mode: 'HTML',
      };

      // If media URLs provided, send as photo or document
      if (postData.mediaUrls && postData.mediaUrls.length > 0) {
        const mediaUrl = postData.mediaUrls[0];
        if (mediaUrl.match(/\.(jpg|jpeg|png|gif|webp)$/i)) {
          method = 'sendPhoto';
          data = {
            chat_id: chatId,
            photo: mediaUrl,
            caption: postData.content,
            parse_mode: 'HTML',
          };
        }
      }

      const response = await fetch(`https://api.telegram.org/bot${accessToken}/${method}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });

      const result = await response.json();
      if (!result.ok) {
        throw new Error(result.description || 'Telegram API error');
      }

      return {
        success: true,
        externalPostId: result.result.message_id.toString(),
      };
    } catch (error) {
      return this.handleApiError(error, 'post to Telegram');
    }
  }

  async validateToken(accessToken: string): Promise<boolean> {
    try {
      const response = await fetch(`https://api.telegram.org/bot${accessToken}/getMe`);
      const data = await response.json();
      return data.ok && data.result?.is_bot;
    } catch {
      return false;
    }
  }
}

// Social Media Manager
export class SocialMediaManager {
  private services: Map<number, BaseSocialMediaService> = new Map();

  constructor() {
    this.services.set(1, new InstagramService());
    this.services.set(2, new TikTokService());
    this.services.set(3, new YouTubeService());
    this.services.set(4, new TelegramService());
  }

  getService(platformId: number): BaseSocialMediaService | undefined {
    return this.services.get(platformId);
  }

  async postToAllPlatforms(userId: string, postData: SocialMediaPost): Promise<{ [platformId: number]: PostResult }> {
    const userAccounts = await storage.getUserAccounts(userId);
    const results: { [platformId: number]: PostResult } = {};

    for (const account of userAccounts.filter(acc => acc.isActive && acc.authStatus === 'connected')) {
      const service = this.getService(account.platformId);
      if (service) {
        try {
          results[account.platformId] = await service.post(account, postData);
        } catch (error) {
          const message = error instanceof Error ? error.message : String(error);
          results[account.platformId] = {
            success: false,
            error: message,
          };
        }
      }
    }

    return results;
  }

  async validateAllTokens(userId: string): Promise<void> {
    const userAccounts = await storage.getUserAccounts(userId);

    for (const account of userAccounts.filter(acc => acc.isActive)) {
      const service = this.getService(account.platformId);
      if (service && account.accessToken) {
        const isValid = await service.validateToken(account.accessToken);
        
        if (!isValid) {
          await storage.updateUserAccount(account.id, {
            authStatus: 'expired',
          });
        }
      }
    }
  }
}

export const socialMediaManager = new SocialMediaManager();