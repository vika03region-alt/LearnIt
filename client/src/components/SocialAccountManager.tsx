import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/useAuth";
import { queryClient, apiRequest } from "@/lib/queryClient";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Instagram, Youtube, Loader2, ExternalLink, CheckCircle, AlertCircle, XCircle, Settings } from "lucide-react";
import { SiTiktok, SiTelegram } from "react-icons/si";
import { Platform } from "@/types/api";
import { UserAccount } from "@shared/schema";

interface SocialAccountManagerProps {
  platforms?: Platform[];
}

export default function SocialAccountManager({ platforms }: SocialAccountManagerProps) {
  const { toast } = useToast();
  const { user } = useAuth();
  const [connectingPlatform, setConnectingPlatform] = useState<number | null>(null);

  // Fetch user accounts
  const { data: userAccounts, isLoading: isAccountsLoading } = useQuery<UserAccount[]>({
    queryKey: ['/api/social/accounts'],
    retry: false,
  });

  // Connect platform mutation
  const connectMutation = useMutation({
    mutationFn: async (platformId: number) => {
      const response = await apiRequest('POST', `/api/social/connect/${platformId}`);
      return await response.json();
    },
    onSuccess: (data: any) => {
      if (data.authUrl) {
        // Redirect to OAuth URL
        window.location.href = data.authUrl;
      } else {
        toast({
          title: "Ошибка подключения",
          description: "Не удалось получить ссылку авторизации",
          variant: "destructive",
        });
      }
    },
    onError: (error: any) => {
      toast({
        title: "Ошибка подключения",
        description: error?.message || "Не удалось подключить платформу",
        variant: "destructive",
      });
    },
    onSettled: () => {
      setConnectingPlatform(null);
    },
  });

  // Disconnect account mutation
  const disconnectMutation = useMutation({
    mutationFn: async (accountId: number) => {
      const response = await apiRequest('POST', `/api/social/disconnect/${accountId}`);
      return accountId;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/social/accounts'] });
      toast({
        title: "Успешно отключено",
        description: "Аккаунт успешно отключён от системы",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Ошибка отключения",
        description: error?.message || "Не удалось отключить аккаунт",
        variant: "destructive",
      });
    },
  });

  const getPlatformIcon = (platformName: string) => {
    const iconClass = "w-6 h-6";
    switch (platformName) {
      case 'instagram':
        return <Instagram className={`${iconClass} text-pink-600`} />;
      case 'tiktok':
        return <SiTiktok className={`${iconClass} text-red-600`} />;
      case 'youtube':
        return <Youtube className={`${iconClass} text-red-600`} />;
      case 'telegram':
        return <SiTelegram className={`${iconClass} text-blue-600`} />;
      default:
        return <div className={`${iconClass} bg-muted rounded`} />;
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'connected':
        return (
          <Badge variant="default" className="bg-green-100 text-green-700 border-green-200">
            <CheckCircle className="w-3 h-3 mr-1" />
            Подключен
          </Badge>
        );
      case 'error':
        return (
          <Badge variant="destructive">
            <XCircle className="w-3 h-3 mr-1" />
            Ошибка
          </Badge>
        );
      case 'expired':
        return (
          <Badge variant="secondary">
            <AlertCircle className="w-3 h-3 mr-1" />
            Токен истёк
          </Badge>
        );
      default:
        return (
          <Badge variant="outline">
            <XCircle className="w-3 h-3 mr-1" />
            Не подключен
          </Badge>
        );
    }
  };

  const handleConnect = (platformId: number) => {
    setConnectingPlatform(platformId);
    connectMutation.mutate(platformId);
  };

  const handleDisconnect = (accountId: number) => {
    if (confirm('Вы уверены, что хотите отключить этот аккаунт? Все настройки будут сброшены.')) {
      disconnectMutation.mutate(accountId);
    }
  };

  if (isAccountsLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="text-center">
          <Loader2 className="w-8 h-8 animate-spin mx-auto mb-4 text-primary" />
          <p className="text-muted-foreground">Загружаем Ваши изысканные соединения...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-foreground mb-2">Управление Социальными Аккаунтами</h2>
        <p className="text-muted-foreground">
          Подключите Ваши светские площадки для элегантного управления контентом из единого салона
        </p>
      </div>

      {/* Connection Instructions */}
      <Alert className="border-blue-200 bg-blue-50">
        <Settings className="h-4 w-4" />
        <AlertDescription className="text-blue-800">
          <strong>Инструкция по подключению:</strong> Instagram требует подключения бизнес-аккаунта к Facebook странице. 
          YouTube и TikTok подключаются через собственные API. Telegram требует создания бота.
        </AlertDescription>
      </Alert>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-2 gap-6">
        {platforms?.map((platform) => {
          const userAccount = userAccounts?.find(acc => acc.platformId === platform.id);
          const isConnecting = connectingPlatform === platform.id;

          return (
            <Card key={platform.id} className="relative overflow-hidden" data-testid={`card-account-${platform.name}`}>
              <CardHeader className="pb-4">
                <CardTitle className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className={`p-2 rounded-lg ${platform.name === 'instagram' ? 'bg-pink-100' : 
                      platform.name === 'tiktok' ? 'bg-red-100' : 
                      platform.name === 'youtube' ? 'bg-red-50' : 
                      platform.name === 'telegram' ? 'bg-blue-100' : 'bg-muted'}`}>
                      {getPlatformIcon(platform.name)}
                    </div>
                    <div>
                      <h3 className="font-semibold text-foreground">{platform.displayName}</h3>
                      <p className="text-sm text-muted-foreground">{platform.name.charAt(0).toUpperCase() + platform.name.slice(1)}</p>
                    </div>
                  </div>
                  {getStatusBadge(userAccount?.authStatus || 'disconnected')}
                </CardTitle>
              </CardHeader>

              <CardContent className="pt-0">
                {userAccount ? (
                  // Connected Account Info
                  <div className="space-y-4">
                    <div className="space-y-2">
                      <div className="flex justify-between items-center">
                        <span className="text-sm text-muted-foreground">Аккаунт:</span>
                        <span className="text-sm font-medium" data-testid={`text-handle-${platform.name}`}>
                          {userAccount.accountHandle || 'Неизвестный аккаунт'}
                        </span>
                      </div>
                      
                      {userAccount.platformConfig?.businessAccountId && (
                        <div className="flex justify-between items-center">
                          <span className="text-sm text-muted-foreground">Business ID:</span>
                          <span className="text-xs font-mono text-muted-foreground">
                            {userAccount.platformConfig.businessAccountId.slice(0, 12)}...
                          </span>
                        </div>
                      )}

                      {userAccount.tokenExpiry && (
                        <div className="flex justify-between items-center">
                          <span className="text-sm text-muted-foreground">Токен действует до:</span>
                          <span className="text-xs text-muted-foreground">
                            {new Date(userAccount.tokenExpiry).toLocaleDateString('ru-RU')}
                          </span>
                        </div>
                      )}
                    </div>

                    <div className="flex gap-2">
                      <Button 
                        variant="outline" 
                        size="sm" 
                        onClick={() => handleDisconnect(userAccount.id)}
                        disabled={disconnectMutation.isPending}
                        data-testid={`button-disconnect-${platform.name}`}
                      >
                        {disconnectMutation.isPending ? (
                          <Loader2 className="w-4 h-4 animate-spin mr-2" />
                        ) : (
                          <XCircle className="w-4 h-4 mr-2" />
                        )}
                        Отключить
                      </Button>
                      
                      {userAccount.authStatus === 'expired' && (
                        <Button 
                          size="sm" 
                          onClick={() => handleConnect(platform.id)}
                          disabled={isConnecting}
                          data-testid={`button-reconnect-${platform.name}`}
                        >
                          {isConnecting ? (
                            <Loader2 className="w-4 h-4 animate-spin mr-2" />
                          ) : (
                            <ExternalLink className="w-4 h-4 mr-2" />
                          )}
                          Переподключить
                        </Button>
                      )}
                    </div>
                  </div>
                ) : (
                  // Not Connected
                  <div className="space-y-4">
                    <p className="text-sm text-muted-foreground">
                      Аккаунт не подключён. Нажмите кнопку ниже для подключения через OAuth.
                    </p>
                    
                    <Button 
                      className="w-full" 
                      onClick={() => handleConnect(platform.id)}
                      disabled={isConnecting}
                      data-testid={`button-connect-${platform.name}`}
                    >
                      {isConnecting ? (
                        <Loader2 className="w-4 h-4 animate-spin mr-2" />
                      ) : (
                        <ExternalLink className="w-4 h-4 mr-2" />
                      )}
                      Подключить {platform.displayName}
                    </Button>
                  </div>
                )}
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* Additional Information */}
      <div className="mt-8 p-6 bg-muted/50 rounded-lg border border-border">
        <h3 className="font-semibold text-foreground mb-3">Важные заметки</h3>
        <div className="space-y-2 text-sm text-muted-foreground">
          <p>• <strong>Instagram:</strong> Требует бизнес-аккаунт, подключенный к Facebook странице</p>
          <p>• <strong>YouTube:</strong> Поддерживает загрузку видео до 128MB с resumable uploads</p>
          <p>• <strong>TikTok:</strong> Использует TikTok for Business API для загрузки контента</p>
          <p>• <strong>Telegram:</strong> Требует создания бота через @BotFather</p>
        </div>
      </div>
    </div>
  );
}