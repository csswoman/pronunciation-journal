/**
 * Generates app/styles/tokens.css from docs/design-system/tokens.json.
 *
 * Do NOT edit app/styles/tokens.css by hand for values that exist in tokens.json
 * (colors, type scale, spacing, radii, shadow). Edit tokens.json and run:
 *
 *   npm run tokens
 *
 * Sections not covered by tokens.json (legacy compatibility aliases, --ej-*
 * aliases, motion, --layout-* semantic spacing, and extra --text-size-* tokens
 * used by existing components but not part of the design system spec) are
 * hand-maintained here, in EXTRA_* constants, so they survive regeneration.
 * See docs/design-system/MIGRATION.md for why each extra exists.
 */
import fs from "node:fs";
import path from "node:path";

const ROOT = process.cwd();
const TOKENS_JSON_PATH = path.join(ROOT, "docs/design-system/tokens.json");
const OUTPUT_PATH = path.join(ROOT, "app/styles/tokens.css");

type ThemeValue<T> = T | { dark: T; light: T };

interface ColorToken {
  name: string;
  value: ThemeValue<string>;
  usage: string;
}

interface TypeStyle {
  name: string;
  fontSize: string;
  lineHeight: string;
  fontWeight: number;
  letterSpacing?: string;
  sample: string;
  usage: string;
}

interface TokensJson {
  color: { tokens: ColorToken[] };
  type: {
    families: { display: string; body: string; phonetic: string };
    groups: { name: string; family: string; styles: TypeStyle[] }[];
  };
  spacing: { tokens: { name: string; value: string; usage: string }[] };
  radius: { tokens: { name: string; value: string; usage: string }[] };
  size: { tokens: { name: string; value: string; usage: string }[] };
  shadow: { tokens: { name: string; value: ThemeValue<string>; usage: string }[] };
}

function isThemed<T>(v: ThemeValue<T>): v is { dark: T; light: T } {
  return typeof v === "object" && v !== null && "dark" in v && "light" in v;
}

function px(remOrPx: string): string {
  return remOrPx;
}

/**
 * OKLCH equivalents of every hex value in tokens.json, computed once
 * (sRGB → linear → OKLab → OKLCH, D65) and checked in here rather than
 * recomputed on every run. tokens.json ships hex; this project's color
 * system is OKLCH end to end (see docs/design-system/MIGRATION.md).
 * If tokens.json gains a new hex not listed here, this script throws
 * with the missing key — add its OKLCH conversion and re-run.
 */
