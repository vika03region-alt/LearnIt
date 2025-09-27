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

  // Get Instagram Business Account ID automatically
  async getInstagramBusinessAccountId(accessToken: string): Promise<string | null> {
    try {
      // Step 1: Get Facebook pages associated with the access token
      const pagesResponse = await fetch(
        `https://graph.facebook.com/v18.0/me/accounts?access_token=${accessToken}`
      );
      
      const pagesData = await pagesResponse.json();
      if (pagesData.error || !pagesData.data) {
        console.warn('Could not retrieve Facebook pages:', pagesData.error?.message);
        return null;
      }
      
      // Step 2: Check each page for connected Instagram Business Account
      for (const page of pagesData.data) {
        try {
          const instagramResponse = await fetch(
            `https://graph.facebook.com/v18.0/${page.id}?fields=instagram_business_account&access_token=${page.access_token}`
          );
          
          const instagramData = await instagramResponse.json();
          
          if (instagramData.instagram_business_account?.id) {
            console.log(`Found Instagram Business Account ID: ${instagramData.instagram_business_account.id}`);
            return instagramData.instagram_business_account.id;
          }
        } catch (error) {
          // Continue checking other pages if one fails
          console.warn(`Failed to check Instagram account for page ${page.id}:`, error);
          continue;
        }
      }
      
      console.warn('No Instagram Business Account found. User may need to connect Instagram to their Facebook page.');
      return null;
    } catch (error) {
      console.error('Error getting Instagram Business Account ID:', error);
      return null;
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

      const videoUrl = postData.mediaUrls[0];
      // Basic URL and video format validation
      if (!videoUrl.match(/^https?:\/\//)) {
        return {
          success: false,
          error: 'Invalid video URL format. Must be HTTPS.',
        };
      }

      // YouTube metadata
      const metadata = {
        snippet: {
          title: postData.content.substring(0, 100), // YouTube title limit
          description: postData.content,
          tags: this.extractTags(postData.content),
          categoryId: '22', // People & Blogs
        },
        status: {
          privacyStatus: 'private', // Default to private for unverified apps
          selfDeclaredMadeForKids: false,
        },
      };

      // Validate video URL for security
      const validation = await this.validateVideoUrl(videoUrl);
      if (!validation.isValid) {
        return {
          success: false,
          error: 'Invalid or unsafe video URL. Must be HTTPS and not internal/private IP.',
        };
      }
      
      // Perform safe resumable upload
      const uploadResult = await this.performResumableUpload(
        accessToken, 
        metadata, 
        videoUrl, 
        validation.contentLength
      );
      
      return uploadResult;
    } catch (error) {
      return this.handleApiError(error, 'post to YouTube');
    }
  }

  // Security-focused URL validation
  private async validateVideoUrl(videoUrl: string): Promise<{ isValid: boolean; contentType?: string; contentLength?: number }> {
    try {
      const url = new URL(videoUrl);
      
      // Only allow HTTPS
      if (url.protocol !== 'https:') {
        return { isValid: false };
      }
      
      // Block private/internal IPs for SSRF protection
      const privateIpRanges = [
        /^127\./,           // 127.0.0.0/8
        /^10\./,            // 10.0.0.0/8  
        /^172\.(1[6-9]|2[0-9]|3[0-1])\./,  // 172.16.0.0/12
        /^192\.168\./,      // 192.168.0.0/16
        /^169\.254\./,      // 169.254.0.0/16 (link-local)
        /^::1$/,            // IPv6 localhost
        /^fe80:/,           // IPv6 link-local
      ];
      
      const hostname = url.hostname;
      if (privateIpRanges.some(range => range.test(hostname))) {
        return { isValid: false };
      }
      
      // HEAD request to check content type and size
      const response = await fetch(videoUrl, { method: 'HEAD' });
      if (!response.ok) {
        return { isValid: false };
      }
      
      const contentType = response.headers.get('content-type') || '';
      const contentLength = parseInt(response.headers.get('content-length') || '0');
      
      // Validate content type
      if (!contentType.startsWith('video/')) {
        return { isValid: false };
      }
      
      // Validate file size (max 2GB)
      const maxSize = 2 * 1024 * 1024 * 1024; // 2GB
      if (contentLength > maxSize) {
        return { isValid: false };
      }
      
      return { 
        isValid: true, 
        contentType,
        contentLength: contentLength || undefined
      };
    } catch (error) {
      return { isValid: false };
    }
  }

  // Safe streaming resumable upload implementation
  private async performResumableUpload(
    accessToken: string,
    metadata: any,
    videoUrl: string,
    contentLength?: number
  ): Promise<PostResult> {
    try {
      // Step 1: Initialize resumable upload session
      const uploadUrl = await this.initializeResumableUpload(accessToken, metadata, contentLength);
      
      // Step 2: Stream video data in chunks
      const videoId = await this.streamVideoUpload(uploadUrl, videoUrl, accessToken);
      
      return {
        success: true,
        externalPostId: videoId,
      };
    } catch (error) {
      throw new Error(`Resumable upload failed: ${error instanceof Error ? error.message : String(error)}`);
    }
  }

  // Initialize resumable upload session
  private async initializeResumableUpload(
    accessToken: string,
    metadata: any,
    fileSize?: number
  ): Promise<string> {
    const headers: Record<string, string> = {
      'Authorization': `Bearer ${accessToken}`,
      'Content-Type': 'application/json; charset=UTF-8',
      'X-Upload-Content-Type': 'video/*',
    };
    
    if (fileSize) {
      headers['X-Upload-Content-Length'] = fileSize.toString();
    }

    const response = await fetch('https://www.googleapis.com/upload/youtube/v3/videos?uploadType=resumable&part=snippet,status', {
      method: 'POST',
      headers,
      body: JSON.stringify(metadata),
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(`Upload initialization failed: ${response.status} ${errorData.error?.message || response.statusText}`);
    }

    const uploadUrl = response.headers.get('location');
    if (!uploadUrl) {
      throw new Error('No upload URL received from YouTube');
    }

    return uploadUrl;
  }

  // Safe streaming video upload with retry logic
  private async streamVideoUpload(
    uploadUrl: string,
    videoUrl: string,
    accessToken: string,
    chunkSize = 8 * 1024 * 1024 // 8MB chunks - safe default
  ): Promise<string> {
    const maxRetries = 3;
    
    for (let attempt = 0; attempt < maxRetries; attempt++) {
      try {
        return await this.performStreamingUpload(uploadUrl, videoUrl, chunkSize);
      } catch (error) {
        console.error(`Upload attempt ${attempt + 1} failed:`, error);
        
        if (attempt === maxRetries - 1) {
          throw error;
        }
        
        // Check if token expired (401) and refresh if needed
        if (error instanceof Error && error.message.includes('401')) {
          // Token refresh would need to be handled at higher level
          throw new Error('YouTube access token expired. Please re-authenticate.');
        }
        
        // Wait before retry with exponential backoff
        const backoffMs = Math.min(1000 * Math.pow(2, attempt), 10000);
        await new Promise(resolve => setTimeout(resolve, backoffMs));
      }
    }
    
    throw new Error('Upload failed after all retry attempts');
  }

  // Perform the actual streaming upload
  private async performStreamingUpload(
    uploadUrl: string,
    videoUrl: string,
    chunkSize: number
  ): Promise<string> {
    const response = await fetch(videoUrl);
    if (!response.ok) {
      throw new Error(`Failed to fetch video: ${response.status} ${response.statusText}`);
    }
    
    const totalSize = parseInt(response.headers.get('content-length') || '0');
    const reader = response.body?.getReader();
    
    if (!reader) {
      throw new Error('Unable to read video stream');
    }
    
    let uploadedBytes = 0;
    let buffer = new Uint8Array(0);
    
    console.log(`Starting YouTube streaming upload: ${totalSize} bytes`);
    
    try {
      while (true) {
        const { done, value } = await reader.read();
        
        if (value) {
          // Append new data to buffer
          const newBuffer = new Uint8Array(buffer.length + value.length);
          newBuffer.set(buffer);
          newBuffer.set(value, buffer.length);
          buffer = newBuffer;
        }
        
        // Upload chunks when buffer is full or stream is done
        while (buffer.length >= chunkSize || (done && buffer.length > 0)) {
          const chunkData = buffer.slice(0, Math.min(chunkSize, buffer.length));
          buffer = buffer.slice(chunkData.length);
          
          const chunkStart = uploadedBytes;
          const chunkEnd = uploadedBytes + chunkData.length - 1;
          
          console.log(`Uploading chunk: ${chunkStart}-${chunkEnd}/${totalSize} (${Math.round((chunkEnd + 1) / totalSize * 100)}%)`);
          
          const chunkResponse = await fetch(uploadUrl, {
            method: 'PUT',
            headers: {
              'Content-Range': totalSize > 0 
                ? `bytes ${chunkStart}-${chunkEnd}/${totalSize}`
                : `bytes ${chunkStart}-${chunkEnd}/*`,
              'Content-Length': chunkData.length.toString(),
              'Content-Type': 'video/mp4', // Default, could be more specific
            },
            body: chunkData,
          });
          
          if (chunkResponse.status === 308) {
            // Resume incomplete - continue with next chunk
            uploadedBytes = chunkEnd + 1;
          } else if (chunkResponse.status === 200 || chunkResponse.status === 201) {
            // Upload complete
            const result = await chunkResponse.json();
            console.log('YouTube streaming upload completed successfully');
            return result.id;
          } else {
            // Error occurred
            const errorData = await chunkResponse.json().catch(() => ({}));
            throw new Error(`Upload failed at chunk ${chunkStart}-${chunkEnd}: ${chunkResponse.status} ${errorData.error?.message || chunkResponse.statusText}`);
          }
        }
        
        if (done && buffer.length === 0) {
          break;
        }
      }
    } finally {
      reader.releaseLock();
    }
    
    throw new Error('Upload stream completed but no video ID received');
  }

  // Legacy method kept for backward compatibility (now unused)
  private async uploadVideoChunks(
    uploadUrl: string,
    videoData: Buffer,
    chunkSize = 8 * 1024 * 1024 // 8MB chunks
  ): Promise<string> {
    const totalSize = videoData.length;
    let uploadedBytes = 0;

    console.log(`Starting YouTube upload: ${totalSize} bytes in ${Math.ceil(totalSize / chunkSize)} chunks`);

    while (uploadedBytes < totalSize) {
      const chunkStart = uploadedBytes;
      const chunkEnd = Math.min(uploadedBytes + chunkSize - 1, totalSize - 1);
      const chunk = videoData.subarray(chunkStart, chunkEnd + 1);

      console.log(`Uploading chunk: ${chunkStart}-${chunkEnd}/${totalSize} (${Math.round((chunkEnd + 1) / totalSize * 100)}%)`);

      const response = await fetch(uploadUrl, {
        method: 'PUT',
        headers: {
          'Content-Range': `bytes ${chunkStart}-${chunkEnd}/${totalSize}`,
          'Content-Length': chunk.length.toString(),
        },
        body: chunk,
      });

      if (response.status === 308) {
        // Resume incomplete - check range header for next chunk
        const rangeHeader = response.headers.get('range');
        if (rangeHeader) {
          const match = rangeHeader.match(/bytes=0-(\d+)/);
          if (match) {
            uploadedBytes = parseInt(match[1]) + 1;
            continue;
          }
        }
        uploadedBytes = chunkEnd + 1;
      } else if (response.status === 200 || response.status === 201) {
        // Upload complete
        const result = await response.json();
        console.log('YouTube upload completed successfully');
        return result.id;
      } else {
        // Error occurred
        const errorData = await response.json().catch(() => ({}));
        throw new Error(`Upload failed at chunk ${chunkStart}-${chunkEnd}: ${response.status} ${errorData.error?.message || response.statusText}`);
      }
    }

    throw new Error('Upload completed but no video ID received');
  }

  // Extract tags from content
  private extractTags(content: string): string[] {
    const hashtagRegex = /#(\w+)/g;
    const tags: string[] = [];
    let match;

    while ((match = hashtagRegex.exec(content)) !== null) {
      tags.push(match[1]);
    }

    return tags.slice(0, 10); // YouTube allows max 10 tags
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