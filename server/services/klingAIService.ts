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

interface ViralVideoAnalysis {
  topVideos: Array<{
    url: string;
    title: string;
    views: number;
    engagement: number;
    viralFactors: string[];
  }>;
  commonElements: {
    hooks: string[];
    visualStyles: string[];
    musicTypes: string[];
    duration: number;
    hashtags: string[];
  };
  recommendations: string[];
}

class KlingAIService {
  private apiKey: string;
  private baseUrl = 'https://api.klingai.com/v1';

  constructor() {
    this.apiKey = process.env.KLING_API_KEY || '';
  }

  // === АНАЛИЗ ПОПУЛЯРНЫХ ВИДЕО ===
  async analyzeTopVideos(
    topic: string,
    platform: 'tiktok' | 'youtube' | 'instagram' = 'tiktok',
    limit: number = 10
  ): Promise<ViralVideoAnalysis> {
    try {
      // Используем AI для анализа трендов
      const OpenAI = (await import('openai')).default;
      const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY || '' });

      const prompt = `Проанализируй топ-${limit} самых популярных видео по теме "${topic}" на ${platform}.

Создай JSON с:
- topVideos: массив видео с URL, title, views, engagement, viralFactors (что сделало видео вирусным)
- commonElements: общие элементы успеха (hooks, visualStyles, musicTypes, duration, hashtags)
- recommendations: рекомендации для создания похожего вирусного контента

Фокус на трейдинг/крипто/финансы контент. Используй реальные данные о популярных каналах.`;

      const response = await openai.chat.completions.create({
        model: 'gpt-4',
        messages: [
          { role: 'system', content: 'Ты эксперт по вирусному видео-контенту. Анализируешь тренды TikTok, YouTube, Instagram.' },
          { role: 'user', content: prompt }
        ],
        response_format: { type: 'json_object' },
        temperature: 0.7
      });