const OKLCH_BY_HEX: Record<string, string> = {
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

function oklch(hex: string): string {
  const v = OKLCH_BY_HEX[hex.toLowerCase()];
  if (!v) {
    throw new Error(
      `No hand-tuned OKLCH value for ${hex}. Add it to OKLCH_BY_HEX in scripts/build-tokens.ts ` +
        `(convert once, keep it stable — do not auto-convert on every run).`
    );
  }
  return `${v}; /* ${hex} */`;
}

function main() {
  const raw = fs.readFileSync(TOKENS_JSON_PATH, "utf8");
  const tokens: TokensJson = JSON.parse(raw);

  const byName = new Map(tokens.color.tokens.map((t) => [t.name, t]));
  const get = (name: string) => {
    const t = byName.get(name);
    if (!t) throw new Error(`Missing color token in tokens.json: ${name}`);
    return t;
  };
  const themedVal = (name: string, theme: "dark" | "light") => {
    const v = get(name).value;
    return isThemed(v) ? v[theme] : v;
  };
  const fixedVal = (name: string) => {
    const v = get(name).value;
    if (isThemed(v)) throw new Error(`Expected fixed value for ${name}`);
    return v;
  };

  const NEUTRAL_NAMES = [
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
  ];

  const PASTELS = ["sky", "butter", "coral", "lilac", "mint"] as const;
  const ACCENTS = [
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

  const lightNeutrals = NEUTRAL_NAMES.map(
    (n) => `  --${n}:${" ".repeat(Math.max(1, 18 - n.length))}${oklch(themedVal(n, "light"))}`
  ).join("\n");
  const darkNeutrals = NEUTRAL_NAMES.map(
    (n) => `  --${n}:${" ".repeat(Math.max(1, 18 - n.length))}${oklch(themedVal(n, "dark"))}`
  ).join("\n");

  const pastelBlocks = PASTELS.map((p) => {
    const base = oklch(fixedVal(p));
    const deep = oklch(fixedVal(`${p}-deep`));
    const soft = oklch(fixedVal(`${p}-soft`));
    return `  --${p}:      ${base}\n  --${p}-deep: ${deep}\n  --${p}-soft: ${soft}`;
  }).join("\n\n");

  const ejAliasBlocks = PASTELS.map(
    (p) =>
      `  --ej-${p}:      var(--${p});\n  --ej-${p}-deep: var(--${p}-deep);\n  --ej-${p}-soft: var(--${p}-soft);`
  ).join("\n");

  const accentBlock = ACCENTS.map(
    (a) => `  --accent-${a}: ${oklch(fixedVal(`accent-${a}`))}`
  ).join("\n");
  const accentAttrBlock = ACCENTS.map(
    (a) => `html[data-accent="${a}"] { --accent: var(--accent-${a}); }`
  ).join("\n");

  const spacing = tokens.spacing.tokens
    .map((t) => `  --${t.name}: ${px(t.value)}; /* ${t.usage} */`)
    .join("\n");

  // tokens.json names the pill radius "radius-pill"; the codebase's existing
  // name is "--radius-full" (used across theme.css and ~80 components).
  // Emit under the established name and keep --radius-pill as an alias.
  const radius = tokens.radius.tokens
    .map((t) => {
      const name = t.name === "radius-pill" ? "radius-full" : t.name;
      return `  --${name}: ${t.value}; /* ${t.usage} */`;
    })
    .join("\n") + "\n  --radius-pill: var(--radius-full); /* alias del nombre en tokens.json */";

  const typeGroups = tokens.type.groups
    .map((g) =>
      g.styles
        .map((s) => {
          const parts = [`  --text-size-${s.name}: ${s.fontSize};`];
          return parts.join(" ");
        })
        .join("\n")
    )
    .join("\n");

  const output = `/* Design Tokens — English Journal
   AUTO-GENERATED from docs/design-system/tokens.json by scripts/build-tokens.ts.
   Run \`npm run tokens\` to regenerate. Do not hand-edit values that exist in
   tokens.json — edit tokens.json instead. Hand-maintained sections (legacy
   aliases, --ej-* aliases, motion, --layout-*, extra text sizes) are appended
   below and preserved across regeneration; see docs/design-system/MIGRATION.md.

   3-layer architecture:
   1. Neutrals (responsive to data-theme="light|dark")
   2. Fijos + Pastel de contenido (fixed hues across themes)
   3. Acentos (dynamic data-accent="blue|teal|emerald...")
*/

:root, html[data-theme="light"] {
  color-scheme: light;
  --sidebar-width: 256px;

  /* ── 1. Neutros (Light) ────────────────────────────────────────────────── */
${lightNeutrals}

  /* Legacy aliases for compatibility */
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
  --cta-bg-hover:     var(--ink-secondary);
}

html[data-theme="dark"], .dark {
  color-scheme: dark;

  /* ── 1. Neutros (Dark) ─────────────────────────────────────────────────── */
${darkNeutrals}

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
  --primary-soft:  var(--accent-soft);
}

:root {
  /* ── 2. Fijos (Iguales en ambos temas) ────────────────────────────────── */
  --ink:           ${oklch(fixedVal("ink"))}
  --ink-secondary: ${oklch(fixedVal("ink-secondary"))}
  --ink-muted:     ${oklch(fixedVal("ink-muted"))}
  --paper:         ${oklch(fixedVal("paper"))}
  --on-accent:     ${oklch(fixedVal("on-accent"))}

  /* ── 3. Pastel de contenido (base / deep / soft) ───────────────────────── */
${pastelBlocks}

  /* ── English Journal ej-* aliases (legacy — ver MIGRATION.md) ──────────── */
${ejAliasBlocks}

  /* ── 4. Feedback (alias de pasteles, NO verde/rojo oscuros) ───────────── */
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
  --info-soft:       var(--sky-soft);

  /* ── 5. Acentos (9 tonos 600) ─────────────────────────────────────────── */
${accentBlock}

  /* Default accent = blue */
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
  --ease-spring: cubic-bezier(0.34, 1.56, 0.64, 1);

  /* ── 7. Escala de Espaciado ─────────────────────────────────────────────── */
${spacing}

  /* --layout-* (sin equivalente en tokens.json — hand-maintained, ver MIGRATION.md) */
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
  --layout-session-max: 45rem;

  /* ── 8. Radios de Borde ─────────────────────────────────────────────────── */
${radius}

  /* ── 9. Tipografía ────────────────────────────────────────────────────── */
  --font-display:  var(--font-display, ${tokens.type.families.display});
  --font-sans:     var(--font-body, ${tokens.type.families.body});
  --font-ipa:      var(--font-phonetic, ${tokens.type.families.phonetic});

${typeGroups}
  /* Extra text sizes used by existing components, not in tokens.json spec */
  --text-size-h1: 2.25rem;
  --text-size-h2: 1.625rem;
  --text-size-h3: 1.375rem;
  --text-size-h4: 1.25rem;
  --text-size-label: 0.875rem;
  --text-size-kicker: 0.75rem;
  --text-size-tiny: 0.75rem;
  --text-size-display-word: 2.25rem;
  --text-size-display-ipa: 2.25rem;
}

/* Accent attributes */
${accentAttrBlock}
`;

  fs.writeFileSync(OUTPUT_PATH, output, "utf8");
  console.log(`✓ Generated ${path.relative(ROOT, OUTPUT_PATH)} from tokens.json`);
}

main();
