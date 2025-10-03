import OpenAI from 'openai';

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY || '',
});

// Hugging Face Inference API (100% бесплатный)
const HF_API_KEY = process.env.HUGGINGFACE_API_KEY || '';
const HF_API_URL = 'https://api-inference.huggingface.co/models/Lightricks/LTX-Video';

export interface VideoScene {
  text: string;
  duration: number;
  visualCue: string;
}

export interface VideoConfig {
  duration: 5 | 10;
  mode: 'std' | 'pro';
  aspectRatio?: '16:9' | '9:16' | '1:1';
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

class HuggingFaceVideoService {
  
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

  // === HUGGING FACE: TEXT-TO-VIDEO (LTX-Video) ===
  async generateTextToVideo(
    prompt: string,
    config: Partial<VideoConfig> = {}
  ): Promise<VideoGenerationResult> {
    if (!HF_API_KEY) {
      throw new Error('Hugging Face API key not configured. Please set HUGGINGFACE_API_KEY environment variable.');
    }

    const defaultConfig: VideoConfig = {
      duration: config.duration || 5,
      mode: config.mode || 'std',
      aspectRatio: config.aspectRatio || '16:9',
      negativePrompt: config.negativePrompt || 'blurry, low quality, distorted, static'
    };

    try {
      // LTX-Video генерирует 121 кадр (5 сек при 24fps)
      const numFrames = defaultConfig.duration === 5 ? 121 : 241;
      
      const response = await fetch(HF_API_URL, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${HF_API_KEY}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          inputs: prompt,
          parameters: {
            num_frames: numFrames,
            width: defaultConfig.aspectRatio === '16:9' ? 768 : 
                   defaultConfig.aspectRatio === '9:16' ? 432 : 512,
            height: defaultConfig.aspectRatio === '16:9' ? 432 : 
                    defaultConfig.aspectRatio === '9:16' ? 768 : 512,
            guidance_scale: 3.0,
            negative_prompt: defaultConfig.negativePrompt
          }
        })
      });

      if (!response.ok) {
        const error = await response.text();
        
        // Если модель загружается, возвращаем статус ожидания
        if (response.status === 503) {
          return {
            taskId: `hf_loading_${Date.now()}`,
            status: 'processing',
            cost: 0,
            estimatedTime: '20 seconds (model loading)',
            provider: 'Hugging Face (LTX-Video) - FREE'
          };
        }
        
        throw new Error(`Hugging Face API error: ${error}`);
      }

      // Hugging Face возвращает видео напрямую
      const videoBuffer = Buffer.from(await response.arrayBuffer());
      const taskId = `hf_${Date.now()}`;
      
      // Сохраняем видео во временный файл
      const fs = await import('fs/promises');
      const path = await import('path');
      const tmpDir = '/tmp/ai-videos';
      
      // Создаём директорию если не существует
      try {
        await fs.mkdir(tmpDir, { recursive: true });
      } catch (e) {
        // Директория уже существует
      }
      
      const videoPath = path.join(tmpDir, `${taskId}.mp4`);
      await fs.writeFile(videoPath, videoBuffer);

      return {
        taskId,
        status: 'completed',
        videoUrl: videoPath, // Локальный путь к файлу
        cost: 0, // БЕСПЛАТНО!
        estimatedTime: '10-20 seconds',
        provider: 'Hugging Face (LTX-Video) - FREE'
      };
    } catch (error) {
      throw new Error(`Hugging Face video generation failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  // === HUGGING FACE: IMAGE-TO-VIDEO ===
  async generateImageToVideo(
    imageUrl: string,
    prompt: string,
    config: Partial<VideoConfig> = {}
  ): Promise<VideoGenerationResult> {
    if (!HF_API_KEY) {
      throw new Error('Hugging Face API key not configured.');
    }

    const defaultConfig: VideoConfig = {
      duration: config.duration || 5,
      mode: config.mode || 'std',
      negativePrompt: config.negativePrompt || 'blurry, low quality, distorted'
    };

    try {
      // Скачиваем изображение
      const imageResponse = await fetch(imageUrl);
      const imageBlob = await imageResponse.blob();
      
      const formData = new FormData();
      formData.append('image', imageBlob);
      formData.append('prompt', prompt);
      if (defaultConfig.negativePrompt) {
        formData.append('negative_prompt', defaultConfig.negativePrompt);
      }
      formData.append('num_frames', defaultConfig.duration === 5 ? '121' : '241');

      const response = await fetch(`${HF_API_URL}/image-to-video`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${HF_API_KEY}`
        },
        body: formData
      });

      if (!response.ok) {
        const error = await response.text();
        throw new Error(`Hugging Face API error: ${error}`);
      }

      const videoBuffer = Buffer.from(await response.arrayBuffer());
      const taskId = `hf_i2v_${Date.now()}`;
      
      // Сохраняем видео во временный файл
      const fs = await import('fs/promises');
      const path = await import('path');
      const tmpDir = '/tmp/ai-videos';
      
      try {
        await fs.mkdir(tmpDir, { recursive: true });
      } catch (e) {
        // Директория уже существует
      }
      
      const videoPath = path.join(tmpDir, `${taskId}.mp4`);
      await fs.writeFile(videoPath, videoBuffer);

      return {
        taskId,
        status: 'completed',
        videoUrl: videoPath,
        cost: 0, // БЕСПЛАТНО!
        estimatedTime: '10-20 seconds',
        provider: 'Hugging Face (LTX-Video) - FREE'
      };
    } catch (error) {
      throw new Error(`Hugging Face image-to-video generation failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  // === ПРОВЕРКА СТАТУСА (для совместимости) ===
  async checkVideoStatus(taskId: string): Promise<VideoGenerationResult> {
    // Hugging Face возвращает видео сразу, статус всегда completed
    return {
      taskId,
      status: 'completed',
      cost: 0,
      provider: 'Hugging Face (LTX-Video) - FREE'
    };
  }

  // === AUTO PIPELINE: ТЕКСТ → СКРИПТ → ВИДЕО ===
  async autoGenerateVideo(
    topic: string,
    config?: Partial<VideoConfig>
  ): Promise<{
    script: any;
    video: VideoGenerationResult;
  }> {
    // 1. Генерируем скрипт
    const scriptData = await this.generateVideoScript(topic, 10, 'professional');

    // 2. Создаём промпт для видео из скрипта
    const videoPrompt = `${topic}. ${scriptData.script}. ${scriptData.scenes.map(s => s.visualCue).join(', ')}. Professional trading finance content, cinematic lighting, high quality, smooth camera movement.`;

    // 3. Генерируем видео
    const video = await this.generateTextToVideo(videoPrompt, config);

    return {
      script: scriptData,
      video
    };
  }

  // === POLLING: ОЖИДАНИЕ ЗАВЕРШЕНИЯ (для совместимости) ===
  async waitForCompletion(
    taskId: string,
    maxWaitTime: number = 60000, // 1 минута для HF
    pollInterval: number = 5000 // 5 секунд
  ): Promise<VideoGenerationResult> {
    // Hugging Face обычно возвращает сразу или через 20 сек
    const startTime = Date.now();

    while (Date.now() - startTime < maxWaitTime) {
      const result = await this.checkVideoStatus(taskId);

      if (result.status === 'completed') {
        return result;
      } else if (result.status === 'failed') {
        throw new Error('Video generation failed');
      }

      await new Promise(resolve => setTimeout(resolve, pollInterval));
    }

    throw new Error('Video generation timeout');
  }
}

export const huggingFaceVideoService = new HuggingFaceVideoService();
