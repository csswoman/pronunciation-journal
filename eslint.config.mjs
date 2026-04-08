import { createRequire } from "node:module";
import nextPlugin from "@next/eslint-plugin-next";
import tseslint from "typescript-eslint";

const require = createRequire(import.meta.url);
const reactHooks = require("./node_modules/eslint-config-next/node_modules/eslint-plugin-react-hooks");

const eslintConfig = [
  {
    ignores: [
      ".next/**",
      "out/**",
      "build/**",
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
];

export default eslintConfig;
