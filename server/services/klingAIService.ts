import OpenAI from 'openai';

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY || '',
});

// Kling AI API через разные провайдеры
const KLING_API_KEY = process.env.KLING_API_KEY || '';
const KLING_PROVIDER = process.env.KLING_PROVIDER || 'piapi'; // 'fal', 'piapi'

// API endpoints для разных провайдеров (актуализировано 2025)
const API_ENDPOINTS = {
  fal: {
    textToVideo: 'https://fal.run/fal-ai/kling-video/v2.1/standard/text-to-video',
    imageToVideo: 'https://fal.run/fal-ai/kling-video/v2.1/standard/image-to-video',
    status: 'https://fal.run/fal-ai'
  },
  piapi: {
    createTask: 'https://api.piapi.ai/api/v1/task',
    getTask: 'https://api.piapi.ai/api/v1/task'
  }
};

export interface VideoScene {
  text: string;
  duration: number;
  visualCue: string;
}

export interface KlingVideoConfig {
  duration: 5 | 10;
  mode: 'std' | 'pro';
  aspectRatio?: '16:9' | '9:16' | '1:1';
  cfgScale?: number; // 0-1, prompt adherence
  negativePrompt?: string;
}

export interface VideoGenerationResult {
  taskId: string;
  status: 'queued' | 'processing' | 'completed' | 'failed';
  videoUrl?: string;
  thumbnailUrl?: string;
  duration?: number;
  cost: number;
  estimatedTime?: string;
  provider: string;
}

class KlingAIService {
  
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

    const prompt = `Create a ${duration}-second video script about ${topic} for trading/finance social media.
    Tone: ${toneStyles[tone]}.
    
    Create a compelling narrative optimized for short-form video (5-10 seconds).
    
    Structure:
    1. Hook (1-2 sec) - attention grabbing opening
    2. Main content (3-6 sec) - key information with visual action
    3. CTA (1-2 sec) - call to action or conclusion
    
    Format as JSON with:
    - full_script: complete text (under 100 words for 10s video)
    - scenes: array of {text, duration, visual_cue}
    - voiceover_instructions: delivery notes`;

