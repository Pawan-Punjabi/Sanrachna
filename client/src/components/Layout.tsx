import { Link } from "wouter";
import { Moon, Sun, Scan } from "lucide-react";
import { useTheme } from "@/hooks/use-theme";
import { motion } from "framer-motion";

export function Layout({ children }: { children: React.ReactNode }) {
  const { theme, toggleTheme } = useTheme();

  return (
    <div className="min-h-screen flex flex-col font-sans">
      <header className="sticky top-0 z-50 glass">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-20 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-3 group">
            <div className="w-10 h-10 rounded-xl bg-primary text-primary-foreground flex items-center justify-center group-hover:scale-105 transition-transform duration-300">
              <Scan size={20} />
            </div>
            <span className="font-display font-semibold text-xl tracking-wide">
              Aura <span className="text-muted-foreground font-sans font-normal text-sm ml-1 hidden sm:inline-block">Space Analyzer</span>
            </span>
          </Link>
          
          <div className="flex items-center gap-6">
            <nav className="hidden md:flex items-center gap-8 text-sm font-medium">
              <Link href="/" className="text-muted-foreground hover:text-foreground transition-colors">Analyzer</Link>
              <a href="#how-it-works" className="text-muted-foreground hover:text-foreground transition-colors">How it works</a>
            </nav>
            
            <div className="w-px h-6 bg-border hidden md:block"></div>
            
            <button
              onClick={toggleTheme}
              className="p-2 rounded-full hover:bg-secondary text-muted-foreground hover:text-foreground transition-colors"
              aria-label="Toggle theme"
            >
              <motion.div
                initial={false}
                animate={{ rotate: theme === 'dark' ? 180 : 0 }}
                transition={{ duration: 0.3 }}
              >
                {theme === 'dark' ? <Moon size={20} /> : <Sun size={20} />}
              </motion.div>
            </button>
          </div>
        </div>
      </header>

      <main className="flex-1 flex flex-col">
        {children}
      </main>

      <footer className="border-t border-border/50 py-12 mt-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col md:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2 text-muted-foreground">
            <Scan size={18} />
            <span className="font-display font-medium">Aura</span>
            <span className="text-sm">© {new Date().getFullYear()}</span>
          </div>
          <p className="text-sm text-muted-foreground text-balance text-center">
            Elevating interior spaces with artificial intelligence.
          </p>
        </div>
      </footer>
    </div>
  );
}
