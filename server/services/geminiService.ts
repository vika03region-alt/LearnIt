import { GoogleGenerativeAI } from "@google/generative-ai";

const genAI = new GoogleGenerativeAI(process.env.GEMINI || "");

export async function analyzeNicheWithGemini(username?: string): Promise<string> {
  try {
    const model = genAI.getGenerativeModel({ model: "gemini-2.0-flash-exp" });

    const prompt = `Ты эксперт по маркетингу в социальных сетях. Проведи глубокий анализ ниши для пользователя ${username || "новый клиент"}.

Сделай КОНКРЕТНЫЙ и ДЕТАЛЬНЫЙ анализ:

🎯 **ОПРЕДЕЛЕНИЕ НИШИ**
Определи нишу на основе username/контекста. Если непонятно - предложи 3 лучших варианта для начинающих.

📊 **АНАЛИЗ КОНКУРЕНТОВ**
- Топ-3 игрока в этой нише
- Их слабые стороны и возможности

💎 **ТОЧКИ УНИКАЛЬНОСТИ**
- Как выделиться среди конкурентов
- Уникальное позиционирование

👥 **ЦЕЛЕВАЯ АУДИТОРИЯ**
**Демография**: возраст, пол, география, доход
**Боли**: 3-5 главных проблем аудитории
**Желания**: чего хотят достичь

📱 **КОНТЕНТ-СТРАТЕГИЯ**
**Форматы**: какие типы контента работают
**Темы**: 5-7 конкретных тем для постов
**Частота**: оптимальная частота публикаций

🚀 **ТОП-3 ДЕЙСТВИЯ ДЛЯ БЫСТРОГО РОСТА**
Конкретные шаги, которые можно сделать прямо сейчас.

Форматируй ответ в Markdown для Telegram (используй *жирный*, _курсив_, \`код\`).`;

    const result = await model.generateContent(prompt);
    const response = result.response;
    const text = response.text();

    return text || "Не удалось сгенерировать анализ";
  } catch (error: any) {
    console.error("❌ Ошибка Gemini анализа ниши:", error);
    throw new Error(`Gemini API ошибка: ${error.message}`);
  }
}

export async function generateContentWithGemini(
  topic: string,
  brandStyle?: {
    tone: string;
    keywords: string[];
    targetAudience: string;
  }
): Promise<string> {
  try {
    const model = genAI.getGenerativeModel({ model: "gemini-2.0-flash-exp" });

    const styleContext = brandStyle
      ? `
Стиль бренда:
- Тон: ${brandStyle.tone}
- Ключевые слова: ${brandStyle.keywords.join(", ")}
- Целевая аудитория: ${brandStyle.targetAudience}
`
      : "";

    const prompt = `Создай вовлекающий пост для Telegram на тему: "${topic}"

${styleContext}

Требования:
- Длина: 150-300 символов
- Начни с хука (первая строка должна цеплять)
- Добавь эмодзи для визуальной привлекательности
- Закончи призывом к действию
- Используй Markdown форматирование

Только текст поста, без пояснений.`;

    const result = await model.generateContent(prompt);
    const response = result.response;
    const text = response.text();

    return text || "Не удалось сгенерировать контент";
  } catch (error: any) {
    console.error("❌ Ошибка Gemini генерации контента:", error);
    throw new Error(`Gemini API ошибка: ${error.message}`);
  }
}

