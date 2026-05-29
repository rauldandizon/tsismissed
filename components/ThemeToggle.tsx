"use client";

import { Moon, Sun } from "lucide-react";
import { useTheme } from "./ThemeProvider";

export function ThemeToggle() {
  const { theme, toggleTheme } = useTheme();

  return (
    <button
      onClick={toggleTheme}
      type="button"
      title={theme === "dark" ? "Mag-switch sa Light Mode" : "Mag-switch sa Dark Mode"}
      aria-label="Toggle Theme"
      className="h-8 w-8 flex items-center justify-center rounded-full bg-transparent text-tsismis-muted hover:text-tsismis-text hover:bg-tsismis-text/5 transition-all duration-200 hover:rotate-12 hover:scale-105 active:scale-95 cursor-pointer shrink-0"
    >
      {theme === "dark" ? (
        <Sun size={18} className="animate-in fade-in zoom-in duration-300" />
      ) : (
        <Moon size={18} className="animate-in fade-in zoom-in duration-300" />
      )}
    </button>
  );
}
