// Server-side loader for authored grammar study decks.
//
// Each lesson's deck lives as one JSON file per slug under public/grammar-decks/
// — outside the JS module graph — read from disk and validated with Zod.
// Mirrors lib/content/lessons.ts: throws loudly in dev, logs + falls back in prod.
//
// The `fs` import makes this module server-only by construction.

import fs from "fs";
import path from "path";
import { z } from "zod";
import { GrammarStudyDeckSchema } from "./schema";
import type { GrammarStudyDeckData } from "./types";
import { MOCK_GRAMMAR_DECK } from "./mockGrammarDeck";

const DECKS_DIR = path.join(process.cwd(), "public", "grammar-decks");

const DEFAULT_META = {
  eyebrow: "Mazo de estudio · sin voltear",
  title: "Gramática",
} as const;

function readJson(slug: string): unknown | null {
  const filePath = path.join(DECKS_DIR, `${slug}.json`);
  if (!fs.existsSync(filePath)) return null;
  return JSON.parse(fs.readFileSync(filePath, "utf-8"));
}

/**
 * Returns the authored deck for a lesson slug, or `null` when no content file
 * exists yet (caller falls back). In dev, malformed JSON throws; in prod it is
 * logged and treated as missing so the app degrades gracefully.
 */
export function getDeckBySlug(slug: string): GrammarStudyDeckData | null {
  const data = readJson(slug);
  if (data === null) return null;

  const result = GrammarStudyDeckSchema.safeParse(data);
  if (!result.success) {
    const message = `[grammar-deck] Zod validation failed for "${slug}":\n${z.prettifyError(result.error)}`;
    if (process.env.NODE_ENV !== "production") throw new Error(message);
    console.error(message);
    return null;
  }

  // Assign sequential 1-based indices from array position so authors never
  // have to keep `index` in sync by hand.
  return {
    meta: result.data.meta ?? DEFAULT_META,
    cards: result.data.cards.map((card, i) => ({ ...card, index: i + 1 })),
  };
}

/**
 * Resolves the deck to render for a lesson. Falls back to the demo deck while
 * a lesson's content file does not exist yet.
 */
export function getDeckForLesson(slug: string | undefined): GrammarStudyDeckData {
  if (slug) {
    const deck = getDeckBySlug(slug);
    if (deck) return deck;
  }
  return MOCK_GRAMMAR_DECK;
}
