
import OpenAI from 'openai';
import { storage } from '../storage';

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

interface AutoVisualResult {
  imageUrl: string;
  prompt: string;
  postText: string;
  platform: string;
  cost: number;
}

class AutoVisualGenerator {
  // Автоматическая генерация визуала для поста
  async generateVisualForPost(
    postText: string,
    platform: 'telegram' | 'instagram' | 'tiktok' | 'youtube',
    userId: string
  ): Promise<AutoVisualResult> {
    try {
      // Шаг 1: Анализируем текст поста и создаем промпт для DALL-E
      const analysisPrompt = `Проанализируй этот пост для ${platform} и создай промпт для генерации изображения:

ТЕКСТ ПОСТА:
"${postText}"

Создай детальный промпт на английском для DALL-E 3:
1. Определи главную тему/месседж
2. Какое настроение (bullish/bearish/neutral/exciting)
3. Ключевые визуальные элементы
4. Стиль (modern, minimalist, professional, vibrant)
5. Цветовая палитра

Промпт должен быть конкретным, визуальным, без текста на изображении.
Формат: один абзац, 100-150 слов.`;

      const analysis = await openai.chat.completions.create({
        model: 'gpt-4',
        messages: [
          {
            role: 'system',
            content: 'Ты эксперт по созданию визуального контента для соцсетей. Создаешь эффективные промпты для DALL-E 3.'
          },
          {
            role: 'user',
            content: analysisPrompt
          }
        ],
        temperature: 0.7,
        max_tokens: 300
      });

      const imagePrompt = analysis.choices[0].message.content || '';

      // Шаг 2: Определяем размер изображения в зависимости от платформы
      let imageSize: "1024x1024" | "1792x1024" | "1024x1792" = "1024x1024";
      
      switch (platform) {
        case 'instagram':
          imageSize = "1024x1024"; // квадрат для постов
          break;
        case 'telegram':
          imageSize = "1792x1024"; // широкий для Telegram
          break;
        case 'tiktok':
          imageSize = "1024x1792"; // вертикальный
          break;
        case 'youtube':
          imageSize = "1792x1024"; // 16:9 для превью
          break;
      }

      // Шаг 3: Генерируем изображение через DALL-E 3
      const imageResponse = await openai.images.generate({
        model: "dall-e-3",
        prompt: imagePrompt,
        n: 1,
        size: imageSize,
        quality: "standard",
        style: "vivid"
      });

      const imageUrl = imageResponse.data[0].url || '';

      // Логируем генерацию
      await storage.createActivityLog({
        userId,
        action: 'Auto Visual Generated',
        description: `Автоматически создан визуал для ${platform}`,
        status: 'success',
        metadata: {
          platform,
          imagePrompt: imagePrompt.substring(0, 100),
          postText: postText.substring(0, 100)
        }
      });

      return {
        imageUrl,
        prompt: imagePrompt,
        postText,
        platform,
        cost: 0.04 // DALL-E 3 standard cost
      };
    } catch (error) {
      console.error('Ошибка генерации визуала:', error);
      throw new Error(`Не удалось создать визуал: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  // Пакетная генерация визуалов для серии постов
  async generateVisualsForMultiplePosts(
    posts: Array<{ text: string; platform: string }>,
    userId: string
  ): Promise<AutoVisualResult[]> {
    const results: AutoVisualResult[] = [];

    for (const post of posts) {
      try {
        const visual = await this.generateVisualForPost(
          post.text,
          post.platform as any,
          userId
        );
        results.push(visual);

        // Небольшая задержка между запросами
        await new Promise(resolve => setTimeout(resolve, 1000));
      } catch (error) {
        console.error(`Ошибка для поста: ${post.text.substring(0, 50)}`, error);
      }
    }

    return results;
  }

  // Автоматический визуал для вирусного контента
  async generateViralVisual(
    contentType: 'meme' | 'infographic' | 'quote' | 'statistic',
    topic: string,
    platform: string,
    userId: string
  ): Promise<AutoVisualResult> {
    const contentPrompts = {
      meme: `Create a viral meme-style image about ${topic}. Bold, humorous, eye-catching visual metaphor. Social media friendly composition.`,
      infographic: `Create a modern infographic visualization about ${topic}. Clean data visualization, professional business style, clear hierarchy, statistics-focused.`,
      quote: `Create an inspiring quote image about ${topic}. Motivational typography, elegant design, shareable social media format.`,
      statistic: `Create a bold statistic visualization about ${topic}. Large numbers, impactful data presentation, professional modern style.`
    };

    const basePrompt = contentPrompts[contentType] || contentPrompts.meme;

    let size: "1024x1024" | "1792x1024" | "1024x1792" = "1024x1024";
    if (platform === 'tiktok') size = "1024x1792";
    else if (platform === 'youtube' || platform === 'telegram') size = "1792x1024";

    const imageResponse = await openai.images.generate({
      model: "dall-e-3",
      prompt: basePrompt,
      n: 1,
      size,
      quality: "hd",
      style: "vivid"
    });

    const imageUrl = imageResponse.data[0].url || '';

    await storage.createActivityLog({
      userId,
      action: 'Viral Visual Generated',
      description: `Создан вирусный ${contentType} визуал`,
      status: 'success',
      metadata: { contentType, topic, platform }
    });

    return {
      imageUrl,
      prompt: basePrompt,
      postText: `Вирусный ${contentType} про ${topic}`,
      platform,
      cost: 0.12 // HD quality
    };
  }
}

export const autoVisualGenerator = new AutoVisualGenerator();
