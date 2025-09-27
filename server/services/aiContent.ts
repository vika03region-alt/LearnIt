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
    } catch (error) {
      throw new Error(`Failed to generate AI content: ${error.message}`);
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
      throw new Error(`Failed to analyze content performance: ${error.message}`);
    }
  }
}

export const aiContentService = new AIContentService();
