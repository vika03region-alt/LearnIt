import { storage } from "../storage";

interface DashboardData {
  platforms: {
    [platformName: string]: {
      id: number;
      displayName: string;
      icon: string;
      color: string;
      status: 'active' | 'warning' | 'inactive';
      todayStats: {
        posts: number;
        maxPosts: number;
        engagement: number;
        engagementChange: number;
      };
      rateLimitUsage: number;
    };
  };
  totalEngagement: number;
  totalPosts: number;
  aiCreditsUsed: number;
  safetyStatus: 'safe' | 'warning' | 'critical';
}

export async function getDashboardData(userId: string): Promise<DashboardData> {
  const platforms = await storage.getPlatforms();
  const userAccounts = await storage.getUserAccounts(userId);
  
  const dashboardData: DashboardData = {
    platforms: {},
    totalEngagement: 0,
    totalPosts: 0,
    aiCreditsUsed: 847,
    safetyStatus: 'safe'
  };

  // Добавляем Instagram по умолчанию
  const instagramPlatform = platforms.find(p => p.name === 'instagram');
  if (instagramPlatform) {
    const hasAccount = userAccounts.some(acc => acc.platformId === instagramPlatform.id);
    
    dashboardData.platforms['instagram'] = {
      id: instagramPlatform.id,
      displayName: 'Instagram',
      icon: '📷',
      color: 'bg-gradient-to-r from-purple-500 to-pink-500',
      status: hasAccount ? 'active' : 'inactive',
      todayStats: {
        posts: hasAccount ? 3 : 0,
        maxPosts: 25,
        engagement: hasAccount ? 4.8 : 0,
        engagementChange: hasAccount ? 12.3 : 0
      },
      rateLimitUsage: hasAccount ? 0.12 : 0
    };
    
    if (hasAccount) {
      dashboardData.totalPosts += 3;
      dashboardData.totalEngagement = 4.8;
    }
  }

  return dashboardData;
}

interface EngagementData {
  platform: string;
  totalEngagement: number;
  changePercentage: number;
  breakdown: {
    likes: number;
    comments: number;
    shares: number;
    views: number;
  };
}

class AnalyticsService {
  async getDashboardData(userId: string): Promise<DashboardData> {
    try {
      const platforms = await storage.getPlatforms();
      const userAccounts = await storage.getUserAccounts(userId);
      const recentPosts = await this.getRecentPosts(userId, 7); // Last 7 days
      const safetyLogs = await storage.getUserSafetyLogs(userId);
      const aiLogs = await storage.getUserAIContentLogs(userId, 30); // Last 30 days

      const dashboardData: DashboardData = {
        platforms: {},
        totalEngagement: 0,
        totalPosts: recentPosts.length,
        aiCreditsUsed: aiLogs.reduce((sum, log) => sum + (log.tokensUsed || 0), 0),
        safetyStatus: 'safe',
      };

      // Calculate platform-specific data
      for (const platform of platforms) {
        const userAccount = userAccounts.find(acc => acc.platformId === platform.id);
        const platformPosts = recentPosts.filter(post => post.platformId === platform.id);
        const todayPosts = platformPosts.filter(post => this.isToday(post.createdAt));
        
        // Get recent safety logs for this platform
        const platformSafetyLogs = safetyLogs
          .filter(log => log.platformId === platform.id)
          .filter(log => this.isWithin24Hours(log.checkTime))
          .sort((a, b) => b.checkTime.getTime() - a.checkTime.getTime());

        const latestSafetyLog = platformSafetyLogs[0];
        let rateLimitUsage = 0;
        
        if (latestSafetyLog) {
          rateLimitUsage = ((latestSafetyLog.rateLimitUsed || 0) / (latestSafetyLog.rateLimitMax || 100)) * 100;
        }

        // Calculate engagement for this platform
        const platformEngagement = await this.calculatePlatformEngagement(userId, platform.id, 7);
        dashboardData.totalEngagement += platformEngagement.totalEngagement;

        // Determine platform status
        let status: 'active' | 'warning' | 'inactive' = 'inactive';
        if (userAccount && userAccount.isActive) {
          status = rateLimitUsage > 80 ? 'warning' : 'active';
        }

        // Set default max posts based on platform
        let maxPosts = 10;
        switch (platform.name) {
          case 'instagram':
            maxPosts = 15;
            break;
          case 'tiktok':
            maxPosts = 12;
            break;
          case 'youtube':
            maxPosts = 5;
            break;
          case 'telegram':
            maxPosts = 30;
            break;
        }

        dashboardData.platforms[platform.name] = {
          id: platform.id,
          displayName: platform.displayName,
          icon: platform.icon,
          color: platform.color,
          status,
          todayStats: {
            posts: todayPosts.length,
            maxPosts,
            engagement: platformEngagement.totalEngagement,
            engagementChange: platformEngagement.changePercentage,
          },
          rateLimitUsage,
        };

        // Update overall safety status
        if (rateLimitUsage > 90) {
          dashboardData.safetyStatus = 'critical';
        } else if (rateLimitUsage > 80 && dashboardData.safetyStatus === 'safe') {
          dashboardData.safetyStatus = 'warning';
        }
      }

      return dashboardData;
    } catch (error) {
      throw new Error(`Failed to get dashboard data: ${error.message}`);
    }
  }

