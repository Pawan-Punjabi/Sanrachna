import { createContext, useContext, useState, useEffect } from "react";

type Plan = "free" | "pro";

interface PlanContextValue {
  plan: Plan;
  isPro: boolean;
  togglePlan: () => void;
  setPlan: (plan: Plan) => void;
}

const PlanContext = createContext<PlanContextValue | null>(null);

export function PlanProvider({ children }: { children: React.ReactNode }) {
  const [plan, setPlanState] = useState<Plan>(() => {
    try {
      const stored = localStorage.getItem("sanrachna-plan");
      return stored === "pro" ? "pro" : "free";
    } catch {
      return "free";
    }
  });

  const setPlan = (newPlan: Plan) => {
    setPlanState(newPlan);
    try {
      localStorage.setItem("sanrachna-plan", newPlan);
    } catch {}
  };

  const togglePlan = () => setPlan(plan === "free" ? "pro" : "free");

  return (
    <PlanContext.Provider value={{ plan, isPro: plan === "pro", togglePlan, setPlan }}>
      {children}
    </PlanContext.Provider>
  );
}

export function usePlan() {
  const ctx = useContext(PlanContext);
  if (!ctx) throw new Error("usePlan must be used within a PlanProvider");
  return ctx;
}
