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
import {
  ACCENTS,
  EXTRA_TEXT_SIZES,
  LEGACY_THEME_ALIASES_DARK,
  LEGACY_THEME_ALIASES_LIGHT,
  NEUTRAL_NAMES,
  OKLCH_BY_HEX,
  PASTELS,
  STATIC_LAYOUT_AND_MOTION,
  STATIC_LAYOUT_TOKENS,
  STATIC_TOKENS_FEEDBACK_AND_MOTION,
} from "./build-tokens-data";

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

function oklch(hex: string): string {
  const v = OKLCH_BY_HEX[hex.toLowerCase()];
  if (!v) {
    throw new Error(
      `No hand-tuned OKLCH value for ${hex}. Add it to OKLCH_BY_HEX in scripts/build-tokens-data.ts ` +
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

${LEGACY_THEME_ALIASES_LIGHT}
}

html[data-theme="dark"], .dark {
  color-scheme: dark;

  /* ── 1. Neutros (Dark) ─────────────────────────────────────────────────── */
${darkNeutrals}

${LEGACY_THEME_ALIASES_DARK}
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

${STATIC_TOKENS_FEEDBACK_AND_MOTION}

  /* ── 5. Acentos (9 tonos 600) ─────────────────────────────────────────── */
${accentBlock}

${STATIC_LAYOUT_AND_MOTION}

  /* ── 7. Escala de Espaciado ─────────────────────────────────────────────── */
${spacing}

${STATIC_LAYOUT_TOKENS}

  /* ── 8. Radios de Borde ─────────────────────────────────────────────────── */
${radius}

  /* ── 9. Tipografía ────────────────────────────────────────────────────── */
  --font-display:  var(--font-display, ${tokens.type.families.display});
  --font-sans:     var(--font-body, ${tokens.type.families.body});
  --font-ipa:      var(--font-phonetic, ${tokens.type.families.phonetic});

${typeGroups}
${EXTRA_TEXT_SIZES}
}

/* Accent attributes */
${accentAttrBlock}
`;

  fs.writeFileSync(OUTPUT_PATH, output, "utf8");
  console.log(`✓ Generated ${path.relative(ROOT, OUTPUT_PATH)} from tokens.json`);
}

main();