      const analysis = JSON.parse(response.choices[0].message.content || '{}');
      return analysis;
    } catch (error) {
      console.error('Ошибка анализа топовых видео:', error);
      return this.getDefaultAnalysis(topic);
    }
  }

  // === АВТОМАТИЧЕСКАЯ ГЕНЕРАЦИЯ ВИРУСНОГО ВИДЕО С БРЕНДОМ ===
  async generateViralBrandedVideo(
    topic: string,
    brandConfig: {
      name: string;
      logo?: string;
      channel?: string;
      colors?: string[];
      slogan?: string;
    },
    options?: {
      duration?: 5 | 10;
      mode?: 'std' | 'pro';
      aspectRatio?: '16:9' | '9:16' | '1:1';
      platform?: 'tiktok' | 'youtube' | 'instagram';
    }
  ): Promise<{
    videoId: string;
    analysis: ViralVideoAnalysis;
    prompt: string;
    brandedElements: string[];
    cost: number;
  }> {
    try {
      console.log(`🔥 Анализируем топовые видео по теме: ${topic}`);

      // 1. Анализируем популярные видео
      const analysis = await this.analyzeTopVideos(
        topic,
        options?.platform || 'tiktok',
        5
      );

      console.log(`✅ Найдено ${analysis.topVideos.length} топовых видео`);
      console.log(`📊 Вирусные факторы:`, analysis.commonElements);

      // 2. Создаем оптимизированный промпт на основе анализа
      const viralPrompt = this.createViralPrompt(topic, analysis, brandConfig);

      console.log(`📝 Сгенерирован вирусный промпт с брендом ${brandConfig.name}`);

      // 3. Генерируем видео
      const videoResult = await this.generateVideo({
        prompt: viralPrompt,
        duration: options?.duration || 5,
        mode: options?.mode || 'pro', // Для вирусного контента используем PRO
        aspectRatio: options?.aspectRatio || '9:16', // Vertical для TikTok/Reels
        cfgScale: 0.8, // Высокая точность следования промпту
        negativePrompt: 'blurry, low quality, amateur, boring, static, watermark'
      });

      // 4. Добавляем брендирование в метаданные
      const brandedElements = this.extractBrandedElements(viralPrompt, brandConfig);

      return {
        videoId: videoResult.taskId,
        analysis,
        prompt: viralPrompt,
        brandedElements,
        cost: videoResult.cost
      };
    } catch (error) {
      throw new Error(`Не удалось создать вирусное видео: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  // === СОЗДАНИЕ ВИРУСНОГО ПРОМПТА ===
  private createViralPrompt(
    topic: string,
    analysis: ViralVideoAnalysis,
    brandConfig: any
  ): string {
    const { commonElements, recommendations } = analysis;

    // Берем лучшие элементы из анализа
    const topHooks = commonElements.hooks.slice(0, 2).join(', ');
    const visualStyle = commonElements.visualStyles[0] || 'cinematic professional';
    const hashtags = commonElements.hashtags.slice(0, 3).join(' ');

    // Создаем промпт с брендированием
    let prompt = `${topic} video in ${visualStyle} style. `;

    // Добавляем вирусные элементы
    prompt += `Hook: ${topHooks}. `;

    // БРЕНДИРОВАНИЕ - это ключевое!
    prompt += `Brand: ${brandConfig.name} logo visible throughout. `;

    if (brandConfig.colors && brandConfig.colors.length > 0) {
      prompt += `Brand colors: ${brandConfig.colors.join(', ')}. `;
    }

    if (brandConfig.slogan) {
      prompt += `Slogan "${brandConfig.slogan}" displayed. `;
    }

    // Добавляем визуальный стиль для максимальной вирусности
    prompt += `Professional lighting, dynamic camera angles, engaging visuals. `;
    prompt += `Trending format, attention-grabbing, social media optimized. `;

    // Канал/контакт
    if (brandConfig.channel) {
      prompt += `Channel name ${brandConfig.channel} watermark. `;
    }

    prompt += `${hashtags}. High quality, viral potential, engaging content.`;

    return prompt;
  }

  // === ИЗВЛЕЧЕНИЕ БРЕНДИРОВАННЫХ ЭЛЕМЕНТОВ ===
  private extractBrandedElements(prompt: string, brandConfig: any): string[] {
    const elements: string[] = [];

    elements.push(`Бренд: ${brandConfig.name}`);

    if (brandConfig.logo) {
      elements.push(`Логотип: ${brandConfig.logo}`);
    }

    if (brandConfig.channel) {
      elements.push(`Канал: ${brandConfig.channel}`);
    }

    if (brandConfig.colors) {
      elements.push(`Цвета бренда: ${brandConfig.colors.join(', ')}`);
    }

    if (brandConfig.slogan) {
      elements.push(`Слоган: ${brandConfig.slogan}`);
    }

    return elements;
  }

  // === ДЕФОЛТНЫЙ АНАЛИЗ (если API недоступен) ===
  private getDefaultAnalysis(topic: string): ViralVideoAnalysis {
    return {
      topVideos: [
        {
          url: 'https://tiktok.com/example1',
          title: `${topic} - Viral Hit`,
          views: 2500000,
          engagement: 18.5,
          viralFactors: ['Strong hook', 'Fast pacing', 'Trending music', 'Clear value']
        }
      ],
      commonElements: {
        hooks: ['Stop scrolling!', 'You need to see this', 'Secret revealed'],
        visualStyles: ['cinematic', 'dynamic', 'professional'],
        musicTypes: ['trending', 'energetic', 'upbeat'],
        duration: 15,
        hashtags: ['#trading', '#crypto', '#forex', '#viral', '#fyp']
      },
      recommendations: [
        'Use strong hook in first 3 seconds',
        'Keep video under 30 seconds',
        'Use trending music',
        'Add captions for accessibility',
        'Include clear call-to-action'
      ]
    };
  }

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
        cost: 0.24, // Placeholder, actual cost may vary
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
          duration: model === 'hunyuan' ? 5 : 10, // Placeholder, actual duration may vary
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