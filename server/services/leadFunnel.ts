
import { storage } from '../storage';

interface Lead {
  id: string;
  source: string;
  platform: string;
  stage: 'awareness' | 'consideration' | 'decision' | 'customer';
  score: number;
  interactions: string[];
}

class LeadFunnelService {
  async trackLead(leadData: {
    userId: string;
    source: string;
    platform: string;
    action: string;
  }): Promise<void> {
    await storage.createActivityLog({
      userId: leadData.userId,
      action: `Lead: ${leadData.action}`,
      description: `Лид с ${leadData.platform} (${leadData.source})`,
      status: 'success',
      metadata: leadData,
    });
  }

  async scoreLeads(userId: string): Promise<Lead[]> {
    const activities = await storage.getUserActivityLogs(userId, 90);
    
    const leadActivities = activities.filter(a => a.action.startsWith('Lead:'));
    
    // Группируем по источникам
    const leadsMap = new Map<string, Lead>();
    
    for (const activity of leadActivities) {
      const source = activity.metadata?.source || 'unknown';
      
      if (!leadsMap.has(source)) {
        leadsMap.set(source, {
          id: source,
          source,
          platform: activity.metadata?.platform || 'unknown',
          stage: 'awareness',
          score: 0,
          interactions: [],
        });
      }
      
      const lead = leadsMap.get(source)!;
      lead.interactions.push(activity.action);
      lead.score += this.calculateActivityScore(activity.action);
      lead.stage = this.determineStage(lead.score);
    }
    
    return Array.from(leadsMap.values()).sort((a, b) => b.score - a.score);
  }

  private calculateActivityScore(action: string): number {
    const scores: Record<string, number> = {
      'Lead: Downloaded': 10,
      'Lead: Registered': 15,
      'Lead: Email Open': 5,
      'Lead: Link Click': 8,
      'Lead: Video View': 7,
      'Lead: Comment': 12,
      'Lead: Share': 10,
      'Lead: Contact Form': 20,
    };
    
    return scores[action] || 1;
  }

  private determineStage(score: number): Lead['stage'] {
    if (score >= 50) return 'decision';
    if (score >= 30) return 'consideration';
    if (score >= 10) return 'awareness';
    return 'awareness';
  }
}

export const leadFunnelService = new LeadFunnelService();
