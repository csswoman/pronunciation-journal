import type { IllustrationKey } from "@/lib/illustrations/registry";

/**
 * Maps a lexicon category id to its bespoke `/words` card illustration.
 * Categories without art fall through to `null` — consumers render the
 * title-initial block instead.
 */
const CATEGORY_ILLUSTRATION: Record<string, IllustrationKey> = {
  "artificial-intelligence": "categoryAi",
  "backend-infra": "categoryBackend",
  "data-science": "categoryDataScience",
  "frontend-dev": "categoryFrontend",
  "ux-design": "categoryUxDesign",
  "design-systems": "categoryDesignSystems",
  professional: "categoryProfessional",
  "technical-writing": "categoryTechnicalWriting",
  "personal-interview": "categoryPersonalInterview",
};

export function illustrationForCategory(categoryId: string): IllustrationKey | null {
  return CATEGORY_ILLUSTRATION[categoryId] ?? null;
}
