import type { Config } from "tailwindcss";

const config: Config = {
  darkMode: "class",
  content: [
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
    "./lib/**/*.{js,ts,jsx,tsx,mdx}",
    "./styles/**/*.css",
  ],
  theme: {
    extend: {
      fontFamily: {
        sans: ["var(--font-inter)", "system-ui", "sans-serif"],
      },
      colors: {
        bg: {
          base: "var(--bg-base)",
          surface: "var(--bg-surface)",
          elevated: "var(--bg-elevated)",
          border: "var(--bg-border)",
        },
        "t-primary": "var(--text-primary)",
        "t-secondary": "var(--text-secondary)",
        "t-muted": "var(--text-muted)",
        accent: {
          DEFAULT: "var(--accent-500)",
          hover: "var(--accent-400)",
          dark: "var(--accent-900)",
          light: "var(--accent-100)",
        },
        indigo: {
          DEFAULT: "var(--indigo-500)",
          hover: "var(--indigo-400)",
          dark: "var(--indigo-900)",
        },
        success: "var(--success)",
        warning: "var(--warning)",
        danger: "var(--danger)",
        info: "var(--info)",
      },
      borderRadius: {
        card: "16px",
      },
      boxShadow: {
        card: "var(--shadow-sm)",
        "card-hover": "var(--shadow-md)",
        md: "var(--shadow-md)",
        lg: "var(--shadow-lg)",
        glow: "var(--shadow-glow)",
      },
    },
  },
  plugins: [],
};
export default config;
