
import { aiContentService } from './aiContent';

interface B2BContentRequest {
  industry: string;
  painPoint: string;
  platform: string;
  cta: string;
}

class B2BContentGenerator {
  async generateCaseStudy(data: {
    clientName: string;
    problem: string;
    solution: string;
    results: string[];
  }): Promise<string> {
    const prompt = `
Создай убедительный кейс-стади для B2B аудитории:

Клиент: ${data.clientName}
Проблема: ${data.problem}
Решение: ${data.solution}
Результаты: ${data.results.join(', ')}

Формат:
📊 КЕЙС: [название]

🎯 ПРОБЛЕМА:
[описание]

✅ РЕШЕНИЕ:
[что сделали]

📈 РЕЗУЛЬТАТЫ:
[конкретные цифры]

💡 ВЫВОД:
[key takeaway]

Стиль: профессиональный, с цифрами и фактами.
`;

    const result = await aiContentService.generateContent(prompt, 'case_study', ['linkedin', 'facebook']);
    return result.content;
  }

  async generateThoughtLeadership(topic: string, industry: string): Promise<string> {
    const prompt = `
Создай экспертную статью для позиционирования в качестве лидера мнений:

Тема: ${topic}
Индустрия: ${industry}

Структура:
🔥 Провокационный тезис
📊 Данные и статистика
💡 Уникальный инсайт
🚀 Практические рекомендации
❓ Вопрос для дискуссии

Длина: 800-1200 символов для LinkedIn
`;

    const result = await aiContentService.generateContent(prompt, 'thought_leadership', ['linkedin']);
    return result.content;
  }

  async generateSocialProof(testimonials: string[]): Promise<string> {
    const prompt = `
Создай пост с социальным доказательством на основе отзывов:

Отзывы: ${testimonials.join(' | ')}

Формат:
⭐ ЧТО ГОВОРЯТ НАШИ КЛИЕНТЫ:

"[цитата 1]"
- [имя, должность]

"[цитата 2]"
- [имя, должность]

💼 Присоединяйтесь к [число]+ компаниям, которые [результат]

[CTA]
`;

    const result = await aiContentService.generateContent(prompt, 'social_proof', ['linkedin', 'facebook', 'instagram']);
    return result.content;
  }
}

export const b2bContentGenerator = new B2BContentGenerator();
