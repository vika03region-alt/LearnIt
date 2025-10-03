
import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Textarea } from './ui/textarea';
import { Badge } from './ui/badge';
import { Progress } from './ui/progress';
import { 
  Target, 
  Users, 
  TrendingUp, 
  FileText, 
  Award,
  Lightbulb,
  Download
} from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

export function B2BMarketingHub() {
  const [industry, setIndustry] = useState('');
  const [audienceProfile, setAudienceProfile] = useState<any>(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const { toast } = useToast();

  const analyzeAudience = async () => {
    if (!industry) {
      toast({
        title: "Ошибка",
        description: "Укажите индустрию",
        variant: "destructive",
      });
      return;
    }

    setIsAnalyzing(true);
    try {
      const response = await fetch('/api/b2b/analyze-audience', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ industry }),
      });

      const data = await response.json();
      setAudienceProfile(data.audienceProfile);
      
      toast({
        title: "✅ Анализ завершен!",
        description: "Профиль целевой аудитории создан",
      });
    } catch (error) {
      toast({
        title: "Ошибка",
        description: "Не удалось проанализировать аудиторию",
        variant: "destructive",
      });
    } finally {
      setIsAnalyzing(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold flex items-center gap-2">
          <Target className="w-6 h-6 text-blue-600" />
          B2B Маркетинг
        </h2>
        <Badge variant="secondary">Привлечение клиентов</Badge>
      </div>

      {/* Анализ аудитории */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Users className="w-5 h-5" />
            Анализ целевой аудитории
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <Input
            placeholder="Индустрия (например: IT консалтинг, B2B SaaS, Manufacturing)"
            value={industry}
            onChange={(e) => setIndustry(e.target.value)}
          />
          
          <Button onClick={analyzeAudience} disabled={isAnalyzing} className="w-full">
            {isAnalyzing ? 'Анализ...' : 'Проанализировать аудиторию'}
          </Button>

          {audienceProfile && (
            <div className="mt-4 space-y-3">
              <div className="p-3 bg-blue-50 rounded-lg">
                <h4 className="font-semibold text-sm mb-2">Целевые индустрии:</h4>
                <div className="flex flex-wrap gap-1">
                  {audienceProfile.industries.map((ind: string, i: number) => (
                    <Badge key={i} variant="outline">{ind}</Badge>
                  ))}
                </div>
              </div>

              <div className="p-3 bg-green-50 rounded-lg">
                <h4 className="font-semibold text-sm mb-2">Лица принимающие решения:</h4>
                <div className="flex flex-wrap gap-1">
                  {audienceProfile.decisionMakers.map((dm: string, i: number) => (
                    <Badge key={i} variant="outline">{dm}</Badge>
                  ))}
                </div>
              </div>

              <div className="p-3 bg-amber-50 rounded-lg">
                <h4 className="font-semibold text-sm mb-2">Основные боли:</h4>
                <ul className="text-sm space-y-1">
                  {audienceProfile.painPoints.map((pain: string, i: number) => (
                    <li key={i}>• {pain}</li>
                  ))}
                </ul>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Генераторы контента */}
      <div className="grid md:grid-cols-2 gap-4">
        <Card className="hover:shadow-lg transition-shadow cursor-pointer">
          <CardContent className="p-6 text-center">
            <FileText className="w-12 h-12 mx-auto mb-3 text-blue-600" />
            <h3 className="font-semibold mb-2">Кейс-стади</h3>
            <p className="text-sm text-gray-600 mb-4">
              Создайте убедительный кейс с результатами
            </p>
            <Button size="sm" variant="outline">Создать кейс</Button>
          </CardContent>
        </Card>

        <Card className="hover:shadow-lg transition-shadow cursor-pointer">
          <CardContent className="p-6 text-center">
            <Lightbulb className="w-12 h-12 mx-auto mb-3 text-amber-600" />
            <h3 className="font-semibold mb-2">Lead-магнит</h3>
            <p className="text-sm text-gray-600 mb-4">
              Генерация ценного контента для привлечения
            </p>
            <Button size="sm" variant="outline">Создать магнит</Button>
          </CardContent>
        </Card>

        <Card className="hover:shadow-lg transition-shadow cursor-pointer">
          <CardContent className="p-6 text-center">
            <Award className="w-12 h-12 mx-auto mb-3 text-purple-600" />
            <h3 className="font-semibold mb-2">Thought Leadership</h3>
            <p className="text-sm text-gray-600 mb-4">
              Экспертные статьи для позиционирования
            </p>
            <Button size="sm" variant="outline">Создать статью</Button>
          </CardContent>
        </Card>

        <Card className="hover:shadow-lg transition-shadow cursor-pointer">
          <CardContent className="p-6 text-center">
            <TrendingUp className="w-12 h-12 mx-auto mb-3 text-green-600" />
            <h3 className="font-semibold mb-2">Социальное доказательство</h3>
            <p className="text-sm text-gray-600 mb-4">
              Посты с отзывами и результатами клиентов
            </p>
            <Button size="sm" variant="outline">Создать пост</Button>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
