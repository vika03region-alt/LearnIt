import { storage } from "../storage";

interface SafetyStatus {
  overall: 'safe' | 'warning' | 'critical';
  platforms: {
    [platformId: number]: {
      status: 'safe' | 'warning' | 'critical';
      rateLimitUsage: number;
      maxLimit: number;
      percentage: number;
      lastAction: Date | null;
    };
  };
  recommendations: string[];
}

class SafetyService {
  async getUserSafetyStatus(userId: string): Promise<SafetyStatus> {
    try {
      const platforms = await storage.getPlatforms();
      const userAccounts = await storage.getUserAccounts(userId);
      const safetyLogs = await storage.getUserSafetyLogs(userId);
      
      const status: SafetyStatus = {
        overall: 'safe',
        platforms: {},
        recommendations: [],
      };

      let hasWarning = false;
      let hasCritical = false;

      for (const platform of platforms) {
        const userAccount = userAccounts.find(acc => acc.platformId === platform.id);
        if (!userAccount) continue;

        const recentLogs = safetyLogs
          .filter(log => log.platformId === platform.id)
          .filter(log => this.isWithin24Hours(log.checkTime))
          .sort((a, b) => b.checkTime.getTime() - a.checkTime.getTime());

        const latestLog = recentLogs[0];
        const rateLimits = await storage.getRateLimits(platform.id);
        
        let platformStatus: 'safe' | 'warning' | 'critical' = 'safe';
        let rateLimitUsage = 0;
        let maxLimit = 100; // default
        
        if (latestLog) {
          rateLimitUsage = latestLog.rateLimitUsed || 0;
          maxLimit = latestLog.rateLimitMax || 100;
          
          const percentage = (rateLimitUsage / maxLimit) * 100;
          
          if (percentage >= 90) {
            platformStatus = 'critical';
            hasCritical = true;
          } else if (percentage >= 80) {
            platformStatus = 'warning';
            hasWarning = true;
          }
        }

        status.platforms[platform.id] = {
          status: platformStatus,
          rateLimitUsage,
          maxLimit,
          percentage: (rateLimitUsage / maxLimit) * 100,
          lastAction: latestLog?.checkTime || null,
        };
      }

      // Determine overall status
      if (hasCritical) {
        status.overall = 'critical';
        status.recommendations.push('Immediate action required: Some platforms are at critical rate limits');
      } else if (hasWarning) {
        status.overall = 'warning';
        status.recommendations.push('Monitor closely: Some platforms approaching rate limits');
      }

      // Add specific recommendations
      status.recommendations.push(...this.generateRecommendations(status.platforms));

      return status;
    } catch (error) {
      throw new Error(`Failed to get safety status: ${error.message}`);
    }
  }

  async performSafetyCheck(userId: string): Promise<{ message: string; issues: string[] }> {
    try {
      const userAccounts = await storage.getUserAccounts(userId);
      const issues: string[] = [];
      
      for (const account of userAccounts) {
        // Check rate limits for the past 24 hours
        const recentLogs = await this.getRecentSafetyLogs(userId, account.platformId);
        const platform = await storage.getPlatform(account.platformId);
        
        if (!platform) continue;

        const totalActions = recentLogs.reduce((sum, log) => sum + (log.actionCount || 0), 0);
        const rateLimits = await storage.getRateLimits(account.platformId);
        
        for (const limit of rateLimits) {
          const actionLogs = recentLogs.filter(log => log.actionType === limit.actionType);
          const actionCount = actionLogs.reduce((sum, log) => sum + (log.actionCount || 0), 0);
          
          const percentage = (actionCount / limit.maxActions) * 100;
          let status: 'safe' | 'warning' | 'critical' = 'safe';
          
          if (percentage >= limit.warningThreshold * 100) {
            status = percentage >= 90 ? 'critical' : 'warning';
            issues.push(`${platform.displayName}: ${limit.actionType} at ${percentage.toFixed(1)}%`);
          }

          // Log the safety check
          await storage.createSafetyLog({
            userId,
            platformId: account.platformId,
            actionType: limit.actionType,
            actionCount,
            rateLimitUsed: actionCount,
            rateLimitMax: limit.maxActions,
            status,
          });
        }
      }

      // Log the safety check activity
      await storage.createActivityLog({
        userId,
        action: 'Safety Check',
        description: `Performed safety check - ${issues.length} issues found`,
        status: issues.length > 0 ? 'warning' : 'success',
        metadata: { issuesCount: issues.length, issues },
      });

      return {
        message: issues.length === 0 ? 'All systems safe' : `${issues.length} issues detected`,
        issues,
      };
    } catch (error) {
      throw new Error(`Failed to perform safety check: ${error.message}`);
    }
  }

