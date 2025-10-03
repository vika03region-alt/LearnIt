import OpenAI from "openai";

// GPT-5 используется ТОЛЬКО для критичных задач: торговые сигналы, технический анализ, образовательный контент
// Для массового контента (вирусные посты, хештеги, идеи) используется Grok AI (см. coreAITools.ts)
const openai = new OpenAI({ 
  apiKey: process.env.OPENAI_API_KEY || process.env.OPENAI_API_KEY_ENV_VAR || "default_key"
});

// Grok AI для массовых задач (80% - дешевле в 100x раз)
const grok = new OpenAI({
  apiKey: process.env.XAI_API_KEY || '',
  baseURL: 'https://api.x.ai/v1'
});

export interface AIContentResult {
  content: string;
  tokensUsed: number;
  cost: number;
}

class AIContentService {
  // === КРИТИЧНЫЕ ЗАДАЧИ (GPT-5) - ВЫСОКАЯ ТОЧНОСТЬ ОБЯЗАТЕЛЬНА ===
  
  async generateTradingSignal(
    pair: string,
    action: string,
    price: number,
    target: number,
    stopLoss: number
  ): Promise<AIContentResult> {
    const prompt = `Generate a trading signal post for ${pair}. Action: ${action}, Entry: ${price}, Target: ${target}, Stop Loss: ${stopLoss}`;
    return this.generatePremiumContent(prompt, 'trading_signal', ['instagram', 'telegram', 'tiktok']);
  }

  async generateMarketAnalysis(
    markets: string[],
    timeframe: string,
    keyEvents: string[]
  ): Promise<AIContentResult> {
    const prompt = `Generate market analysis for ${markets.join(', ')} over ${timeframe}. Key events: ${keyEvents.join(', ')}`;
    return this.generatePremiumContent(prompt, 'market_analysis', ['youtube', 'instagram']);
  }

  async generateEducationalContent(
    topic: string,
    difficulty: string,
    targetPlatform: string
  ): Promise<AIContentResult> {
    const prompt = `Create educational trading content about ${topic} for ${difficulty} level traders`;
    return this.generatePremiumContent(prompt, 'educational', [targetPlatform]);
  }

  async generateLiveSignalPost(
    symbol: string,
    action: 'BUY' | 'SELL',
    entry: number,
    targets: number[],
    stopLoss: number,
    leverage?: number,
    confidence: number = 8
  ): Promise<AIContentResult> {
    const prompt = `Generate live trading signal post for ${symbol}. Action: ${action}, Entry: ${entry}, Targets: ${targets.join(', ')}, SL: ${stopLoss}${leverage ? `, Leverage: ${leverage}x` : ''}. Confidence: ${confidence}/10. Style: Professional yet engaging for social media.`;
    return this.generatePremiumContent(prompt, 'live_signal', ['telegram', 'instagram']);
  }

  // === ПРЕМИУМ ГЕНЕРАЦИЯ (GPT-5) ===
  private async generatePremiumContent(
    prompt: string,
    contentType: string,
    targetPlatforms: string[]
  ): Promise<AIContentResult> {
    try {
      const systemPrompt = this.buildSystemPrompt(contentType, targetPlatforms);
      
      const response = await openai.chat.completions.create({
        model: "gpt-5",
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: prompt }
        ],
        response_format: { type: "json_object" },
      });

      const result = JSON.parse(response.choices[0].message.content || '{}');
      const tokensUsed = response.usage?.total_tokens || 0;
      const cost = this.calculateCost(tokensUsed, 'gpt-5');

