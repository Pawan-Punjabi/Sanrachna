import { Link, useLocation } from "wouter";
import { Moon, Sun, Zap, LogIn, LogOut, User } from "lucide-react";
import { useTheme } from "@/hooks/use-theme";
import { motion } from "framer-motion";
import sanrachnaLogo from "@assets/unnamed_(1)_1773208910201.png";
import { usePlan } from "@/context/plan-context";
import { useAuth } from "@/context/auth-context";
import { signOut } from "@/lib/supabase-helpers";

export function Layout({ children }: { children: React.ReactNode }) {
  const { theme, toggleTheme } = useTheme();
  const { plan, isPro, togglePlan } = usePlan();
  const { user, isAuthenticated, isLoading } = useAuth();
  const [, setLocation] = useLocation();

  const handleLogout = async () => {
    try {
      await signOut();
      setLocation("/");
    } catch (err) {
      console.error("Sign out failed:", err);
    }
  };

  return (
    <div className="min-h-screen flex flex-col font-sans">
      <header className="sticky top-0 z-50 glass backdrop-blur-md">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-28 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-3 group">
            <img
              src={sanrachnaLogo}
              alt="Sanrachna logo"
              className="h-20 group-hover:scale-105 transition-transform duration-300 logo-accent"
            />
          </Link>

          <div className="flex items-center gap-5">
            <nav className="hidden md:flex items-center gap-8 text-sm font-medium">
              <Link href="/" className="text-muted-foreground hover:text-foreground transition-colors duration-200">Home</Link>
              <Link href="/analyzer" className="text-muted-foreground hover:text-foreground transition-colors duration-200">Analyzer</Link>
              <a href="/#how-it-works" className="text-muted-foreground hover:text-foreground transition-colors duration-200">How it works</a>
              <Link href="/pricing" className="text-muted-foreground hover:text-foreground transition-colors duration-200">Pricing</Link>
            </nav>

            <div className="w-px h-6 bg-border hidden md:block" />

            {/* Free / Pro toggle */}
            <button
              onClick={togglePlan}
              data-testid="button-plan-toggle"
              className={`
                relative flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-bold uppercase tracking-wider
                border transition-all duration-300
                ${isPro
                  ? "bg-accent text-accent-foreground border-accent shadow-md shadow-accent/20"
                  : "bg-muted text-muted-foreground border-border hover:border-accent/40"
                }
              `}
              title={isPro ? "Switch to Free plan" : "Switch to Pro plan"}
            >
              {isPro && <Zap size={11} className="fill-current shrink-0" />}
              <span>{isPro ? "Pro" : "Free"}</span>
            </button>

            <div className="w-px h-6 bg-border" />

            {/* Auth section */}
            {!isLoading && (
              isAuthenticated ? (
                <div className="flex items-center gap-3">
                  {/* User avatar / email */}
                  <div className="hidden sm:flex items-center gap-2 text-sm text-muted-foreground">
                    <User size={14} className="text-accent" />
                    <span className="max-w-[140px] truncate" data-testid="text-user-email">
                      {user?.email}
                    </span>
                  </div>

                  {/* Logout */}
                  <button
                    onClick={handleLogout}
                    data-testid="button-logout"
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium border border-border hover:border-destructive/50 hover:text-destructive text-muted-foreground transition-colors duration-200"
                    title="Sign out"
                  >
                    <LogOut size={12} />
                    <span className="hidden sm:inline">Sign out</span>
                  </button>
                </div>
              ) : (
                <Link href="/auth">
                  <button
                    data-testid="button-login"
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium bg-accent text-accent-foreground hover:bg-accent/90 transition-colors duration-200"
                  >
                    <LogIn size={12} />
                    <span>Sign in</span>
                  </button>
                </Link>
              )
            )}

            <div className="w-px h-6 bg-border" />

            {/* Theme toggle */}
            <motion.button
              onClick={toggleTheme}
              className="p-2 rounded-full hover:bg-secondary/20 text-muted-foreground hover:text-foreground transition-colors duration-200"
              aria-label="Toggle theme"
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
            >
              <motion.div
                initial={false}
                animate={{ rotate: theme === "dark" ? 180 : 0 }}
                transition={{ duration: 0.3 }}
              >
                {theme === "dark" ? <Moon size={20} /> : <Sun size={20} />}
              </motion.div>
            </motion.button>
          </div>
        </div>
      </header>

      <main className="flex-1 flex flex-col">
        {children}
      </main>

      <footer className="border-t border-border/50 py-10 mt-0 bg-card/50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col md:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2 text-muted-foreground">
            <span className="font-display font-bold">Sanrachna</span>
            <span className="text-sm">© {new Date().getFullYear()}</span>
          </div>
          <p className="text-sm text-muted-foreground text-balance text-center">
            Creating beautiful spaces through thoughtful design.
          </p>
        </div>
      </footer>
    </div>
  );
}
