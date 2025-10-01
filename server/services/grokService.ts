
import OpenAI from "openai";

interface GrokResponse {
  content: string;
  tokensUsed: number;
  cost: number;
}

class GrokService {
  private grok: OpenAI | null = null;
  private isGrokAvailable = false;

  constructor() {
    this.initializeGrok();
  }

  private initializeGrok(): void {
    const grokApiKey = process.env.GROK_API_KEY;
    
    console.log('🔍 Проверка Grok API Key:', {
      exists: !!grokApiKey,
      length: grokApiKey?.length || 0,
      starts_with_grok: grokApiKey?.startsWith('grok-') || false,
      preview: grokApiKey ? `${grokApiKey.substring(0, 8)}...` : 'отсутствует'
    });
    
    if (grokApiKey && grokApiKey.startsWith('grok-')) {
      try {
        // Grok использует OpenAI-совместимый API
        this.grok = new OpenAI({
          apiKey: grokApiKey,
          baseURL: "https://api.x.ai/v1", // xAI API endpoint
        });
        this.isGrokAvailable = true;
        console.log('🤖 Grok API успешно инициализирован');
        console.log('🔗 API Endpoint: https://api.x.ai/v1');
      } catch (error) {
        console.error('❌ Ошибка инициализации Grok API:', error);
        this.isGrokAvailable = false;
      }
    } else {
      if (!grokApiKey) {
        console.log('⚠️ GROK_API_KEY не найден в переменных окружения');
      } else {
        console.log('⚠️ GROK_API_KEY имеет неверный формат. Должен начинаться с "grok-"');
        console.log('📝 Текущий формат:', grokApiKey.substring(0, 10) + '...');
      }
      this.isGrokAvailable = false;
    }
  }

  public isAvailable(): boolean {
    return this.isGrokAvailable && this.grok !== null;
  }

  async generateContent(
    prompt: string,
    systemPrompt?: string,
    options?: {
      model?: string;
      temperature?: number;
      maxTokens?: number;
    }
  ): Promise<GrokResponse> {
    if (!this.isAvailable()) {
      throw new Error("Grok API не доступен. Проверьте GROK_API_KEY в секретах.");
    }

    try {
      const response = await this.grok!.chat.completions.create({
        model: options?.model || "grok-beta", // Основная модель Grok
        messages: [
          ...(systemPrompt ? [{ role: "system" as const, content: systemPrompt }] : []),
          { role: "user" as const, content: prompt }
        ],
        temperature: options?.temperature || 0.7,
        max_tokens: options?.maxTokens || 1000,
      });

      const content = response.choices[0]?.message?.content || '';
      const tokensUsed = response.usage?.total_tokens || 0;
      
      // Примерная стоимость для Grok (может измениться)
      const cost = tokensUsed * 0.00001; // $0.01 per 1000 tokens (примерно)

      return {
        content,
        tokensUsed,
        cost,
      };
    } catch (error) {
      console.error('Ошибка Grok API:', error);
      throw new Error(`Ошибка генерации контента через Grok: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  async generateTradingContent(
    contentType: 'signal' | 'analysis' | 'prediction' | 'education',
    prompt: string
  ): Promise<GrokResponse> {
    const systemPrompts = {
      signal: `Ты профессиональный трейдер с большим опытом. Создавай точные торговые сигналы с четкими уровнями входа, целями и стоп-лоссами. Всегда включай анализ риска и предупреждения.`,
      analysis: `Ты эксперт по техническому и фундаментальному анализу рынков. Предоставляй глубокие инсайты с обоснованием и данными.`,
      prediction: `Ты аналитик рынков с доступом к актуальным трендам. Делай обоснованные прогнозы с указанием вероятности и временных рамок.`,
      education: `Ты опытный преподаватель трейдинга. Объясняй сложные концепции простым языком с практическими примерами.`
    };

    return this.generateContent(
      prompt,
      systemPrompts[contentType],
      {
        model: "grok-beta",
        temperature: contentType === 'education' ? 0.3 : 0.7,
        maxTokens: 1500
      }
    );
  }

  async analyzeMarketSentiment(
    markets: string[],
    timeframe: string = '24h'
  ): Promise<GrokResponse> {
    const prompt = `Проанализируй текущее настроение рынка для ${markets.join(', ')} за период ${timeframe}. 
    Учти последние новости, технические индикаторы и поведение инвесторов. 
    Предоставь краткий анализ с оценкой настроения от 1 до 10 (где 1 - крайне негативное, 10 - крайне позитивное).`;

    return this.generateContent(
      prompt,
      `Ты эксперт по анализу рыночных настроений с доступом к актуальным данным. 
      Анализируй не только технические факторы, но и социальные медиа, новости и поведение крупных игроков.`,
      {
        model: "grok-beta",
        temperature: 0.4,
        maxTokens: 800
      }
    );
  }

  async generateViralContent(
    platform: 'tiktok' | 'instagram' | 'youtube' | 'telegram',
    niche: string,
    trend: string
  ): Promise<GrokResponse> {
    const platformStyles = {
      tiktok: 'короткий, цепляющий, с хуками в первые 3 секунды',
      instagram: 'визуально привлекательный, с эмодзи и хештегами',
      youtube: 'подробный, образовательный, с интригующим заголовком',
      telegram: 'информативный, прямой, с конкретными фактами'
    };

    const prompt = `Создай вирусный контент для ${platform} в нише ${niche}, используя тренд "${trend}".
    Стиль: ${platformStyles[platform]}
    Контент должен быть уникальным, захватывающим и побуждать к действию.`;

    return this.generateContent(
      prompt,
      `Ты эксперт по созданию вирусного контента, который понимает алгоритмы социальных сетей и психологию пользователей. 
      Создавай контент, который естественно привлекает внимание и вызывает эмоциональный отклик.`,
      {
        model: "grok-beta",
        temperature: 0.8,
        maxTokens: 1200
      }
    );
  }

  async compareWithOtherAI(prompt: string): Promise<{
    grokResponse: GrokResponse;
    comparison: string;
  }> {
    const grokResponse = await this.generateContent(prompt);
    
    const comparisonPrompt = `Сравни свой предыдущий ответ с тем, что мог бы сгенерировать GPT или Claude. 
    В чем уникальность подхода Grok? Какие преимущества и особенности?`;

    const comparison = await this.generateContent(
      comparisonPrompt,
      `Ты Grok - AI с уникальным подходом к анализу и генерации контента. 
      Объясни свои отличительные особенности объективно и честно.`,
      {
        temperature: 0.5,
        maxTokens: 500
      }
    );

    return {
      grokResponse,
      comparison: comparison.content
    };
  }

  getStatus(): {
    available: boolean;
    model: string;
    features: string[];
    diagnostics?: {
      apiKeyExists: boolean;
      apiKeyFormat: boolean;
      endpoint: string;
      initialized: boolean;
    };
  } {
    const grokApiKey = process.env.GROK_API_KEY;
    
    return {
      available: this.isAvailable(),
      model: this.isAvailable() ? "grok-beta" : "unavailable",
      features: this.isAvailable() ? [
        "Контент-генерация",
        "Анализ рынков", 
        "Вирусный контент",
        "Образовательные материалы",
        "Сравнительный анализ"
      ] : [],
      diagnostics: {
        apiKeyExists: !!grokApiKey,
        apiKeyFormat: grokApiKey?.startsWith('grok-') || false,
        endpoint: "https://api.x.ai/v1",
        initialized: this.grok !== null
      }
    };
  }
}

export const grokService = new GrokService();
