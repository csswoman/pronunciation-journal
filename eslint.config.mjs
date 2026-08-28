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
//   • The entries below are cohesive legacy modules pending dedicated extraction.
//
// lib/** query-layer allowlist (rule D below):
//   • lib/db/lessons.ts                          — TODO: move to a queries.ts module
//   • lib/exercises/generators/reorder-from-fragments.ts — TODO: move to a queries.ts module
//   • lib/ai-practice/load-state.ts              — TODO: move to a queries.ts module
//   • lib/api/guards.ts                          — server-side request auth infra (constructs
//                                                   its own admin/token client, not the browser client)
// Note: rule D's @supabase/* pattern allows type-only imports (SupabaseClient,
// Database types) everywhere — passing a client in as a parameter is fine;
// constructing/importing the browser client outside the query layer is not.

/** Static data / generated files exempt from max-lines (see above). */
const MAX_LINES_ALLOWLIST = [
  "lib/ai-prompts.ts",
  "lib/supabase/types.ts",
  "lib/pronunciation/ipa-data.ts",
  "lib/courses/curriculum.ts",
  "components/exercises/SentenceDictationExercise.tsx",
  "components/words/WordsClient.tsx",
  "lib/db/index.ts",
  "lib/phoneme-practice/exercises.ts",
  "lib/progress/queries.ts",
  "scripts/core-1000/generate-chunks.mjs",
  "hooks/useEssentialWordsSession.ts",
  "scripts/generate-missing-curriculum-decks.mjs",
  "components/practice/word-search/WordSearchSetup.tsx",
  "lib/ai-practice/missions/registry.ts",
  "lib/ai-practice/tools/registry.ts",
  "lib/chunk-of-day/data.ts",
  "lib/courses/level-curriculum-order.ts",
  "lib/essential-words/__tests__/queue.test.ts",
  "lib/essential-words/__tests__/runtime-engine.integration.test.ts",
  "lib/essential-words/dictation-feedback.ts",
  "lib/essential-words/runtime-engine.ts",
  "lib/immersion/engvid-catalog.ts",
  "lib/practice/__tests__/queries.test.ts",
  "lib/practice/daily-plan/composer.ts",
  "lib/pronunciation/articulation-guide-data.ts",
  "lib/pronunciation/targets/registry.ts",
  "lib/sounds/minimal-pairs.ts",
  "lib/sync/sync-manager.ts",
  "components/home/__tests__/HomeCommandGrid.test.tsx",
  "components/mini-lessons/ExerciseBlock.tsx",
  "components/practice/hub/PracticeOptionsGrid.tsx",
  "components/practice/word-search/WordSearchGrid.tsx",
  "scripts/essential-words/generate-chunks.mjs",
  "scripts/generate-grammar-pattern-decks.ts",
  "scripts/grammar-pattern-deck-specs-b1-b2.ts",
  "scripts/grammar-pattern-deck-specs-c1-c2.ts",
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

const SUPABASE_PACKAGES_PATTERN_ALLOW_TYPES = {
  ...SUPABASE_PACKAGES_PATTERN,
  allowTypeImports: true,
};

const eslintConfig = [
  {
    ignores: [
      ".agents/**",
      ".claude/**",
      ".next/**",
      "coverage/**",
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
  // D — lib/**: Supabase browser client only allowed in the query layer
  // (files named *queries*.ts, realtime.ts) or infra modules that own their
  // own client lifecycle (auth, sync, supabase/*). Two legacy deviations are
  // allowlisted with a TODO — see header comment.
  {
    files: ["lib/**/*.{ts,tsx}"],
    ignores: [
      "lib/**/*queries*.ts",
      "lib/**/realtime.ts",
      "lib/auth/**",
      "lib/sync/**",
      "lib/supabase/**",
      "lib/decks/study-source.ts",
      "lib/review/build-failed-exercises.ts",
      "lib/db/lessons.ts",
      "lib/exercises/generators/reorder-from-fragments.ts",
      "lib/ai-practice/load-state.ts",
      "lib/api/guards.ts",
    ],
    rules: {
      "no-restricted-imports": [
        "error",
        {
          paths: [SUPABASE_CLIENT_IMPORT],
          patterns: [SUPABASE_PACKAGES_PATTERN_ALLOW_TYPES],
        },
      ],
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
