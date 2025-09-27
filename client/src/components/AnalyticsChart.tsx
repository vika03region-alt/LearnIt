import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useState } from "react";

interface AnalyticsChartProps {
  data?: {
    platforms?: {
      [platformName: string]: {
        displayName: string;
        todayStats: {
          engagement: number;
          engagementChange: number;
        };
      };
    };
  };
}

export default function AnalyticsChart({ data }: AnalyticsChartProps) {
  const [timeRange, setTimeRange] = useState("7days");

  const platformData = [
    {
      name: 'Instagram',
      color: 'bg-pink-500',
      engagement: data?.platforms?.instagram?.todayStats?.engagement || 4200,
      change: data?.platforms?.instagram?.todayStats?.engagementChange || 12.5,
    },
    {
      name: 'TikTok', 
      color: 'bg-red-500',
      engagement: data?.platforms?.tiktok?.todayStats?.engagement || 8700,
      change: data?.platforms?.tiktok?.todayStats?.engagementChange || 28.3,
    },
    {
      name: 'YouTube',
      color: 'bg-red-600',
      engagement: data?.platforms?.youtube?.todayStats?.engagement || 2100,
      change: data?.platforms?.youtube?.todayStats?.engagementChange || 5.8,
    },
    {
      name: 'Telegram',
      color: 'bg-blue-500',
      engagement: data?.platforms?.telegram?.todayStats?.engagement || 1500,
      change: data?.platforms?.telegram?.todayStats?.engagementChange || 9.2,
    },
  ];

  const formatNumber = (num: number) => {
    if (num >= 1000) {
      return `${(num / 1000).toFixed(1)}K`;
    }
    return num.toString();
  };

  return (
    <Card className="bg-card border border-border" data-testid="analytics-chart">
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="text-lg font-semibold text-foreground">
            Engagement Analytics
          </CardTitle>
          <Select value={timeRange} onValueChange={setTimeRange}>
            <SelectTrigger className="w-40">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="7days">Last 7 days</SelectItem>
              <SelectItem value="30days">Last 30 days</SelectItem>
              <SelectItem value="3months">Last 3 months</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </CardHeader>
      
      <CardContent>
        <div className="space-y-4">
          {platformData.map((platform) => (
            <div 
              key={platform.name}
              className="flex items-center justify-between p-3 bg-muted rounded-lg"
              data-testid={`analytics-platform-${platform.name.toLowerCase()}`}
            >
              <div className="flex items-center gap-3">
                <div className={`w-3 h-3 ${platform.color} rounded-full`}></div>
                <span className="text-sm font-medium">{platform.name}</span>
              </div>
              <div className="text-right">
                <div className="text-lg font-bold text-foreground">
                  {formatNumber(platform.engagement)}
                </div>
                <div className="text-xs text-green-600">
                  +{platform.change.toFixed(1)}%
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Simple chart visualization */}
        <div className="mt-6 pt-6 border-t border-border">
          <div className="space-y-3">
            <div className="text-sm font-medium text-foreground mb-4">Engagement Trend</div>
            {platformData.map((platform) => {
              const maxEngagement = Math.max(...platformData.map(p => p.engagement));
              const widthPercentage = (platform.engagement / maxEngagement) * 100;
              
              return (
                <div key={platform.name} className="space-y-1">
                  <div className="flex justify-between text-xs">
                    <span className="text-muted-foreground">{platform.name}</span>
                    <span className="text-foreground">{formatNumber(platform.engagement)}</span>
                  </div>
                  <div className="w-full bg-secondary rounded-full h-2">
                    <div 
                      className={`h-2 rounded-full ${platform.color} progress-bar`}
                      style={{ width: `${widthPercentage}%` }}
                    ></div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
