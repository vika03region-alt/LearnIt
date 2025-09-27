import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Instagram, Youtube, Brain, Shield, AlertTriangle } from "lucide-react";
import { SiTiktok, SiTelegram } from "react-icons/si";
import { Link } from "wouter";

interface Activity {
  id: number;
  action: string;
  description: string;
  platformId?: number;
  status: 'success' | 'warning' | 'error';
  createdAt: string;
  metadata?: any;
}

interface ActivityFeedProps {
  activities?: Activity[];
}

export default function ActivityFeed({ activities = [] }: ActivityFeedProps) {
  const getActivityIcon = (activity: Activity) => {
    const iconClass = "text-sm";
    
    if (activity.action.includes('AI') || activity.action.includes('Generated')) {
      return (
        <div className="w-8 h-8 bg-purple-100 rounded-full flex items-center justify-center flex-shrink-0">
          <Brain className={`${iconClass} text-purple-600`} />
        </div>
      );
    }
    
    if (activity.action.includes('Safety') || activity.action.includes('Check')) {
      return (
        <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center flex-shrink-0">
          <Shield className={`${iconClass} text-blue-600`} />
        </div>
      );
    }
    
    if (activity.action.includes('Warning') || activity.action.includes('Emergency')) {
      return (
        <div className="w-8 h-8 bg-yellow-100 rounded-full flex items-center justify-center flex-shrink-0">
          <AlertTriangle className={`${iconClass} text-yellow-600`} />
        </div>
      );
    }

    // Platform-specific icons
    if (activity.platformId) {
      switch (activity.platformId) {
        case 1: // Instagram
          return (
            <div className="w-8 h-8 bg-pink-100 rounded-full flex items-center justify-center flex-shrink-0">
              <Instagram className={`${iconClass} text-pink-600`} />
            </div>
          );
        case 2: // TikTok
          return (
            <div className="w-8 h-8 bg-red-100 rounded-full flex items-center justify-center flex-shrink-0">
              <SiTiktok className={`${iconClass} text-red-600`} />
            </div>
          );
        case 3: // YouTube
          return (
            <div className="w-8 h-8 bg-red-50 rounded-full flex items-center justify-center flex-shrink-0">
              <Youtube className={`${iconClass} text-red-600`} />
            </div>
          );
        case 4: // Telegram
          return (
            <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center flex-shrink-0">
              <SiTelegram className={`${iconClass} text-blue-600`} />
            </div>
          );
      }
    }

    // Default icon
    return (
      <div className="w-8 h-8 bg-muted rounded-full flex items-center justify-center flex-shrink-0">
        <div className="w-3 h-3 bg-muted-foreground rounded-full"></div>
      </div>
    );
  };

  const getStatusIndicator = (status: string) => {
    switch (status) {
      case 'success':
        return <div className="w-2 h-2 bg-green-500 rounded-full flex-shrink-0"></div>;
      case 'warning':
        return <div className="w-2 h-2 bg-yellow-500 rounded-full flex-shrink-0"></div>;
      case 'error':
        return <div className="w-2 h-2 bg-red-500 rounded-full flex-shrink-0"></div>;
      default:
        return <div className="w-2 h-2 bg-gray-400 rounded-full flex-shrink-0"></div>;
    }
  };

  const formatTimeAgo = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffInMinutes = Math.floor((now.getTime() - date.getTime()) / (1000 * 60));
    
    if (diffInMinutes < 1) return 'Just now';
    if (diffInMinutes < 60) return `${diffInMinutes} minutes ago`;
    
    const diffInHours = Math.floor(diffInMinutes / 60);
    if (diffInHours < 24) return `${diffInHours} hours ago`;
    
    const diffInDays = Math.floor(diffInHours / 24);
    return `${diffInDays} days ago`;
  };

  return (
    <Card className="bg-card border border-border" data-testid="activity-feed">
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="text-lg font-semibold text-foreground">Recent Activity</CardTitle>
          <Link href="/activity">
            <Button variant="ghost" size="sm" data-testid="button-view-all-activity">
              View All
            </Button>
          </Link>
        </div>
      </CardHeader>

      <CardContent>
        {activities.length > 0 ? (
          <div className="space-y-4">
            {activities.slice(0, 5).map((activity) => (
              <div 
                key={activity.id}
                className="flex items-start gap-3 p-3 rounded-lg hover:bg-muted transition-colors"
                data-testid={`activity-item-${activity.id}`}
              >
                {getActivityIcon(activity)}
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-foreground">{activity.action}</p>
                  <p className="text-xs text-muted-foreground line-clamp-2">
                    {activity.description}
                  </p>
                  <p className="text-xs text-muted-foreground mt-1">
                    {formatTimeAgo(activity.createdAt)}
                  </p>
                </div>
                {getStatusIndicator(activity.status)}
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-8">
            <div className="w-12 h-12 bg-muted rounded-full flex items-center justify-center mx-auto mb-4">
              <div className="w-6 h-6 bg-muted-foreground rounded-full opacity-50"></div>
            </div>
            <p className="text-muted-foreground text-sm">No recent activity</p>
            <p className="text-muted-foreground text-xs mt-1">
              Activity will appear here when actions are performed
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
