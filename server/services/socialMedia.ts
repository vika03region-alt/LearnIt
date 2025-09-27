interface PlatformAPI {
  post(content: string, mediaUrls?: string[]): Promise<{ id: string; url: string }>;
  getAnalytics(postId: string): Promise<any>;
  validateToken(): Promise<boolean>;
}

class InstagramAPI implements PlatformAPI {
  constructor(private accessToken: string) {}

  async post(content: string, mediaUrls?: string[]): Promise<{ id: string; url: string }> {
    // Instagram Graph API implementation
    const endpoint = 'https://graph.instagram.com/v18.0/me/media';
    
    try {
      const response = await fetch(endpoint, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${this.accessToken}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          caption: content,
          image_url: mediaUrls?.[0],
        }),
      });

      if (!response.ok) {
        throw new Error(`Instagram API error: ${response.statusText}`);
      }

      const data = await response.json();
      return { id: data.id, url: `https://instagram.com/p/${data.id}` };
    } catch (error) {
      throw new Error(`Failed to post to Instagram: ${error.message}`);
    }
  }

  async getAnalytics(postId: string): Promise<any> {
    const endpoint = `https://graph.instagram.com/v18.0/${postId}/insights`;
    
    try {
      const response = await fetch(`${endpoint}?metric=likes,comments,shares,reach&access_token=${this.accessToken}`);
      
      if (!response.ok) {
        throw new Error(`Instagram Analytics API error: ${response.statusText}`);
      }

      return await response.json();
    } catch (error) {
      throw new Error(`Failed to get Instagram analytics: ${error.message}`);
    }
  }

  async validateToken(): Promise<boolean> {
    try {
      const response = await fetch(`https://graph.instagram.com/v18.0/me?access_token=${this.accessToken}`);
      return response.ok;
    } catch {
      return false;
    }
  }
}

class TikTokAPI implements PlatformAPI {
  constructor(private accessToken: string) {}

  async post(content: string, mediaUrls?: string[]): Promise<{ id: string; url: string }> {
    // TikTok API implementation
    const endpoint = 'https://open-api.tiktok.com/share/video/upload/';
    
    try {
      const response = await fetch(endpoint, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${this.accessToken}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          video_url: mediaUrls?.[0],
          text: content,
        }),
      });

      if (!response.ok) {
        throw new Error(`TikTok API error: ${response.statusText}`);
      }

      const data = await response.json();
      return { id: data.share_id, url: data.share_url };
    } catch (error) {
      throw new Error(`Failed to post to TikTok: ${error.message}`);
    }
  }

  async getAnalytics(postId: string): Promise<any> {
    const endpoint = `https://open-api.tiktok.com/video/data/?video_id=${postId}`;
    
    try {
      const response = await fetch(`${endpoint}&access_token=${this.accessToken}`);
      
      if (!response.ok) {
        throw new Error(`TikTok Analytics API error: ${response.statusText}`);
      }

      return await response.json();
    } catch (error) {
      throw new Error(`Failed to get TikTok analytics: ${error.message}`);
    }
  }

  async validateToken(): Promise<boolean> {
    try {
      const response = await fetch(`https://open-api.tiktok.com/oauth/userinfo/?access_token=${this.accessToken}`);
      return response.ok;
    } catch {
      return false;
    }
  }
}

class YouTubeAPI implements PlatformAPI {
  constructor(private accessToken: string) {}

