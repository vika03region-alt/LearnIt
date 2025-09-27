import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Instagram, Youtube } from "lucide-react";
import { SiTiktok, SiTelegram } from "react-icons/si";
import { Link } from "wouter";

interface PlatformCardProps {
  platform: {
    id: number;
    name: string;
    displayName: string;
    icon: string;
    color: string;
  };
  data?: {
    status: 'active' | 'warning' | 'inactive';
    todayStats: {
      posts: number;
      maxPosts: number;
      engagement: number;
      engagementChange: number;
    };
    rateLimitUsage: number;
  };
}

export default function PlatformCard({ platform, data }: PlatformCardProps) {
  const getPlatformIcon = () => {
    const iconClass = "text-xl";
    switch (platform.name) {
      case 'instagram':
        return <Instagram className={`${iconClass} text-pink-600`} />;
      case 'tiktok':
        return <SiTiktok className={`${iconClass} text-red-600`} />;
      case 'youtube':
        return <Youtube className={`${iconClass} text-red-600`} />;
      case 'telegram':
        return <SiTelegram className={`${iconClass} text-blue-600`} />;
      default:
        return <div className={`${iconClass} w-6 h-6 bg-muted rounded`} />;
    }
  };

  const getStatusBadge = () => {
    if (!data) {
      return (
        <div className="flex items-center gap-2">
          <span className="w-2 h-2 bg-gray-400 rounded-full"></span>
          <span className="text-xs text-gray-600 font-medium">Inactive</span>
        </div>
      );
    }

    switch (data.status) {
      case 'active':
        return (
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 bg-green-500 rounded-full pulse-dot"></span>
            <span className="text-xs text-green-600 font-medium">Active</span>
          </div>
        );
      case 'warning':
        return (
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 bg-yellow-500 rounded-full"></span>
            <span className="text-xs text-yellow-600 font-medium">Limited</span>
          </div>
        );
      default:
        return (
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 bg-gray-400 rounded-full"></span>
            <span className="text-xs text-gray-600 font-medium">Inactive</span>
          </div>
        );
    }
  };

  const getBackgroundColor = () => {
    switch (platform.name) {
      case 'instagram':
        return 'bg-pink-100';
      case 'tiktok':
        return 'bg-red-100';
      case 'youtube':
        return 'bg-red-50';
      case 'telegram':
        return 'bg-blue-100';
      default:
        return 'bg-muted';
    }
  };

  const getProgressColor = () => {
    switch (platform.name) {
      case 'instagram':
        return 'bg-pink-500';
      case 'tiktok':
        return 'bg-red-500';
      case 'youtube':
        return 'bg-yellow-500';
      case 'telegram':
        return 'bg-blue-500';
      default:
        return 'bg-primary';
    }
  };

  return (
    <Link href={`/platform/${platform.id}`}>
      <Card 
        className="hover:shadow-lg transition-shadow cursor-pointer"
        data-testid={`card-platform-${platform.name}`}
      >
        <CardContent className="p-6">
          <div className="flex items-center justify-between mb-4">
            <div className={`w-12 h-12 ${getBackgroundColor()} rounded-lg flex items-center justify-center`}>
              {getPlatformIcon()}
            </div>
            {getStatusBadge()}
          </div>
          <h3 className="font-semibold text-foreground mb-2">{platform.displayName}</h3>
          <div className="space-y-2">
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">
                {platform.name === 'youtube' ? 'Uploads Today' : 
                 platform.name === 'telegram' ? 'Messages Today' :
                 platform.name === 'tiktok' ? 'Videos Today' : 'Posts Today'}
              </span>
              <span className="font-medium" data-testid={`text-${platform.name}-posts`}>
                {data ? `${data.todayStats.posts}/${data.todayStats.maxPosts}` : '0/0'}
              </span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">
                {platform.name === 'youtube' ? 'Subscribers' : 
                 platform.name === 'telegram' ? 'Channel Growth' :
                 platform.name === 'tiktok' ? 'Views' : 'Engagement'}
              </span>
              <span className="font-medium text-green-600">
                {data ? `+${data.todayStats.engagementChange.toFixed(1)}%` : '+0.0%'}
              </span>
            </div>
            <div className="w-full bg-secondary rounded-full h-2">
              <div 
                className={`h-2 rounded-full progress-bar ${getProgressColor()}`}
                style={{ width: `${data ? data.rateLimitUsage : 0}%` }}
                data-testid={`progress-${platform.name}`}
              ></div>
            </div>
          </div>
        </CardContent>
      </Card>
    </Link>
  );
}
