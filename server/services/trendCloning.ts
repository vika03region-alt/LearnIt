import OpenAI from 'openai';
import { storage } from '../storage.js';
import { klingAIService } from './klingAIService.js';
import type { TrendVideo, BrandStyle } from '@shared/schema';

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY || '',
});

const grok = new OpenAI({
  apiKey: process.env.XAI_API_KEY || '',
  baseURL: 'https://api.x.ai/v1'
});

export interface AdaptedTrendResult {
  adaptedPrompt: string;
  adaptedScript: string;
}

export interface CloneTrendResult {
  success: boolean;
  videoUrl?: string;
  aiVideoId?: number;
  cost: number;
  error?: string;
}

class TrendCloningService {
  
  async adaptTrendToBrand(
    trend: TrendVideo,
    brandStyle: BrandStyle
  ): Promise<AdaptedTrendResult> {
    try {
      console.log('🎨 Адаптация тренда под бренд-стиль...');
      console.log(`📊 Тренд: ${trend.title || trend.concept || 'без названия'}`);
      console.log(`🎯 Бренд: ${brandStyle.name}`);

      const systemPrompt = "Ты эксперт по адаптации трендовых видео под бренд. Возьми концепт вирусного видео и адаптируй его под стиль бренда, сохраняя вирусный потенциал.";

      const userPrompt = `Адаптируй этот вирусный тренд под наш бренд-стиль:

ВИРУСНЫЙ ТРЕНД:
- Концепт: ${trend.concept || trend.title || 'Вирусное видео'}
- Визуальные элементы: ${trend.visualElements || 'динамичные визуалы, яркие цвета'}
- Контекст: ${trend.description || 'популярный тренд в социальных сетях'}

БРЕНД-СТИЛЬ:
- Название: ${brandStyle.name}
- Тон: ${brandStyle.tone}
- Видео стиль: ${brandStyle.videoStyle || 'профессиональный, качественный'}
${brandStyle.videoPromptTemplate ? `- Шаблон промпта: ${brandStyle.videoPromptTemplate}` : ''}

ТРЕБОВАНИЯ:
1. Сохрани вирусный потенциал оригинального тренда
2. Адаптируй под тон и стиль бренда (${brandStyle.tone})
3. Создай промпт для генерации видео (текстовое описание для AI)
4. Создай сценарий/скрипт видео (что показывать)

Верни JSON:
{
  "adaptedPrompt": "Детальный промпт для генерации видео через AI (описание визуалов, стиль, атмосфера)",
  "adaptedScript": "Краткий сценарий видео: что происходит, ключевые моменты, призыв к действию"
}`;

      const aiProvider = process.env.XAI_API_KEY ? grok : openai;
      const model = process.env.XAI_API_KEY ? 'grok-2-latest' : 'gpt-4';

      console.log(`🤖 Используем ${process.env.XAI_API_KEY ? 'Grok' : 'OpenAI'} для адаптации`);

      const response = await aiProvider.chat.completions.create({
        model,
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: userPrompt }
        ],
        response_format: { type: 'json_object' },
        temperature: 0.8,
        max_tokens: 1000
      });

      const result = JSON.parse(response.choices[0].message.content || '{}');

      let adaptedPrompt = result.adaptedPrompt || result.adapted_prompt || '';
      let adaptedScript = result.adaptedScript || result.adapted_script || '';

      if (brandStyle.videoPromptTemplate) {
        console.log('📝 Применяю шаблон промпта бренда...');
        
        adaptedPrompt = brandStyle.videoPromptTemplate
          .replace('{concept}', trend.concept || trend.title || 'trending video')
          .replace('{visualElements}', (trend.visualElements || []).join(', '))
          .replace('{tone}', brandStyle.tone)
          .replace('{style}', brandStyle.videoStyle || 'professional')
          .replace('{adaptedPrompt}', adaptedPrompt);
      }

      if (!adaptedPrompt || adaptedPrompt.length < 10) {
        throw new Error('Не удалось сгенерировать адаптированный промпт');
      }

      console.log('✅ Адаптация завершена');
      console.log(`📝 Промпт: ${adaptedPrompt.substring(0, 100)}...`);

