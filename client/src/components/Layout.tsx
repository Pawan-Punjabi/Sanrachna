import { Link } from "wouter";
import { Moon, Sun, Sparkles } from "lucide-react";
import { useTheme } from "@/hooks/use-theme";
import { motion } from "framer-motion";

export function Layout({ children }: { children: React.ReactNode }) {
  const { theme, toggleTheme } = useTheme();

  return (
    <div className="min-h-screen flex flex-col font-sans">
      <header className="sticky top-0 z-50 glass backdrop-blur-md">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-20 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-3 group">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-secondary to-accent text-foreground flex items-center justify-center group-hover:scale-105 transition-transform duration-300 shadow-lg">
              <Sparkles size={20} className="font-bold" />
            </div>
            <span className="font-display font-bold text-xl tracking-tight">
              Aura <span className="text-muted-foreground font-sans font-normal text-sm ml-1 hidden sm:inline-block">Space Analyzer</span>
            </span>
          </Link>
          
          <div className="flex items-center gap-6">
            <nav className="hidden md:flex items-center gap-8 text-sm font-medium">
              <Link href="/" className="text-muted-foreground hover:text-foreground transition-colors duration-200">Analyzer</Link>
              <a href="#how-it-works" className="text-muted-foreground hover:text-foreground transition-colors duration-200">How it works</a>
            </nav>
            
            <div className="w-px h-6 bg-border hidden md:block"></div>
            
            <motion.button
              onClick={toggleTheme}
              className="p-2 rounded-full hover:bg-secondary/20 text-muted-foreground hover:text-foreground transition-colors duration-200"
              aria-label="Toggle theme"
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
            >
              <motion.div
                initial={false}
                animate={{ rotate: theme === 'dark' ? 180 : 0 }}
                transition={{ duration: 0.3 }}
              >
                {theme === 'dark' ? <Moon size={20} /> : <Sun size={20} />}
              </motion.div>
            </motion.button>
          </div>
        </div>
      </header>

      <main className="flex-1 flex flex-col">
        {children}
      </main>

      <footer className="border-t border-border/50 py-12 mt-20 bg-card/50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col md:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2 text-muted-foreground">
            <Sparkles size={18} />
            <span className="font-display font-bold">Aura</span>
            <span className="text-sm">© {new Date().getFullYear()}</span>
          </div>
          <p className="text-sm text-muted-foreground text-balance text-center">
            Transforming spaces with AI-powered design intelligence.
          </p>
        </div>
      </footer>
    </div>
  );
}
