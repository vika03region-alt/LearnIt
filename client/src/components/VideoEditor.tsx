import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Plus, Trash2, Play, Save, Sparkles, Image, Video } from "lucide-react";

interface VideoScene {
  text: string;
  duration: number;
  visualCue: string;
}

interface VideoConfig {
  provider: 'kling' | 'heygen' | 'synthesia';
  avatarId?: string;
  voiceId?: string;
  language?: string;
  background?: string;
  klingMode?: 'std' | 'pro';
  duration?: 5 | 10;
  aspectRatio?: '16:9' | '9:16' | '1:1';
  cfgScale?: number;
  negativePrompt?: string;
  imageUrl?: string;
}

interface VideoEditorProps {
  topic: string;
  onGenerate: (config: VideoConfig, scenes: VideoScene[], prompt?: string) => void;
  onSave?: (config: VideoConfig, scenes: VideoScene[]) => void;
}

export function VideoEditor({ topic, onGenerate, onSave }: VideoEditorProps) {
  const [config, setConfig] = useState<VideoConfig>({
    provider: 'kling',
    klingMode: 'std',
    duration: 5,
    aspectRatio: '16:9',
    cfgScale: 0.5,
    negativePrompt: 'blurry, low quality, distorted, text, watermark'
  });

  const [scenes, setScenes] = useState<VideoScene[]>([
    { text: "", duration: 5, visualCue: "" }
  ]);

  const [textPrompt, setTextPrompt] = useState("");
  const [isGeneratingScript, setIsGeneratingScript] = useState(false);
  const [klingMethod, setKlingMethod] = useState<'text' | 'image'>('text');
  const [viralAnalysis, setViralAnalysis] = useState<any>(null);
  const [brandConfig, setBrandConfig] = useState({
    name: '',
    channel: '',
    slogan: '',
    colors: ['#8B5CF6', '#EC4899']
  });

  const addScene = () => {
    setScenes([...scenes, { text: "", duration: 5, visualCue: "" }]);
  };

  const removeScene = (index: number) => {
    setScenes(scenes.filter((_, i) => i !== index));
  };

  const updateScene = (index: number, field: keyof VideoScene, value: any) => {
    const newScenes = [...scenes];
    newScenes[index] = { ...newScenes[index], [field]: value };
    setScenes(newScenes);
  };

  const generateScript = async () => {
    setIsGeneratingScript(true);
    try {
      const response = await fetch('/api/ai-video/generate-script', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          topic,
          duration: 60,
          tone: 'professional'
        })
      });
      
      const data = await response.json();
      if (data.scenes) {
        setScenes(data.scenes);
      }
    } catch (error) {
      console.error('Failed to generate script:', error);
    } finally {
      setIsGeneratingScript(false);
    }
  };

  const totalDuration = scenes.reduce((acc, scene) => acc + scene.duration, 0);

  return (
    <Card className="w-full" data-testid="video-editor">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Sparkles className="w-5 h-5 text-purple-500" />
          AI Video Editor
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Provider & Config */}
        <Tabs value={config.provider} onValueChange={(v) => setConfig({ ...config, provider: v as any })}>
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="kling" data-testid="provider-kling">Kling AI ⚡</TabsTrigger>
            <TabsTrigger value="heygen" data-testid="provider-heygen">HeyGen</TabsTrigger>
            <TabsTrigger value="synthesia" data-testid="provider-synthesia">Synthesia</TabsTrigger>
          </TabsList>

          {/* KLING AI */}
          <TabsContent value="kling" className="space-y-4">
            <div className="bg-gradient-to-r from-purple-50 to-pink-50 dark:from-purple-900/20 dark:to-pink-900/20 p-4 rounded-lg">
              <div className="flex items-center gap-2 mb-2">
                <Sparkles className="w-5 h-5 text-purple-600" />
                <h3 className="font-semibold text-purple-900 dark:text-purple-100">Kling AI - Free Tier</h3>
              </div>
              <p className="text-sm text-purple-700 dark:text-purple-300">
                ✨ 66 free credits daily = 6 videos/day ($0.25/video standard, $0.45 pro)
              </p>
            </div>

            {/* Method Selection */}
            <div className="flex gap-2">
              <Button
                onClick={() => setKlingMethod('text')}
                variant={klingMethod === 'text' ? 'default' : 'outline'}
                className="flex-1"
                data-testid="method-text-to-video"
              >
                <Video className="w-4 h-4 mr-2" />
                Text-to-Video
              </Button>
              <Button
                onClick={() => setKlingMethod('image')}
                variant={klingMethod === 'image' ? 'default' : 'outline'}
                className="flex-1"
                data-testid="method-image-to-video"
              >
                <Image className="w-4 h-4 mr-2" />
                Image-to-Video
              </Button>
            </div>

            {/* Kling Config */}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="kling-mode">Quality Mode</Label>
                <Select
                  value={config.klingMode}
                  onValueChange={(v) => setConfig({ ...config, klingMode: v as 'std' | 'pro' })}
                >
                  <SelectTrigger id="kling-mode" data-testid="select-kling-mode">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="std">Standard (10 credits - $0.25)</SelectItem>
                    <SelectItem value="pro">Pro (15 credits - $0.45)</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label htmlFor="kling-duration">Duration</Label>
                <Select
                  value={config.duration?.toString()}
                  onValueChange={(v) => setConfig({ ...config, duration: parseInt(v) as 5 | 10 })}
                >
                  <SelectTrigger id="kling-duration" data-testid="select-kling-duration">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="5">5 seconds</SelectItem>
                    <SelectItem value="10">10 seconds (+$0.05)</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label htmlFor="kling-aspect">Aspect Ratio</Label>
                <Select
                  value={config.aspectRatio}
                  onValueChange={(v) => setConfig({ ...config, aspectRatio: v as any })}
                >
                  <SelectTrigger id="kling-aspect" data-testid="select-kling-aspect">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="16:9">16:9 (Landscape)</SelectItem>
                    <SelectItem value="9:16">9:16 (Portrait/Reels)</SelectItem>
                    <SelectItem value="1:1">1:1 (Square)</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label htmlFor="kling-cfg">Prompt Strength</Label>
                <Input
                  id="kling-cfg"
                  type="number"
                  min={0}
                  max={1}
                  step={0.1}
                  value={config.cfgScale}
                  onChange={(e) => setConfig({ ...config, cfgScale: parseFloat(e.target.value) })}
                  data-testid="input-kling-cfg"
                />
              </div>
            </div>

            {/* Image URL for Image-to-Video */}
            {klingMethod === 'image' && (
              <div>
                <Label htmlFor="kling-image">Image URL</Label>
                <Input
                  id="kling-image"
                  type="url"
                  placeholder="https://example.com/image.jpg"
                  value={config.imageUrl || ''}
                  onChange={(e) => setConfig({ ...config, imageUrl: e.target.value })}
                  data-testid="input-kling-image-url"
                />
              </div>
            )}

            {/* ВИРУСНАЯ ГЕНЕРАЦИЯ С БРЕНДОМ */}
            <div className="bg-gradient-to-r from-purple-100 to-pink-100 dark:from-purple-900/30 dark:to-pink-900/30 p-4 rounded-lg space-y-4">
              <div className="flex items-center gap-2">
                <Sparkles className="w-5 h-5 text-purple-600" />
                <h3 className="font-semibold">🔥 Вирусная Генерация с Брендом</h3>
              </div>
              
              <p className="text-sm text-muted-foreground">
                Система проанализирует топовые видео и создаст максимально популярное видео с вашим брендом
              </p>

              {/* Brand Config */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <Label htmlFor="brand-name">Название бренда *</Label>
                  <Input
                    id="brand-name"
                    placeholder="TradingPro"
                    value={brandConfig.name}
                    onChange={(e) => setBrandConfig({ ...brandConfig, name: e.target.value })}
                    data-testid="input-brand-name"
                  />
                </div>
                <div>
                  <Label htmlFor="brand-channel">Канал/Username</Label>
                  <Input
                    id="brand-channel"
                    placeholder="@tradingpro"
                    value={brandConfig.channel}
                    onChange={(e) => setBrandConfig({ ...brandConfig, channel: e.target.value })}
                    data-testid="input-brand-channel"
                  />
                </div>
                <div className="col-span-2">
                  <Label htmlFor="brand-slogan">Слоган (опц.)</Label>
                  <Input
                    id="brand-slogan"
                    placeholder="Trade Smarter, Not Harder"
                    value={brandConfig.slogan}
                    onChange={(e) => setBrandConfig({ ...brandConfig, slogan: e.target.value })}
                    data-testid="input-brand-slogan"
                  />
                </div>
              </div>

              {/* Анализ вирусных видео */}
              {viralAnalysis && (
                <div className="bg-white dark:bg-gray-800 p-3 rounded border border-purple-200 dark:border-purple-700">
                  <h4 className="font-medium mb-2 flex items-center gap-2">
                    📊 Анализ топ-видео
                  </h4>
                  <div className="text-sm space-y-1">
                    <p>✅ Проанализировано: {viralAnalysis.topVideos?.length || 0} видео</p>
                    <p>🎯 Вирусные факторы: {viralAnalysis.commonElements?.hooks?.slice(0, 2).join(', ')}</p>
                    <p>📈 Средний просмотр: {viralAnalysis.topVideos?.[0]?.views?.toLocaleString() || 'N/A'}</p>
                  </div>
                </div>
              )}

              <Button
                onClick={async () => {
                  if (!brandConfig.name) {
                    alert('Введите название бренда!');
                    return;
                  }
                  if (!textPrompt) {
                    alert('Введите тему видео!');
                    return;
                  }

                  try {
                    // 1. Анализируем топовые видео
                    const analysisResponse = await fetch('/api/ai-video/analyze-viral', {
                      method: 'POST',
                      headers: { 'Content-Type': 'application/json' },
                      body: JSON.stringify({
                        topic: textPrompt,
                        platform: config.aspectRatio === '9:16' ? 'tiktok' : 'youtube'
                      })
                    });
                    
                    const analysisData = await analysisResponse.json();
                    setViralAnalysis(analysisData.analysis);

                    // 2. Генерируем видео с брендом
                    const videoResponse = await fetch('/api/ai-video/generate-viral-branded', {
                      method: 'POST',
                      headers: { 'Content-Type': 'application/json' },
                      body: JSON.stringify({
                        topic: textPrompt,
                        brandConfig,
                        options: {
                          duration: config.duration,
                          mode: config.klingMode,
                          aspectRatio: config.aspectRatio,
                          platform: config.aspectRatio === '9:16' ? 'tiktok' : 'youtube'
                        }
                      })
                    });

                    const videoData = await videoResponse.json();
                    console.log('🎬 Вирусное видео создается:', videoData);
                    alert(`✅ Вирусное видео с брендом ${brandConfig.name} создается!\n\n` +
                          `📊 Использованы вирусные элементы из топ-видео\n` +
                          `🎯 Task ID: ${videoData.video?.videoId || 'N/A'}`);
                  } catch (error) {
                    console.error('Ошибка:', error);
                    alert('❌ Ошибка создания вирусного видео');
                  }
                }}
                className="w-full bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700"
                data-testid="button-generate-viral-branded"
              >
                <Sparkles className="w-4 h-4 mr-2" />
                🔥 Создать Вирусное Видео с Брендом
              </Button>
            </div>

            {/* Text Prompt */}
            <div>
              <Label htmlFor="kling-prompt">Video Prompt</Label>
              <Textarea
                id="kling-prompt"
                placeholder="Describe your video: A trader analyzing charts on multiple screens, professional office, cinematic lighting..."
                value={textPrompt}
                onChange={(e) => setTextPrompt(e.target.value)}
                rows={3}
                data-testid="input-kling-prompt"
              />
            </div>

            {/* Negative Prompt */}
            <div>
              <Label htmlFor="kling-negative">Negative Prompt (What to Avoid)</Label>
              <Input
                id="kling-negative"
                placeholder="blurry, low quality, distorted, text"
                value={config.negativePrompt}
                onChange={(e) => setConfig({ ...config, negativePrompt: e.target.value })}
                data-testid="input-kling-negative"
              />
            </div>
          </TabsContent>

          <TabsContent value="heygen" className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="heygen-avatar">Avatar</Label>
                <Select
                  value={config.avatarId}
                  onValueChange={(v) => setConfig({ ...config, avatarId: v })}
                >
                  <SelectTrigger id="heygen-avatar" data-testid="select-avatar">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Daisy-inskirt-20220818">Daisy (Professional)</SelectItem>
                    <SelectItem value="Anna-inblue-20220819">Anna (Business)</SelectItem>
                    <SelectItem value="John-incasual-20220820">John (Casual)</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label htmlFor="heygen-voice">Voice</Label>
                <Select
                  value={config.voiceId}
                  onValueChange={(v) => setConfig({ ...config, voiceId: v })}
                >
                  <SelectTrigger id="heygen-voice" data-testid="select-voice">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="2d5b0e6cf36f460aa7fc47e3eee4ba54">English Female</SelectItem>
                    <SelectItem value="3b0e6cf36f460aa7fc47e3eee4ba551">English Male</SelectItem>
                    <SelectItem value="4c0e6cf36f460aa7fc47e3eee4ba552">Russian Female</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </TabsContent>

          <TabsContent value="synthesia" className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="synthesia-avatar">Avatar</Label>
                <Select
                  value={config.avatarId}
                  onValueChange={(v) => setConfig({ ...config, avatarId: v })}
                >
                  <SelectTrigger id="synthesia-avatar" data-testid="select-avatar">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="anna_costume1_cameraA">Anna (Professional)</SelectItem>
                    <SelectItem value="max_casual_cameraB">Max (Casual)</SelectItem>
                    <SelectItem value="julia_energetic_cameraC">Julia (Energetic)</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label htmlFor="synthesia-voice">Voice</Label>
                <Select
                  value={config.voiceId}
                  onValueChange={(v) => setConfig({ ...config, voiceId: v })}
                >
                  <SelectTrigger id="synthesia-voice" data-testid="select-voice">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="en-US-Neural2-F">English Female</SelectItem>
                    <SelectItem value="en-US-Neural2-D">English Male</SelectItem>
                    <SelectItem value="ru-RU-Wavenet-A">Russian Female</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </TabsContent>
        </Tabs>

        {/* Language & Background (HeyGen/Synthesia only) */}
        {(config.provider === 'heygen' || config.provider === 'synthesia') && (
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="language">Language</Label>
              <Select
                value={config.language}
                onValueChange={(v) => setConfig({ ...config, language: v })}
              >
                <SelectTrigger id="language" data-testid="select-language">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="en">English</SelectItem>
                  <SelectItem value="ru">Russian</SelectItem>
                  <SelectItem value="es">Spanish</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label htmlFor="background">Background Color</Label>
              <Input
                id="background"
                type="color"
                value={config.background}
                onChange={(e) => setConfig({ ...config, background: e.target.value })}
                data-testid="input-background"
              />
            </div>
          </div>
        )}

        {/* AI Script Generation (HeyGen/Synthesia only) */}
        {(config.provider === 'heygen' || config.provider === 'synthesia') && (
          <>
            <div className="flex items-center gap-2">
              <Button
                onClick={generateScript}
                disabled={isGeneratingScript || !topic}
                variant="outline"
                className="flex items-center gap-2"
                data-testid="button-generate-script"
              >
                <Sparkles className="w-4 h-4" />
                {isGeneratingScript ? 'Generating...' : 'Generate AI Script'}
              </Button>
              <span className="text-sm text-muted-foreground">
                for topic: "{topic}"
              </span>
            </div>

            {/* Scenes Editor */}
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <Label className="text-lg font-semibold">Scenes ({scenes.length})</Label>
                <div className="flex items-center gap-2">
                  <span className="text-sm text-muted-foreground">
                    Total: {totalDuration}s
                  </span>
                  <Button onClick={addScene} size="sm" variant="outline" data-testid="button-add-scene">
                    <Plus className="w-4 h-4 mr-1" />
                    Add Scene
                  </Button>
                </div>
              </div>

              <div className="space-y-3 max-h-96 overflow-y-auto">
                {scenes.map((scene, index) => (
                  <Card key={index} className="p-4" data-testid={`scene-${index}`}>
                    <div className="space-y-3">
                      <div className="flex items-center justify-between">
                        <Label className="text-sm font-medium">Scene {index + 1}</Label>
                        <Button
                          onClick={() => removeScene(index)}
                          size="sm"
                          variant="ghost"
                          disabled={scenes.length === 1}
                          data-testid={`button-remove-scene-${index}`}
                        >
                          <Trash2 className="w-4 h-4 text-red-500" />
                        </Button>
                      </div>

                      <Textarea
                        placeholder="Scene text..."
                        value={scene.text}
                        onChange={(e) => updateScene(index, 'text', e.target.value)}
                        rows={2}
                        data-testid={`input-scene-text-${index}`}
                      />

                      <div className="grid grid-cols-2 gap-2">
                        <div>
                          <Label htmlFor={`duration-${index}`} className="text-xs">Duration (seconds)</Label>
                          <Input
                            id={`duration-${index}`}
                            type="number"
                            min={1}
                            value={scene.duration}
                            onChange={(e) => updateScene(index, 'duration', parseInt(e.target.value) || 5)}
                            data-testid={`input-scene-duration-${index}`}
                          />
                        </div>
                        <div>
                          <Label htmlFor={`visual-${index}`} className="text-xs">Visual Cue</Label>
                          <Input
                            id={`visual-${index}`}
                            placeholder="e.g. chart, graph"
                            value={scene.visualCue}
                            onChange={(e) => updateScene(index, 'visualCue', e.target.value)}
                            data-testid={`input-scene-visual-${index}`}
                          />
                        </div>
                      </div>
                    </div>
                  </Card>
                ))}
              </div>
            </div>
          </>
        )}

        {/* Actions */}
        <div className="flex gap-2">
          <Button
            onClick={() => {
              if (config.provider === 'kling') {
                onGenerate(config, scenes, textPrompt);
              } else {
                onGenerate(config, scenes);
              }
            }}
            disabled={config.provider === 'kling' && !textPrompt}
            className="flex-1 bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600"
            data-testid="button-generate-video"
          >
            <Play className="w-4 h-4 mr-2" />
            {config.provider === 'kling' ? 'Generate Video (Kling AI)' : 'Generate Video'}
          </Button>
          {onSave && (
            <Button
              onClick={() => onSave(config, scenes)}
              variant="outline"
              data-testid="button-save-config"
            >
              <Save className="w-4 h-4 mr-2" />
              Save
            </Button>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
