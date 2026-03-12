import { Switch, Route } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import NotFound from "@/pages/not-found";

import { Home } from "@/pages/Home";
import { Analyzer } from "@/pages/Analyzer";

function Router() {
  return (
    <Switch>
      <Route path="/" component={Home} />
      <Route path="/analyzer" component={() => <Analyzer />} />
      <Route path="/analyzer/:id">
        {(params) => <Analyzer id={parseInt(params.id, 10)} />}
      </Route>
      {/* Legacy route — redirect to analyzer */}
      <Route path="/floor-plan/:id">
        {(params) => <Analyzer id={parseInt(params.id, 10)} />}
      </Route>
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
