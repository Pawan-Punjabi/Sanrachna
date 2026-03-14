import { createContext, useContext, useState, useEffect } from "react";
import { useAuth } from "@/context/auth-context";
import { upgradeToPro, downgradeToFree } from "@/lib/supabase-helpers";

type Plan = "free" | "pro";

interface PlanContextValue {
  plan: Plan;
  isPro: boolean;
  togglePlan: () => void;
  setPlan: (plan: Plan) => void;
}

const PlanContext = createContext<PlanContextValue | null>(null);

export function PlanProvider({ children }: { children: React.ReactNode }) {
  const { user, plan: authPlan, isAuthenticated, refreshPlan } = useAuth();

  // Local fallback plan for unauthenticated users (localStorage)
  const [localPlan, setLocalPlan] = useState<Plan>(() => {
    try {
      const stored = localStorage.getItem("sanrachna-plan");
      return stored === "pro" ? "pro" : "free";
    } catch {
      return "free";
    }
  });

  // Sync local plan whenever auth plan changes
  useEffect(() => {
    if (isAuthenticated) {
      setLocalPlan(authPlan);
    }
  }, [authPlan, isAuthenticated]);

  const currentPlan: Plan = isAuthenticated ? authPlan : localPlan;

  const setPlan = async (newPlan: Plan) => {
    if (isAuthenticated && user) {
      try {
        if (newPlan === "pro") {
          await upgradeToPro(user.id);
        } else {
          await downgradeToFree(user.id);
        }
        await refreshPlan();
      } catch (err) {
        console.error("Failed to update plan in DB:", err);
      }
    } else {
      setLocalPlan(newPlan);
      try {
        localStorage.setItem("sanrachna-plan", newPlan);
      } catch {}
    }
  };

  const togglePlan = () => setPlan(currentPlan === "free" ? "pro" : "free");

  return (
    <PlanContext.Provider value={{
      plan: currentPlan,
      isPro: currentPlan === "pro",
      togglePlan,
      setPlan,
    }}>
      {children}
    </PlanContext.Provider>
  );
}

export function usePlan() {
  const ctx = useContext(PlanContext);
  if (!ctx) throw new Error("usePlan must be used within a PlanProvider");
  return ctx;
}
