/**
 * OKLCH equivalents of every hex value in tokens.json, computed once
 * (sRGB → linear → OKLab → OKLCH, D65) and checked in here rather than
 * recomputed on every run. tokens.json ships hex; this project's color
 * system is OKLCH end to end (see docs/design-system/MIGRATION.md).
 * If tokens.json gains a new hex not listed here, add its OKLCH conversion.
 */
export const OKLCH_BY_HEX: Record<string, string> = {
  "#047857": "oklch(0.51 0.105 166)",
  "#0a0c11": "oklch(0.15 0.011 268)",
  "#0d1018": "oklch(0.17 0.017 269)",
  "#0e7490": "oklch(0.52 0.094 223)",
  "#11151f": "oklch(0.20 0.021 268)",
  "#12151c": "oklch(0.20 0.015 267)",
  "#141925": "oklch(0.21 0.025 267)",
  "#15803d": "oklch(0.53 0.137 150)",
  "#1a1f2c": "oklch(0.24 0.026 268)",
  "#1b2130": "oklch(0.25 0.030 267)",
  "#2563eb": "oklch(0.55 0.215 263)",
  "#262d3d": "oklch(0.30 0.031 266)",
  "#2c3445": "oklch(0.33 0.032 265)",
  "#2f3749": "oklch(0.34 0.034 266)",
  "#4a5263": "oklch(0.44 0.030 265)",
  "#636a78": "oklch(0.52 0.024 264)",
  "#7c3aed": "oklch(0.54 0.247 293)",
  "#7c8499": "oklch(0.61 0.033 269)",
  "#86d6b0": "oklch(0.81 0.096 163)",
  "#9ec0f6": "oklch(0.80 0.085 260)",
  "#a8e6c9": "oklch(0.87 0.075 164)",
  "#aab2c4": "oklch(0.76 0.027 267)",
  "#b1a0ea": "oklch(0.75 0.106 294)",
  "#b45309": "oklch(0.56 0.146 49)",
  "#b9d3fb": "oklch(0.86 0.063 259)",
  "#be185d": "oklch(0.52 0.199 4)",
  "#c2410c": "oklch(0.55 0.174 38)",
  "#c9cfdb": "oklch(0.85 0.018 264)",
  "#cbbcf5": "oklch(0.83 0.080 297)",
  "#cfc8b9": "oklch(0.83 0.022 86)",
  "#dc2626": "oklch(0.58 0.215 27)",
  "#e3f6ec": "oklch(0.96 0.024 163)",
  "#eae5db": "oklch(0.92 0.014 85)",
  "#eaf2fe": "oklch(0.96 0.018 258)",
  "#ece6fd": "oklch(0.94 0.031 298)",
  "#ee9f8b": "oklch(0.78 0.099 35)",
  "#eef1f7": "oklch(0.96 0.009 265)",
  "#efd06a": "oklch(0.86 0.126 93)",
  "#efebe3": "oklch(0.94 0.012 85)",
  "#f1eee7": "oklch(0.95 0.010 87)",
  "#f6f4ef": "oklch(0.97 0.007 89)",
  "#f7b7a6": "oklch(0.83 0.079 35)",
  "#f8e08e": "oklch(0.91 0.105 94)",
  "#faf8f4": "oklch(0.98 0.006 85)",
  "#fbf9f5": "oklch(0.98 0.006 85)",
  "#fde4dc": "oklch(0.94 0.030 39)",
  "#fdf3cf": "oklch(0.96 0.048 94)",
  "#ffffff": "oklch(1 0 0)",
};

export const NEUTRAL_NAMES = [
  "bg",
  "bg-sidebar",
  "surface",
  "surface-raised",
  "field",
  "border",
  "border-strong",
  "text-strong",
  "text",
  "text-secondary",
  "text-muted",
  "text-faint",
] as const;

export const PASTELS = ["sky", "butter", "coral", "lilac", "mint"] as const;

export const ACCENTS = [
  "red",
  "orange",
  "amber",
  "green",
  "emerald",
  "teal",
  "blue",
  "purple",
  "pink",
] as const;

export const LEGACY_THEME_ALIASES_LIGHT = `  /* Legacy aliases for compatibility */
  --text-primary:     var(--text);
  --text-tertiary:    var(--text-muted);
  --text-quaternary:  var(--text-faint);
  --text-disabled:    var(--text-faint);
  --text-placeholder: var(--text-muted);
  --border-subtle:    var(--border);
  --border-default:   var(--border);
  --border-hover:     var(--border-strong);

  --surface-base:     var(--bg);
  --surface-sunken:   var(--field);
  --surface-overlay:  oklch(1 0 0 / 0.96);
  --surface-tooltip:  var(--text-strong);
  --surface-code:     var(--field);
  --card-bg:          var(--surface-raised);
  --page-bg:          var(--bg);

  --cta-bg:           var(--ink);
  --cta-fg:           var(--paper);
  --cta-bg-hover:     var(--ink-secondary);`;

