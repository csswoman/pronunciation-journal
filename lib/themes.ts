export type ThemeName =
  | "blue"
  | "pink"
  | "purple"
  | "green"
  | "yellow"
  | "red"
  | "orange"
  | "neutral";

interface ThemeTokens {
  accent: string;
  accentSoft: string;
  accentHover: string;
  textOnAccent: string;
  textPrimary: string;
  textSecondary: string;
}

export interface ThemeDefinition {
  name: ThemeName;
  label: string;
  light: ThemeTokens;
  dark: ThemeTokens;
}

export const themes: Record<ThemeName, ThemeDefinition> = {
  blue: {
    name: "blue",
    label: "Blue",
    light: {
      accent: "#6EA8FE",
      accentSoft: "#E7F0FF",
      accentHover: "#5A95F5",
      textOnAccent: "#FFFFFF",
      textPrimary: "#1F2A44",
      textSecondary: "#6B7A99",
    },
    dark: {
      accent: "#6EA8FE",
      accentSoft: "#1B2A4A",
      accentHover: "#8CB9FF",
      textOnAccent: "#0B1220",
      textPrimary: "#E6ECFF",
      textSecondary: "#A9B4D0",
    },
  },
  pink: {
    name: "pink",
    label: "Pink",
    light: {
      accent: "#F59BB7",
      accentSoft: "#FDE7EF",
      accentHover: "#EC7FA2",
      textOnAccent: "#FFFFFF",
      textPrimary: "#3A1F2B",
      textSecondary: "#8C5A6B",
    },
    dark: {
      accent: "#F59BB7",
      accentSoft: "#3A1F2B",
      accentHover: "#FFB3CC",
      textOnAccent: "#1A0F14",
      textPrimary: "#FFEAF1",
      textSecondary: "#D8A8B8",
    },
  },
  purple: {
    name: "purple",
    label: "Purple",
    light: {
      accent: "#B69DF8",
      accentSoft: "#F1ECFF",
      accentHover: "#9F84F2",
      textOnAccent: "#FFFFFF",
      textPrimary: "#2A1F3D",
      textSecondary: "#7B6F99",
    },
    dark: {
      accent: "#B69DF8",
      accentSoft: "#2A1F3D",
      accentHover: "#C7B3FF",
      textOnAccent: "#140F1F",
      textPrimary: "#F1ECFF",
      textSecondary: "#B8A9D6",
    },
  },
  green: {
    name: "green",
    label: "Green",
    light: {
      accent: "#6ED3A3",
      accentSoft: "#E8FBF2",
      accentHover: "#57C492",
      textOnAccent: "#FFFFFF",
      textPrimary: "#1F3A2E",
      textSecondary: "#5F8C78",
    },
    dark: {
      accent: "#6ED3A3",
      accentSoft: "#1C3328",
      accentHover: "#8BE0B7",
      textOnAccent: "#0E1F18",
      textPrimary: "#E8FBF2",
      textSecondary: "#A7D6C2",
    },
  },
  yellow: {
    name: "yellow",
    label: "Yellow",
    light: {
      accent: "#F6D860",
      accentSoft: "#FFF7D6",
      accentHover: "#EBC94C",
      textOnAccent: "#3A2E00",
      textPrimary: "#3A2E00",
      textSecondary: "#8C7A2F",
    },
    dark: {
      accent: "#F6D860",
      accentSoft: "#3A2E00",
      accentHover: "#FFE27A",
      textOnAccent: "#1F1800",
      textPrimary: "#FFF7D6",
      textSecondary: "#D6C26A",
    },
  },
  red: {
    name: "red",
    label: "Red",
    light: {
      accent: "#F28B82",
      accentSoft: "#FDECEA",
      accentHover: "#E57373",
      textOnAccent: "#FFFFFF",
      textPrimary: "#3A1F1F",
      textSecondary: "#8C5A5A",
    },
    dark: {
      accent: "#F28B82",
      accentSoft: "#3A1F1F",
      accentHover: "#FFAAA3",
      textOnAccent: "#1A0F0F",
      textPrimary: "#FDECEA",
      textSecondary: "#D8A8A8",
    },
  },
  orange: {
    name: "orange",
    label: "Orange",
    light: {
      accent: "#F4A261",
      accentSoft: "#FFF1E6",
      accentHover: "#E8904E",
      textOnAccent: "#FFFFFF",
      textPrimary: "#3A2A1F",
      textSecondary: "#8C6A4F",
    },
    dark: {
      accent: "#F4A261",
      accentSoft: "#3A2A1F",
      accentHover: "#FFB97D",
      textOnAccent: "#1F140C",
      textPrimary: "#FFF1E6",
      textSecondary: "#D6A98C",
    },
  },
  neutral: {
    name: "neutral",
    label: "Neutral",
    light: {
      accent: "#7B8FA1",
      accentSoft: "#EEF3F7",
      accentHover: "#6A7F91",
      textOnAccent: "#FFFFFF",
      textPrimary: "#1E293B",
      textSecondary: "#6B7280",
    },
    dark: {
      accent: "#7B8FA1",
      accentSoft: "#1E293B",
      accentHover: "#9FB3C8",
      textOnAccent: "#0B1220",
      textPrimary: "#EEF3F7",
      textSecondary: "#AAB4C2",
    },
  },
};

export const THEME_NAMES = Object.keys(themes) as ThemeName[];
export const DEFAULT_THEME: ThemeName = "blue";

export function resolveThemeName(value: string): ThemeName {
  return value in themes ? (value as ThemeName) : DEFAULT_THEME;
}

function hexToRgb(hex: string): string {
  const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
  return result
    ? `${parseInt(result[1], 16)}, ${parseInt(result[2], 16)}, ${parseInt(result[3], 16)}`
    : "110, 168, 254";
}

/**
 * Apply theme tokens directly to the documentElement for the given theme and mode.
 * Uses `document.documentElement.style.setProperty(...)` as required.
 */
export function applyTheme(themeName: ThemeName, mode: "light" | "dark" | "auto" = "light") {
  if (typeof document === "undefined") return;
  const theme = themes[themeName] ?? themes[DEFAULT_THEME];

  const prefersDark = typeof window !== "undefined" && window.matchMedia && window.matchMedia("(prefers-color-scheme: dark)").matches;
  const useDark = mode === "auto" ? prefersDark : mode === "dark";

  const tokens = useDark ? theme.dark : theme.light;

  const set = (name: string, value: string) =>
    document.documentElement.style.setProperty(name, value);

  set("--color-accent", tokens.accent);
  set("--color-accent-soft", tokens.accentSoft);
  set("--color-accent-hover", tokens.accentHover);
  set("--color-text-on-accent", tokens.textOnAccent);
  set("--color-text-primary", tokens.textPrimary);
  set("--color-text-secondary", tokens.textSecondary);
  set("--accent-rgb", hexToRgb(tokens.accent));

  // Ensure Tailwind's dark class is kept in sync
  if (useDark) document.documentElement.classList.add("dark");
  else document.documentElement.classList.remove("dark");
}

// Backwards-compatible alias used in some places
export const injectTheme = (themeName: ThemeName) => applyTheme(themeName, "light");
