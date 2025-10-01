import React from "react";
import { Switch, Route } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { useAuth } from "@/hooks/useAuth";
import Landing from "@/pages/Landing";
import Dashboard from "@/pages/Dashboard";
import PlatformDetails from "@/pages/PlatformDetails";
import AIContent from "@/pages/AIContent";
import SafetyCenter from "@/pages/SafetyCenter";
import Scheduler from "@/pages/Scheduler";
import Settings from "@/pages/Settings";
import AIAssistant from "@/pages/AIAssistant";
import NotFound from "@/pages/not-found";

function Router() {
  const { isAuthenticated, isLoading } = useAuth();

  return (
    <Switch>
      {isLoading || !isAuthenticated ? (
        <Route path="/" component={Landing} />
      ) : (
        <>
          <Route path="/" component={Dashboard} />
          <Route path="/platform/:platformId" component={PlatformDetails} />
          <Route path="/ai-content" component={AIContent} />
          <Route path="/ai-assistant" component={AIAssistant} />
          <Route path="/telegram-test">
            {() => {
              const TelegramTestDashboard = React.lazy(() => import('./components/TelegramTestDashboard').then(m => ({ default: m.TelegramTestDashboard })));
              return (
                <React.Suspense fallback={<div>Loading...</div>}>
                  <TelegramTestDashboard />
                </React.Suspense>
              );
            }}
          </Route>
          <Route path="/safety" component={SafetyCenter} />
          <Route path="/scheduler" component={Scheduler} />
          <Route path="/settings" component={Settings} />
        </>
      )}
      <Route component={NotFound} />
    </Switch>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <Toaster />
        <Router />
      </TooltipProvider>
    </QueryClientProvider>
  );
}

export default App;