
import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Button } from './ui/button';
import { Slider } from './ui/slider';
import { Tabs, TabsContent, TabsList, TabsTrigger } from './ui/tabs';
import { Scissors, Play, Download, Wand2, Filter } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

export function VideoEditor() {
  const [trimStart, setTrimStart] = useState(0);
  const [trimEnd, setTrimEnd] = useState(100);
  const [selectedFilter, setSelectedFilter] = useState('none');
  const [isProcessing, setIsProcessing] = useState(false);
  const { toast } = useToast();

  const filters = [
    { id: 'none', name: 'Без фильтра', emoji: '🎬' },
    { id: 'vintage', name: 'Винтаж', emoji: '📷' },
    { id: 'bright', name: 'Яркий', emoji: '☀️' },
    { id: 'dark', name: 'Тёмный', emoji: '🌙' },
  ];

  const applyEdits = async () => {
    setIsProcessing(true);
    try {
      const response = await fetch('/api/video/edit', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          trimStart,
          trimEnd,
          filter: selectedFilter,
        }),
      });

      if (response.ok) {
        toast({
          title: "✅ Готово!",
          description: "Видео успешно обработано",
        });
      }
    } catch (error) {
      toast({
        title: "Ошибка",
        description: "Не удалось обработать видео",
        variant: "destructive",
      });
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Scissors className="w-5 h-5" />
          Редактор видео
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="aspect-video bg-gray-100 rounded-lg flex items-center justify-center">
          <Play className="w-16 h-16 text-gray-400" />
        </div>

        <Tabs defaultValue="trim">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="trim">Обрезка</TabsTrigger>
            <TabsTrigger value="filters">Фильтры</TabsTrigger>
            <TabsTrigger value="ai">AI Улучшение</TabsTrigger>
          </TabsList>

          <TabsContent value="trim" className="space-y-4">
            <div className="space-y-2">
              <label className="text-sm font-medium">Начало: {trimStart}%</label>
              <Slider
                value={[trimStart]}
                onValueChange={(value) => setTrimStart(value[0])}
                max={100}
                step={1}
              />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">Конец: {trimEnd}%</label>
              <Slider
                value={[trimEnd]}
                onValueChange={(value) => setTrimEnd(value[0])}
                max={100}
                step={1}
              />
            </div>
          </TabsContent>

          <TabsContent value="filters">
            <div className="grid grid-cols-2 gap-2">
              {filters.map((filter) => (
                <Button
                  key={filter.id}
                  variant={selectedFilter === filter.id ? 'default' : 'outline'}
                  onClick={() => setSelectedFilter(filter.id)}
                  className="flex items-center gap-2"
                >
                  <span>{filter.emoji}</span>
                  {filter.name}
                </Button>
              ))}
            </div>
          </TabsContent>

          <TabsContent value="ai" className="space-y-4">
            <Button variant="outline" className="w-full">
              <Wand2 className="w-4 h-4 mr-2" />
              Улучшить качество
            </Button>
            <Button variant="outline" className="w-full">
              <Filter className="w-4 h-4 mr-2" />
              Автоматическая цветокоррекция
            </Button>
          </TabsContent>
        </Tabs>

        <div className="flex gap-2">
          <Button
            onClick={applyEdits}
            disabled={isProcessing}
            className="flex-1"
          >
            {isProcessing ? 'Обработка...' : 'Применить'}
          </Button>
          <Button variant="outline">
            <Download className="w-4 h-4" />
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
