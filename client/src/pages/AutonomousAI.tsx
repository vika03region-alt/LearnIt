import Sidebar from "@/components/Sidebar";
import AutonomousAIControl from "@/components/AutonomousAIControl";
import AutonomousMonitoring from "@/components/AutonomousMonitoring";

export default function AutonomousAI() {
  return (
    <div className="min-h-screen bg-background">
      <Sidebar />

      <main className="ml-64 transition-all duration-300">
        <header className="bg-card border-b border-border px-6 py-4">
          <div>
            <h2 className="text-3xl font-bold bg-gradient-to-r from-purple-600 to-blue-600 bg-clip-text text-transparent">
              🤖 Автономная AI Система
            </h2>
            <p className="text-muted-foreground mt-2">
              Система самостоятельного развития и улучшения кода через искусственный интеллект
            </p>
          </div>
        </header>

        <div className="p-6 space-y-6">
          <AutonomousAIControl />
          <AutonomousMonitoring />
        </div>
      </main>
    </div>
  );
}