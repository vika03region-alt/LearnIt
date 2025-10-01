export const grokService = {
  async testConnection(prompt: string) {
    try {
      console.log('🔄 Тестирование подключения к Grok API...');

      const response = await fetch('https://api.x.ai/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${process.env.GROK_API_KEY}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          messages: [
            {
              role: 'system',
              content: 'Ты помощник для анализа и продвижения в социальных сетях. Отвечай кратко и по делу.'
            },
            {
              role: 'user',
              content: prompt
            }
          ],
          model: 'grok-beta',
          stream: false,
          temperature: 0.7
        })
      });

      if (!response.ok) {
        const errorText = await response.text();
        console.error('❌ Ошибка Grok API:', errorText);
        throw new Error(`Grok API error: ${response.status} - ${errorText}`);
      }

      const data = await response.json();
      console.log('✅ Grok API ответил успешно');

      return {
        success: true,
        response: data.choices[0]?.message?.content || 'Пустой ответ',
        usage: data.usage,
        model: data.model
      };
    } catch (error) {
      console.error('🚨 Критическая ошибка Grok API:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Неизвестная ошибка'
      };
    }
  },

  async advancedAnalysis(prompt: string, analysisType: string) {
    try {
      console.log(`🔍 Запуск продвинутого анализа: ${analysisType}`);

      const systemPrompts = {
        telegram_promotion_analysis: `Ты эксперт по продвижению Telegram каналов. 
        Анализируй каналы комплексно: контент-стратегию, аудиторию, конкурентов, монетизацию.
        Давай конкретные actionable рекомендации с метриками и таймлайнами.`,

        viral_content_strategy: `Ты специалист по созданию вирусного контента.
        Анализируй тренды, психологию аудитории, эмоциональные триггеры.
        Предлагай конкретные форматы и стратегии для максимального охвата.`,

        competitor_analysis: `Ты аналитик конкурентной разведки.
        Изучай стратегии конкурентов, их сильные и слабые стороны.
        Предлагай способы превзойти конкурентов и занять их долю рынка.`
      };

      const systemContent = systemPrompts[analysisType as keyof typeof systemPrompts] || 
                           systemPrompts.telegram_promotion_analysis;

      const response = await fetch('https://api.x.ai/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${process.env.GROK_API_KEY}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          messages: [
            {
              role: 'system',
              content: systemContent
            },
            {
              role: 'user',
              content: prompt
            }
          ],
          model: 'grok-beta',
          stream: false,
          temperature: 0.8,
          max_tokens: 2000
        })
      });

      if (!response.ok) {
        const errorText = await response.text();
        console.error('❌ Ошибка продвинутого анализа Grok:', errorText);
        throw new Error(`Grok advanced analysis error: ${response.status} - ${errorText}`);
      }

      const data = await response.json();
      console.log('✅ Продвинутый анализ Grok завершен');

      return {
        success: true,
        response: data.choices[0]?.message?.content || 'Пустой ответ',
        usage: data.usage,
        model: data.model,
        analysisType
      };
    } catch (error) {
      console.error('🚨 Ошибка продвинутого анализа:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Ошибка продвинутого анализа'
      };
    }
  },

  async generatePromotionStrategy(channelUrl: string, niche: string) {
    try {
      const prompt = `Создай детальную стратегию продвижения для Telegram канала ${channelUrl} в нише ${niche}.

      Включи:
      1. Анализ целевой аудитории
      2. Контент-план на месяц
      3. Стратегии привлечения подписчиков
      4. Методы монетизации
      5. KPI и метрики для отслеживания
      6. Бюджет и ROI прогнозы

      Дай конкретные actionable шаги с временными рамками.`;

      return await this.advancedAnalysis(prompt, 'telegram_promotion_analysis');
    } catch (error) {
      console.error('Ошибка генерации стратегии продвижения:', error);
      return {
        success: false,
        error: 'Не удалось создать стратегию продвижения'
      };
    }
  }
};