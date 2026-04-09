/**
 * Design System Tokens
 * Centralized spacing, typography, and layout values
 * No hardcoded values—everything comes from here
 */

// Spacing Scale (8pt system)
export const SPACING = {
  xs: "4px",    // 0.25rem
  sm: "8px",    // 0.5rem
  md: "16px",   // 1rem
  lg: "24px",   // 1.5rem
  xl: "32px",   // 2rem
  "2xl": "48px", // 3rem
  "3xl": "64px", // 4rem
} as const;

// Tailwind-compatible spacing (for className use)
export const SPACING_MAP = {
  xs: "1",      // 4px
  sm: "2",      // 8px
  md: "4",      // 16px
  lg: "6",      // 24px
  xl: "8",      // 32px
  "2xl": "12",  // 48px
  "3xl": "16",  // 64px
} as const;

// Container widths
export const CONTAINER = {
  sm: "640px",   // max-w-sm
  md: "768px",   // max-w-md
  lg: "1024px",  // max-w-lg
  xl: "1280px",  // max-w-xl
  full: "1200px", // content max-width (responsive)
} as const;

// Typography Scale
export const TYPOGRAPHY = {
  heading: {
    h1: {
      size: "2.625rem",    // 42px
      lineHeight: "1.2",
      fontWeight: "700",
      letterSpacing: "-0.02em",
    },
    h2: {
      size: "2rem",        // 32px
      lineHeight: "1.3",
      fontWeight: "700",
      letterSpacing: "-0.01em",
    },
    h3: {
      size: "1.5rem",      // 24px
      lineHeight: "1.4",
      fontWeight: "600",
      letterSpacing: "-0.005em",
    },
    h4: {
      size: "1.25rem",     // 20px
      lineHeight: "1.4",
      fontWeight: "600",
    },
  },
  body: {
    lg: {
      size: "1.125rem",    // 18px
      lineHeight: "1.6",
      fontWeight: "400",
    },
    base: {
      size: "1rem",        // 16px
      lineHeight: "1.6",
      fontWeight: "400",
    },
    sm: {
      size: "0.875rem",    // 14px
      lineHeight: "1.5",
      fontWeight: "400",
    },
    xs: {
      size: "0.75rem",     // 12px
      lineHeight: "1.5",
      fontWeight: "400",
    },
  },
} as const;

// Border Radius
export const BORDER_RADIUS = {
  sm: "8px",
  md: "12px",
  lg: "16px",
  xl: "20px",
  "2xl": "24px",
  "3xl": "32px",
} as const;

// Shadows
export const SHADOWS = {
  sm: "0 1px 2px rgba(0, 0, 0, 0.05)",
  md: "0 4px 6px rgba(0, 0, 0, 0.07)",
  lg: "0 10px 15px rgba(0, 0, 0, 0.1)",
  xl: "0 20px 25px rgba(0, 0, 0, 0.1)",
} as const;

// Transitions
export const TRANSITIONS = {
  fast: "150ms",
  base: "200ms",
  slow: "300ms",
} as const;
