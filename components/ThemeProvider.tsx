"use client";

import React, { createContext, useContext, useEffect, useState } from "react";

type Theme = "dark" | "light";

interface ThemeContextType {
  theme: Theme;
  toggleTheme: () => void;
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const [theme, setTheme] = useState<Theme>("dark");
  const [mounted, setMounted] = useState(false);

  // Load theme from localStorage or system preferences on mount
  useEffect(() => {
    setMounted(true);
    const savedTheme = localStorage.getItem("tsismis-theme") as Theme | null;
    if (savedTheme) {
      setTheme(savedTheme);
    } else {
      const systemPrefersLight = window.matchMedia("(prefers-color-scheme: light)").matches;
      setTheme(systemPrefersLight ? "light" : "dark");
    }
  }, []);

  // Update document class whenever theme changes (only on client)
  useEffect(() => {
    if (!mounted) return;
    const root = window.document.documentElement;
    if (theme === "light") {
      root.classList.add("light");
    } else {
      root.classList.remove("light");
    }
    localStorage.setItem("tsismis-theme", theme);
  }, [theme, mounted]);

  function toggleTheme() {
    setTheme((prev) => (prev === "dark" ? "light" : "dark"));
  }

  // Prevent flash or hydration mismatch by returning a placeholder or simply mounting
  return (
    <ThemeContext.Provider value={{ theme, toggleTheme }}>
      {children}
    </ThemeContext.Provider>
  );
}

export function useTheme() {
  const context = useContext(ThemeContext);
  if (!context) {
    throw new Error("useTheme must be used within a ThemeProvider");
  }
  return context;
}
