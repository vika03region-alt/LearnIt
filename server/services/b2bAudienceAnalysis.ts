
import { storage } from '../storage';
import { OpenAI } from 'openai';

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY || '',
});

interface B2BAudienceProfile {
  industries: string[];
  companySize: string[];
  decisionMakers: string[];
  painPoints: string[];
  contentPreferences: string[];
  platforms: string[];
  bestTimes: number[];
}

class B2BAudienceAnalysisService {
  async analyzeOrganization(orgData: {
    industry: string;
    website?: string;
    competitors?: string[];
    targetMarkets?: string[];
  }): Promise<B2BAudienceProfile> {
    const prompt = `
Проанализируй целевую аудиторию для B2B маркетинга организации:

Индустрия: ${orgData.industry}
Сайт: ${orgData.website || 'не указан'}
Конкуренты: ${orgData.competitors?.join(', ') || 'не указаны'}
Целевые рынки: ${orgData.targetMarkets?.join(', ') || 'не указаны'}

Создай детальный профиль целевой аудитории в формате JSON:
{
  "industries": ["связанные индустрии"],
  "companySize": ["малый бизнес", "средний бизнес", "корпорации"],
  "decisionMakers": ["должности лиц принимающих решения"],
  "painPoints": ["основные проблемы аудитории"],
  "contentPreferences": ["типы контента которые работают"],
  "platforms": ["приоритетные платформы"],
  "bestTimes": [часы для постинга]
}
`;

    const response = await openai.chat.completions.create({
      model: 'gpt-4',
      messages: [{ role: 'user', content: prompt }],
      temperature: 0.3,
    });

    return JSON.parse(response.choices[0].message.content || '{}');
  }

  async generateLeadMagnet(audienceProfile: B2BAudienceProfile): Promise<{
    title: string;
    description: string;
    format: string;
    content: string;
  }> {
    const prompt = `
Создай lead-magnet для привлечения B2B аудитории:

Целевая аудитория:
- Индустрии: ${audienceProfile.industries.join(', ')}
- Размер компаний: ${audienceProfile.companySize.join(', ')}
- ЛПР: ${audienceProfile.decisionMakers.join(', ')}
- Боли: ${audienceProfile.painPoints.join(', ')}

Создай ценное предложение в формате JSON:
{
  "title": "заголовок lead-магнита",
  "description": "описание ценности",
  "format": "чек-лист/гайд/шаблон/вебинар",
  "content": "структура контента"
}
`;

    const response = await openai.chat.completions.create({
      model: 'gpt-4',
      messages: [{ role: 'user', content: prompt }],
      temperature: 0.7,
    });

    return JSON.parse(response.choices[0].message.content || '{}');
  }
}

export const b2bAudienceAnalysis = new B2BAudienceAnalysisService();
