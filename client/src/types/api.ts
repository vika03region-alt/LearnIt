// API response types based on database schema

export interface User {
  id: string;
  email: string | null;
  firstName: string | null;
  lastName: string | null;
  profileImageUrl: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface Platform {
  id: number;
  name: string;
  displayName: string;
  icon: string;
  color: string;
  apiEndpoint: string | null;
  isActive: boolean;
}

export interface PlatformData {
  status: 'active' | 'warning' | 'inactive';
  todayStats: {
    posts: number;
    maxPosts: number;
    engagement: number;
    engagementChange: number;
  };
  rateLimitUsage: number;
}

export interface SafetyStatus {
  overall: 'safe' | 'warning' | 'critical';
  platforms: {
    [platformId: number]: {
      status: 'safe' | 'warning' | 'critical';
      rateLimitUsage: number;
      maxLimit: number;
      percentage: number;
      lastAction: Date | null;
    };
  };
  recommendations: string[];
}

export interface Activity {
  id: number;
  action: string;
  description: string;
  platformId?: number;
  status: 'success' | 'warning' | 'error';
  createdAt: string;
  metadata?: any;
}

export interface DashboardData {
  platforms?: {
    [platformName: string]: PlatformData & {
      displayName: string;
    };
  };
}