  async getEngagementAnalytics(userId: string, days: number = 7): Promise<EngagementData[]> {
    try {
      const platforms = await storage.getPlatforms();
      const engagementData: EngagementData[] = [];

      for (const platform of platforms) {
        const current = await this.calculatePlatformEngagement(userId, platform.id, days);
        const previous = await this.calculatePlatformEngagement(userId, platform.id, days, days);
        
        const changePercentage = previous.totalEngagement > 0 
          ? ((current.totalEngagement - previous.totalEngagement) / previous.totalEngagement) * 100
          : 0;

        engagementData.push({
          platform: platform.displayName,
          totalEngagement: current.totalEngagement,
          changePercentage,
          breakdown: current.breakdown,
        });
      }

      return engagementData;
    } catch (error) {
      throw new Error(`Failed to get engagement analytics: ${error.message}`);
    }
  }

  async getPerformanceMetrics(userId: string, platformId?: number): Promise<{
    postsPublished: number;
    totalReach: number;
    averageEngagement: number;
    topPerformingPost: any;
    engagementTrend: Array<{ date: string; engagement: number }>;
  }> {
    try {
      const posts = await this.getRecentPosts(userId, 30, platformId);
      const analytics = await storage.getUserAnalytics(userId, platformId);

      const postsPublished = posts.filter(post => post.status === 'published').length;
      const totalReach = analytics.reduce((sum, a) => sum + (a.reach || 0), 0);
      const totalEngagement = analytics.reduce((sum, a) => sum + (a.likes || 0) + (a.comments || 0) + (a.shares || 0), 0);
      const averageEngagement = analytics.length > 0 ? totalEngagement / analytics.length : 0;

      // Find top performing post
      const topPerformingPost = analytics.reduce((top, current) => {
        const currentScore = (current.likes || 0) + (current.comments || 0) + (current.shares || 0);
        const topScore = (top?.likes || 0) + (top?.comments || 0) + (top?.shares || 0);
        return currentScore > topScore ? current : top;
      }, analytics[0]);

      // Calculate engagement trend (last 7 days)
      const engagementTrend = await this.calculateEngagementTrend(userId, 7, platformId);

      return {
        postsPublished,
        totalReach,
        averageEngagement,
        topPerformingPost,
        engagementTrend,
      };
    } catch (error) {
      throw new Error(`Failed to get performance metrics: ${error.message}`);
    }
  }

  private async calculatePlatformEngagement(
    userId: string, 
    platformId: number, 
    days: number,
    offsetDays: number = 0
  ): Promise<{
    totalEngagement: number;
    changePercentage: number;
    breakdown: { likes: number; comments: number; shares: number; views: number };
  }> {
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - days - offsetDays);
    const endDate = new Date();
    endDate.setDate(endDate.getDate() - offsetDays);

    const posts = await this.getPostsInDateRange(userId, platformId, startDate, endDate);
    const analytics = await storage.getUserAnalytics(userId, platformId);
    
    const relevantAnalytics = analytics.filter(a => {
      const post = posts.find(p => p.id === a.postId);
      return post && post.createdAt >= startDate && post.createdAt <= endDate;
    });

    const breakdown = relevantAnalytics.reduce((acc, a) => ({
      likes: acc.likes + (a.likes || 0),
      comments: acc.comments + (a.comments || 0),
      shares: acc.shares + (a.shares || 0),
      views: acc.views + (a.views || 0),
    }), { likes: 0, comments: 0, shares: 0, views: 0 });

    const totalEngagement = breakdown.likes + breakdown.comments + breakdown.shares;

    return {
      totalEngagement,
      changePercentage: 0, // Will be calculated in the calling function
      breakdown,
    };
  }

  private async calculateEngagementTrend(
    userId: string, 
    days: number, 
    platformId?: number
  ): Promise<Array<{ date: string; engagement: number }>> {
    const trend: Array<{ date: string; engagement: number }> = [];
    
    for (let i = days - 1; i >= 0; i--) {
      const date = new Date();
      date.setDate(date.getDate() - i);
      
      const dayStart = new Date(date);
      dayStart.setHours(0, 0, 0, 0);
      const dayEnd = new Date(date);
      dayEnd.setHours(23, 59, 59, 999);

      const posts = await this.getPostsInDateRange(userId, platformId, dayStart, dayEnd);
      const analytics = await storage.getUserAnalytics(userId, platformId);
      
      const dayEngagement = analytics
        .filter(a => {
          const post = posts.find(p => p.id === a.postId);
          return post && post.createdAt >= dayStart && post.createdAt <= dayEnd;
        })
        .reduce((sum, a) => sum + (a.likes || 0) + (a.comments || 0) + (a.shares || 0), 0);

      trend.push({
        date: date.toISOString().split('T')[0],
        engagement: dayEngagement,
      });
    }

    return trend;
  }

  private async getRecentPosts(userId: string, days: number, platformId?: number): Promise<any[]> {
    const allPosts = await storage.getUserPosts(userId, 1000); // Get many posts
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - days);

    return allPosts.filter(post => {
      const isRecent = post.createdAt >= cutoffDate;
      const matchesPlatform = !platformId || post.platformId === platformId;
      return isRecent && matchesPlatform;
    });
  }

  private async getPostsInDateRange(
    userId: string, 
    platformId: number | undefined, 
    startDate: Date, 
    endDate: Date
  ): Promise<any[]> {
    const allPosts = await storage.getUserPosts(userId, 1000);
    return allPosts.filter(post => {
      const inDateRange = post.createdAt >= startDate && post.createdAt <= endDate;
      const matchesPlatform = !platformId || post.platformId === platformId;
      return inDateRange && matchesPlatform;
    });
  }

  private isToday(date: Date): boolean {
    const today = new Date();
    return date.toDateString() === today.toDateString();
  }

  private isWithin24Hours(date: Date): boolean {
    const now = new Date();
    const twentyFourHoursAgo = new Date(now.getTime() - 24 * 60 * 60 * 1000);
    return date >= twentyFourHoursAgo;
  }
}

export const analyticsService = new AnalyticsService();
