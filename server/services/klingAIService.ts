import OpenAI from 'openai';
import { fal } from '@fal-ai/client';

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY || '',
});

// Fal.ai API (Hunyuan Video: $0.40/видео, WAN-2.1: $0.20-0.40/видео)
const FAL_KEY = process.env.FAL_KEY || '';

// Kling AI API через PiAPI (самый дешевый: $0.24/видео)
const KLING_API_KEY = process.env.KLING_API_KEY || '';

// Конфигурация Fal.ai
if (FAL_KEY) {
  fal.config({
    credentials: FAL_KEY
  });
}

export interface VideoScene {
  text: string;
  duration: number;
  visualCue: string;
}

export interface KlingVideoConfig {
  duration: 5 | 10;
  mode: 'std' | 'pro';
  aspectRatio?: '16:9' | '9:16' | '1:1';
  cfgScale?: number;
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

  // === KLING AI: TEXT-TO-VIDEO (PiAPI 2025) ===
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
      const response = await fetch('https://api.piapi.ai/api/v1/task', {
        method: 'POST',
        headers: {
          'x-api-key': KLING_API_KEY,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          model: 'kling',
          task_type: 'video_generation',
          input: {
            prompt: prompt,
            negative_prompt: defaultConfig.negativePrompt,
            cfg_scale: defaultConfig.cfgScale,
            duration: defaultConfig.duration,
            aspect_ratio: defaultConfig.aspectRatio,
            mode: defaultConfig.mode
          }
        })
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(`Kling AI API error: ${error.message || response.statusText}`);
      }

      const data = await response.json();

      // Цены PiAPI 2025: Standard $0.24/5s, $0.48/10s; Pro $0.48/5s, $0.96/10s
      const cost = defaultConfig.mode === 'std' 
        ? (defaultConfig.duration === 5 ? 0.24 : 0.48)
        : (defaultConfig.duration === 5 ? 0.48 : 0.96);

      return {
        taskId: data.data?.task_id || data.task_id,
        status: 'queued',
        cost,
        estimatedTime: '2-3 minutes',
        provider: 'Kling AI (PiAPI)'
      };
    } catch (error) {
      throw new Error(`Kling video generation failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  // === KLING AI: IMAGE-TO-VIDEO (PiAPI 2025) ===
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
      const response = await fetch('https://api.piapi.ai/api/v1/task', {
        method: 'POST',
        headers: {
          'x-api-key': KLING_API_KEY,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          model: 'kling',
          task_type: 'video_generation',
          input: {
            image_url: imageUrl,
            prompt: prompt,
            negative_prompt: defaultConfig.negativePrompt,
            cfg_scale: defaultConfig.cfgScale,
            duration: defaultConfig.duration,
            mode: defaultConfig.mode
          }
        })
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(`Kling AI API error: ${error.message || response.statusText}`);
      }

      const data = await response.json();

      const cost = defaultConfig.mode === 'std' 
        ? (defaultConfig.duration === 5 ? 0.24 : 0.48)
        : (defaultConfig.duration === 5 ? 0.48 : 0.96);

      return {
        taskId: data.data?.task_id || data.task_id,
        status: 'queued',
        cost,
        estimatedTime: '2-3 minutes',
        provider: 'Kling AI (PiAPI)'
      };
    } catch (error) {
      throw new Error(`Kling image-to-video generation failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  // === ПРОВЕРКА СТАТУСА ВИДЕО (PiAPI 2025) ===
  async checkVideoStatus(taskId: string): Promise<VideoGenerationResult> {
    if (!KLING_API_KEY) {
      throw new Error('Kling API key not configured.');
    }

    try {
      const response = await fetch(`https://api.piapi.ai/api/v1/task?task_id=${taskId}`, {
        headers: {
          'x-api-key': KLING_API_KEY
        }
      });

      const result = await response.json();
      const data = result.data;

      // Статусы PiAPI: pending, processing, completed, failed, staged
      let status: VideoGenerationResult['status'] = 'processing';
      if (data.status === 'completed') {
        status = 'completed';
      } else if (data.status === 'failed') {
        status = 'failed';
      } else if (data.status === 'pending' || data.status === 'processing') {
        status = 'processing';
      }

      // Извлечение URL видео из ответа PiAPI
      const videoUrl = data.output?.works?.[0]?.video?.resource || 
                      data.output?.works?.[0]?.video?.resource_without_watermark;

      return {
        taskId,
        status,
        videoUrl,
        thumbnailUrl: data.output?.works?.[0]?.image?.resource,
        duration: data.output?.works?.[0]?.video?.duration ? 
          data.output.works[0].video.duration / 1000 : undefined,
        cost: 0.24,
        provider: 'Kling AI (PiAPI)'
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

  // === FAL.AI: HUNYUAN VIDEO (TEXT-TO-VIDEO) ===
  async generateFalVideo(
    prompt: string,
    config: {
      model?: 'hunyuan' | 'wan' | 'veo3';
      resolution?: '480p' | '720p';
      aspectRatio?: '16:9' | '9:16' | '1:1';
      numFrames?: number;
    } = {}
  ): Promise<VideoGenerationResult> {
    if (!FAL_KEY) {
      throw new Error('Fal.ai API key not configured. Please set FAL_KEY environment variable.');
    }

    const model = config.model || 'hunyuan';
    const modelEndpoints = {
      'hunyuan': 'fal-ai/hunyuan-video',
      'wan': 'fal-ai/wan-t2v',
      'veo3': 'fal-ai/veo3'
    };

    const costs = {
      'hunyuan': 0.40,
      'wan': config.resolution === '720p' ? 0.40 : 0.20,
      'veo3': 0.40 // базовая оценка
    };

    try {
      console.log(`🎬 Fal.ai: Запуск генерации ${model} видео...`);
      console.log(`📤 Промпт:`, prompt);

      const input: any = {
        prompt: prompt,
      };

      if (model === 'hunyuan') {
        input.num_inference_steps = 30;
        input.aspect_ratio = config.aspectRatio || '16:9';
        input.resolution = config.resolution || '720p';
        input.num_frames = config.numFrames || 129;
      } else if (model === 'wan') {
        input.resolution = config.resolution || '720p';
      } else if (model === 'veo3') {
        input.audio_enabled = false;
        input.aspect_ratio = config.aspectRatio || '16:9';
      }

      const result = await fal.subscribe(modelEndpoints[model], {
        input,
        logs: true,
        onQueueUpdate: (update: any) => {
          if (update.status === 'IN_PROGRESS') {
            console.log(`⏳ ${model}: В процессе...`);
          }
        }
      });

      console.log(`✅ Fal.ai результат:`, result);

      if (result.data?.video?.url) {
        return {
          taskId: result.requestId || 'fal-' + Date.now(),
          status: 'completed',
          videoUrl: result.data.video.url,
          duration: model === 'hunyuan' ? 5 : 10,
          cost: costs[model],
          provider: `Fal.ai (${model})`
        };
      } else {
        throw new Error('Video URL not found in response');
      }
    } catch (error) {
      console.error(`❌ Fal.ai ${model} ошибка:`, error);
      throw new Error(`Fal.ai video generation failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }
}

export const klingAIService = new KlingAIService();
