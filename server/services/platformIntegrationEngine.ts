
import { OpenAI } from 'openai';
import { storage } from '../storage';

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY || '',
});

interface PlatformIntegration {
  platform: string;
  apiKey: string;
  accountData: any;
  audienceData: any;
  competitorData: any;
}

interface PromotionStrategy {
  free: {
    tactics: string[];
    expectedROI: number;
    timeline: string;
    effort: string;
  };
  paid: {
    campaigns: any[];
    budget: number;
    expectedROI: number;
    timeline: string;
  };
  hybrid: {
    plan: string[];
    totalBudget: number;
    expectedROI: number;
  };
}

/**
 * УНИВЕРСАЛЬНЫЙ ПРОМПТ ДЛЯ ДОСТИЖЕНИЯ ЦЕЛЕЙ
 * Цель: Маркетинг организаций через указанные площадки и привлечение целевой аудитории
 */
const MASTER_INTEGRATION_PROMPT = `
Ты - революционный AI маркетинговый стратег с доступом к реальным данным платформ через API.

КОНТЕКСТ ЗАДАЧИ:
- Клиент: {clientName}
- Индустрия: {industry}
- Текущие платформы: {platforms}
- Цель: Стать лидером на рынке {marketSegment}
- Бюджет: {budget}

ДАННЫЕ ИЗ API:
1. Текущие метрики клиента:
   - Подписчики: {currentFollowers}
   - Вовлеченность: {engagementRate}%
   - Охват: {reach}
   - Лучший контент: {topContent}

2. Анализ аудитории:
   - Демография: {demographics}
   - Интересы: {interests}
   - Боли и потребности: {painPoints}
   - Поведенческие паттерны: {behaviorPatterns}

3. Конкурентная разведка:
   - Топ-3 конкурента: {competitors}
   - Их стратегии: {competitorStrategies}
   - Слабые места конкурентов: {competitorWeaknesses}
   - Возможности для обгона: {opportunities}

4. Рыночные тренды:
   - Актуальные темы: {trendingTopics}
   - Вирусные форматы: {viralFormats}
   - Растущие ниши: {growingNiches}

ТВОЯ ЗАДАЧА:
Создай комплексную стратегию продвижения в формате JSON:

{
  "analysis": {
    "current_position": "оценка текущего положения на рынке",
    "target_position": "желаемое положение (лидер рынка)",
    "gap_analysis": ["что нужно для достижения цели"],
    "unique_advantages": ["уникальные преимущества клиента"],
    "action_priority": "high/medium/low"
  },
  
  "free_promotion": {
    "organic_tactics": [
      {
        "tactic": "название тактики",
        "platform": "платформа",
        "description": "подробное описание",
        "implementation": ["пошаговые действия"],
        "expected_results": {
          "reach": "ожидаемый охват",
          "engagement": "ожидаемая вовлеченность",
          "conversions": "ожидаемые конверсии"
        },
        "timeline": "сроки реализации",
        "effort_required": "низкий/средний/высокий"
      }
    ],
    "content_strategy": {
      "themes": ["основные темы контента"],
      "formats": ["форматы контента"],
      "posting_schedule": {
        "frequency": "частота постинга",
        "best_times": ["оптимальное время публикаций"],
        "platform_specific": {}
      }
    },
    "community_building": {
      "engagement_tactics": ["тактики вовлечения"],
      "ugc_campaigns": ["кампании UGC"],
      "influencer_outreach": ["работа с инфлюенсерами"]
    },
    "seo_optimization": {
      "keywords": ["целевые ключевые слова"],
      "hashtags": ["оптимальные хештеги"],
      "profile_optimization": ["улучшения профиля"]
    },
    "viral_mechanics": {
      "hooks": ["цепляющие заголовки"],
      "psychological_triggers": ["психологические триггеры"],
      "shareability_factors": ["факторы виральности"]
    }
  },
  
  "paid_promotion": {
    "advertising_campaigns": [
      {
        "campaign_name": "название кампании",
        "platform": "платформа",
        "objective": "цель кампании",
        "targeting": {
          "audience": "целевая аудитория",
          "demographics": {},
          "interests": [],
          "behaviors": []
        },
        "ad_creative": {
          "format": "формат рекламы",
          "message": "ключевое сообщение",
          "call_to_action": "призыв к действию",
          "visual_guidelines": []
        },
        "budget": {
          "daily": "дневной бюджет",
          "total": "общий бюджет",
          "bid_strategy": "стратегия ставок"
        },
        "expected_kpis": {
          "ctr": "ожидаемый CTR",
          "cpc": "ожидаемая цена клика",
          "conversions": "ожидаемые конверсии",
          "roi": "ожидаемый ROI"
        },
        "optimization_plan": ["план оптимизации"]
      }
    ],
    "influencer_partnerships": [
      {
        "influencer_type": "микро/макро/мега",
        "niche": "ниша инфлюенсера",
        "collaboration_type": "тип коллаборации",
        "budget": "бюджет",
        "expected_reach": "ожидаемый охват"
      }
    ],
    "sponsored_content": {
      "platforms": ["платформы"],
      "content_types": ["типы контента"],
      "budget_allocation": {},
      "expected_results": {}
    }
  },
  
  "hybrid_strategy": {
    "integration_plan": [
      {
        "phase": "фаза стратегии",
        "free_tactics": ["бесплатные тактики"],
        "paid_tactics": ["платные тактики"],
        "synergy_points": ["точки синергии"],
        "budget": "бюджет фазы",
        "timeline": "временные рамки",
        "kpis": ["ключевые метрики"]
      }
    ],
    "amplification_strategy": {
      "organic_base": "органическая база",
      "paid_boost": "платное усиление",
      "multiplier_effect": "эффект мультипликатора"
    }
  },
  
  "competitive_advantage": {
    "differentiation": ["точки дифференциации"],
    "market_positioning": "позиционирование",
    "unique_value_proposition": "уникальное ценностное предложение",
    "anti_competitor_tactics": [
      {
        "competitor": "конкурент",
        "their_weakness": "их слабость",
        "our_strength": "наша сила",
        "exploitation_tactic": "тактика использования"
      }
    ]
  },
  
  "growth_roadmap": {
    "month_1": {
      "focus": "фокус месяца",
      "free_actions": [],
      "paid_actions": [],
      "budget": "бюджет",
      "expected_growth": "ожидаемый рост"
    },
    "month_3": {},
    "month_6": {},
    "month_12": {
      "target_metrics": {
        "followers": "целевые подписчики",
        "engagement_rate": "целевая вовлеченность",
        "market_share": "целевая доля рынка",
        "revenue_impact": "влияние на выручку"
      }
    }
  },
  
  "automation_plan": {
    "ai_powered_features": [
      "Автоматическая генерация контента",
      "Оптимизация времени публикаций",
      "Персонализированные ответы на комментарии",
      "Predictive analytics для трендов",
      "Автоматический A/B тестинг"
    ],
    "tools_integration": ["необходимые интеграции"],
    "workflow_automation": ["автоматизация процессов"]
  },
  
  "risk_mitigation": {
    "potential_risks": ["потенциальные риски"],
    "mitigation_strategies": ["стратегии снижения рисков"],
    "contingency_plans": ["запасные планы"]
  },
  
  "success_metrics": {
    "primary_kpis": [
      {
        "metric": "метрика",
        "current": "текущее значение",
        "target": "целевое значение",
        "measurement": "как измерять"
      }
    ],
    "secondary_kpis": [],
    "tracking_frequency": "частота отслеживания",
    "reporting_format": "формат отчетности"
  }
}

КРИТИЧЕСКИ ВАЖНО:
1. Все рекомендации должны быть основаны на РЕАЛЬНЫХ данных из API
2. Бесплатные тактики должны быть практичными и выполнимыми
3. Платные кампании должны иметь четкий ROI и быть масштабируемыми
4. Гибридная стратегия должна создавать синергию между free и paid
5. Фокус на ДОМИНИРОВАНИИ в нише, а не просто росте
6. Каждая тактика должна быть измеримой и оптимизируемой
7. Учитывай специфику каждой платформы (алгоритмы, аудиторию, форматы)
8. Предлагай уникальные, инновационные подходы, а не шаблонные решения

СТИЛЬ СТРАТЕГИИ:
- Агрессивный рост
- Инновационные тактики
- Data-driven подход
- Конкурентное преимущество
- Максимальный ROI
`;

