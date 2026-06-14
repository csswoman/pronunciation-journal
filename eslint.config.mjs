import nextPlugin from "@next/eslint-plugin-next";
import reactHooks from "eslint-plugin-react-hooks";
import tseslint from "typescript-eslint";

// ── Architectural guardrails ───────────────────────────────────────────────
//
// Query layer: Supabase browser client lives in lib/*/queries.ts only.
// Hooks orchestrate; components render. Auth is the sole UI exception.
//
// Documented exceptions (do not remove without updating this block):
//   • components/auth/AuthProvider.tsx — auth session infra (Supabase client)
//   • lib/supabase/types.ts            — generated DB types (max-lines)
//   • lib/pronunciation/ipa-data.ts    — static IPA reference data (max-lines)
//   • lib/courses/curriculum.ts        — static curriculum data (max-lines)

/** Static data / generated files exempt from max-lines (see above). */
const MAX_LINES_ALLOWLIST = [
  "lib/supabase/types.ts",
  "lib/pronunciation/ipa-data.ts",
  "lib/courses/curriculum.ts",
];

const SUPABASE_CLIENT_IMPORT = {
  name: "@/lib/supabase/client",
  message:
    "Import Supabase via lib/*/queries.ts. Direct client access belongs in the query layer, not hooks or UI.",
};

const SUPABASE_PACKAGES_PATTERN = {
  group: ["@supabase/*"],
  message:
    "Do not import @supabase packages in hooks. Use lib/*/queries.ts instead.",
};

const eslintConfig = [
  {
    ignores: [
      ".agents/**",
      ".claude/**",
      ".next/**",
      "out/**",
      "build/**",
      "test-results/**",
      "next-env.d.ts",
    ],
  },
  ...tseslint.configs.recommended,
  {
    files: ["**/*.{js,jsx,mjs,ts,tsx,mts,cts}"],
    plugins: {
      "@next/next": nextPlugin,
      "react-hooks": reactHooks,
    },
    rules: {
      ...nextPlugin.configs["core-web-vitals"].rules,
      "@typescript-eslint/no-explicit-any": "warn",
      "@typescript-eslint/no-unused-expressions": "warn",
      "@typescript-eslint/no-unused-vars": "warn",
    },
  },
  // A — Hooks: no Supabase client or @supabase/* packages
  {
    files: ["hooks/**/*.{ts,tsx}"],
    rules: {
      "no-restricted-imports": [
        "error",
        {
          paths: [SUPABASE_CLIENT_IMPORT],
          patterns: [SUPABASE_PACKAGES_PATTERN],
        },
      ],
    },
  },
  // B — Components: no Supabase client (AuthProvider exempt — see header)
  {
    files: ["components/**/*.{ts,tsx}"],
    ignores: ["components/auth/AuthProvider.tsx"],
    rules: {
      "no-restricted-imports": ["error", { paths: [SUPABASE_CLIENT_IMPORT] }],
    },
  },
  // C — File size: warn above 300 lines (allowlisted static/generated files exempt)
  {
    files: ["**/*.{js,jsx,mjs,ts,tsx,mts,cts}"],
    ignores: MAX_LINES_ALLOWLIST,
    rules: {
      "max-lines": [
        "warn",
        { max: 300, skipBlankLines: true, skipComments: true },
      ],
    },
  },
];

export default eslintConfig;
