import OpenAI from 'openai';

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY || '',
});

// API ключи для видео-сервисов
const HEYGEN_API_KEY = process.env.HEYGEN_API_KEY || '';
const SYNTHESIA_API_KEY = process.env.SYNTHESIA_API_KEY || '';

// Типы для AI-видео
export interface VideoScene {
  text: string;
  duration: number;
  visualCue: string;
  avatarId?: string;
  voiceId?: string;
}

export interface VideoConfig {
  provider: 'heygen' | 'synthesia';
  avatarId: string;
  voiceId: string;
  language: string;
  dimension?: { width: number; height: number };
  background?: string;
}

export interface VideoGenerationResult {
  videoId: string;
  status: 'queued' | 'processing' | 'completed' | 'failed';
  videoUrl?: string;
  thumbnailUrl?: string;
  duration?: number;
  cost: number;
  estimatedTime?: string;
  provider: string;
}

class AIVideoService {
  
  // === ГЕНЕРАЦИЯ ВИДЕО-СКРИПТА С AI ===
  async generateVideoScript(
    topic: string,
    duration: number = 60,
    tone: 'professional' | 'casual' | 'educational' | 'promotional' = 'professional'
  ): Promise<{
    script: string;
    scenes: VideoScene[];
    voiceoverInstructions: string;
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
        scenes: (result.scenes || []).map((s: any) => ({
          text: s.text,
          duration: s.duration,
          visualCue: s.visual_cue
        })),
        voiceoverInstructions: result.voiceover_instructions || ''
      };
    } catch (error) {
      throw new Error(`Failed to generate video script: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  // === HEYGEN API: ГЕНЕРАЦИЯ ВИДЕО ===
  async generateWithHeyGen(
    script: string,
    config: Partial<VideoConfig> = {}
  ): Promise<VideoGenerationResult> {
    if (!HEYGEN_API_KEY) {
      throw new Error('HeyGen API key not configured. Please set HEYGEN_API_KEY environment variable.');
    }

    const defaultConfig: VideoConfig = {
      provider: 'heygen',
      avatarId: config.avatarId || 'Daisy-inskirt-20220818', // Стандартный аватар HeyGen
      voiceId: config.voiceId || '2d5b0e6cf36f460aa7fc47e3eee4ba54', // Стандартный голос
      language: config.language || 'en',
      dimension: config.dimension || { width: 1280, height: 720 },
      background: config.background || '#ffffff'
    };

    try {
      const response = await fetch('https://api.heygen.com/v2/video/generate', {
        method: 'POST',
        headers: {
          'X-Api-Key': HEYGEN_API_KEY,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          video_inputs: [{
            character: {
              type: 'avatar',
              avatar_id: defaultConfig.avatarId,
              avatar_style: 'normal'
            },
            voice: {
              type: 'text',
              input_text: script,
              voice_id: defaultConfig.voiceId
            },
            background: {
              type: 'color',
              value: defaultConfig.background
            }
          }],
          dimension: defaultConfig.dimension,
          test: false
        })
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(`HeyGen API error: ${error.message || response.statusText}`);
      }

      const data = await response.json();

      return {
        videoId: data.data.video_id,
        status: 'queued',
        cost: 1.0, // 1 кредит HeyGen ≈ $1
        estimatedTime: '3-10 minutes',
        provider: 'HeyGen'
      };
    } catch (error) {
      throw new Error(`HeyGen video generation failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  // === SYNTHESIA API: ГЕНЕРАЦИЯ ВИДЕО ===
  async generateWithSynthesia(
    script: string,
    config: Partial<VideoConfig> = {}
  ): Promise<VideoGenerationResult> {
    if (!SYNTHESIA_API_KEY) {
      throw new Error('Synthesia API key not configured. Please set SYNTHESIA_API_KEY environment variable.');
    }

    const defaultConfig: VideoConfig = {
      provider: 'synthesia',
      avatarId: config.avatarId || 'anna_costume1_cameraA',
      voiceId: config.voiceId || 'en-US-Neural2-F',
      language: config.language || 'en',
      background: config.background || 'green_screen'
    };

    try {
      const response = await fetch('https://api.synthesia.io/v2/videos', {
        method: 'POST',
        headers: {
          'Authorization': SYNTHESIA_API_KEY,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          title: `AI Video ${Date.now()}`,
          input: [{
            script: script,
            avatar: defaultConfig.avatarId,
            background: defaultConfig.background,
            voice: defaultConfig.voiceId
          }]
        })
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(`Synthesia API error: ${error.message || response.statusText}`);
      }

      const data = await response.json();

      return {
        videoId: data.id,
        status: 'queued',
        cost: 0.30, // ~$0.30 за 1 минуту в Synthesia
        estimatedTime: '3-5 minutes',
        provider: 'Synthesia'
      };
    } catch (error) {
      throw new Error(`Synthesia video generation failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  // === ПРОВЕРКА СТАТУСА ВИДЕО ===
  async checkVideoStatus(videoId: string, provider: 'heygen' | 'synthesia'): Promise<VideoGenerationResult> {
    if (provider === 'heygen') {
      const response = await fetch(`https://api.heygen.com/v2/videos/${videoId}`, {
        headers: {
          'X-Api-Key': HEYGEN_API_KEY
        }
      });

      const data = await response.json();
      
      return {
        videoId: data.data.video_id,
        status: data.data.status,
        videoUrl: data.data.video_url,
        thumbnailUrl: data.data.thumbnail_url,
        duration: data.data.duration,
        cost: 1.0,
        provider: 'HeyGen'
      };
    } else {
      const response = await fetch(`https://api.synthesia.io/v2/videos/${videoId}`, {
        headers: {
          'Authorization': SYNTHESIA_API_KEY
        }
      });

      const data = await response.json();
      
      return {
        videoId: data.id,
        status: data.status,
        videoUrl: data.download,
        thumbnailUrl: data.thumbnail,
        duration: data.duration,
        cost: 0.30,
        provider: 'Synthesia'
      };
    }
  }

  // === ПОЛУЧИТЬ СПИСОК АВАТАРОВ ===
  async getAvailableAvatars(provider: 'heygen' | 'synthesia'): Promise<any[]> {
    if (provider === 'heygen') {
      const response = await fetch('https://api.heygen.com/v2/avatars', {
        headers: {
          'X-Api-Key': HEYGEN_API_KEY
        }
      });
      const data = await response.json();
      return data.data.avatars || [];
    } else {
      const response = await fetch('https://api.synthesia.io/v2/avatars', {
        headers: {
          'Authorization': SYNTHESIA_API_KEY
        }
      });
      const data = await response.json();
      return data.avatars || [];
    }
  }

  // === ПОЛУЧИТЬ СПИСОК ГОЛОСОВ ===
  async getAvailableVoices(provider: 'heygen' | 'synthesia'): Promise<any[]> {
    if (provider === 'heygen') {
      const response = await fetch('https://api.heygen.com/v2/voices', {
        headers: {
          'X-Api-Key': HEYGEN_API_KEY
        }
      });
      const data = await response.json();
      return data.data.voices || [];
    } else {
      const response = await fetch('https://api.synthesia.io/v2/voices', {
        headers: {
          'Authorization': SYNTHESIA_API_KEY
        }
      });
      const data = await response.json();
      return data.voices || [];
    }
  }

  // === AUTO PIPELINE: ТЕКСТ → СКРИПТ → ВИДЕО ===
  async autoGenerateVideo(
    topic: string,
    provider: 'heygen' | 'synthesia' = 'heygen',
    config?: Partial<VideoConfig>
  ): Promise<{
    script: any;
    video: VideoGenerationResult;
  }> {
    // 1. Генерируем скрипт
    const scriptData = await this.generateVideoScript(topic, 60, 'professional');

    // 2. Генерируем видео
    const video = provider === 'heygen'
      ? await this.generateWithHeyGen(scriptData.script, config)
      : await this.generateWithSynthesia(scriptData.script, config);

    return {
      script: scriptData,
      video
    };
  }
}

export const aiVideoService = new AIVideoService();
