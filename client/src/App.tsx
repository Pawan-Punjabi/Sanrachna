import { Switch, Route } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import NotFound from "@/pages/not-found";

import { Home } from "@/pages/Home";
import { Result } from "@/pages/Result";

function Router() {
  return (
    <Switch>
      <Route path="/" component={Home} />
      <Route path="/floor-plan/:id">
        {(params) => <Result id={parseInt(params.id, 10)} />}
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
