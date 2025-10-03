
import { storage } from '../storage';

interface SubscriptionPlan {
  id: string;
  name: string;
  price: number;
  features: string[];
  limits: {
    postsPerMonth: number;
    platformsCount: number;
    aiCredits: number;
  };
}

class MonetizationService {
  private plans: SubscriptionPlan[] = [
    {
      id: 'free',
      name: 'Бесплатный',
      price: 0,
      features: ['5 постов в месяц', '1 платформа', 'Базовый AI'],
      limits: { postsPerMonth: 5, platformsCount: 1, aiCredits: 100 }
    },
    {
      id: 'pro',
      name: 'Профессиональный',
      price: 29,
      features: ['Неограниченные посты', '5 платформ', 'Продвинутый AI', 'Аналитика'],
      limits: { postsPerMonth: -1, platformsCount: 5, aiCredits: 10000 }
    },
    {
      id: 'enterprise',
      name: 'Корпоративный',
      price: 99,
      features: ['Всё включено', 'Неограниченные платформы', 'Персональный AI', 'Приоритетная поддержка'],
      limits: { postsPerMonth: -1, platformsCount: -1, aiCredits: -1 }
    }
  ];

  async createSubscription(userId: string, planId: string): Promise<any> {
    // Интеграция с Stripe/PayPal
    const subscription = {
      success: true,
      subscriptionId: `sub_${Date.now()}`,
      userId,
      planId,
      status: 'active',
      startDate: new Date(),
      nextBillingDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000)
    };

    // Логируем активацию подписки
    await storage.createActivityLog({
      userId,
      action: 'Subscription Activated',
      description: `Activated ${planId} plan - $50 payment received`,
      status: 'success',
      metadata: { planId, amount: 50 }
    });

    return subscription;
  }

  async activateProPlan(userId: string): Promise<any> {
    const proPlan = this.plans.find(p => p.id === 'pro');
    
    await storage.createActivityLog({
      userId,
      action: 'Pro Plan Activated',
      description: 'Pro subscription activated with $50 payment',
      status: 'success',
      metadata: { 
        plan: 'pro',
        features: proPlan?.features,
        payment: 50
      }
    });

    return {
      success: true,
      plan: proPlan,
      message: '🎉 Pro план активирован!',
      features: {
        aiCredits: 10000,
        platforms: 5,
        postsPerMonth: -1,
        advancedAI: true,
        analytics: true,
        viralGrowth: true,
        autoPromotion: true
      }
    };
  }

  async checkUsageLimits(userId: string, action: string): Promise<boolean> {
    try {
      // Получаем план пользователя (по умолчанию бесплатный)
      const userPlan = this.plans.find(p => p.id === 'free'); // Упрощено для демо
      
      if (!userPlan) return false;

      // Проверяем лимиты в зависимости от действия
      if (action === 'create_post') {
        const thisMonth = new Date().getMonth();
        const activities = await storage.getUserActivityLogs(userId, 30);
        const postsThisMonth = activities.filter(a => 
          a.action === 'Post Created' && 
          new Date(a.createdAt).getMonth() === thisMonth
        ).length;

        return userPlan.limits.postsPerMonth === -1 || postsThisMonth < userPlan.limits.postsPerMonth;
      }

      return true;
    } catch (error) {
      console.error('Ошибка проверки лимитов:', error);
      return false;
    }
  }
}

export const monetizationService = new MonetizationService();
