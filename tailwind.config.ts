import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        tsismis: {
          bg: "var(--tsismis-bg)",
          sidebar: "var(--tsismis-sidebar)",
          surface: "var(--tsismis-surface)",
          border: "var(--tsismis-border)",
          pink: "var(--tsismis-pink)",
          purple: "var(--tsismis-purple)",
          cyan: "var(--tsismis-cyan)",
          mango: "var(--tsismis-mango)",
          text: "var(--tsismis-text)",
          muted: "var(--tsismis-muted)",
          hint: "var(--tsismis-hint)",
        },
      },
      backgroundImage: {
        "tsismis-gradient": "var(--tsismis-gradient)",
        "bubble-gradient": "var(--tsismis-bubble-gradient)",
        "active-item": "var(--tsismis-active-item)",
      },
    },
  },
  plugins: [],
};

export default config;
