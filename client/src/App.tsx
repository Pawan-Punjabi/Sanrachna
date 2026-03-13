import { Switch, Route, useLocation } from "wouter";
import { useEffect } from "react";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import NotFound from "@/pages/not-found";
import { PlanProvider } from "@/context/plan-context";

import { Home } from "@/pages/Home";
import { Analyzer } from "@/pages/Analyzer";
import { Pricing } from "@/pages/Pricing";

function ScrollToTop() {
  const [location] = useLocation();
  useEffect(() => {
    // Skip scroll-to-top when navigating to a hash anchor (e.g. /#how-it-works)
    if (window.location.hash) return;
    window.scrollTo({ top: 0, behavior: "instant" });
  }, [location]);
  return null;
}

function Router() {
  return (
    <>
      <ScrollToTop />
      <Switch>
        <Route path="/" component={Home} />
        <Route path="/analyzer" component={() => <Analyzer />} />
        <Route path="/analyzer/:id">
          {(params) => <Analyzer id={parseInt(params.id, 10)} />}
        </Route>
        <Route path="/floor-plan/:id">
          {(params) => <Analyzer id={parseInt(params.id, 10)} />}
        </Route>
        <Route path="/pricing" component={Pricing} />
        <Route component={NotFound} />
      </Switch>
    </>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <PlanProvider>
        <TooltipProvider>
          <Toaster />
          <Router />
        </TooltipProvider>
      </PlanProvider>
    </QueryClientProvider>
  );
}

export default App;
