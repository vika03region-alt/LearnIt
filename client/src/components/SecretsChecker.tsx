
import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { CheckCircle, XCircle, AlertCircle, RefreshCw } from "lucide-react";
import { toast } from "@/hooks/use-toast";

interface SecretStatus {
  name: string;
  displayName: string;
  status: 'present' | 'missing' | 'invalid';
  description: string;
  priority: 'critical' | 'important' | 'optional';
}

export default function SecretsChecker() {
  const [secrets, setSecrets] = useState<SecretStatus[]>([]);
  const [isChecking, setIsChecking] = useState(false);

  const checkSecrets = async () => {
    setIsChecking(true);
    try {
      const response = await fetch('/api/system/check-secrets');
      const data = await response.json();
      setSecrets(data.secrets);
    } catch (error) {
      toast({
        title: "Ошибка проверки",
        description: "Не удалось проверить статус секретов",
        variant: "destructive",
      });
    } finally {
      setIsChecking(false);
    }
  };

  useEffect(() => {
    checkSecrets();
  }, []);

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'present':
        return <CheckCircle className="w-4 h-4 text-green-500" />;
      case 'missing':
        return <XCircle className="w-4 h-4 text-red-500" />;
      case 'invalid':
        return <AlertCircle className="w-4 h-4 text-yellow-500" />;
      default:
        return <XCircle className="w-4 h-4 text-gray-400" />;
    }
  };

  const getStatusBadge = (status: string, priority: string) => {
    const variant = status === 'present' ? 'default' : 
                   priority === 'critical' ? 'destructive' : 'secondary';
    return (
      <Badge variant={variant}>
        {status === 'present' ? '✓ Готов' : 
         status === 'missing' ? '✗ Отсутствует' : '⚠ Недействителен'}
      </Badge>
    );
  };

  const criticalSecrets = secrets.filter(s => s.priority === 'critical');
  const readyToLaunch = criticalSecrets.every(s => s.status === 'present');

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center justify-between">
          🔑 Проверка секретов для запуска
          <Button
            onClick={checkSecrets}
            disabled={isChecking}
            size="sm"
            variant="outline"
          >
            {isChecking ? (
              <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
            ) : (
              <RefreshCw className="w-4 h-4 mr-2" />
            )}
            Обновить
          </Button>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Статус готовности */}
        <div className={`p-4 rounded-lg ${readyToLaunch ? 'bg-green-50 border border-green-200' : 'bg-red-50 border border-red-200'}`}>
          <div className="flex items-center gap-2">
            {readyToLaunch ? (
              <CheckCircle className="w-5 h-5 text-green-600" />
            ) : (
              <XCircle className="w-5 h-5 text-red-600" />
            )}
            <span className="font-medium">
              {readyToLaunch ? 
                '🚀 Готов к полноценному запуску!' : 
                '⚠️ Необходимо добавить критические секреты'}
            </span>
          </div>
        </div>

        {/* Список секретов */}
        <div className="space-y-2">
          {secrets.map((secret) => (
            <div key={secret.name} className="flex items-center justify-between p-3 border rounded-lg">
              <div className="flex items-center gap-3">
                {getStatusIcon(secret.status)}
                <div>
                  <div className="font-medium">{secret.displayName}</div>
                  <div className="text-sm text-muted-foreground">
                    {secret.description}
                  </div>
                </div>
              </div>
              <div className="flex items-center gap-2">
                {secret.priority === 'critical' && (
                  <Badge variant="outline" className="text-xs">
                    КРИТИЧНО
                  </Badge>
                )}
                {getStatusBadge(secret.status, secret.priority)}
              </div>
            </div>
          ))}
        </div>

        {/* Инструкции */}
        {!readyToLaunch && (
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
            <h4 className="font-medium text-blue-900 mb-2">
              📋 Что нужно сделать:
            </h4>
            <ol className="text-sm text-blue-800 space-y-1">
              <li>1. Перейдите в <strong>Tools → Secrets</strong></li>
              <li>2. Добавьте недостающие ключи</li>
              <li>3. Перезапустите приложение</li>
              <li>4. Протестируйте функции</li>
            </ol>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