export async function analyzeTrendVideoWithGemini(
  trendDescription: string,
  videoUrl?: string
): Promise<{
  whyItWorks: string;
  keyElements: string[];
  adaptationStrategy: string;
}> {
  try {
    const model = genAI.getGenerativeModel({ model: "gemini-2.0-flash-exp" });

    const prompt = `Проанализируй тренд в социальных сетях:

Описание: ${trendDescription}
${videoUrl ? `URL: ${videoUrl}` : ""}

Ответь в формате JSON:
{
  "whyItWorks": "почему этот тренд работает (1-2 предложения)",
  "keyElements": ["элемент1", "элемент2", "элемент3"],
  "adaptationStrategy": "как адаптировать под свой бренд (2-3 предложения)"
}`;

    const result = await model.generateContent(prompt);
    const response = result.response;
    const text = response.text();

    const jsonMatch = text.match(/\{[\s\S]*\}/);
    if (jsonMatch) {
      return JSON.parse(jsonMatch[0]);
    }

    return {
      whyItWorks: "Тренд работает благодаря вирусному потенциалу и эмоциональной вовлеченности.",
      keyElements: ["Визуальная привлекательность", "Эмоциональный отклик", "Простота повторения"],
      adaptationStrategy: "Адаптируйте формат под ваш бренд, сохраняя ключевую идею тренда.",
    };
  } catch (error: any) {
    console.error("❌ Ошибка Gemini анализа тренда:", error);
    throw new Error(`Gemini API ошибка: ${error.message}`);
  }
}

export async function generateImagePromptWithGemini(
  trendDescription: string,
  brandStyle?: string
): Promise<string> {
  try {
    const model = genAI.getGenerativeModel({ model: "gemini-2.0-flash-exp" });

    const prompt = `Создай детальный промпт для AI генерации изображения на основе тренда:

Тренд: ${trendDescription}
${brandStyle ? `Стиль бренда: ${brandStyle}` : ""}

Требования к промпту:
- Детальное описание сцены, освещения, ракурса
- Художественный стиль (cinematic, professional, vibrant и т.д.)
- Конкретные визуальные элементы
- Эмоциональная атмосфера
- Длина: 50-150 слов
- На английском языке для оптимальной работы с Fal.ai

Только промпт, без пояснений.`;

    const result = await model.generateContent(prompt);
    const response = result.response;
    const text = response.text();

    return text || "Professional high-quality image, vibrant colors, engaging composition";
  } catch (error: any) {
    console.error("❌ Ошибка Gemini генерации промпта:", error);
    throw new Error(`Gemini API ошибка: ${error.message}`);
  }
}

export async function generateTradingContentWithGemini(params: {
  type: 'signal' | 'analysis' | 'education';
  market?: string;
  trend?: string;
  audience?: string;
}): Promise<string> {
  try {
    const model = genAI.getGenerativeModel({ model: "gemini-2.0-flash-exp" });

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

    const result = await model.generateContent(prompts[params.type]);
    const response = result.response;
    return response.text();
  } catch (error: any) {
    console.error("❌ Ошибка Gemini генерации трейдинг контента:", error);
    throw new Error(`Gemini API ошибка: ${error.message}`);
  }
}

// Экспорт для использования в других модулях
export const geminiService = {
  generateContent: async (prompt: string, systemInstruction?: string) => {
    const model = genAI.getGenerativeModel({ model: "gemini-2.0-flash-exp" });
    const result = await model.generateContent(prompt);
    return {
      content: result.response.text(),
      tokensUsed: 0,
      cost: 0
    };
  },
  analyzeImage: async (imageData: string, prompt: string) => {
    const model = genAI.getGenerativeModel({ model: "gemini-2.0-flash-exp" });
    const result = await model.generateContent([prompt, { inlineData: { data: imageData, mimeType: "image/jpeg" } }]);
    return { analysis: result.response.text() };
  },
  generateViralContent: async (platform: string, niche: string, trend?: string) => {
    return await generateContentWithGemini(`Создай вирусный контент для ${platform} в нише ${niche}${trend ? ` на основе тренда: ${trend}` : ''}`);
  },
  analyzeCompetitor: async (competitorUrl: string, platform: string) => {
    const prompt = `Проанализируй конкурента на ${platform}: ${competitorUrl}. Дай стратегию превосходства.`;
    const model = genAI.getGenerativeModel({ model: "gemini-2.0-flash-exp" });
    const result = await model.generateContent(prompt);
    return { analysis: result.response.text() };
  }
};
