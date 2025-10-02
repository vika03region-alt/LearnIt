
import OpenAI from 'openai';
import { storage } from '../storage';

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

interface VisualContentResult {
  type: 'image' | 'video' | 'audio';
  url?: string;
  prompt: string;
  metadata: any;
  cost: number;
}

class VisualContentAI {
  // === ГЕНЕРАЦИЯ ИЗОБРАЖЕНИЙ (DALL-E 3) ===
  
  async generateChannelCover(
    niche: string,
    style: 'минимализм' | 'футуризм' | 'профессионал' | 'агрессивный' | 'luxury'
  ): Promise<VisualContentResult> {
    const stylePrompts = {
      'минимализм': 'clean minimalist design, simple geometric shapes, professional color palette',
      'футуризм': 'futuristic cyberpunk aesthetic, neon colors, digital tech elements',
      'профессионал': 'corporate professional design, elegant typography, business colors',
      'агрессивный': 'bold aggressive design, dynamic shapes, high contrast colors',
      'luxury': 'luxury premium design, gold accents, sophisticated elegance'
    };

    const prompt = `Create a professional Telegram channel cover for ${niche} trading/finance channel. Style: ${stylePrompts[style]}. Include subtle chart patterns, bull/bear symbolism. High quality, 1200x400px aspect ratio. No text, only visual elements.`;

    try {
      const response = await openai.images.generate({
        model: "dall-e-3",
        prompt,
        n: 1,
        size: "1792x1024",
        quality: "hd",
        style: "vivid"
      });

      return {
        type: 'image',
        url: response.data[0].url,
        prompt,
        metadata: {
          niche,
          style,
          size: "1792x1024",
          revised_prompt: response.data[0].revised_prompt
        },
        cost: 0.12 // DALL-E 3 HD cost
      };
    } catch (error) {
      throw new Error(`Failed to generate channel cover: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  async generatePostIllustration(
    topic: string,
    mood: 'bullish' | 'bearish' | 'neutral' | 'explosive' | 'cautious'
  ): Promise<VisualContentResult> {
    const moodPrompts = {
      'bullish': 'optimistic green upward trending, bull market energy, prosperity vibes',
      'bearish': 'cautious red downward trending, bear market warning, serious tone',
      'neutral': 'balanced analysis, professional charts, data-driven',
      'explosive': 'explosive breakthrough moment, rocket launch, dramatic momentum',
      'cautious': 'risk warning, danger signals, protective shields'
    };

    const prompt = `Create trading/finance illustration for ${topic}. Mood: ${moodPrompts[mood]}. Modern flat design, suitable for social media post. Include relevant financial symbols, charts or metaphors. No text.`;

    try {
      const response = await openai.images.generate({
        model: "dall-e-3",
        prompt,
        n: 1,
        size: "1024x1024",
        quality: "standard",
        style: "vivid"
      });

      return {
        type: 'image',
        url: response.data[0].url,
        prompt,
        metadata: {
          topic,
          mood,
          size: "1024x1024"
        },
        cost: 0.04
      };
    } catch (error) {
      throw new Error(`Failed to generate post illustration: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  async generateMeme(
    tradingScenario: string,
    humor: 'sarcastic' | 'relatable' | 'dark' | 'wholesome'
  ): Promise<VisualContentResult> {
    const humorStyles = {
      'sarcastic': 'sarcastic trader humor, exaggerated reactions, mocking market behavior',
      'relatable': 'relatable trader struggles, everyday trading pain, common mistakes',
      'dark': 'dark trader humor, portfolio destruction, loss memes',
      'wholesome': 'wholesome trading community, supportive vibes, learning together'
    };

    const prompt = `Create a trading meme about ${tradingScenario}. Style: ${humorStyles[humor]}. Visual metaphor or scenario illustration. Meme-friendly composition, relatable to traders. No text needed.`;

    try {
      const response = await openai.images.generate({
        model: "dall-e-3",
        prompt,
        n: 1,
        size: "1024x1024",
        quality: "standard"
      });

      return {
        type: 'image',
        url: response.data[0].url,
        prompt,
        metadata: {
          scenario: tradingScenario,
          humor,
          viral_potential: 'high'
        },
        cost: 0.04
      };
    } catch (error) {
      throw new Error(`Failed to generate meme: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  async generateInfographic(
    data: {
      title: string;
      keyPoints: string[];
      statistics: { label: string; value: string }[];
    }
  ): Promise<VisualContentResult> {
    const prompt = `Create infographic visualization: "${data.title}". 
    Key points: ${data.keyPoints.join(', ')}. 
    Statistics: ${data.statistics.map(s => `${s.label}: ${s.value}`).join(', ')}. 
    Modern minimalist infographic design, data visualization, professional business style, clear hierarchy.`;

    try {
      const response = await openai.images.generate({
        model: "dall-e-3",
        prompt,
        n: 1,
        size: "1024x1792", // вертикальная для сторис
        quality: "hd"
      });

      return {
        type: 'image',
        url: response.data[0].url,
        prompt,
        metadata: {
          title: data.title,
          format: 'infographic',
          orientation: 'vertical'
        },
        cost: 0.12
      };
    } catch (error) {
      throw new Error(`Failed to generate infographic: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  // === ГЕНЕРАЦИЯ АУДИО (TTS для озвучки) ===
  
  async generateVoiceover(
    text: string,
    voice: 'alloy' | 'echo' | 'fable' | 'onyx' | 'nova' | 'shimmer' = 'onyx',
    speed: number = 1.0
  ): Promise<VisualContentResult> {
    try {
      const mp3 = await openai.audio.speech.create({
        model: "tts-1-hd",
        voice: voice,
        input: text,
        speed: speed,
      });

      const buffer = Buffer.from(await mp3.arrayBuffer());
      const base64Audio = buffer.toString('base64');

      return {
        type: 'audio',
        url: `data:audio/mp3;base64,${base64Audio}`,
        prompt: text,
        metadata: {
          voice,
          speed,
          length_chars: text.length,
          estimated_duration: Math.ceil(text.length / 15) // примерно 15 символов в секунду
        },
        cost: 0.03 // за 1k символов
      };
    } catch (error) {
      throw new Error(`Failed to generate voiceover: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  // === МАССОВАЯ ГЕНЕРАЦИЯ КОНТЕНТА ===
  
  async generateContentPack(
    campaign: {
      niche: string;
      posts: number;
      style: string;
    }
  ): Promise<{
    covers: VisualContentResult[];
    illustrations: VisualContentResult[];
    memes: VisualContentResult[];
    totalCost: number;
  }> {
    const covers: VisualContentResult[] = [];
    const illustrations: VisualContentResult[] = [];
    const memes: VisualContentResult[] = [];

    // Генерируем обложку
    const cover = await this.generateChannelCover(campaign.niche, campaign.style as any);
    covers.push(cover);

    // Генерируем иллюстрации для постов
    const topics = [
      'market analysis',
      'trading strategy',
      'risk management',
      'technical analysis',
      'crypto trends'
    ];
    
    for (let i = 0; i < Math.min(campaign.posts, 5); i++) {
      const illustration = await this.generatePostIllustration(
        topics[i],
        ['bullish', 'bearish', 'neutral'][Math.floor(Math.random() * 3)] as any
      );
      illustrations.push(illustration);
    }

    // Генерируем мемы
    const memeScenarios = [
      'when your stop loss hits',
      'hodling through the dip',
      'checking portfolio at 3am',
      'market manipulation theories'
    ];

    for (let i = 0; i < 2; i++) {
      const meme = await this.generateMeme(
        memeScenarios[i],
        ['sarcastic', 'relatable'][i] as any
      );
      memes.push(meme);
    }

    const totalCost = [
      ...covers,
      ...illustrations,
      ...memes
    ].reduce((sum, item) => sum + item.cost, 0);

    return {
      covers,
      illustrations,
      memes,
      totalCost
    };
  }

  // === ГЕНЕРАЦИЯ ВИДЕО-СКРИПТОВ (для Synthesia/HeyGen) ===
  
  async generateVideoScript(
    topic: string,
    duration: number = 60,
    tone: 'professional' | 'casual' | 'educational' | 'promotional'
  ): Promise<{
    script: string;
    scenes: { text: string; duration: number; visual_cue: string }[];
    voiceover_instructions: string;
  }> {
    const toneStyles = {
      'professional': 'Formal business tone, confident delivery, industry expertise',
      'casual': 'Friendly conversational tone, relatable language, approachable',
      'educational': 'Clear instructive tone, step-by-step explanations, patient',
      'promotional': 'Enthusiastic energetic tone, compelling calls-to-action, exciting'
    };

    const prompt = `Create a ${duration}-second video script about ${topic} for trading/finance channel.
    Tone: ${toneStyles[tone]}.
    
    Structure:
    1. Hook (3-5 sec) - attention grabbing opening
    2. Main content (40-50 sec) - key information
    3. CTA (5-10 sec) - call to action
    
    Format as JSON with:
    - full_script: complete text
    - scenes: array of {text, duration, visual_cue}
    - voiceover_instructions: delivery notes`;

    try {
      const response = await openai.chat.completions.create({
        model: "gpt-4",
        messages: [
          {
            role: "system",
            content: "You are a professional video scriptwriter for finance content. Create engaging, concise scripts optimized for AI avatar presentation."
          },
          {
            role: "user",
            content: prompt
          }
        ],
        response_format: { type: "json_object" }
      });

      const result = JSON.parse(response.choices[0].message.content || '{}');
      
      return {
        script: result.full_script || '',
        scenes: result.scenes || [],
        voiceover_instructions: result.voiceover_instructions || ''
      };
    } catch (error) {
      throw new Error(`Failed to generate video script: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  // === CANVA-СТИЛЬ ШАБЛОНЫ (текстовые инструкции для дизайна) ===
  
  async generateDesignTemplate(
    platform: 'instagram_story' | 'instagram_post' | 'telegram_post' | 'youtube_thumbnail',
    content: string
  ): Promise<{
    layout: string;
    colors: string[];
    typography: string;
    elements: string[];
    composition: string;
  }> {
    const platformSpecs = {
      'instagram_story': { size: '1080x1920', aspect: '9:16', format: 'vertical story' },
      'instagram_post': { size: '1080x1080', aspect: '1:1', format: 'square post' },
      'telegram_post': { size: '1200x628', aspect: '1.91:1', format: 'wide post' },
      'youtube_thumbnail': { size: '1280x720', aspect: '16:9', format: 'horizontal thumbnail' }
    };

    const spec = platformSpecs[platform];
    
    const prompt = `Design a ${spec.format} template for: "${content}"
    Platform: ${platform}
    Size: ${spec.size}
    
    Provide design blueprint with:
    - Layout structure and composition
    - Color palette (HEX codes)
    - Typography recommendations
    - Visual elements to include
    - Overall composition strategy
    
    Make it modern, engaging, and optimized for ${platform}.`;

    try {
      const response = await openai.chat.completions.create({
        model: "gpt-4",
        messages: [
          {
            role: "system",
            content: "You are a professional graphic designer specializing in social media templates. Provide detailed design blueprints."
          },
          {
            role: "user",
            content: prompt
          }
        ],
        response_format: { type: "json_object" }
      });

      const result = JSON.parse(response.choices[0].message.content || '{}');
      
      return {
        layout: result.layout || '',
        colors: result.colors || [],
        typography: result.typography || '',
        elements: result.elements || [],
        composition: result.composition || ''
      };
    } catch (error) {
      throw new Error(`Failed to generate design template: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }
}

export const visualContentAI = new VisualContentAI();
