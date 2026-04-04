import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  darkMode: "class",
  theme: {
    extend: {
      colors: {
        primary:       "var(--primary)",
        "page-bg":     "var(--page-bg)",
        "card-bg":     "var(--card-bg)",
        "btn-regular": "var(--btn-regular-bg)",
        "btn-hover":   "var(--btn-regular-bg-hover)",
        "btn-content": "var(--btn-content)",
        "deep-text":   "var(--deep-text)",
        "line-div":    "var(--line-divider)",
        "line-color":  "var(--line-color)",
        accent:        "var(--color-accent)",
        "accent-soft": "var(--color-accent-soft)",
      },
      fontFamily: {
        display: ["var(--font-display)", "serif"],
        heading: ["var(--font-heading)", "sans-serif"],
        sans:    ["var(--font-sans)",    "sans-serif"],
      },
    },
  },
  plugins: [],
};
export default config;

