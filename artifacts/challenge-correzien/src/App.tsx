import { Switch, Route, Router as WouterRouter } from "wouter";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import NotFound from "@/pages/not-found";

import Home from "@/pages/home";
import AdminLogin from "@/pages/admin/login";
import AdminDashboard from "@/pages/admin/dashboard";
import AdminPlayers from "@/pages/admin/players";
import AdminYears from "@/pages/admin/years";
import AdminStages from "@/pages/admin/stages";
import AdminScores from "@/pages/admin/scores";
import AdminScoringRules from "@/pages/admin/scoring-rules";

const queryClient = new QueryClient();

function Router() {
  return (
    <Switch>
      <Route path="/" component={Home} />
      <Route path="/admin/login" component={AdminLogin} />
      <Route path="/admin/dashboard" component={AdminDashboard} />
      <Route path="/admin/players" component={AdminPlayers} />
      <Route path="/admin/years" component={AdminYears} />
      <Route path="/admin/stages" component={AdminStages} />
      <Route path="/admin/scores" component={AdminScores} />
      <Route path="/admin/scoring-rules" component={AdminScoringRules} />
      <Route component={NotFound} />
    </Switch>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <WouterRouter base={import.meta.env.BASE_URL.replace(/\/$/, "")}>
          <Router />
        </WouterRouter>
        <Toaster />
      </TooltipProvider>
    </QueryClientProvider>
  );
}

export default App;