      return {
        adaptedPrompt,
        adaptedScript
      };

    } catch (error) {
      console.error('❌ Ошибка адаптации тренда:', error);
      throw new Error(`Failed to adapt trend to brand: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  async cloneTrendVideo(
    trendId: number,
    userId: string
  ): Promise<CloneTrendResult> {
    try {
      console.log('🎬 Начинаем клонирование тренда...');
      console.log(`📊 Trend ID: ${trendId}, User ID: ${userId}`);

      const { trend, brandStyle } = await storage.getTrendWithBrandStyle(trendId);

      if (!trend) {
        return {
          success: false,
          cost: 0,
          error: 'Тренд не найден'
        };
      }

      console.log(`📊 Тренд найден: ${trend.title || trend.concept}`);

      if (!brandStyle) {
        console.log('⚠️ Бренд-стиль не найден, ищем дефолтный...');
        const defaultStyle = await storage.getDefaultBrandStyle(userId);
        
        if (!defaultStyle) {
          return {
            success: false,
            cost: 0,
            error: 'Нет бренд-стиля. Создайте через /brandstyle'
          };
        }
        
        console.log(`✅ Используем дефолтный бренд-стиль: ${defaultStyle.name}`);
      }

      const styleToUse = brandStyle || await storage.getDefaultBrandStyle(userId);

      if (!styleToUse) {
        return {
          success: false,
          cost: 0,
          error: 'Нет бренд-стиля'
        };
      }

      console.log('🎨 Адаптирую тренд под бренд...');
      const { adaptedPrompt, adaptedScript } = await this.adaptTrendToBrand(trend, styleToUse);

      console.log('🎬 Генерирую видео через Fal.ai...');
      console.log(`📝 Финальный промпт: ${adaptedPrompt.substring(0, 100)}...`);

      const videoConfig = {
        model: 'wan' as const,
        resolution: '720p' as const,
        aspectRatio: (styleToUse.aspectRatio || '9:16') as '16:9' | '9:16' | '1:1'
      };

      const videoResult = await klingAIService.generateFalVideo(
        adaptedPrompt,
        videoConfig
      );

      console.log(`✅ Видео сгенерировано: ${videoResult.videoUrl || 'processing...'}`);
      console.log(`💰 Стоимость: $${videoResult.cost}`);

      const aiVideo = await storage.createAIVideo({
        userId,
        prompt: adaptedPrompt,
        videoUrl: videoResult.videoUrl,
        thumbnailUrl: videoResult.thumbnailUrl,
        provider: videoResult.provider,
        duration: videoResult.duration || 5,
        resolution: '720p',
        aspectRatio: videoConfig.aspectRatio,
        status: videoResult.status,
        taskId: videoResult.taskId,
        cost: videoResult.cost,
        metadata: {
          trendId,
          brandStyleId: styleToUse.id,
          adaptedScript
        }
      });

      console.log(`💾 AI Video сохранено в БД: ID ${aiVideo.id}`);

      await storage.updateTrendVideo(trendId, {
        adaptedPrompt,
        adaptedScript
      });

      console.log('📝 Тренд обновлен с адаптированным промптом');

      await storage.updateTrendVideoStatus(trendId, 'cloned', aiVideo.id);

      console.log('✅ Статус тренда обновлен на "cloned"');

      return {
        success: true,
        videoUrl: videoResult.videoUrl,
        aiVideoId: aiVideo.id,
        cost: videoResult.cost
      };

    } catch (error) {
      console.error('❌ Ошибка клонирования тренда:', error);
      return {
        success: false,
        cost: 0,
        error: error instanceof Error ? error.message : 'Unknown error'
      };
    }
  }

  async checkVideoStatus(taskId: string): Promise<{
    status: 'queued' | 'processing' | 'completed' | 'failed';
    videoUrl?: string;
    thumbnailUrl?: string;
  }> {
    try {
      const result = await klingAIService.checkVideoStatus(taskId);
      return {
        status: result.status,
        videoUrl: result.videoUrl,
        thumbnailUrl: result.thumbnailUrl
      };
    } catch (error) {
      console.error('❌ Ошибка проверки статуса видео:', error);
      return {
        status: 'failed'
      };
    }
  }
}

export const trendCloningService = new TrendCloningService();
