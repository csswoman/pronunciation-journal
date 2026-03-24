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
        accent: "var(--color-accent)",
        "accent-soft": "var(--color-accent-soft)",
        "accent-hover": "var(--color-accent-hover)",
        "on-accent": "var(--color-text-on-accent)",
        "text-primary": "var(--color-text-primary)",
        "text-secondary": "var(--color-text-secondary)",
      },
    },
  },
  plugins: [],
};
export default config;