  async recordAction(
    userId: string, 
    platformId: number, 
    actionType: string, 
    actionCount: number = 1
  ): Promise<void> {
    try {
      const rateLimits = await storage.getRateLimits(platformId);
      const relevantLimit = rateLimits.find(limit => limit.actionType === actionType);
      
      if (!relevantLimit) return;

      const recentLogs = await this.getRecentSafetyLogs(userId, platformId);
      const recentActionLogs = recentLogs.filter(log => log.actionType === actionType);
      const currentActionCount = recentActionLogs.reduce((sum, log) => sum + (log.actionCount || 0), 0);
      
      const newTotal = currentActionCount + actionCount;
      const percentage = (newTotal / relevantLimit.maxActions) * 100;
      
      let status: 'safe' | 'warning' | 'critical' = 'safe';
      if (percentage >= 90) {
        status = 'critical';
      } else if (percentage >= relevantLimit.warningThreshold * 100) {
        status = 'warning';
      }

      await storage.createSafetyLog({
        userId,
        platformId,
        actionType,
        actionCount,
        rateLimitUsed: newTotal,
        rateLimitMax: relevantLimit.maxActions,
        status,
      });

      // If critical, log an activity warning
      if (status === 'critical') {
        const platform = await storage.getPlatform(platformId);
        await storage.createActivityLog({
          userId,
          action: 'Rate Limit Warning',
          description: `${platform?.displayName || 'Platform'} ${actionType} approaching limit (${percentage.toFixed(1)}%)`,
          platformId,
          status: 'warning',
        });
      }
    } catch (error) {
      console.error('Failed to record safety action:', error);
    }
  }

  private async getRecentSafetyLogs(userId: string, platformId: number) {
    const allLogs = await storage.getUserSafetyLogs(userId, platformId);
    return allLogs.filter(log => this.isWithin24Hours(log.checkTime));
  }

  private isWithin24Hours(date: Date): boolean {
    const now = new Date();
    const twentyFourHoursAgo = new Date(now.getTime() - 24 * 60 * 60 * 1000);
    return date >= twentyFourHoursAgo;
  }

  private generateRecommendations(platforms: SafetyStatus['platforms']): string[] {
    const recommendations: string[] = [];
    
    for (const [platformId, data] of Object.entries(platforms)) {
      if (data.status === 'critical') {
        recommendations.push(`Остановить всю активность на платформе ${platformId} до завтра`);
      } else if (data.status === 'warning') {
        recommendations.push(`Снизить активность на платформе ${platformId} на сегодня`);
      }
      
      if (data.percentage > 50) {
        recommendations.push(`Внимательно отслеживать платформу ${platformId} до конца дня`);
      }
    }

    if (recommendations.length === 0) {
      recommendations.push('Все платформы работают в безопасных параметрах');
      recommendations.push('Продолжить нормальное расписание автоматизации');
    }

    return recommendations;
  }

  async initializeDefaultRateLimits(): Promise<void> {
    const platforms = await storage.getPlatforms();
    
    for (const platform of platforms) {
      const existingLimits = await storage.getRateLimits(platform.id);
      if (existingLimits.length > 0) continue;

      // Set default rate limits based on platform
      let defaultLimits: Array<{
        platformId: number;
        actionType: string;
        limitPeriod: string;
        maxActions: number;
        safeThreshold: number;
        warningThreshold: number;
      }> = [];

      switch (platform.name) {
        case 'instagram':
          defaultLimits = [
            { platformId: platform.id, actionType: 'post', limitPeriod: 'day', maxActions: 10, safeThreshold: 0.7, warningThreshold: 0.8 },
            { platformId: platform.id, actionType: 'like', limitPeriod: 'hour', maxActions: 60, safeThreshold: 0.7, warningThreshold: 0.8 },
            { platformId: platform.id, actionType: 'follow', limitPeriod: 'hour', maxActions: 20, safeThreshold: 0.7, warningThreshold: 0.8 },
          ];
          break;
        case 'tiktok':
          defaultLimits = [
            { platformId: platform.id, actionType: 'post', limitPeriod: 'day', maxActions: 12, safeThreshold: 0.7, warningThreshold: 0.8 },
            { platformId: platform.id, actionType: 'like', limitPeriod: 'hour', maxActions: 100, safeThreshold: 0.7, warningThreshold: 0.8 },
            { platformId: platform.id, actionType: 'follow', limitPeriod: 'hour', maxActions: 30, safeThreshold: 0.7, warningThreshold: 0.8 },
          ];
          break;
        case 'youtube':
          defaultLimits = [
            { platformId: platform.id, actionType: 'post', limitPeriod: 'day', maxActions: 5, safeThreshold: 0.6, warningThreshold: 0.8 },
            { platformId: platform.id, actionType: 'comment', limitPeriod: 'hour', maxActions: 50, safeThreshold: 0.7, warningThreshold: 0.8 },
          ];
          break;
        case 'telegram':
          defaultLimits = [
            { platformId: platform.id, actionType: 'message', limitPeriod: 'day', maxActions: 30, safeThreshold: 0.7, warningThreshold: 0.8 },
          ];
          break;
      }

      // Insert default limits (this would need to be implemented in storage)
      // await storage.createRateLimits(defaultLimits);
    }
  }
}

export const safetyService = new SafetyService();