    try {
      const response = await openai.chat.completions.create({
        model: "gpt-4",
        messages: [
          {
            role: "system",
            content: "You are a professional video scriptwriter for finance social media content. Create engaging, concise scripts optimized for platforms like TikTok, Instagram Reels, and YouTube Shorts. Keep it punchy and visual."
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

  // === KLING AI: TEXT-TO-VIDEO ===
  async generateTextToVideo(
    prompt: string,
    config: Partial<KlingVideoConfig> = {}
  ): Promise<VideoGenerationResult> {
    if (!KLING_API_KEY) {
      throw new Error('Kling API key not configured. Please set KLING_API_KEY environment variable.');
    }

    const defaultConfig: KlingVideoConfig = {
      duration: config.duration || 5,
      mode: config.mode || 'std',
      aspectRatio: config.aspectRatio || '16:9',
      cfgScale: config.cfgScale || 0.5,
      negativePrompt: config.negativePrompt || 'blurry, low quality, distorted, text, watermark'
    };

    try {
      let response;
      
      if (KLING_PROVIDER === 'fal') {
        // FAL.ai integration
        response = await fetch(API_ENDPOINTS.fal, {
          method: 'POST',
          headers: {
            'Authorization': `Key ${KLING_API_KEY}`,
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            prompt: prompt,
            duration: defaultConfig.duration.toString(),
            cfg_scale: defaultConfig.cfgScale,
            mode: defaultConfig.mode,
            negative_prompt: defaultConfig.negativePrompt
          })
        });
      } else if (KLING_PROVIDER === 'piapi') {
        // PiAPI integration
        response = await fetch(API_ENDPOINTS.piapi, {
          method: 'POST',
          headers: {
            'X-API-Key': KLING_API_KEY,
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            prompt: prompt,
            duration: defaultConfig.duration,
            mode: defaultConfig.mode,
            aspect_ratio: defaultConfig.aspectRatio
          })
        });
      } else {
        // Pollo AI integration
        response = await fetch(API_ENDPOINTS.pollo, {
          method: 'POST',
          headers: {
            'x-api-key': KLING_API_KEY,
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            input: {
              prompt: prompt,
              negativePrompt: defaultConfig.negativePrompt,
              length: defaultConfig.duration,
              mode: defaultConfig.mode
            }
          })
        });
      }

      if (!response.ok) {
        const error = await response.json();
        throw new Error(`Kling AI API error: ${error.message || response.statusText}`);
      }

      const data = await response.json();

      // Расчет стоимости (fal.ai: $0.25 за 5 сек стандарт, $0.45 про)
      const cost = defaultConfig.mode === 'std' ? 0.25 : 0.45;
      const extraCost = defaultConfig.duration === 10 ? (defaultConfig.mode === 'std' ? 0.05 : 0.09) : 0;

      return {
        taskId: data.request_id || data.task_id || data.id,
        status: 'queued',
        cost: cost + extraCost,
        estimatedTime: '2-3 minutes',
        provider: `Kling AI (${KLING_PROVIDER})`
      };
    } catch (error) {
      throw new Error(`Kling video generation failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  // === KLING AI: IMAGE-TO-VIDEO ===
  async generateImageToVideo(
    imageUrl: string,
    prompt: string,
    config: Partial<KlingVideoConfig> = {}
  ): Promise<VideoGenerationResult> {
    if (!KLING_API_KEY) {
      throw new Error('Kling API key not configured. Please set KLING_API_KEY environment variable.');
    }

    const defaultConfig: KlingVideoConfig = {
      duration: config.duration || 5,
      mode: config.mode || 'std',
      cfgScale: config.cfgScale || 0.5,
      negativePrompt: config.negativePrompt || 'blurry, low quality, distorted'
    };

    try {
      const endpoint = KLING_PROVIDER === 'fal' 
        ? 'https://api.fal.ai/v1/kling-video/v2.1/standard/image-to-video'
        : API_ENDPOINTS[KLING_PROVIDER as keyof typeof API_ENDPOINTS];

      const response = await fetch(endpoint, {
        method: 'POST',
        headers: {
          [KLING_PROVIDER === 'fal' ? 'Authorization' : KLING_PROVIDER === 'piapi' ? 'X-API-Key' : 'x-api-key']: 
            KLING_PROVIDER === 'fal' ? `Key ${KLING_API_KEY}` : KLING_API_KEY,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(
          KLING_PROVIDER === 'fal' ? {
            image_url: imageUrl,
            prompt: prompt,
            duration: defaultConfig.duration.toString(),
            cfg_scale: defaultConfig.cfgScale,
            mode: defaultConfig.mode
          } : {
            input: {
              image: imageUrl,
              prompt: prompt,
              length: defaultConfig.duration,
              mode: defaultConfig.mode
            }
          }
        )
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(`Kling AI API error: ${error.message || response.statusText}`);
      }

      const data = await response.json();

      const cost = defaultConfig.mode === 'std' ? 0.25 : 0.45;
      const extraCost = defaultConfig.duration === 10 ? (defaultConfig.mode === 'std' ? 0.05 : 0.09) : 0;

      return {
        taskId: data.request_id || data.task_id || data.id,
        status: 'queued',
        cost: cost + extraCost,
        estimatedTime: '2-3 minutes',
        provider: `Kling AI (${KLING_PROVIDER})`
      };
    } catch (error) {
      throw new Error(`Kling image-to-video generation failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  // === ПРОВЕРКА СТАТУСА ВИДЕО ===
  async checkVideoStatus(taskId: string): Promise<VideoGenerationResult> {
    if (!KLING_API_KEY) {
      throw new Error('Kling API key not configured.');
    }

    try {
      let endpoint: string;
      let headers: Record<string, string>;

      if (KLING_PROVIDER === 'fal') {
        endpoint = `https://api.fal.ai/v1/tasks/${taskId}`;
        headers = {
          'Authorization': `Key ${KLING_API_KEY}`
        };
      } else if (KLING_PROVIDER === 'piapi') {
        endpoint = `https://api.piapi.ai/kling/task/${taskId}`;
        headers = {
          'X-API-Key': KLING_API_KEY
        };
      } else {
        endpoint = `https://pollo.ai/api/platform/task/${taskId}`;
        headers = {
          'x-api-key': KLING_API_KEY
        };
      }

      const response = await fetch(endpoint, { headers });
      const data = await response.json();

      // Преобразование статуса в унифицированный формат
      let status: VideoGenerationResult['status'] = 'processing';
      if (data.status === 'COMPLETED' || data.state === 'completed') {
        status = 'completed';
      } else if (data.status === 'FAILED' || data.state === 'failed') {
        status = 'failed';
      } else if (data.status === 'PROCESSING' || data.state === 'processing') {
        status = 'processing';
      }

      return {
        taskId,
        status,
        videoUrl: data.video_url || data.output?.video_url || data.result?.video_url,
        thumbnailUrl: data.thumbnail_url || data.output?.thumbnail_url,
        duration: data.duration,
        cost: 0.25, // Уже учтено при создании
        provider: `Kling AI (${KLING_PROVIDER})`
      };
    } catch (error) {
      throw new Error(`Failed to check video status: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  // === AUTO PIPELINE: ТЕКСТ → СКРИПТ → ВИДЕО ===
  async autoGenerateVideo(
    topic: string,
    config?: Partial<KlingVideoConfig>
  ): Promise<{
    script: any;
    video: VideoGenerationResult;
  }> {
    // 1. Генерируем скрипт
    const scriptData = await this.generateVideoScript(topic, 10, 'professional');

    // 2. Создаём промпт для видео из скрипта
    const videoPrompt = `${topic}. ${scriptData.script}. ${scriptData.scenes.map(s => s.visualCue).join(', ')}. Professional trading finance content, cinematic lighting, high quality.`;

    // 3. Генерируем видео
    const video = await this.generateTextToVideo(videoPrompt, config);

    return {
      script: scriptData,
      video
    };
  }

  // === POLLING: ОЖИДАНИЕ ЗАВЕРШЕНИЯ ГЕНЕРАЦИИ ===
  async waitForCompletion(
    taskId: string,
    maxWaitTime: number = 300000, // 5 минут
    pollInterval: number = 10000 // 10 секунд
  ): Promise<VideoGenerationResult> {
    const startTime = Date.now();

    while (Date.now() - startTime < maxWaitTime) {
      const result = await this.checkVideoStatus(taskId);

      if (result.status === 'completed') {
        return result;
      } else if (result.status === 'failed') {
        throw new Error('Video generation failed');
      }

      // Ждём перед следующей проверкой
      await new Promise(resolve => setTimeout(resolve, pollInterval));
    }

    throw new Error('Video generation timeout');
  }
}

export const klingAIService = new KlingAIService();