  async post(content: string, mediaUrls?: string[]): Promise<{ id: string; url: string }> {
    // YouTube Data API implementation
    const endpoint = 'https://www.googleapis.com/upload/youtube/v3/videos';
    
    try {
      const response = await fetch(`${endpoint}?part=snippet&access_token=${this.accessToken}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          snippet: {
            title: content.split('\n')[0] || 'Trading Update',
            description: content,
            tags: ['trading', 'forex', 'crypto'],
          },
        }),
      });

      if (!response.ok) {
        throw new Error(`YouTube API error: ${response.statusText}`);
      }

      const data = await response.json();
      return { id: data.id, url: `https://youtube.com/watch?v=${data.id}` };
    } catch (error) {
      throw new Error(`Failed to post to YouTube: ${error.message}`);
    }
  }

  async getAnalytics(postId: string): Promise<any> {
    const endpoint = 'https://www.googleapis.com/youtube/analytics/v1/reports';
    
    try {
      const response = await fetch(`${endpoint}?ids=channel==MINE&metrics=views,likes,comments&filters=video==${postId}&access_token=${this.accessToken}`);
      
      if (!response.ok) {
        throw new Error(`YouTube Analytics API error: ${response.statusText}`);
      }

      return await response.json();
    } catch (error) {
      throw new Error(`Failed to get YouTube analytics: ${error.message}`);
    }
  }

  async validateToken(): Promise<boolean> {
    try {
      const response = await fetch(`https://www.googleapis.com/youtube/v3/channels?part=id&mine=true&access_token=${this.accessToken}`);
      return response.ok;
    } catch {
      return false;
    }
  }
}

class TelegramAPI implements PlatformAPI {
  constructor(private botToken: string, private chatId: string) {}

  async post(content: string, mediaUrls?: string[]): Promise<{ id: string; url: string }> {
    const endpoint = `https://api.telegram.org/bot${this.botToken}/sendMessage`;
    
    try {
      const response = await fetch(endpoint, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          chat_id: this.chatId,
          text: content,
          parse_mode: 'Markdown',
        }),
      });

      if (!response.ok) {
        throw new Error(`Telegram API error: ${response.statusText}`);
      }

      const data = await response.json();
      return { 
        id: data.result.message_id.toString(), 
        url: `https://t.me/${this.chatId}/${data.result.message_id}` 
      };
    } catch (error) {
      throw new Error(`Failed to post to Telegram: ${error.message}`);
    }
  }

  async getAnalytics(postId: string): Promise<any> {
    // Telegram doesn't provide detailed analytics through bot API
    // This would need to be implemented with Telegram Analytics API if available
    return {
      views: 0,
      reactions: 0,
    };
  }

  async validateToken(): Promise<boolean> {
    try {
      const response = await fetch(`https://api.telegram.org/bot${this.botToken}/getMe`);
      return response.ok;
    } catch {
      return false;
    }
  }
}

class SocialMediaService {
  private apis: Map<string, PlatformAPI> = new Map();

  setAPI(platform: string, api: PlatformAPI) {
    this.apis.set(platform, api);
  }

  async postContent(platform: string, content: string, mediaUrls?: string[]): Promise<{ id: string; url: string }> {
    const api = this.apis.get(platform);
    if (!api) {
      throw new Error(`No API configured for platform: ${platform}`);
    }

    return await api.post(content, mediaUrls);
  }

  async getAnalytics(platform: string, postId: string): Promise<any> {
    const api = this.apis.get(platform);
    if (!api) {
      throw new Error(`No API configured for platform: ${platform}`);
    }

    return await api.getAnalytics(postId);
  }

  async validateAllTokens(): Promise<{ [platform: string]: boolean }> {
    const results: { [platform: string]: boolean } = {};
    
    for (const [platform, api] of this.apis) {
      try {
        results[platform] = await api.validateToken();
      } catch {
        results[platform] = false;
      }
    }

    return results;
  }

  initializeAPIs(userAccounts: any[]) {
    for (const account of userAccounts) {
      if (!account.accessToken) continue;

      switch (account.platformId) {
        case 1: // Instagram
          this.setAPI('instagram', new InstagramAPI(account.accessToken));
          break;
        case 2: // TikTok
          this.setAPI('tiktok', new TikTokAPI(account.accessToken));
          break;
        case 3: // YouTube
          this.setAPI('youtube', new YouTubeAPI(account.accessToken));
          break;
        case 4: // Telegram
          this.setAPI('telegram', new TelegramAPI(account.accessToken, account.accountHandle));
          break;
      }
    }
  }
}

export const socialMediaService = new SocialMediaService();
