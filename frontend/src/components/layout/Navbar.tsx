import { Link, useLocation } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";
import { useTheme } from "../../context/ThemeContext";
import { Sun, Moon, LogOut, Users, Box } from "lucide-react";
import { motion } from "framer-motion";
import { cn } from "../../lib/utils";

export function Navbar() {
  const { user, logout } = useAuth();
  const { theme, setTheme } = useTheme();
  const location = useLocation();

  if (!user) return null;

  return (
    <nav className="sticky top-0 z-50 w-full bg-background/70 backdrop-blur-2xl border-b border-border transition-colors duration-300">
      <div className="max-w-7xl mx-auto px-6 h-16 flex items-center justify-between">
        <div className="flex items-center gap-8">
          <Link
            to="/"
            className="text-2xl font-black bg-gradient-to-r from-primary via-fuchsia-500 to-emerald-500 bg-clip-text text-transparent hover:opacity-80 transition-opacity"
          >
            TF.
          </Link>

          {user.role === "org" && (
            <div className="hidden md:flex items-center gap-2">
              <Link
                to="/projects"
                className={cn(
                  "flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-semibold transition-all",
                  location.pathname.startsWith("/projects") 
                    ? "bg-primary text-primary-foreground shadow-sm" 
                    : "text-muted-foreground hover:bg-muted hover:text-foreground"
                )}
              >
                <Box size={16} /> Projects
              </Link>
              <Link
                to="/employees"
                className={cn(
                  "flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-semibold transition-all",
                  location.pathname === "/employees" 
                    ? "bg-primary text-primary-foreground shadow-sm" 
                    : "text-muted-foreground hover:bg-muted hover:text-foreground"
                )}
              >
                <Users size={16} /> Employees
              </Link>
            </div>
          )}
        </div>

        <div className="flex items-center gap-4">
          <motion.button
            whileTap={{ scale: 0.9 }}
            onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
            className="p-2.5 rounded-full bg-muted/50 hover:bg-muted text-muted-foreground hover:text-foreground transition-colors border border-border"
            title="Toggle Theme"
          >
            {theme === "dark" ? <Sun size={18} /> : <Moon size={18} />}
          </motion.button>

          <div className="h-6 w-px bg-border mx-1"></div>
          
          <div className="flex items-center gap-3">
            <div className="hidden sm:flex flex-col items-end">
              <span className="text-sm font-bold text-foreground leading-tight">
                {user.name}
              </span>
              <span className="text-[10px] font-black uppercase tracking-widest text-primary">
                {user.role}
              </span>
            </div>
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={logout}
              className="p-2.5 rounded-full bg-destructive/10 hover:bg-destructive text-destructive hover:text-destructive-foreground transition-colors ml-2 shadow-sm"
              title="Sign Out"
            >
              <LogOut size={16} className="stroke-[2.5]" />
            </motion.button>
          </div>
        </div>
      </div>
    </nav>
  );
}