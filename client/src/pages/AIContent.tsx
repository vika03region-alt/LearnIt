import { useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/useAuth";
import { isUnauthorizedError } from "@/lib/authUtils";
import { apiRequest } from "@/lib/queryClient";
import Sidebar from "@/components/Sidebar";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { ArrowLeft, Brain, Wand2, History, Trash2 } from "lucide-react";
import { Link } from "wouter";

export default function AIContent() {
  const { toast } = useToast();
  const { isAuthenticated, isLoading } = useAuth();
  const queryClient = useQueryClient();
  
  const [contentType, setContentType] = useState("");
  const [targetPlatforms, setTargetPlatforms] = useState<string[]>([]);
  const [prompt, setPrompt] = useState("");
  const [generatedContent, setGeneratedContent] = useState("");

  // Redirect if not authenticated
  useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      toast({
        title: "Unauthorized",
        description: "You are logged out. Logging in again...",
        variant: "destructive",
      });
      setTimeout(() => {
        window.location.href = "/api/login";
      }, 500);
      return;
    }
  }, [isAuthenticated, isLoading, toast]);

  const { data: contentLogs, isLoading: isLogsLoading } = useQuery<any[]>({
    queryKey: ['/api/ai/content-logs'],
    retry: false,
  });

  const generateContentMutation = useMutation({
    mutationFn: async (data: {
      prompt: string;
      contentType: string;
      targetPlatforms: string[];
    }) => {
      const response = await apiRequest('POST', '/api/ai/generate-content', data);
      return await response.json();
    },
    onSuccess: (result) => {
      setGeneratedContent(result.content);
      queryClient.invalidateQueries({ queryKey: ['/api/ai/content-logs'] });
      queryClient.invalidateQueries({ queryKey: ['/api/activity'] });
      toast({
        title: "Content Generated",
        description: "AI content has been successfully generated.",
      });
    },
    onError: (error) => {
      if (isUnauthorizedError(error)) {
        toast({
          title: "Unauthorized",
          description: "You are logged out. Logging in again...",
          variant: "destructive",
        });
        setTimeout(() => {
          window.location.href = "/api/login";
        }, 500);
        return;
      }
      toast({
        title: "Generation Failed",
        description: error.message || "Failed to generate AI content",
        variant: "destructive",
      });
    },
  });

  const handleGenerate = () => {
    if (!prompt.trim()) {
      toast({
        title: "Missing Prompt",
        description: "Please enter a prompt for content generation.",
        variant: "destructive",
      });
      return;
    }

    if (!contentType) {
      toast({
        title: "Missing Content Type", 
        description: "Please select a content type.",
        variant: "destructive",
      });
      return;
    }

    generateContentMutation.mutate({
      prompt: prompt.trim(),
      contentType,
      targetPlatforms: targetPlatforms.length > 0 ? targetPlatforms : ['all'],
    });
  };

  const handlePlatformToggle = (platform: string) => {
    if (platform === 'all') {
      setTargetPlatforms(['all']);
      return;
    }

    setTargetPlatforms(prev => {
      const filtered = prev.filter(p => p !== 'all');
      if (filtered.includes(platform)) {
        return filtered.filter(p => p !== platform);
      } else {
        return [...filtered, platform];
      }
    });
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-muted-foreground">Loading...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <Sidebar />
      
      <main className="ml-64 transition-all duration-300">
        <header className="bg-card border-b border-border px-6 py-4">
          <div className="flex items-center gap-4">
            <Link href="/">
              <Button variant="ghost" size="sm" data-testid="button-back">
                <ArrowLeft className="w-4 h-4 mr-2" />
                Back to Dashboard
              </Button>
            </Link>
            <div>
              <h2 className="text-2xl font-bold text-foreground">AI Content Generator</h2>
              <p className="text-muted-foreground">
                Generate engaging trading content with AI-powered assistance
              </p>
            </div>
          </div>
        </header>

        <div className="p-6 space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Content Generation Panel */}
            <div className="lg:col-span-2">
              <Card>
                <CardHeader>
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-gradient-to-br from-purple-500 to-pink-500 rounded-lg flex items-center justify-center">
                      <Brain className="text-white" />
                    </div>
                    <div>
                      <CardTitle>Generate New Content</CardTitle>
                      <p className="text-sm text-muted-foreground">Powered by OpenAI GPT-5</p>
                    </div>
                  </div>
                </CardHeader>

                <CardContent className="space-y-6">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <Label className="text-sm font-medium text-foreground">Content Type</Label>
                      <Select value={contentType} onValueChange={setContentType}>
                        <SelectTrigger className="mt-2" data-testid="select-content-type">
                          <SelectValue placeholder="Select content type" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="trading_signal">Trading Signal Post</SelectItem>
                          <SelectItem value="market_analysis">Market Analysis</SelectItem>
                          <SelectItem value="educational">Educational Content</SelectItem>
                          <SelectItem value="motivational">Motivational Quote</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

                    <div>
                      <Label className="text-sm font-medium text-foreground">Target Platforms</Label>
                      <div className="flex flex-wrap gap-2 mt-2">
                        {[
                          { value: 'all', label: 'All' },
                          { value: 'instagram', label: 'Instagram' },
                          { value: 'tiktok', label: 'TikTok' },
                          { value: 'youtube', label: 'YouTube' },
                          { value: 'telegram', label: 'Telegram' },
                        ].map((platform) => (
                          <Button
                            key={platform.value}
                            variant={targetPlatforms.includes(platform.value) ? "default" : "outline"}
                            size="sm"
                            onClick={() => handlePlatformToggle(platform.value)}
                            data-testid={`button-platform-${platform.value}`}
                          >
                            {platform.label}
                          </Button>
                        ))}
                      </div>
                    </div>
                  </div>

                  <div>
                    <Label className="text-sm font-medium text-foreground">Content Prompt</Label>
                    <Textarea
                      className="mt-2 min-h-[120px] resize-none"
                      placeholder="Describe the content you want to generate. For example: 'EUR/USD breakout above 1.1250 resistance, targeting 1.1300 with stop loss at 1.1220'"
                      value={prompt}
                      onChange={(e) => setPrompt(e.target.value)}
                      data-testid="textarea-prompt"
                    />
                  </div>

                  <div className="flex justify-between items-center">
                    <div className="flex items-center gap-4">
                      <div className="text-sm">
                        <span className="text-muted-foreground">API Credits:</span>
                        <span className="font-medium text-foreground ml-1">847/1000</span>
                      </div>
                      <div className="w-32 bg-secondary rounded-full h-2">
                        <div className="bg-primary h-2 rounded-full" style={{ width: '84.7%' }}></div>
                      </div>
                    </div>
                    <Button
                      className="bg-gradient-to-r from-purple-500 to-pink-500 text-white font-medium hover:from-purple-600 hover:to-pink-600"
                      onClick={handleGenerate}
                      disabled={generateContentMutation.isPending}
                      data-testid="button-generate-content"
                    >
                      {generateContentMutation.isPending ? (
                        <>
                          <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2"></div>
                          Generating...
                        </>
                      ) : (
                        <>
                          <Wand2 className="w-4 h-4 mr-2" />
                          Generate Content
                        </>
                      )}
                    </Button>
                  </div>

                  {generatedContent && (
                    <div className="p-4 bg-muted rounded-lg border-l-4 border-primary">
                      <h4 className="font-medium text-foreground mb-2">Generated Content:</h4>
                      <p className="text-sm text-foreground mb-4 whitespace-pre-wrap">
                        {generatedContent}
                      </p>
                      <div className="flex gap-2">
                        <Button size="sm" data-testid="button-use-content">
                          Use This Content
                        </Button>
                        <Button size="sm" variant="outline" data-testid="button-regenerate">
                          Regenerate
                        </Button>
                        <Button size="sm" variant="outline" data-testid="button-edit-content">
                          Edit
                        </Button>
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>

            {/* Content History */}
            <div className="lg:col-span-1">
              <Card>
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <CardTitle className="flex items-center gap-2">
                      <History className="w-5 h-5" />
                      Recent Generations
                    </CardTitle>
                  </div>
                </CardHeader>

                <CardContent>
                  {isLogsLoading ? (
                    <div className="flex items-center justify-center py-8">
                      <div className="w-6 h-6 border-2 border-primary border-t-transparent rounded-full animate-spin"></div>
                    </div>
                  ) : contentLogs && contentLogs.length > 0 ? (
                    <div className="space-y-4">
                      {contentLogs.slice(0, 10).map((log: any) => (
                        <div
                          key={log.id}
                          className="p-3 border border-border rounded-lg hover:bg-muted transition-colors"
                          data-testid={`content-log-${log.id}`}
                        >
                          <div className="flex items-start justify-between gap-2 mb-2">
                            <Badge variant="secondary" className="text-xs">
                              {log.contentType.replace('_', ' ')}
                            </Badge>
                            <span className="text-xs text-muted-foreground">
                              {formatDate(log.createdAt)}
                            </span>
                          </div>
                          <p className="text-sm text-foreground line-clamp-3 mb-2">
                            {log.generatedContent}
                          </p>
                          <div className="flex items-center justify-between">
                            <div className="text-xs text-muted-foreground">
                              {log.tokensUsed || 0} tokens
                            </div>
                            <Button 
                              size="sm" 
                              variant="ghost"
                              onClick={() => setGeneratedContent(log.generatedContent)}
                              data-testid={`button-reuse-${log.id}`}
                            >
                              Reuse
                            </Button>
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="text-center py-8">
                      <Brain className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
                      <p className="text-muted-foreground text-sm">No content generated yet</p>
                      <p className="text-muted-foreground text-xs mt-1">
                        Start generating AI content to see your history here
                      </p>
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
