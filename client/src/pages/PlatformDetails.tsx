import { useParams } from "wouter";
import { useQuery } from "@tanstack/react-query";
import { useAuth } from "@/hooks/useAuth";
import Sidebar from "@/components/Sidebar";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ArrowLeft, TrendingUp, Users, Eye, Heart } from "lucide-react";
import { Link } from "wouter";

export default function PlatformDetails() {
  const { platformId } = useParams();
  const { user } = useAuth();

  const { data: platform } = useQuery({
    queryKey: [`/api/platforms/${platformId}`],
    retry: false,
  });

  const { data: posts } = useQuery({
    queryKey: [`/api/posts?platformId=${platformId}`],
    retry: false,
  });

  const { data: analytics } = useQuery({
    queryKey: [`/api/analytics?platformId=${platformId}`],
    retry: false,
  });

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
              <h2 className="text-2xl font-bold text-foreground">
                {platform?.displayName || 'Platform'} Details
              </h2>
              <p className="text-muted-foreground">
                Detailed analytics and management for this platform
              </p>
            </div>
          </div>
        </header>

        <div className="p-6 space-y-6">
          {/* Platform Overview */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Total Posts</CardTitle>
                <TrendingUp className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{posts?.length || 0}</div>
                <p className="text-xs text-muted-foreground">
                  +2 from last week
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Total Engagement</CardTitle>
                <Heart className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {analytics?.reduce((sum: number, a: any) => 
                    sum + (a.likes || 0) + (a.comments || 0) + (a.shares || 0), 0
                  ) || 0}
                </div>
                <p className="text-xs text-muted-foreground">
                  +12.5% from last week
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Total Reach</CardTitle>
                <Eye className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {analytics?.reduce((sum: number, a: any) => sum + (a.reach || 0), 0) || 0}
                </div>
                <p className="text-xs text-muted-foreground">
                  +8.2% from last week
                </p>
              </CardContent>
            </Card>
          </div>

          {/* Recent Posts */}
          <Card>
            <CardHeader>
              <CardTitle>Recent Posts</CardTitle>
            </CardHeader>
            <CardContent>
              {posts && posts.length > 0 ? (
                <div className="space-y-4">
                  {posts.slice(0, 10).map((post: any) => (
                    <div key={post.id} className="flex items-start gap-4 p-4 border border-border rounded-lg">
                      <div className="flex-1">
                        <p className="text-sm text-foreground line-clamp-2">
                          {post.content}
                        </p>
                        <div className="flex items-center gap-4 mt-2">
                          <Badge variant={post.status === 'published' ? 'default' : 'secondary'}>
                            {post.status}
                          </Badge>
                          <span className="text-xs text-muted-foreground">
                            {new Date(post.createdAt).toLocaleDateString()}
                          </span>
                          {post.aiGenerated && (
                            <Badge variant="outline" className="text-xs">
                              AI Generated
                            </Badge>
                          )}
                        </div>
                      </div>
                      <div className="text-right text-sm text-muted-foreground">
                        {post.publishedAt && (
                          <div>
                            Published: {new Date(post.publishedAt).toLocaleDateString()}
                          </div>
                        )}
                        {post.scheduledAt && !post.publishedAt && (
                          <div>
                            Scheduled: {new Date(post.scheduledAt).toLocaleDateString()}
                          </div>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8">
                  <p className="text-muted-foreground">No posts found for this platform</p>
                  <Button className="mt-4" data-testid="button-create-post">
                    Create Your First Post
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </main>
    </div>
  );
}