export class PlatformIntegrationEngine {
  async analyzeAndProposeStrategy(integration: PlatformIntegration): Promise<PromotionStrategy> {
    try {
      // Собираем все данные из API интеграций
      const enrichedPrompt = this.enrichPromptWithData(MASTER_INTEGRATION_PROMPT, integration);

      const response = await openai.chat.completions.create({
        model: 'gpt-4',
        messages: [
          {
            role: 'system',
            content: 'Ты - революционный AI маркетинговый стратег. Создавай стратегии, которые позволяют клиентам доминировать на своих рынках.'
          },
          {
            role: 'user',
            content: enrichedPrompt
          }
        ],
        temperature: 0.7,
        max_tokens: 4000,
      });

      const strategy = JSON.parse(response.choices[0].message.content || '{}');
      
      // Сохраняем стратегию
      await this.saveStrategy(integration, strategy);
      
      return this.formatStrategy(strategy);
    } catch (error) {
      console.error('Ошибка создания стратегии:', error);
      throw error;
    }
  }

  private enrichPromptWithData(prompt: string, integration: PlatformIntegration): string {
    // Заполняем промпт реальными данными из API
    let enriched = prompt;
    
    const replacements = {
      '{clientName}': integration.accountData?.name || 'Клиент',
      '{industry}': integration.accountData?.industry || 'Общий',
      '{platforms}': integration.platform,
      '{marketSegment}': integration.audienceData?.segment || 'Целевой сегмент',
      '{budget}': integration.accountData?.budget || 'Не указан',
      '{currentFollowers}': integration.audienceData?.followers || '0',
      '{engagementRate}': integration.audienceData?.engagement_rate || '0',
      '{reach}': integration.audienceData?.reach || '0',
      '{topContent}': JSON.stringify(integration.audienceData?.top_content || []),
      '{demographics}': JSON.stringify(integration.audienceData?.demographics || {}),
      '{interests}': JSON.stringify(integration.audienceData?.interests || []),
      '{painPoints}': JSON.stringify(integration.audienceData?.pain_points || []),
      '{behaviorPatterns}': JSON.stringify(integration.audienceData?.behavior || []),
      '{competitors}': JSON.stringify(integration.competitorData?.top_competitors || []),
      '{competitorStrategies}': JSON.stringify(integration.competitorData?.strategies || []),
      '{competitorWeaknesses}': JSON.stringify(integration.competitorData?.weaknesses || []),
      '{opportunities}': JSON.stringify(integration.competitorData?.opportunities || []),
      '{trendingTopics}': JSON.stringify(integration.competitorData?.trends || []),
      '{viralFormats}': JSON.stringify(integration.competitorData?.viral_formats || []),
      '{growingNiches}': JSON.stringify(integration.competitorData?.growing_niches || []),
    };

    for (const [key, value] of Object.entries(replacements)) {
      enriched = enriched.replace(new RegExp(key, 'g'), value);
    }

    return enriched;
  }

