
import { GoogleGenerativeAI } from "@google/generative-ai";

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || '');

interface GeminiAnalysis {
  content: string;
  analysis: any;
  suggestions: string[];
  tokensUsed?: number;
}

class GeminiService {
  private model = genAI.getGenerativeModel({ model: "gemini-pro" });
  private visionModel = genAI.getGenerativeModel({ model: "gemini-pro-vision" });

  // === АНАЛИЗ ТЕКСТОВОГО КОНТЕНТА ===
  
  async analyzeContent(content: string, context?: string): Promise<GeminiAnalysis> {
    try {
      const prompt = `Проанализируй следующий контент для социальных сетей${context ? ` в контексте: ${context}` : ''}:

${content}

Предоставь:
1. Оценку качества контента (1-10)
2. Потенциал вирусности
3. Эмоциональную окраску
4. Целевую аудиторию
5. Рекомендации по улучшению

Ответ в JSON формате.`;

      const result = await this.model.generateContent(prompt);
      const response = await result.response;
      const text = response.text();

      try {
        const analysis = JSON.parse(text);
        return {
          content: text,
          analysis,
          suggestions: analysis.recommendations || [],
        };
      } catch {
        return {
          content: text,
          analysis: { raw: text },
          suggestions: [],
        };
      }
    } catch (error) {
      console.error('Gemini analysis error:', error);
      throw new Error('Failed to analyze content with Gemini');
    }
  }

  // === АНАЛИЗ ИЗОБРАЖЕНИЙ ===
  
  async analyzeImage(imageData: string, prompt?: string): Promise<GeminiAnalysis> {
    try {
      const defaultPrompt = prompt || `Проанализируй это изображение для социальных сетей:
- Что изображено?
- Подходит ли для Instagram/TikTok/YouTube?
- Какие эмоции вызывает?
- Рекомендации по подписи
- Оптимальное время публикации

Ответ в JSON формате.`;

      const imageParts = [
        {
          inlineData: {
            data: imageData,
            mimeType: "image/jpeg"
          }
        }
      ];

      const result = await this.visionModel.generateContent([defaultPrompt, ...imageParts]);
      const response = await result.response;
      const text = response.text();

      try {
        const analysis = JSON.parse(text);
        return {
          content: text,
          analysis,
          suggestions: analysis.recommendations || [],
        };
      } catch {
        return {
          content: text,
          analysis: { raw: text },
          suggestions: [],
        };
      }
    } catch (error) {
      console.error('Gemini image analysis error:', error);
      throw new Error('Failed to analyze image with Gemini');
    }
  }

  // === ГЕНЕРАЦИЯ ТРЕЙДИНГ КОНТЕНТА ===
  
  async generateTradingContent(params: {
    type: 'signal' | 'analysis' | 'education';
    market?: string;
    trend?: string;
    audience?: string;
  }): Promise<string> {
    const prompts = {
      signal: `Создай профессиональный торговый сигнал для ${params.market || 'крипто рынка'}. 
Включи: точку входа, цели, стоп-лосс, обоснование. 
Формат для ${params.audience || 'опытных трейдеров'}. На русском языке.`,
      
      analysis: `Создай глубокий анализ рынка ${params.market || 'криптовалют'}.
Текущий тренд: ${params.trend || 'анализируй самостоятельно'}.
Включи: технический анализ, фундаментал, прогноз. На русском языке.`,
      
      education: `Создай обучающий контент по трейдингу для ${params.audience || 'начинающих'}.
Тема: ${params.market || 'основы трейдинга'}.
Стиль: понятный, с примерами. На русском языке.`,
    };

    const result = await this.model.generateContent(prompts[params.type]);
    const response = await result.response;
    return response.text();
  }

  // === МУЛЬТИМОДАЛЬНЫЙ АНАЛИЗ ===
  
  async analyzePostWithImage(
    caption: string,
    imageData: string,
    platform: string
  ): Promise<{
    compatibility_score: number;
    suggestions: string[];
    optimal_hashtags: string[];
    best_time: string;
  }> {
    try {
      const prompt = `Проанализируй этот пост для ${platform}:

Подпись: ${caption}

Оцени:
1. Совместимость текста и изображения (1-10)
2. Оптимальные хештеги
3. Лучшее время публикации
4. Рекомендации по улучшению

JSON формат с полями: compatibility_score, suggestions, optimal_hashtags, best_time`;

      const imageParts = [
        {
          inlineData: {
            data: imageData,
            mimeType: "image/jpeg"
          }
        }
      ];

      const result = await this.visionModel.generateContent([prompt, ...imageParts]);
      const response = await result.response;
      const text = response.text();

      const analysis = JSON.parse(text);
      return {
        compatibility_score: analysis.compatibility_score || 0,
        suggestions: analysis.suggestions || [],
        optimal_hashtags: analysis.optimal_hashtags || [],
        best_time: analysis.best_time || 'не определено',
      };
    } catch (error) {
      console.error('Multimodal analysis error:', error);
      return {
        compatibility_score: 0,
        suggestions: ['Ошибка анализа'],
        optimal_hashtags: [],
        best_time: 'не определено',
      };
    }
  }

  // === КОНКУРЕНТНЫЙ АНАЛИЗ ===
  
  async analyzeCompetitor(competitorContent: string[], niche: string): Promise<{
    strengths: string[];
    weaknesses: string[];
    opportunities: string[];
    content_gaps: string[];
  }> {
    const prompt = `Проанализируй контент конкурента в нише ${niche}:

${competitorContent.join('\n---\n')}

Определи:
1. Сильные стороны их стратегии
2. Слабые места
3. Возможности для нас
4. Пробелы в контенте, которые можем заполнить

JSON формат.`;

    const result = await this.model.generateContent(prompt);
    const response = await result.response;
    const text = response.text();

    try {
      return JSON.parse(text);
    } catch {
      return {
        strengths: [],
        weaknesses: [],
        opportunities: [],
        content_gaps: [],
      };
    }
  }

  // === УМНАЯ АДАПТАЦИЯ КОНТЕНТА ===
  
  async adaptContentForPlatform(
    content: string,
    fromPlatform: string,
    toPlatform: string
  ): Promise<string> {
    const prompt = `Адаптируй этот контент с ${fromPlatform} для ${toPlatform}:

${content}

Учти особенности ${toPlatform}:
- Формат
- Длину
- Стиль
- Хештеги
- Эмодзи

На русском языке.`;

    const result = await this.model.generateContent(prompt);
    const response = await result.response;
    return response.text();
  }

  // === ПЕРСОНАЛИЗАЦИЯ ПОД АУДИТОРИЮ ===
  
  async personalizeContent(
    content: string,
    audienceProfile: {
      age?: string;
      interests?: string[];
      experience?: string;
      goals?: string[];
    }
  ): Promise<string> {
    const prompt = `Персонализируй этот контент под аудиторию:

Контент: ${content}

Профиль аудитории:
- Возраст: ${audienceProfile.age || 'смешанный'}
- Интересы: ${audienceProfile.interests?.join(', ') || 'трейдинг'}
- Опыт: ${audienceProfile.experience || 'средний'}
- Цели: ${audienceProfile.goals?.join(', ') || 'заработок'}

Адаптируй тон, сложность и примеры. На русском языке.`;

    const result = await this.model.generateContent(prompt);
    const response = await result.response;
    return response.text();
  }
}

export const geminiService = new GeminiService();
