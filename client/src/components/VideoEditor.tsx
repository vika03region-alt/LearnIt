import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Plus, Trash2, Play, Save, Sparkles } from "lucide-react";

interface VideoScene {
  text: string;
  duration: number;
  visualCue: string;
}

interface VideoConfig {
  provider: 'heygen' | 'synthesia';
  avatarId: string;
  voiceId: string;
  language: string;
  background?: string;
}

interface VideoEditorProps {
  topic: string;
  onGenerate: (config: VideoConfig, scenes: VideoScene[]) => void;
  onSave?: (config: VideoConfig, scenes: VideoScene[]) => void;
}

export function VideoEditor({ topic, onGenerate, onSave }: VideoEditorProps) {
  const [config, setConfig] = useState<VideoConfig>({
    provider: 'heygen',
    avatarId: 'Daisy-inskirt-20220818',
    voiceId: '2d5b0e6cf36f460aa7fc47e3eee4ba54',
    language: 'en',
    background: '#ffffff'
  });

  const [scenes, setScenes] = useState<VideoScene[]>([
    { text: "", duration: 5, visualCue: "" }
  ]);

  const [isGeneratingScript, setIsGeneratingScript] = useState(false);

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
        <Tabs value={config.provider} onValueChange={(v) => setConfig({ ...config, provider: v as 'heygen' | 'synthesia' })}>
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="heygen" data-testid="provider-heygen">HeyGen</TabsTrigger>
            <TabsTrigger value="synthesia" data-testid="provider-synthesia">Synthesia</TabsTrigger>
          </TabsList>

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

        {/* Language & Background */}
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

        {/* AI Script Generation */}
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

        {/* Actions */}
        <div className="flex gap-2">
          <Button
            onClick={() => onGenerate(config, scenes)}
            className="flex-1 bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600"
            data-testid="button-generate-video"
          >
            <Play className="w-4 h-4 mr-2" />
            Generate Video
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