export const LEGACY_THEME_ALIASES_DARK = `  --text-primary:     var(--text);
  --text-tertiary:    var(--text-muted);
  --text-quaternary:  var(--text-faint);
  --text-disabled:    var(--text-faint);
  --text-placeholder: var(--text-muted);
  --border-subtle:    var(--border);
  --border-default:   var(--border);
  --border-hover:     var(--border-strong);

  --surface-base:     var(--bg);
  --surface-sunken:   var(--field);
  --surface-overlay:  oklch(0.18 0.018 260 / 0.96);
  --surface-tooltip:  var(--surface-raised);
  --surface-code:     var(--field);
  --card-bg:          var(--surface-raised);
  --page-bg:          var(--bg);

  --cta-bg:           var(--paper);
  --cta-fg:           var(--ink);
  --cta-bg-hover:     oklch(0.92 0.005 85);

  /* Derivados del acento (Dark theme) */
  --accent-text:   color-mix(in oklch, var(--accent) 45%, white);
  --accent-soft:   color-mix(in oklch, var(--accent) 26%, #0d1018);
  --accent-border: color-mix(in oklch, var(--accent) 55%, #0d1018);

  --primary-text:  var(--accent-text);
  --primary-soft:  var(--accent-soft);`;

export const STATIC_TOKENS_FEEDBACK_AND_MOTION = `  /* ── 4. Feedback (alias de pasteles, NO verde/rojo oscuros) ───────────── */
  --feedback-correct:      var(--mint);
  --feedback-correct-soft: var(--mint-soft);
  --feedback-wrong:        var(--coral);
  --feedback-wrong-soft:   var(--coral-soft);
  --feedback-hint:         var(--butter);
  --feedback-hint-soft:    var(--butter-soft);

  --success:         var(--feedback-correct);
  --success-soft:    var(--feedback-correct-soft);
  --error:           var(--feedback-wrong);
  --error-soft:      var(--feedback-wrong-soft);
  --warning:         var(--feedback-hint);
  --warning-soft:    var(--feedback-hint-soft);
  --info:            var(--sky);
  --info-soft:       var(--sky-soft);`;

export const STATIC_LAYOUT_AND_MOTION = `  /* Default accent = blue */
  --accent:         var(--accent-blue);
  --primary:        var(--accent);
  --primary-hover:  color-mix(in oklch, var(--accent) 85%, black);
  --on-primary:     var(--on-accent);
  --focus-ring:     var(--accent);

  /* Derivados del acento (Light theme) */
  --accent-text:   color-mix(in oklch, var(--accent) 88%, black);
  --accent-soft:   color-mix(in oklch, var(--accent) 14%, white);
  --accent-border: color-mix(in oklch, var(--accent) 45%, white);

  --primary-text:  var(--accent-text);
  --primary-soft:  var(--accent-soft);

  /* ── 6. Motion (sin equivalente en tokens.json — hand-maintained) ──────── */
  --dur-fast: 150ms;
  --dur-base: 250ms;
  --dur-celebrate: 420ms;
  --ease-out: cubic-bezier(0.16, 1, 0.3, 1);
  --ease-out-expo: var(--ease-out);
  --ease-out-quart: cubic-bezier(0.25, 1, 0.5, 1);
  --ease-spring: cubic-bezier(0.34, 1.56, 0.64, 1);`;

export const STATIC_LAYOUT_TOKENS = `  /* --layout-* (sin equivalente en tokens.json — hand-maintained, ver MIGRATION.md) */
  --layout-page-inline: var(--space-4);
  --layout-page-block: var(--space-4);
  --layout-page-block-end: var(--space-8);
  --layout-header-gap: var(--space-2);
  --layout-header-pb: var(--space-4);
  --layout-section-gap: var(--space-5);
  --layout-stack-tight: var(--space-2);
  --layout-stack: var(--space-3);
  --layout-stack-loose: var(--space-4);
  --layout-card-pad: var(--space-6);
  --layout-card-pad-compact: var(--space-5);
  --layout-canvas-max: 80rem;
  --layout-session-max: 45rem;`;

export const EXTRA_TEXT_SIZES = `  /* Extra text sizes used by existing components, not in tokens.json spec */
  --text-size-h1: 2.25rem;
  --text-size-h2: 1.625rem;
  --text-size-h3: 1.375rem;
  --text-size-h4: 1.25rem;
  --text-size-label: 0.875rem;
  --text-size-kicker: 0.75rem;
  --text-size-tiny: 0.75rem;
  --text-size-display-word: 2.25rem;
  --text-size-display-ipa: 2.25rem;`;
