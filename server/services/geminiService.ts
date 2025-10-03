
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
import { GoogleGenerativeAI } from "@google/generative-ai";

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || '');

interface GeminiResult {
  content: string;
  tokensUsed: number;
  cost: number;
}

class GeminiService {
  private model = genAI.getGenerativeModel({ model: "gemini-2.0-flash-exp" });

  async generateContent(prompt: string, systemInstruction?: string): Promise<GeminiResult> {
    try {
      const chat = this.model.startChat({
        history: systemInstruction ? [
          {
            role: "user",
            parts: [{ text: systemInstruction }],
          },
          {
            role: "model",
            parts: [{ text: "Понял, буду следовать этим инструкциям." }],
          },
        ] : [],
      });

      const result = await chat.sendMessage(prompt);
      const response = await result.response;
      const text = response.text();

      // Gemini pricing: ~$0.00015 per 1K tokens (approximate)
      const tokensUsed = text.length / 4; // Approximate
      const cost = (tokensUsed / 1000) * 0.00015;

      return {
        content: text,
        tokensUsed: Math.round(tokensUsed),
        cost,
      };
    } catch (error) {
      throw new Error(`Gemini API error: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  async analyzeImage(imageData: string, prompt: string): Promise<GeminiResult> {
    try {
      const visionModel = genAI.getGenerativeModel({ model: "gemini-2.0-flash-exp" });
      
      const result = await visionModel.generateContent([
        prompt,
        {
          inlineData: {
            data: imageData.split(',')[1], // Remove data:image/... prefix
            mimeType: "image/jpeg",
          },
        },
      ]);

      const response = await result.response;
      const text = response.text();

      const tokensUsed = text.length / 4;
      const cost = (tokensUsed / 1000) * 0.00015;

      return {
        content: text,
        tokensUsed: Math.round(tokensUsed),
        cost,
      };
    } catch (error) {
      throw new Error(`Gemini Vision error: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  async generateViralContent(
    platform: string,
    niche: string,
    trend: string
  ): Promise<GeminiResult> {
    const prompt = `Создай вирусный контент для ${platform} в нише ${niche} на тренд: ${trend}.
    
Требования:
- Цепляющий хук в первых 3 секунды
- Эмоциональный триггер
- Призыв к действию
- Оптимизация под алгоритмы платформы

Формат:JSON с полями title, description, hashtags, hooks`;

    return this.generateContent(prompt);
  }

  async analyzeCompetitor(competitorUrl: string, platform: string): Promise<any> {
    const prompt = `Проанализируй стратегию конкурента на ${platform}: ${competitorUrl}
    
Предоставь анализ:
1. Контент-стратегия
2. Частота публикаций
3. Форматы контента
4. Успешные паттерны
5. Слабые стороны
6. Возможности для нас

Формат: JSON`;

    const result = await this.generateContent(prompt);
    return JSON.parse(result.content);
  }

  async generateMarketingStrategy(
    businessType: string,
    targetAudience: string,
    budget: number,
    platforms: string[]
  ): Promise<any> {
    const prompt = `Создай детальную маркетинговую стратегию:
    
Бизнес: ${businessType}
Аудитория: ${targetAudience}
Бюджет: $${budget}
Платформы: ${platforms.join(', ')}

Включи:
1. Позиционирование
2. Контент-план на месяц
3. Бесплатные стратегии
4. Платные кампании
5. KPI и метрики
6. План роста

Формат: JSON`;

    const result = await this.generateContent(prompt);
    return JSON.parse(result.content);
  }

  async optimizeContent(content: string, platform: string): Promise<GeminiResult> {
    const prompt = `Оптимизируй этот контент для ${platform}:

${content}

Улучши:
- Хуки и CTA
- Хештеги
- Структуру
- Читабельность
- Вирусный потенциал

Предоставь улучшенную версию и объяснение изменений.`;

    return this.generateContent(prompt);
  }

  async generateContentIdeas(niche: string, count: number = 10): Promise<string[]> {
    const prompt = `Сгенерируй ${count} уникальных идей для контента в нише: ${niche}

Требования:
- Актуальность
- Вирусный потенциал
- Разнообразие форматов
- Практическая ценность

Формат: JSON массив строк`;

    const result = await this.generateContent(prompt);
    const parsed = JSON.parse(result.content);
    return parsed;
  }
}

export const geminiService = new GeminiService();
