import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { 
  Brain, 
  TrendingUp, 
  Target, 
  Coins,
  BookOpen,
  Hash,
  Users,
  Lightbulb,
  Sparkles,
  Clock,
  DollarSign,
  BarChart3,
  Copy,
  Download
} from 'lucide-react';
import { apiRequest } from '@/lib/queryClient';
import { toast } from '@/hooks/use-toast';

interface AIResult {
  content: string;
  tokensUsed: number;
  cost: number;
}

export default function AIContentGenerator() {
  const [loading, setLoading] = useState<string | null>(null);
  const [results, setResults] = useState<{[key: string]: any}>({});

  const generateContent = async (endpoint: string, data: any, key: string) => {
    try {
      setLoading(key);
      const response = await apiRequest('POST', `/api/ai/${endpoint}`, data);
      const result = await response.json();
      
      setResults(prev => ({ ...prev, [key]: result }));
      toast({
        title: "Контент успешно создан",
        description: `Использовано ${result.tokensUsed} токенов • $${result.cost.toFixed(4)}`
      });
    } catch (error) {
      toast({
        title: "Ошибка генерации",
        description: "Не удалось создать контент",
        variant: "destructive"
      });
    } finally {
      setLoading(null);
    }
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    toast({
      title: "Скопировано",
      description: "Контент скопирован в буфер обмена"
    });
  };

  const ResultCard = ({ title, result, icon: Icon }: { title: string, result: any, icon: any }) => {
    if (!result) return null;
    
    return (
      <Card className="mt-4">
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center gap-2 text-amber-600 dark:text-amber-400">
            <Icon className="w-5 h-5" />
            {title}
            <Badge variant="outline" className="ml-auto">
              ${result.cost?.toFixed(4)} • {result.tokensUsed} токенов
            </Badge>
          </CardTitle>
        </CardHeader>
        <CardContent>
          {typeof result.content === 'string' ? (
            <div className="space-y-3">
              <div className="relative bg-muted/30 p-4 rounded-lg">
                <pre className="whitespace-pre-wrap text-sm leading-relaxed">
                  {result.content}
                </pre>
                <Button
                  size="sm"
                  variant="outline"
                  className="absolute top-2 right-2"
                  onClick={() => copyToClipboard(result.content)}
                  data-testid="button-copy-content"
                >
                  <Copy className="w-4 h-4" />
                </Button>
              </div>
            </div>
          ) : (
            <div className="space-y-3">
              {Object.entries(result).map(([key, value]) => (
                <div key={key} className="space-y-2">
                  <Label className="text-sm font-medium capitalize">
                    {key.replace(/_/g, ' ')}
                  </Label>
                  <div className="bg-muted/30 p-3 rounded text-sm">
                    {Array.isArray(value) ? (
                      <div className="flex flex-wrap gap-1">
                        {value.map((item, idx) => (
                          <Badge key={idx} variant="secondary">
                            {typeof item === 'string' ? item : JSON.stringify(item)}
                          </Badge>
                        ))}
                      </div>
                    ) : (
                      <span>{typeof value === 'string' ? value : JSON.stringify(value, null, 2)}</span>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    );
  };

  return (
    <div className="space-y-6">
      <div className="text-center space-y-2">
        <h1 className="text-3xl font-bold bg-gradient-to-r from-amber-600 to-amber-400 bg-clip-text text-transparent">
          AI Инструменты для Трейдинг-Контента
        </h1>
        <p className="text-muted-foreground text-lg">
          Профессиональная генерация контента на основе анализа ведущих каналов
        </p>
        <div className="flex justify-center gap-2 text-sm text-muted-foreground">
          <Badge variant="outline">Rayner Teo: 18.3M</Badge>
          <Badge variant="outline">Coin Bureau: 2.52M</Badge>
          <Badge variant="outline">#crypto: 30B views</Badge>
        </div>
      </div>

      <Tabs defaultValue="viral" className="space-y-6">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="viral" data-testid="tab-viral">Viral Контент</TabsTrigger>
          <TabsTrigger value="analysis" data-testid="tab-analysis">Анализ & Сигналы</TabsTrigger>
          <TabsTrigger value="education" data-testid="tab-education">Обучение</TabsTrigger>
          <TabsTrigger value="optimization" data-testid="tab-optimization">Оптимизация</TabsTrigger>
        </TabsList>

        {/* Viral контент */}
        <TabsContent value="viral" className="space-y-6">
          {/* TikTok Viral */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Sparkles className="w-5 h-5 text-pink-500" />
                Viral TikTok Контент
                <Badge variant="secondary">30B просмотров</Badge>
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Трендовая тема</Label>
                  <Input 
                    placeholder="Bitcoin 2025, Crypto crash, DeFi revolution"
                    data-testid="input-viral-trend"
                    id="viral-trend"
                  />
                </div>
                <div className="space-y-2">
                  <Label>Hooks (через запятую)</Label>
                  <Input 
                    placeholder="Остановись!, Не покупай пока..., Секрет трейдеров"
                    data-testid="input-viral-hooks"
                    id="viral-hooks"
                  />
                </div>
              </div>
              <Button 
                className="w-full" 
                disabled={loading === 'viral'}
                onClick={() => {
                  const trend = (document.getElementById('viral-trend') as HTMLInputElement)?.value;
                  const hooksStr = (document.getElementById('viral-hooks') as HTMLInputElement)?.value;
                  if (!trend || !hooksStr) return;
                  const hooks = hooksStr.split(',').map(h => h.trim());
                  generateContent('viral-tiktok', { trend, hooks }, 'viral');
                }}
                data-testid="button-generate-viral"
              >
                {loading === 'viral' ? (
                  <>
                    <Clock className="w-4 h-4 mr-2 animate-spin" />
                    Создание viral контента...
                  </>
                ) : (
                  <>
                    <Sparkles className="w-4 h-4 mr-2" />
                    Создать Viral TikTok
                  </>
                )}
              </Button>
            </CardContent>
          </Card>

          <ResultCard 
            title="Viral TikTok Контент" 
            result={results.viral} 
            icon={Sparkles}
          />

          {/* YouTube Анализ */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <BarChart3 className="w-5 h-5 text-red-500" />
                YouTube Анализ в стиле топ-каналов
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Рынки для анализа</Label>
                  <Input 
                    placeholder="BTC/USD, EUR/GBP, Gold"
                    data-testid="input-youtube-markets"
                    id="youtube-markets"
                  />
                </div>
                <div className="space-y-2">
                  <Label>Стиль канала</Label>
                  <Select>
                    <SelectTrigger data-testid="select-youtube-style" id="youtube-style">
                      <SelectValue placeholder="Выберите стиль" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="rayner_teo">Rayner Teo (18.3M) - Price Action</SelectItem>
                      <SelectItem value="coin_bureau">Coin Bureau (2.52M) - Crypto Аналитика</SelectItem>
                      <SelectItem value="trading_channel">Trading Channel (2.38M) - Forex Обучение</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <Button 
                className="w-full" 
                disabled={loading === 'youtube'}
                onClick={() => {
                  const marketsStr = (document.getElementById('youtube-markets') as HTMLInputElement)?.value;
                  const style = (document.querySelector('[id="youtube-style"] input') as HTMLInputElement)?.value;
                  if (!marketsStr || !style) return;
                  const markets = marketsStr.split(',').map(m => m.trim());
                  generateContent('youtube-analysis', { markets, style }, 'youtube');
                }}
                data-testid="button-generate-youtube"
              >
                {loading === 'youtube' ? (
                  <>
                    <Clock className="w-4 h-4 mr-2 animate-spin" />
                    Создание анализа...
                  </>
                ) : (
                  <>
                    <BarChart3 className="w-4 h-4 mr-2" />
                    Создать YouTube Анализ
                  </>
                )}
              </Button>
            </CardContent>
          </Card>

          <ResultCard 
            title="YouTube Анализ" 
            result={results.youtube} 
            icon={BarChart3}
          />
        </TabsContent>

        {/* Анализ & Сигналы */}
        <TabsContent value="analysis" className="space-y-6">
          {/* Live Сигналы */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Target className="w-5 h-5 text-green-500" />
                Live Торговые Сигналы
                <Badge variant="destructive">Высокий риск</Badge>
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-3 gap-4">
                <div className="space-y-2">
                  <Label>Символ</Label>
                  <Input placeholder="BTC/USDT" data-testid="input-signal-symbol" id="signal-symbol" />
                </div>
                <div className="space-y-2">
                  <Label>Действие</Label>
                  <Select>
                    <SelectTrigger id="signal-action" data-testid="select-signal-action">
                      <SelectValue placeholder="BUY/SELL" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="BUY">BUY - Покупка</SelectItem>
                      <SelectItem value="SELL">SELL - Продажа</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>Точка входа</Label>
                  <Input placeholder="45000" type="number" data-testid="input-signal-entry" id="signal-entry" />
                </div>
              </div>
              
              <div className="grid grid-cols-4 gap-4">
                <div className="space-y-2">
                  <Label>Цели (через запятую)</Label>
                  <Input placeholder="46000, 47000, 48000" data-testid="input-signal-targets" id="signal-targets" />
                </div>
                <div className="space-y-2">
                  <Label>Стоп-лосс</Label>
                  <Input placeholder="44000" type="number" data-testid="input-signal-stoploss" id="signal-stoploss" />
                </div>
                <div className="space-y-2">
                  <Label>Плечо (опц.)</Label>
                  <Input placeholder="5" type="number" data-testid="input-signal-leverage" id="signal-leverage" />
                </div>
                <div className="space-y-2">
                  <Label>Уверенность (1-10)</Label>
                  <Input placeholder="8" type="number" min="1" max="10" data-testid="input-signal-confidence" id="signal-confidence" />
                </div>
              </div>
              
              <Button 
                className="w-full" 
                disabled={loading === 'signal'}
                onClick={() => {
                  const symbol = (document.getElementById('signal-symbol') as HTMLInputElement)?.value;
                  const action = (document.querySelector('[id="signal-action"] input') as HTMLInputElement)?.value as 'BUY' | 'SELL';
                  const entry = parseFloat((document.getElementById('signal-entry') as HTMLInputElement)?.value);
                  const targetsStr = (document.getElementById('signal-targets') as HTMLInputElement)?.value;
                  const stopLoss = parseFloat((document.getElementById('signal-stoploss') as HTMLInputElement)?.value);
                  const leverage = parseInt((document.getElementById('signal-leverage') as HTMLInputElement)?.value) || undefined;
                  const confidence = parseInt((document.getElementById('signal-confidence') as HTMLInputElement)?.value) || 8;
                  
                  if (!symbol || !action || !entry || !targetsStr || !stopLoss) return;
                  const targets = targetsStr.split(',').map(t => parseFloat(t.trim()));
                  
                  generateContent('live-signal', { symbol, action, entry, targets, stopLoss, leverage, confidence }, 'signal');
                }}
                data-testid="button-generate-signal"
              >
                {loading === 'signal' ? (
                  <>
                    <Clock className="w-4 h-4 mr-2 animate-spin" />
                    Создание сигнала...
                  </>
                ) : (
                  <>
                    <Target className="w-4 h-4 mr-2" />
                    Создать Live Сигнал
                  </>
                )}
              </Button>
            </CardContent>
          </Card>

          <ResultCard 
            title="Live Торговый Сигнал" 
            result={results.signal} 
            icon={Target}
          />

          {/* Crypto Прогнозы */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Coins className="w-5 h-5 text-amber-500" />
                Crypto Прогнозы
                <Badge variant="secondary">Топ формат</Badge>
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Временной горизонт</Label>
                  <Select>
                    <SelectTrigger id="crypto-timeframe" data-testid="select-crypto-timeframe">
                      <SelectValue placeholder="Выберите период" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="2025">2025 год</SelectItem>
                      <SelectItem value="2026">2026 год</SelectItem>
                      <SelectItem value="короткосрочно">Краткосрочно</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>Монеты (через запятую)</Label>
                  <Input placeholder="BTC, ETH, XRP, ADA, SOL" data-testid="input-crypto-coins" id="crypto-coins" />
                </div>
              </div>
              <div className="space-y-2">
                <Label>Обоснование (каждое с новой строки)</Label>
                <Textarea 
                  placeholder="Halving эффект для BTC
Ethereum 2.0 upgrade
DeFi революция продолжается
Институциональное принятие" 
                  rows={4}
                  data-testid="textarea-crypto-reasoning"
                  id="crypto-reasoning"
                />
              </div>
              <Button 
                className="w-full" 
                disabled={loading === 'crypto'}
                onClick={() => {
                  const timeframe = (document.querySelector('[id="crypto-timeframe"] input') as HTMLInputElement)?.value as '2025' | '2026' | 'короткосрочно';
                  const coinsStr = (document.getElementById('crypto-coins') as HTMLInputElement)?.value;
                  const reasoningText = (document.getElementById('crypto-reasoning') as HTMLTextAreaElement)?.value;
                  
                  if (!timeframe || !coinsStr || !reasoningText) return;
                  const coins = coinsStr.split(',').map(c => c.trim());
                  const reasoning = reasoningText.split('\n').map(r => r.trim()).filter(r => r);
                  
                  generateContent('crypto-predictions', { timeframe, coins, reasoning }, 'crypto');
                }}
                data-testid="button-generate-crypto"
              >
                {loading === 'crypto' ? (
                  <>
                    <Clock className="w-4 h-4 mr-2 animate-spin" />
                    Создание прогноза...
                  </>
                ) : (
                  <>
                    <Coins className="w-4 h-4 mr-2" />
                    Создать Crypto Прогноз
                  </>
                )}
              </Button>
            </CardContent>
          </Card>

          <ResultCard 
            title="Crypto Прогнозы" 
            result={results.crypto} 
            icon={Coins}
          />
        </TabsContent>

        {/* Обучение */}
        <TabsContent value="education" className="space-y-6">
          {/* Forex Образование */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <BookOpen className="w-5 h-5 text-blue-500" />
                Forex Образование
                <Badge variant="outline">Профессиональное</Badge>
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-3 gap-4">
                <div className="space-y-2">
                  <Label>Тема</Label>
                  <Input placeholder="Price Action, Свечной анализ" data-testid="input-forex-topic" id="forex-topic" />
                </div>
                <div className="space-y-2">
                  <Label>Уровень опыта</Label>
                  <Select>
                    <SelectTrigger id="forex-experience" data-testid="select-forex-experience">
                      <SelectValue placeholder="Выберите уровень" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="новичок">Новичок</SelectItem>
                      <SelectItem value="средний">Средний уровень</SelectItem>
                      <SelectItem value="продвинутый">Продвинутый</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>Фокус обучения</Label>
                  <Select>
                    <SelectTrigger id="forex-focus" data-testid="select-forex-focus">
                      <SelectValue placeholder="Выберите фокус" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="психология">Психология торговли</SelectItem>
                      <SelectItem value="теханализ">Технический анализ</SelectItem>
                      <SelectItem value="фундаментал">Фундаментальный анализ</SelectItem>
                      <SelectItem value="риск-менеджмент">Риск-менеджмент</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <Button 
                className="w-full" 
                disabled={loading === 'forex'}
                onClick={() => {
                  const topic = (document.getElementById('forex-topic') as HTMLInputElement)?.value;
                  const experience = (document.querySelector('[id="forex-experience"] input') as HTMLInputElement)?.value as 'новичок' | 'средний' | 'продвинутый';
                  const focus = (document.querySelector('[id="forex-focus"] input') as HTMLInputElement)?.value as 'психология' | 'теханализ' | 'фундаментал' | 'риск-менеджмент';
                  
                  if (!topic || !experience || !focus) return;
                  generateContent('forex-education', { topic, experience, focus }, 'forex');
                }}
                data-testid="button-generate-forex"
              >
                {loading === 'forex' ? (
                  <>
                    <Clock className="w-4 h-4 mr-2 animate-spin" />
                    Создание обучения...
                  </>
                ) : (
                  <>
                    <BookOpen className="w-4 h-4 mr-2" />
                    Создать Forex Обучение
                  </>
                )}
              </Button>
            </CardContent>
          </Card>

          <ResultCard 
            title="Forex Образование" 
            result={results.forex} 
            icon={BookOpen}
          />
        </TabsContent>

        {/* Оптимизация */}
        <TabsContent value="optimization" className="space-y-6">
          {/* Анализ трендов */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <TrendingUp className="w-5 h-5 text-purple-500" />
                Анализ трендовых тем
                <Badge variant="secondary">Real-time</Badge>
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Платформа</Label>
                  <Select>
                    <SelectTrigger id="trends-platform" data-testid="select-trends-platform">
                      <SelectValue placeholder="Выберите платформу" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="tiktok">TikTok</SelectItem>
                      <SelectItem value="youtube">YouTube</SelectItem>
                      <SelectItem value="instagram">Instagram</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>Ниша</Label>
                  <Select>
                    <SelectTrigger id="trends-niche" data-testid="select-trends-niche">
                      <SelectValue placeholder="Выберите нишу" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="crypto">Криптовалюты</SelectItem>
                      <SelectItem value="forex">Форекс</SelectItem>
                      <SelectItem value="stocks">Акции</SelectItem>
                      <SelectItem value="general">Общий трейдинг</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <Button 
                className="w-full" 
                disabled={loading === 'trends'}
                onClick={() => {
                  const platform = (document.querySelector('[id="trends-platform"] input') as HTMLInputElement)?.value as 'tiktok' | 'youtube' | 'instagram';
                  const niche = (document.querySelector('[id="trends-niche"] input') as HTMLInputElement)?.value as 'crypto' | 'forex' | 'stocks' | 'general';
                  
                  if (!platform || !niche) return;
                  generateContent('analyze-trends', { platform, niche }, 'trends');
                }}
                data-testid="button-analyze-trends"
              >
                {loading === 'trends' ? (
                  <>
                    <Clock className="w-4 h-4 mr-2 animate-spin" />
                    Анализ трендов...
                  </>
                ) : (
                  <>
                    <TrendingUp className="w-4 h-4 mr-2" />
                    Анализировать Тренды
                  </>
                )}
              </Button>
            </CardContent>
          </Card>

          <ResultCard 
            title="Анализ трендов" 
            result={results.trends} 
            icon={TrendingUp}
          />

          {/* Оптимизация хештегов */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Hash className="w-5 h-5 text-cyan-500" />
                Профессиональная оптимизация хештегов
                <Badge variant="outline">30B+ данных</Badge>
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Контент</Label>
                  <Textarea 
                    placeholder="Bitcoin достиг нового максимума! Анализ перспектив..."
                    rows={3}
                    data-testid="textarea-hashtag-content"
                    id="hashtag-content"
                  />
                </div>
                <div className="space-y-2">
                  <Label>Платформа</Label>
                  <Select>
                    <SelectTrigger id="hashtag-platform" data-testid="select-hashtag-platform">
                      <SelectValue placeholder="Выберите платформу" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="tiktok">TikTok</SelectItem>
                      <SelectItem value="instagram">Instagram</SelectItem>
                      <SelectItem value="youtube">YouTube</SelectItem>
                    </SelectContent>
                  </Select>
                  <Label>Целевая аудитория</Label>
                  <Select>
                    <SelectTrigger id="hashtag-audience" data-testid="select-hashtag-audience">
                      <SelectValue placeholder="Аудитория" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="новички">Новички в трейдинге</SelectItem>
                      <SelectItem value="опытные">Опытные трейдеры</SelectItem>
                      <SelectItem value="смешанная">Смешанная аудитория</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <Button 
                className="w-full" 
                disabled={loading === 'hashtags'}
                onClick={() => {
                  const content = (document.getElementById('hashtag-content') as HTMLTextAreaElement)?.value;
                  const platform = (document.querySelector('[id="hashtag-platform"] input') as HTMLInputElement)?.value;
                  const targetAudience = (document.querySelector('[id="hashtag-audience"] input') as HTMLInputElement)?.value as 'новички' | 'опытные' | 'смешанная';
                  
                  if (!content || !platform) return;
                  generateContent('optimize-hashtags-pro', { content, platform, targetAudience }, 'hashtags');
                }}
                data-testid="button-optimize-hashtags"
              >
                {loading === 'hashtags' ? (
                  <>
                    <Clock className="w-4 h-4 mr-2 animate-spin" />
                    Оптимизация хештегов...
                  </>
                ) : (
                  <>
                    <Hash className="w-4 h-4 mr-2" />
                    Оптимизировать Хештеги
                  </>
                )}
              </Button>
            </CardContent>
          </Card>

          <ResultCard 
            title="Оптимизация хештегов" 
            result={results.hashtags} 
            icon={Hash}
          />
        </TabsContent>
      </Tabs>
    </div>
  );
}