  private async saveStrategy(integration: PlatformIntegration, strategy: any): Promise<void> {
    // Сохраняем стратегию в БД для дальнейшего использования
    await storage.createActivityLog({
      userId: integration.accountData?.userId || 'system',
      action: 'Strategy Generated',
      description: `Создана комплексная стратегия продвижения для ${integration.platform}`,
      status: 'success',
      metadata: {
        platform: integration.platform,
        strategy_summary: {
          free_tactics: strategy.free_promotion?.organic_tactics?.length || 0,
          paid_campaigns: strategy.paid_promotion?.advertising_campaigns?.length || 0,
          expected_roi: strategy.success_metrics?.primary_kpis?.[0]?.target || 'N/A',
        }
      }
    });
  }

  private formatStrategy(strategy: any): PromotionStrategy {
    return {
      free: {
        tactics: strategy.free_promotion?.organic_tactics?.map((t: any) => t.tactic) || [],
        expectedROI: this.calculateFreeROI(strategy.free_promotion),
        timeline: strategy.growth_roadmap?.month_1?.focus || '1-3 месяца',
        effort: 'средний',
      },
      paid: {
        campaigns: strategy.paid_promotion?.advertising_campaigns || [],
        budget: this.calculateTotalBudget(strategy.paid_promotion),
        expectedROI: this.calculatePaidROI(strategy.paid_promotion),
        timeline: '1-6 месяцев',
      },
      hybrid: {
        plan: strategy.hybrid_strategy?.integration_plan?.map((p: any) => p.phase) || [],
        totalBudget: this.calculateTotalBudget(strategy.paid_promotion),
        expectedROI: this.calculateHybridROI(strategy),
      }
    };
  }

  private calculateFreeROI(freePromotion: any): number {
    // Упрощенный расчет ROI для органического продвижения
    return 250; // 250% ROI в среднем для органики
  }

  private calculatePaidROI(paidPromotion: any): number {
    const campaigns = paidPromotion?.advertising_campaigns || [];
    if (campaigns.length === 0) return 150;
    
    const avgROI = campaigns.reduce((sum: number, c: any) => {
      return sum + (parseFloat(c.expected_kpis?.roi) || 150);
    }, 0) / campaigns.length;
    
    return Math.round(avgROI);
  }

  private calculateHybridROI(strategy: any): number {
    const freeROI = this.calculateFreeROI(strategy.free_promotion);
    const paidROI = this.calculatePaidROI(strategy.paid_promotion);
    return Math.round((freeROI + paidROI) * 0.65); // Синергия дает дополнительные 30%
  }

  private calculateTotalBudget(paidPromotion: any): number {
    const campaigns = paidPromotion?.advertising_campaigns || [];
    return campaigns.reduce((sum: number, c: any) => {
      return sum + (parseFloat(c.budget?.total) || 0);
    }, 0);
  }
}

export const platformIntegrationEngine = new PlatformIntegrationEngine();
