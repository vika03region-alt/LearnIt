import OpenAI from "openai";

// the newest OpenAI model is "gpt-5" which was released August 7, 2025. do not change this unless explicitly requested by the user
const openai = new OpenAI({ 
  apiKey: process.env.OPENAI_API_KEY || process.env.OPENAI_API_KEY_ENV_VAR || "default_key"
});

export interface AIContentResult {
  content: string;
  tokensUsed: number;
  cost: number;
}

class AIContentService {
  async generateContent(
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
      const cost = this.calculateCost(tokensUsed);

      return {
        content: result.content || '',
        tokensUsed,
        cost,
      };
    } catch (error: any) {
      console.error("OpenAI API Error:", error);
      
      // Handle specific OpenAI errors with detailed messages
      if (error.status === 429 || error.code === 'rate_limit_exceeded') {
        throw new Error('OpenAI rate limit exceeded. Please try again in a few minutes.');
      } else if (error.status === 401 || error.code === 'invalid_api_key') {
        throw new Error('OpenAI API key is invalid or expired.');
      } else if (error.status === 403 || error.code === 'insufficient_quota') {
        throw new Error('OpenAI quota exceeded. Please check your billing.');
      } else if (error.status === 500) {
        throw new Error('OpenAI service is temporarily unavailable. Please try again later.');
      } else if (error.message?.includes('timeout')) {
        throw new Error('Request timed out. Please try again.');
      } else if (error.code === 'context_length_exceeded') {
        throw new Error('Content too long. Please reduce the input size.');
      } else if (error.code === 'invalid_request_error') {
        throw new Error('Invalid request format. Please check your input.');
      }
      
      throw new Error(`Failed to generate AI content: ${error?.message || 'Unknown error'}`);
    }
  }

  async generateTradingSignal(
    pair: string,
    action: string,
    price: number,
    target: number,
    stopLoss: number
  ): Promise<AIContentResult> {
    const prompt = `Generate a trading signal post for ${pair}. Action: ${action}, Entry: ${price}, Target: ${target}, Stop Loss: ${stopLoss}`;
    return this.generateContent(prompt, 'trading_signal', ['instagram', 'telegram', 'tiktok']);
  }

  async generateMarketAnalysis(
    markets: string[],
    timeframe: string,
    keyEvents: string[]
  ): Promise<AIContentResult> {
    const prompt = `Generate market analysis for ${markets.join(', ')} over ${timeframe}. Key events: ${keyEvents.join(', ')}`;
    return this.generateContent(prompt, 'market_analysis', ['youtube', 'instagram']);
  }

  async generateEducationalContent(
    topic: string,
    difficulty: string,
    targetPlatform: string
  ): Promise<AIContentResult> {
    const prompt = `Create educational trading content about ${topic} for ${difficulty} level traders`;
    return this.generateContent(prompt, 'educational', [targetPlatform]);
  }

  // === ПРОФЕССИОНАЛЬНЫЕ ТРЕЙДИНГ AI ИНСТРУМЕНТЫ ===
  
  async generateViralTikTokContent(
    trend: string,
    hooks: string[]
  ): Promise<AIContentResult> {
    const prompt = `Create viral TikTok trading content about ${trend}. Use hooks: ${hooks.join(', ')}. Style: Short, catchy, trend-focused like top trading TikTokers with millions of views.`;
    return this.generateContent(prompt, 'viral_tiktok', ['tiktok']);
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
    return this.generateContent(prompt, 'youtube_analysis', ['youtube']);
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
    return this.generateContent(prompt, 'live_signal', ['telegram', 'instagram']);
  }

  async generateCryptoPredictions(
    timeframe: '2025' | '2026' | 'короткосрочно',
    coins: string[],
    reasoning: string[]
  ): Promise<AIContentResult> {
    const prompt = `Create "Топ ${coins.length} монеты на ${timeframe}" prediction content. Coins: ${coins.join(', ')}. Reasoning: ${reasoning.join('. ')}. Style: Engaging but responsible with disclaimers.`;
    return this.generateContent(prompt, 'crypto_predictions', ['youtube', 'instagram', 'tiktok']);
  }

  async generateMemeCoinAnalysis(
    coin: string,
    metrics: {
      holders: number;
      liquidity: number;
      socialSentiment: string;
      riskLevel: 'LOW' | 'MEDIUM' | 'HIGH' | 'EXTREME';
    }
  ): Promise<AIContentResult> {
    const prompt = `Analyze memecoin ${coin}. Holders: ${metrics.holders}, Liquidity: $${metrics.liquidity}, Sentiment: ${metrics.socialSentiment}, Risk: ${metrics.riskLevel}. Create engaging but cautious analysis.`;
    return this.generateContent(prompt, 'memecoin_analysis', ['tiktok', 'instagram']);
  }

  async generateForexEducation(
    topic: string,
    experience: 'новичок' | 'средний' | 'продвинутый',
    focus: 'психология' | 'теханализ' | 'фундаментал' | 'риск-менеджмент'
  ): Promise<AIContentResult> {
    const prompt = `Create forex education about ${topic} for ${experience} traders focusing on ${focus}. Make it practical and actionable like top forex educators.`;
    return this.generateContent(prompt, 'forex_education', ['youtube', 'instagram']);
  }

  // === АНАЛИЗ ТРЕНДОВ И ОПТИМИЗАЦИЯ ===
  
  async analyzeTrendingTopics(
    platform: 'tiktok' | 'youtube' | 'instagram',
    niche: 'crypto' | 'forex' | 'stocks' | 'general'
  ): Promise<{
    trending_topics: string[];
    viral_patterns: string[];
    content_opportunities: string[];
    competitor_insights: string[];
  }> {
    try {
      const prompt = `Analyze current trending topics on ${platform} for ${niche} trading content. Based on data from top performing channels like Rayner Teo (18.3M), Coin Bureau (2.52M), identify viral patterns and content opportunities.`;
      
      const response = await openai.chat.completions.create({
        model: "gpt-5",
        messages: [
          { role: "system", content: "You are a social media trend analyst specializing in trading content. Analyze current trends and provide actionable insights." },
          { role: "user", content: prompt }
        ],
        response_format: { type: "json_object" },
      });

      return JSON.parse(response.choices[0].message.content || '{}');
    } catch (error) {
      throw new Error(`Failed to analyze trending topics: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  async optimizeHashtags(
    content: string,
    platform: string,
    targetAudience: 'новички' | 'опытные' | 'смешанная'
  ): Promise<{
    recommended_hashtags: string[];
    trending_hashtags: string[];
    niche_hashtags: string[];
    engagement_prediction: number;
  }> {
    try {
      const prompt = `Optimize hashtags for this ${platform} trading content: "${content}". Target audience: ${targetAudience}. Use data from trending hashtags: #crypto (30B views), #bitcoin (20B), #forex (7B), #trading (4B).`;
      
      const response = await openai.chat.completions.create({
        model: "gpt-5",
        messages: [
          { role: "system", content: "You are a hashtag optimization expert for trading content. Recommend hashtags that maximize reach and engagement." },
          { role: "user", content: prompt }
        ],
        response_format: { type: "json_object" },
      });

      return JSON.parse(response.choices[0].message.content || '{}');
    } catch (error) {
      throw new Error(`Failed to optimize hashtags: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  async generateCompetitorAnalysis(
    competitors: string[],
    analysisType: 'content_gaps' | 'successful_patterns' | 'engagement_strategies'
  ): Promise<{
    insights: string[];
    opportunities: string[];
    recommendations: string[];
  }> {
    try {
      const prompt = `Analyze competitors: ${competitors.join(', ')} for ${analysisType}. Focus on trading content strategies used by top channels like Rayner Teo, Coin Bureau, The Trading Channel.`;
      
      const response = await openai.chat.completions.create({
        model: "gpt-5",
        messages: [
          { role: "system", content: "You are a competitive analysis expert for trading social media. Provide actionable insights for content strategy." },
          { role: "user", content: prompt }
        ],
        response_format: { type: "json_object" },
      });

      return JSON.parse(response.choices[0].message.content || '{}');
    } catch (error) {
      throw new Error(`Failed to generate competitor analysis: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  async generateHookLibrary(
    contentType: 'video_intro' | 'post_opener' | 'story_hook',
    emotion: 'curiosity' | 'urgency' | 'excitement' | 'fear_of_missing_out'
  ): Promise<{
    hooks: string[];
    examples: string[];
    usage_tips: string[];
  }> {
    try {
      const prompt = `Generate ${contentType} hooks for trading content that trigger ${emotion}. Base on successful patterns from viral trading content.`;
      
      const response = await openai.chat.completions.create({
        model: "gpt-5",
        messages: [
          { role: "system", content: "You are a copywriting expert specializing in engaging trading content hooks that drive clicks and engagement." },
          { role: "user", content: prompt }
        ],
        response_format: { type: "json_object" },
      });

      return JSON.parse(response.choices[0].message.content || '{}');
    } catch (error) {
      throw new Error(`Failed to generate hook library: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  private buildSystemPrompt(contentType: string, targetPlatforms: string[]): string {
    let basePrompt = `You are a professional forex and crypto trading content creator. Generate engaging, accurate, and educational trading content.`;
    
    // Platform-specific guidelines
    const platformGuidelines = targetPlatforms.map(platform => {
      switch (platform) {
        case 'instagram':
          return 'Instagram: Use hashtags, emoji, keep under 2200 characters, visually appealing';
        case 'tiktok':
          return 'TikTok: Short, catchy, trend-focused, use popular trading hashtags';
        case 'youtube':
          return 'YouTube: Detailed, educational, can be longer form';
        case 'telegram':
          return 'Telegram: Direct, informative, can include technical details';
        default:
          return `${platform}: Professional and engaging`;
      }
    }).join('. ');

    // Content type specific instructions
    let contentInstructions = '';
    switch (contentType) {
      case 'trading_signal':
        contentInstructions = 'Create a clear trading signal with entry, target, and stop loss. Include risk warning and market context.';
        break;
      case 'market_analysis':
        contentInstructions = 'Provide comprehensive market analysis with technical and fundamental insights.';
        break;
      case 'educational':
        contentInstructions = 'Create educational content that teaches trading concepts clearly and practically.';
        break;
      case 'motivational':
        contentInstructions = 'Generate motivational trading content that inspires discipline and proper risk management.';
        break;
      case 'viral_tiktok':
        contentInstructions = 'Create viral TikTok content with hooks, trending sounds reference, and engaging format. Keep under 150 characters for captions.';
        break;
      case 'youtube_analysis':
        contentInstructions = 'Create comprehensive YouTube analysis with detailed market insights, multiple timeframes, and educational value. Include video structure suggestions.';
        break;
      case 'live_signal':
        contentInstructions = 'Generate live trading signal with professional formatting, risk levels, and immediate actionability. Include confidence rating.';
        break;
      case 'crypto_predictions':
        contentInstructions = 'Create responsible crypto predictions with solid reasoning, disclaimers, and balanced perspective. Avoid guaranteed returns language.';
        break;
      case 'memecoin_analysis':
        contentInstructions = 'Analyze memecoin with extreme caution, highlight risks, provide objective data, and emphasize speculative nature.';
        break;
      case 'forex_education':
        contentInstructions = 'Create practical forex education with real examples, step-by-step guidance, and applicable techniques.';
        break;
      default:
        contentInstructions = 'Create engaging trading-related content.';
    }

    return `${basePrompt}

${contentInstructions}

Platform guidelines: ${platformGuidelines}

IMPORTANT: Always include proper risk warnings and disclaimers. Never give financial advice, only educational content and analysis.

Return your response as JSON with this format:
{
  "content": "Your generated content here"
}`;
  }

  private calculateCost(tokens: number): number {
    // GPT-5 pricing (estimated based on typical OpenAI pricing)
    const costPerToken = 0.00003; // $0.03 per 1K tokens
    return tokens * costPerToken;
  }

  async analyzeContentPerformance(content: string, platform: string): Promise<{
    engagement_prediction: number;
    improvement_suggestions: string[];
  }> {
    try {
      const response = await openai.chat.completions.create({
        model: "gpt-5",
        messages: [
          {
            role: "system",
            content: `Analyze the potential performance of this social media content for ${platform}. Consider engagement factors, hashtag effectiveness, content quality, and platform-specific best practices. Provide an engagement prediction score (1-10) and specific improvement suggestions.`
          },
          {
            role: "user",
            content: content
          }
        ],
        response_format: { type: "json_object" },
      });

      return JSON.parse(response.choices[0].message.content || '{}');
    } catch (error) {
      throw new Error(`Failed to analyze content performance: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }
}

export const aiContentService = new AIContentService();
