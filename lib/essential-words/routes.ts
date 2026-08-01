// Declarative registry of themed vocabulary "routes" over the Core 1000 dataset.
// A route is just a curated CEFR-level + part-of-speech slice (e.g. "B1 verbs"),
// which the Essential Words session can focus on. Pure data + selectors: no I/O.

import { matchesFilter } from "./queue";
import type { CefrLevel, EssentialWordPos, EssentialWord } from "./types";

export interface VocabularyRoute {
  id: string;
  label: string;
  description: string;
  levels: CefrLevel[];
  pos: EssentialWordPos[];
}

export const VOCAB_ROUTES: readonly VocabularyRoute[] = [
  {
    id: "verbs-a2",
    label: "Verbos A2",
    description: "Acciones cotidianas para empezar a construir frases.",
    levels: ["A2"],
    pos: ["verb"],
  },
  {
    id: "verbs-b1",
    label: "Verbos B1",
    description: "Verbos útiles para conversaciones del día a día.",
    levels: ["B1"],
    pos: ["verb"],
  },
  {
    id: "adjectives-b1",
    label: "Adjetivos B1",
    description: "Describe personas, lugares y cosas con más matiz.",
    levels: ["B1"],
    pos: ["adjective"],
  },
  {
    id: "adverbs-b1",
    label: "Adverbios B1",
    description: "Precisa cómo, cuándo y cuánto ocurren las cosas.",
    levels: ["B1"],
    pos: ["adverb"],
  },
  {
    id: "nouns-b2",
    label: "Sustantivos B2",
    description: "Amplía tu vocabulario temático de nivel intermedio-alto.",
    levels: ["B2"],
    pos: ["noun"],
  },
  {
    id: "verbs-b2",
    label: "Verbos B2",
    description: "Verbos más ricos para expresar ideas complejas.",
    levels: ["B2"],
    pos: ["verb"],
  },
  {
    id: "adjectives-b2",
    label: "Adjetivos B2",
    description: "Matices y precisión al describir.",
    levels: ["B2"],
    pos: ["adjective"],
  },
  {
    id: "advanced-c1",
    label: "Avanzado C1",
    description: "Vocabulario de alto nivel para pulir tu fluidez.",
    levels: ["C1"],
    pos: [],
  },
] as const;

export function getRoute(id: string | null | undefined): VocabularyRoute | undefined {
  if (!id) return undefined;
  return VOCAB_ROUTES.find((r) => r.id === id);
}

/** Words belonging to a route (level + pos slice), preserving rank order. */
export function wordsInRoute(words: EssentialWord[], route: VocabularyRoute): EssentialWord[] {
  return words.filter((w) => matchesFilter(w, route.levels, route.pos));
}
