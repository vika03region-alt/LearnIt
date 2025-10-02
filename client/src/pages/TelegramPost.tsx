import { useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/useAuth";
import { apiRequest } from "@/lib/queryClient";
import Sidebar from "@/components/Sidebar";
import { TelegramMediaUploader } from "@/components/TelegramMediaUploader";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { ArrowLeft, Send, MessageSquare } from "lucide-react";
import { Link } from "wouter";

export default function TelegramPost() {
  const { toast } = useToast();
  const { isAuthenticated, isLoading } = useAuth();
  const queryClient = useQueryClient();
  
  const [content, setContent] = useState("");
  const [title, setTitle] = useState("");
  const [videoUrl, setVideoUrl] = useState("");
  const [coverUrl, setCoverUrl] = useState("");

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

  const { data: platforms } = useQuery<any[]>({
    queryKey: ['/api/platforms'],
    retry: false,
  });

  const createPostMutation = useMutation({
    mutationFn: async (data: {
      content: string;
      title?: string;
      platformId: number;
      videoUrl?: string;
      coverUrl?: string;
    }) => {
      const response = await apiRequest('POST', '/api/posts', data);
      return await response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/posts'] });
      queryClient.invalidateQueries({ queryKey: ['/api/activity'] });
      toast({
        title: "Post Created",
        description: "Your Telegram post has been created successfully.",
      });
      setContent("");
      setTitle("");
      setVideoUrl("");
      setCoverUrl("");
    },
    onError: (error: any) => {
      toast({
        title: "Post Creation Failed",
        description: error.message || "Failed to create post",
        variant: "destructive",
      });
    },
  });

  const handleSubmit = () => {
    if (!content.trim()) {
      toast({
        title: "Missing Content",
        description: "Please enter post content.",
        variant: "destructive",
      });
      return;
    }

    const telegramPlatform = platforms?.find((p: any) => p.name === 'telegram');
    if (!telegramPlatform) {
      toast({
        title: "Platform Not Found",
        description: "Telegram platform is not configured.",
        variant: "destructive",
      });
      return;
    }

    createPostMutation.mutate({
      content: content.trim(),
      title: title.trim() || undefined,
      platformId: telegramPlatform.id,
      videoUrl: videoUrl || undefined,
      coverUrl: coverUrl || undefined,
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
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50/30 to-purple-50/30 dark:from-slate-900 dark:via-slate-900 dark:to-slate-900">
      <Sidebar />
      
      <main className="ml-64 transition-all duration-300">
        <header className="bg-white/80 dark:bg-slate-800/80 backdrop-blur-sm border-b border-slate-200 dark:border-slate-700 px-6 py-4 sticky top-0 z-40">
          <div className="flex items-center gap-4">
            <Link href="/">
              <Button variant="ghost" size="sm" data-testid="button-back">
                <ArrowLeft className="w-4 h-4 mr-2" />
                Back to Dashboard
              </Button>
            </Link>
            <div>
              <h2 className="text-2xl font-bold text-foreground flex items-center gap-2">
                <MessageSquare className="w-6 h-6 text-blue-600" />
                Create Telegram Post
              </h2>
              <p className="text-muted-foreground">
                Create engaging posts with video and cover images for Telegram
              </p>
            </div>
          </div>
        </header>

        <div className="p-6">
          <div className="max-w-4xl mx-auto grid grid-cols-1 lg:grid-cols-2 gap-6">
            <div className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle>Post Content</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="title">Title (Optional)</Label>
                    <Input
                      id="title"
                      placeholder="Enter post title..."
                      value={title}
                      onChange={(e) => setTitle(e.target.value)}
                      data-testid="input-title"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="content">Content</Label>
                    <Textarea
                      id="content"
                      placeholder="Write your Telegram post content..."
                      value={content}
                      onChange={(e) => setContent(e.target.value)}
                      rows={10}
                      className="resize-none"
                      data-testid="textarea-content"
                    />
                    <p className="text-xs text-muted-foreground">
                      {content.length} characters
                    </p>
                  </div>

                  <Button
                    onClick={handleSubmit}
                    disabled={createPostMutation.isPending || !content.trim()}
                    className="w-full"
                    data-testid="button-submit"
                  >
                    {createPostMutation.isPending ? (
                      <>
                        <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2" />
                        Creating Post...
                      </>
                    ) : (
                      <>
                        <Send className="w-4 h-4 mr-2" />
                        Create Post
                      </>
                    )}
                  </Button>
                </CardContent>
              </Card>
            </div>

            <div className="space-y-6">
              <TelegramMediaUploader
                onVideoUploaded={(url) => setVideoUrl(url)}
                onCoverUploaded={(url) => setCoverUrl(url)}
              />

              <Card>
                <CardHeader>
                  <CardTitle>Preview</CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  {title && (
                    <div>
                      <p className="text-sm text-muted-foreground">Title</p>
                      <p className="font-semibold">{title}</p>
                    </div>
                  )}
                  {content && (
                    <div>
                      <p className="text-sm text-muted-foreground">Content</p>
                      <p className="whitespace-pre-wrap">{content}</p>
                    </div>
                  )}
                  {videoUrl && (
                    <div>
                      <p className="text-sm text-green-600">✓ Video attached</p>
                    </div>
                  )}
                  {coverUrl && (
                    <div>
                      <p className="text-sm text-green-600">✓ Cover image attached</p>
                    </div>
                  )}
                  {!title && !content && !videoUrl && !coverUrl && (
                    <p className="text-sm text-muted-foreground italic">
                      Your post preview will appear here...
                    </p>
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
