
import { storage } from "../storage";

interface InstagramProfile {
  id: string;
  username: string;
  account_type: 'PERSONAL' | 'BUSINESS' | 'CREATOR';
  media_count: number;
  followers_count: number;
  follows_count: number;
}

interface InstagramMedia {
  id: string;
  media_type: 'IMAGE' | 'VIDEO' | 'CAROUSEL_ALBUM';
  media_url: string;
  caption: string;
  permalink: string;
  timestamp: string;
  like_count?: number;
  comments_count?: number;
}

export class InstagramService {
  private readonly baseUrl = 'https://graph.instagram.com';

  async getProfile(accessToken: string): Promise<InstagramProfile> {
    const response = await fetch(
      `${this.baseUrl}/me?fields=id,username,account_type,media_count,followers_count,follows_count&access_token=${accessToken}`
    );

    if (!response.ok) {
      throw new Error(`Instagram API error: ${response.statusText}`);
    }

    return await response.json();
  }

  async getMedia(accessToken: string, limit = 25): Promise<InstagramMedia[]> {
    const response = await fetch(
      `${this.baseUrl}/me/media?fields=id,media_type,media_url,caption,permalink,timestamp,like_count,comments_count&limit=${limit}&access_token=${accessToken}`
    );

    if (!response.ok) {
      throw new Error(`Instagram API error: ${response.statusText}`);
    }

    const data = await response.json();
    return data.data || [];
  }

  async publishPost(accessToken: string, imageUrl: string, caption: string): Promise<string> {
    // Шаг 1: Создаем медиа объект
    const createResponse = await fetch(`${this.baseUrl}/me/media`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        image_url: imageUrl,
        caption: caption,
        access_token: accessToken
      })
    });

    if (!createResponse.ok) {
      throw new Error(`Ошибка создания медиа: ${createResponse.statusText}`);
    }

    const createData = await createResponse.json();
    const creationId = createData.id;

    // Шаг 2: Публикуем медиа
    const publishResponse = await fetch(`${this.baseUrl}/me/media_publish`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        creation_id: creationId,
        access_token: accessToken
      })
    });

    if (!publishResponse.ok) {
      throw new Error(`Ошибка публикации: ${publishResponse.statusText}`);
    }

    const publishData = await publishResponse.json();
    return publishData.id;
  }

  async getInsights(accessToken: string, mediaId: string): Promise<any> {
    const response = await fetch(
      `${this.baseUrl}/${mediaId}/insights?metric=engagement,impressions,reach,saved&access_token=${accessToken}`
    );

    if (!response.ok) {
      throw new Error(`Instagram Insights API error: ${response.statusText}`);
    }

    return await response.json();
  }

  async validateToken(accessToken: string): Promise<boolean> {
    try {
      const response = await fetch(`${this.baseUrl}/me?access_token=${accessToken}`);
      return response.ok;
    } catch {
      return false;
    }
  }

  async refreshLongLivedToken(accessToken: string): Promise<string> {
    const response = await fetch(
      `${this.baseUrl}/refresh_access_token?grant_type=ig_refresh_token&access_token=${accessToken}`,
      { method: 'GET' }
    );

    if (!response.ok) {
      throw new Error(`Token refresh error: ${response.statusText}`);
    }

    const data = await response.json();
    return data.access_token;
  }
}

export const instagramService = new InstagramService();
