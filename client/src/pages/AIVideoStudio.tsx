import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { queryClient, apiRequest } from "@/lib/queryClient";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { VideoEditor } from "@/components/VideoEditor";
import { Sparkles, Video, Clock, CheckCircle, XCircle, Loader2, Download, ExternalLink } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { Progress } from "@/components/ui/progress";

interface AIVideo {
  id: number;
  userId: string;
  postId: number | null;
  provider: string;
  videoId: string;
  prompt: string | null;
  script: string | null;
  config: any;
  status: string;
  videoUrl: string | null;
  thumbnailUrl: string | null;
  duration: number | null;
  cost: number;
  createdAt: string;
  completedAt: string | null;
}

export default function AIVideoStudio() {
  const { toast } = useToast();
  const [selectedTopic, setSelectedTopic] = useState("Trading Strategies for Beginners");
  const [activeTab, setActiveTab] = useState("editor");

  // Fetch user's AI videos
  const { data: userVideos = [], isLoading: videosLoading } = useQuery<AIVideo[]>({
    queryKey: ['/api/ai-video/user-videos'],
  });

  // Generate video mutation
  const generateVideoMutation = useMutation({
    mutationFn: async ({ prompt, config, postId }: any) => {
      const endpoint = config.imageUrl 
        ? '/api/ai-video/generate-from-image'
        : '/api/ai-video/generate';

      return apiRequest(endpoint, 'POST', {
        prompt,
        config,
        postId,
        imageUrl: config.imageUrl
      });
    },
    onSuccess: (data) => {
      toast({
        title: "Video Generation Started! 🎬",
        description: `Your video is being generated. This takes 2-3 minutes. Task ID: ${data.taskId}`,
      });
      queryClient.invalidateQueries({ queryKey: ['/api/ai-video/user-videos'] });
      setActiveTab('history');
    },
    onError: (error: any) => {
      toast({
        title: "Generation Failed",
        description: error.message || "Failed to start video generation",
        variant: "destructive",
      });
    },
  });

  // Auto-generate mutation (Topic → Script → Video)
  const autoGenerateMutation = useMutation({
    mutationFn: async ({ topic, config }: any) => {
      return apiRequest('/api/ai-video/auto-generate', 'POST', {
        topic,
        config
      });
    },
    onSuccess: (data) => {
      toast({
        title: "Auto-Generation Started! ✨",
        description: `AI is creating your video about: ${selectedTopic}`,
      });
      queryClient.invalidateQueries({ queryKey: ['/api/ai-video/user-videos'] });
      setActiveTab('history');
    },
    onError: (error: any) => {
      toast({
        title: "Auto-Generation Failed",
        description: error.message || "Failed to auto-generate video",
        variant: "destructive",
      });
    },
  });

  // Check video status mutation
  const checkStatusMutation = useMutation({
    mutationFn: async (videoId: number) => {
      const response = await fetch(`/api/ai-video/status/${videoId}`);
      if (!response.ok) throw new Error('Failed to check status');
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/ai-video/user-videos'] });
    },
  });

  const handleGenerate = (config: any, scenes: any[], prompt?: string) => {
    if (config.provider === 'kling') {
      // Kling AI generation
      generateVideoMutation.mutate({
        prompt: prompt || selectedTopic,
        config: {
          duration: config.duration,
          mode: config.klingMode,
          aspectRatio: config.aspectRatio,
          cfgScale: config.cfgScale,
          negativePrompt: config.negativePrompt,
          imageUrl: config.imageUrl
        },
        postId: null
      });
    } else {
      // HeyGen/Synthesia - would need different implementation
      toast({
        title: "Provider Not Yet Implemented",
        description: "HeyGen and Synthesia integration coming soon. Use Kling AI for now!",
        variant: "default"
      });
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'completed':
        return <CheckCircle className="w-4 h-4 text-green-500" />;
      case 'processing':
        return <Loader2 className="w-4 h-4 text-blue-500 animate-spin" />;
      case 'failed':
        return <XCircle className="w-4 h-4 text-red-500" />;
      default:
        return <Clock className="w-4 h-4 text-gray-500" />;
    }
  };

  const getStatusBadge = (status: string) => {
    const variants: Record<string, "default" | "secondary" | "destructive"> = {
      completed: "default",
      processing: "secondary",
      failed: "destructive",
      queued: "secondary"
    };
    return <Badge variant={variants[status] || "secondary"}>{status}</Badge>;
  };

  const processingVideos = userVideos.filter(v => v.status === 'processing' || v.status === 'queued');
  const completedVideos = userVideos.filter(v => v.status === 'completed');

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 via-white to-pink-50 dark:from-gray-900 dark:via-gray-800 dark:to-purple-900/20 p-6">
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-4xl font-bold bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent flex items-center gap-3">
              <Sparkles className="w-8 h-8 text-purple-600" />
              AI Video Studio
            </h1>
            <p className="text-muted-foreground mt-2">
              Create professional trading videos with Kling AI - 66 free credits daily
            </p>
          </div>
          <div className="flex gap-2">
            <Button
              onClick={() => autoGenerateMutation.mutate({ topic: selectedTopic, config: { duration: 5, mode: 'std' } })}
              disabled={autoGenerateMutation.isPending}
              className="bg-gradient-to-r from-purple-500 to-pink-500"
              data-testid="button-auto-generate"
            >
              {autoGenerateMutation.isPending ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Generating...
                </>
              ) : (
                <>
                  <Sparkles className="w-4 h-4 mr-2" />
                  Auto-Generate Video
                </>
              )}
            </Button>
          </div>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <Card data-testid="stat-total-videos">
            <CardHeader className="pb-2">
              <CardDescription>Total Videos</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold">{userVideos.length}</div>
            </CardContent>
          </Card>
          <Card data-testid="stat-completed">
            <CardHeader className="pb-2">
              <CardDescription>Completed</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-green-600">{completedVideos.length}</div>
            </CardContent>
          </Card>
          <Card data-testid="stat-processing">
            <CardHeader className="pb-2">
              <CardDescription>Processing</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-blue-600">{processingVideos.length}</div>
            </CardContent>
          </Card>
          <Card data-testid="stat-cost">
            <CardHeader className="pb-2">
              <CardDescription>Total Cost</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-purple-600">
                ${userVideos.reduce((acc, v) => acc + (v.cost || 0), 0).toFixed(2)}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Main Content */}
        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="editor" data-testid="tab-editor">
              <Video className="w-4 h-4 mr-2" />
              Video Editor
            </TabsTrigger>
            <TabsTrigger value="history" data-testid="tab-history">
              <Clock className="w-4 h-4 mr-2" />
              History ({userVideos.length})
            </TabsTrigger>
          </TabsList>

          <TabsContent value="editor" className="space-y-6">
            <VideoEditor
              topic={selectedTopic}
              onGenerate={handleGenerate}
            />
          </TabsContent>

          <TabsContent value="history" className="space-y-6">
            {videosLoading ? (
              <div className="flex items-center justify-center py-12">
                <Loader2 className="w-8 h-8 animate-spin text-purple-600" />
              </div>
            ) : userVideos.length === 0 ? (
              <Card className="p-12 text-center">
                <Video className="w-16 h-16 mx-auto text-gray-300 mb-4" />
                <h3 className="text-xl font-semibold mb-2">No Videos Yet</h3>
                <p className="text-muted-foreground mb-4">
                  Start creating AI-generated videos with Kling AI
                </p>
                <Button
                  onClick={() => setActiveTab('editor')}
                  className="bg-gradient-to-r from-purple-500 to-pink-500"
                >
                  Create Your First Video
                </Button>
              </Card>
            ) : (
              <div className="grid gap-4">
                {userVideos.map((video) => (
                  <Card key={video.id} className="overflow-hidden" data-testid={`video-card-${video.id}`}>
                    <CardHeader>
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          {getStatusIcon(video.status)}
                          <div>
                            <CardTitle className="text-lg">{video.prompt || 'Video Generation'}</CardTitle>
                            <CardDescription className="flex items-center gap-2 mt-1">
                              <span>{video.provider}</span>
                              <span>•</span>
                              <span>{new Date(video.createdAt).toLocaleDateString()}</span>
                            </CardDescription>
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          {getStatusBadge(video.status)}
                          <Badge variant="outline">${video.cost.toFixed(2)}</Badge>
                        </div>
                      </div>
                    </CardHeader>
                    <CardContent>
                      {video.status === 'processing' && (
                        <div className="space-y-2">
                          <div className="flex items-center justify-between text-sm">
                            <span>Generating video...</span>
                            <Button
                              size="sm"
                              variant="ghost"
                              onClick={() => checkStatusMutation.mutate(video.id)}
                              disabled={checkStatusMutation.isPending}
                              data-testid={`button-check-status-${video.id}`}
                            >
                              <Loader2 className="w-3 h-3 mr-1 animate-spin" />
                              Check Status
                            </Button>
                          </div>
                          <Progress value={33} className="h-2" />
                        </div>
                      )}

                      {video.status === 'completed' && video.videoUrl && (
                        <div className="space-y-3">
                          <video
                            src={video.videoUrl}
                            controls
                            className="w-full rounded-lg"
                            poster={video.thumbnailUrl || undefined}
                            data-testid={`video-player-${video.id}`}
                          />
                          <div className="flex gap-2">
                            <Button
                              size="sm"
                              variant="outline"
                              asChild
                              data-testid={`button-download-${video.id}`}
                            >
                              <a href={video.videoUrl} download>
                                <Download className="w-4 h-4 mr-2" />
                                Download
                              </a>
                            </Button>
                            <Button
                              size="sm"
                              variant="outline"
                              asChild
                              data-testid={`button-open-${video.id}`}
                            >
                              <a href={video.videoUrl} target="_blank" rel="noopener noreferrer">
                                <ExternalLink className="w-4 h-4 mr-2" />
                                Open
                              </a>
                            </Button>
                          </div>
                        </div>
                      )}

                      {video.status === 'failed' && (
                        <div className="text-sm text-red-600">
                          Video generation failed. Please try again.
                        </div>
                      )}
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}
