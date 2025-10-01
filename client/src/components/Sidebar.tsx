
import { useState } from "react";
import { Link, useLocation } from "wouter";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { useQuery } from "@tanstack/react-query";
import { Platform, SafetyStatus as SafetyStatusType } from "@/types/api";
import { 
  TrendingUp, 
  Gauge, 
  Brain, 
  Shield, 
  Calendar, 
  Settings, 
  ChevronLeft,
  Instagram,
  Youtube,
  Rocket,
  BarChart3,
  Target,
  Users,
  MessageCircle
} from "lucide-react";
import { SiTiktok, SiTelegram } from "react-icons/si";

export default function Sidebar() {
  const [collapsed, setCollapsed] = useState(false);
  const [location] = useLocation();

  const { data: platforms } = useQuery<Platform[]>({
    queryKey: ['/api/platforms'],
    retry: false,
  });

  const { data: safetyStatus } = useQuery<SafetyStatusType>({
    queryKey: ['/api/safety/status'],
    retry: false,
  });

  const getPlatformIcon = (platformName: string) => {
    switch (platformName) {
      case 'instagram':
        return <Instagram className="w-5 h-5" />;
      case 'tiktok':
        return <SiTiktok className="w-5 h-5" />;
      case 'youtube':
        return <Youtube className="w-5 h-5" />;
      case 'telegram':
        return <SiTelegram className="w-5 h-5" />;
      default:
        return <div className="w-5 h-5 bg-muted rounded" />;
    }
  };

  const getPlatformStatus = (platformName: string) => {
    if (!safetyStatus?.platforms) return 'inactive';
    
    const platformData = Object.values(safetyStatus.platforms).find(
      (platform: any, index: number) => index.toString() === platformName || platform.name === platformName
    );
    if (!platformData) return 'inactive';
    
    if (platformData.percentage > 90) return 'critical';
    if (platformData.percentage > 80) return 'warning';
    return 'active';
  };

  const getStatusIndicator = (status: string) => {
    switch (status) {
      case 'active':
        return <span className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></span>;
      case 'warning':
        return <span className="w-2 h-2 bg-yellow-500 rounded-full"></span>;
      case 'critical':
        return <span className="w-2 h-2 bg-red-500 rounded-full animate-pulse"></span>;
      default:
        return <span className="w-2 h-2 bg-gray-400 rounded-full"></span>;
    }
  };

  return (
    <aside 
      className={cn(
        "fixed left-0 top-0 h-full bg-white border-r border-slate-200 transition-all duration-300 z-50 shadow-lg",
        collapsed ? "w-20" : "w-64"
      )}
      data-testid="sidebar"
    >
      <div className="p-6">
        <div className="flex items-center gap-3 mb-8">
          <div className="w-10 h-10 bg-gradient-to-br from-blue-600 via-purple-600 to-pink-600 rounded-lg flex items-center justify-center">
            <Rocket className="text-white text-lg" />
          </div>
          {!collapsed && (
            <div>
              <h1 className="text-xl font-bold bg-gradient-to-r from-blue-800 to-purple-600 bg-clip-text text-transparent">
                Продвижение PRO
              </h1>
              <p className="text-sm text-slate-600">Пульт управления</p>
            </div>
          )}
        </div>
        
        <nav className="space-y-2">
          <Link href="/">
            <a 
              className={cn(
                "flex items-center gap-3 px-3 py-3 rounded-lg transition-colors",
                location === "/" 
                  ? "bg-gradient-to-r from-blue-500 to-purple-600 text-white shadow-sm" 
                  : "hover:bg-slate-100 text-slate-700 hover:text-slate-900"
              )}
              data-testid="link-dashboard"
            >
              <Gauge className="w-5 h-5" />
              {!collapsed && <span className="font-medium">Главная Панель</span>}
            </a>
          </Link>

          {/* Раздел платформы */}
          {!collapsed && (
            <div className="px-3 py-2">
              <h3 className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
                Социальные Сети
              </h3>
            </div>
          )}

          {platforms?.map((platform: any) => (
            <Link key={platform.id} href={`/platform/${platform.id}`}>
              <a 
                className={cn(
                  "flex items-center gap-3 px-3 py-2 rounded-lg transition-colors",
                  location === `/platform/${platform.id}`
                    ? "bg-gradient-to-r from-blue-500 to-purple-600 text-white shadow-sm"
                    : "hover:bg-slate-100 text-slate-700 hover:text-slate-900"
                )}
                data-testid={`link-platform-${platform.name}`}
              >
                {getPlatformIcon(platform.name)}
                {!collapsed && <span>{platform.displayName}</span>}
                {!collapsed && (
                  <span className="ml-auto">
                    {getStatusIndicator(getPlatformStatus(platform.name))}
                  </span>
                )}
              </a>
            </Link>
          ))}
          
          <div className="pt-4 border-t border-slate-200">
            {!collapsed && (
              <div className="px-3 py-2 mb-2">
                <h3 className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
                  Инструменты
                </h3>
              </div>
            )}

            <Link href="/ai-content">
              <a 
                className={cn(
                  "flex items-center gap-3 px-3 py-2 rounded-lg transition-colors",
                  location === "/ai-content"
                    ? "bg-gradient-to-r from-purple-500 to-pink-600 text-white shadow-sm"
                    : "hover:bg-slate-100 text-slate-700 hover:text-slate-900"
                )}
                data-testid="link-ai-content"
              >
                <Brain className="w-5 h-5" />
                {!collapsed && <span>AI Контент</span>}
              </a>
            </Link>

            <Link href="/ai-assistant">
              <a 
                className={cn(
                  "flex items-center gap-3 px-3 py-2 rounded-lg transition-colors",
                  location === "/ai-assistant"
                    ? "bg-gradient-to-r from-blue-500 to-cyan-600 text-white shadow-sm"
                    : "hover:bg-slate-100 text-slate-700 hover:text-slate-900"
                )}
                data-testid="link-ai-assistant"
              >
                <MessageCircle className="w-5 h-5" />
                {!collapsed && <span>AI Ассистент</span>}
              </a>
            </Link>

            <Link href="/safety">
              <a 
                className={cn(
                  "flex items-center gap-3 px-3 py-2 rounded-lg transition-colors",
                  location === "/safety"
                    ? "bg-gradient-to-r from-green-500 to-blue-600 text-white shadow-sm"
                    : "hover:bg-slate-100 text-slate-700 hover:text-slate-900"
                )}
                data-testid="link-safety"
              >
                <Shield className="w-5 h-5" />
                {!collapsed && <span>Безопасность</span>}
              </a>
            </Link>

            <Link href="/scheduler">
              <a 
                className={cn(
                  "flex items-center gap-3 px-3 py-2 rounded-lg transition-colors",
                  location === "/scheduler"
                    ? "bg-gradient-to-r from-amber-500 to-orange-600 text-white shadow-sm"
                    : "hover:bg-slate-100 text-slate-700 hover:text-slate-900"
                )}
                data-testid="link-scheduler"
              >
                <Calendar className="w-5 h-5" />
                {!collapsed && <span>Планировщик</span>}
              </a>
            </Link>

            <Link href="/settings">
              <a 
                className={cn(
                  "flex items-center gap-3 px-3 py-2 rounded-lg transition-colors",
                  location === "/settings"
                    ? "bg-gradient-to-r from-slate-500 to-slate-600 text-white shadow-sm"
                    : "hover:bg-slate-100 text-slate-700 hover:text-slate-900"
                )}
                data-testid="link-settings"
              >
                <Settings className="w-5 h-5" />
                {!collapsed && <span>Настройки</span>}
              </a>
            </Link>
          </div>
        </nav>
      </div>
      
      <div className="absolute bottom-6 left-6 right-6">
        <Button
          variant="outline"
          className="w-full flex items-center justify-center gap-2 border-slate-200 hover:bg-slate-50"
          onClick={() => setCollapsed(!collapsed)}
          data-testid="button-toggle-sidebar"
        >
          <ChevronLeft 
            className={cn(
              "w-4 h-4 transition-transform",
              collapsed && "rotate-180"
            )} 
          />
          {!collapsed && <span className="text-sm">Свернуть</span>}
        </Button>
      </div>
    </aside>
  );
}
