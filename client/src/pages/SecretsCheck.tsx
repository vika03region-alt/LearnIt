
import { Sidebar } from "@/components/Sidebar";
import SecretsChecker from "@/components/SecretsChecker";
import GrokQuickTest from "@/components/GrokQuickTest";

export default function SecretsCheck() {
  return (
    <div className="min-h-screen bg-background">
      <Sidebar />
      
      <main className="ml-64 transition-all duration-300">
        <header className="bg-card border-b border-border px-6 py-4">
          <div>
            <h2 className="text-2xl font-bold text-foreground">
              🔑 Проверка секретов и тестирование
            </h2>
            <p className="text-muted-foreground">
              Проверка наличия всех необходимых API ключей и тестирование интеграций
            </p>
          </div>
        </header>

        <div className="p-6 space-y-6">
          <SecretsChecker />
          <GrokQuickTest />
        </div>
      </main>
    </div>
  );
}