      return {
        content: result.content || '',
        tokensUsed,
        cost,
      };
    } catch (error) {
      throw new Error(`Failed to generate premium content: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  // === МАССОВЫЕ ЗАДАЧИ (GROK AI) - ДЕШЕВО И БЫСТРО ===
  
  async generateViralTikTokContent(
    trend: string,
    hooks: string[]
  ): Promise<AIContentResult> {
    const prompt = `Create viral TikTok trading content about ${trend}. Use hooks: ${hooks.join(', ')}. Style: Short, catchy, trend-focused like top trading TikTokers with millions of views.`;
    return this.generateMassContent(prompt, 'viral_tiktok', ['tiktok']);
  }

  async generateYouTubeAnalysis(
    markets: string[],
    style: 'rayner_teo' | 'coin_bureau' | 'trading_channel'
  ): Promise<AIContentResult> {
    const stylePrompts = {
      rayner_teo: 'Price action focused, quality over quantity, practical approach like Rayner Teo (18.3M subscribers)',
      coin_bureau: 'Deep crypto analytics, comprehensive research like Coin Bureau (2.52M subscribers)', 
      trading_channel: 'Step-by-step forex tutorials, chart patterns like The Trading Channel (2.38M subscribers)'
    };
    
    const prompt = `Create YouTube market analysis for ${markets.join(', ')} in the style of ${stylePrompts[style]}`;
    return this.generateMassContent(prompt, 'youtube_analysis', ['youtube']);
  }

  async generateCryptoPredictions(
    timeframe: '2025' | '2026' | 'короткосрочно',
    coins: string[],
    reasoning: string[]
  ): Promise<AIContentResult> {
    const prompt = `Create "Топ ${coins.length} монеты на ${timeframe}" prediction content. Coins: ${coins.join(', ')}. Reasoning: ${reasoning.join('. ')}. Style: Engaging but responsible with disclaimers.`;
    return this.generateMassContent(prompt, 'crypto_predictions', ['youtube', 'instagram', 'tiktok']);
  }

  async generateMemeCoinAnalysis(
    coin: string,
    metrics: {
      holders: number;
      liquidity: number;
      volume24h: number;
      socialMentions: number;
    }
  ): Promise<AIContentResult> {
    const prompt = `Analyze meme coin ${coin}: ${metrics.holders} holders, $${metrics.liquidity} liquidity, $${metrics.volume24h} 24h volume, ${metrics.socialMentions} social mentions. Create engaging analysis with risk warnings.`;
    return this.generateMassContent(prompt, 'memecoin_analysis', ['twitter', 'telegram']);
  }

  async generateForexEducation(
    topic: string,
    targetAudience: 'beginner' | 'intermediate' | 'advanced'
  ): Promise<AIContentResult> {
    const prompt = `Create forex education post about ${topic} for ${targetAudience} traders. Style: Clear explanations like The Trading Channel (2.38M subscribers).`;
    return this.generateMassContent(prompt, 'forex_education', ['youtube', 'instagram']);
  }

  // === МАССОВАЯ ГЕНЕРАЦИЯ (GROK AI) ===
  private async generateMassContent(
    prompt: string,
    contentType: string,
    targetPlatforms: string[]
  ): Promise<AIContentResult> {
    try {
      const systemPrompt = this.buildSystemPrompt(contentType, targetPlatforms);
      
      const response = await grok.chat.completions.create({
        model: 'grok-2-latest',
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: prompt }
        ],
        temperature: 0.85,
        max_tokens: 600
      });

      const content = response.choices[0].message.content || '';
      const tokensUsed = response.usage?.total_tokens || 0;
      const cost = this.calculateCost(tokensUsed, 'grok');

      // Пытаемся распарсить как JSON, если не получается - возвращаем plain text
      let parsedContent = content;
      try {
        const jsonContent = JSON.parse(content);
        parsedContent = jsonContent.content || content;
      } catch {
        // Не JSON - оставляем как есть
      }

      return {
        content: parsedContent,
        tokensUsed,
        cost,
      };
    } catch (error) {
      throw new Error(`Failed to generate mass content: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  // === ВСПОМОГАТЕЛЬНЫЕ МЕТОДЫ ===

  async analyzeTrendingTopics(
    niche: string,
    platform: string
  ): Promise<string[]> {
    const prompt = `Analyze trending topics in ${niche} on ${platform}. Return top 10 trending topics.`;
    
    const response = await grok.chat.completions.create({
      model: 'grok-2-latest',
      messages: [{ role: 'user', content: prompt }],
      temperature: 0.7
    });
    
    const content = response.choices[0].message.content || '';
    const topics = content.split('\n').filter(line => line.trim());
    return topics.slice(0, 10);
  }

  async optimizeHashtags(
    content: string,
    platform: string,
    targetAudience: string
  ): Promise<string[]> {
    const prompt = `Generate 5-10 optimal hashtags for this ${platform} post targeting ${targetAudience}:\n\n${content}`;
    
    const response = await grok.chat.completions.create({
      model: 'grok-2-latest',
      messages: [{ role: 'user', content: prompt }],
      temperature: 0.7
    });
    
    const hashtags = (response.choices[0].message.content || '')
      .match(/#\w+/g) || [];
    
    return hashtags.slice(0, 10);
  }

  private buildSystemPrompt(contentType: string, targetPlatforms: string[]): string {
    const platformContext = targetPlatforms.length > 0 
      ? `Target platforms: ${targetPlatforms.join(', ')}. Optimize content for these platforms.`
      : '';
    
    const contentTypePrompts: Record<string, string> = {
      trading_signal: 'You are a professional trading signal provider. Generate clear, actionable trading signals with entry, target, and stop-loss levels. Include risk warnings.',
      market_analysis: 'You are a market analyst. Provide comprehensive market analysis with data-driven insights, technical indicators, and fundamental factors.',
      educational: 'You are a trading educator. Create clear, educational content that helps traders learn and improve. Use simple language and practical examples.',
      live_signal: 'You are a real-time trading signal provider. Generate urgent, actionable signals with high confidence levels.',
      viral_tiktok: 'You are a viral TikTok content creator. Create short, catchy, trend-focused content that drives massive engagement.',
      youtube_analysis: 'You are a YouTube trading channel host. Create in-depth analysis with clear explanations.',
      crypto_predictions: 'You are a crypto analyst. Make data-driven predictions with proper disclaimers.',
      memecoin_analysis: 'You are a memecoin analyst. Analyze metrics objectively with strong risk warnings.',
      forex_education: 'You are a forex educator. Teach forex concepts clearly with practical examples.'
    };

    const systemPrompt = contentTypePrompts[contentType] || 'You are a professional trading content creator.';
    
    return `${systemPrompt}\n\n${platformContext}\n\nFormat response as JSON with: {"content": "your content here"}`;
  }

  private calculateCost(tokens: number, model: 'gpt-5' | 'grok'): number {
    if (model === 'gpt-5') {
      // GPT-5: $1.25/1M input + $10/1M output (примерное соотношение 3:1)
      const inputTokens = tokens * 0.75;
      const outputTokens = tokens * 0.25;
      return (inputTokens * 1.25 / 1000000) + (outputTokens * 10 / 1000000);
    } else {
      // Grok: супер-дешевый (~$0.01/месяц для массовых запросов)
      return tokens * 0.00001 / 1000;
    }
  }
}

export const aiContentService = new AIContentService();
