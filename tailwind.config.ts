import type { Config } from "tailwindcss";

const config: Config = {
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
        accent: {
          DEFAULT: "#f43f5e", // rose-500
          light: "#fff1f2",   // rose-50
          dark: "#e11d48",    // rose-600
        },
        surface: {
          DEFAULT: "#ffffff",
          warm: "#fafaf9",    // stone-50
        },
        muted: "#78716c",     // stone-500
      },
      borderRadius: {
        card: "16px",
      },
      boxShadow: {
        card: "0 1px 3px rgba(0,0,0,0.06), 0 1px 2px rgba(0,0,0,0.04)",
        "card-hover": "0 8px 25px rgba(0,0,0,0.08)",
      },
    },
  },
  plugins: [],
};
export default config;
