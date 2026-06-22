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
import type { GrammarDeckMeta, GrammarStudyDeckData, GrammarRelatedLink } from "./types";
import { getLevelById } from "@/lib/courses/curriculumIndex";
import type { CoursePathTrackId } from "@/lib/courses/types";

const DECKS_DIR = path.join(process.cwd(), "public", "grammar-decks");

const DEFAULT_META: GrammarDeckMeta = {
  eyebrow: "Mazo de estudio · sin voltear",
  title: "Gramática",
};

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
    sounds: result.data.sounds,
    related: result.data.related,
    quiz: result.data.quiz,
    cards: result.data.cards.map((card, i) => ({ ...card, index: i + 1 })),
  };
}

/**
 * Reverse index: for a target IPA sound, the course decks that practice it.
 * Built by scanning every deck's `sounds` field. Server-only (uses fs).
 */
export interface DeckSoundRef {
  slug: string;
  title: string;
}

export function getDecksForSound(sound: string): DeckSoundRef[] {
  const refs: DeckSoundRef[] = [];
  let files: string[];
  try {
    files = fs.readdirSync(DECKS_DIR).filter((f) => f.endsWith(".json"));
  } catch {
    return refs;
  }
  for (const file of files) {
    const slug = file.replace(/\.json$/, "");
    const data = readJson(slug);
    if (data === null) continue;
    const parsed = GrammarStudyDeckSchema.safeParse(data);
    if (!parsed.success) continue;
    if (parsed.data.sounds?.includes(sound)) {
      const meta = parsed.data.meta ?? DEFAULT_META;
      const title = [meta.title, meta.titleEmphasis].filter(Boolean).join(" ");
      refs.push({ slug, title });
    }
  }
  return refs;
}

export type DeckLevel = 'a1' | 'a2' | 'b1' | 'b2' | 'c1' | 'biz' | 'tech' | 'cs' | 'other'

export interface DeckSummary {
  slug: string
  level: DeckLevel
  title: string
  eyebrow: string
  cardCount: number
  hasQuiz: boolean
  hasSounds: boolean
}

function slugToLevel(slug: string): DeckLevel {
  if (slug.startsWith('a1-')) return 'a1'
  if (slug.startsWith('a2-')) return 'a2'
  if (slug.startsWith('b1-')) return 'b1'
  if (slug.startsWith('b2-')) return 'b2'
  if (slug.startsWith('c1-') || slug.startsWith('c2-')) return 'c1'
  if (slug.startsWith('biz-')) return 'biz'
  if (slug.startsWith('tech-')) return 'tech'
  if (slug.startsWith('cs-')) return 'cs'
  return 'other'
}

/**
 * List all deck summaries for the index page.
 * Reads only meta + card count — does NOT validate full schema for speed.
 */
export function listAllDecks(): DeckSummary[] {
  let files: string[]
  try {
    files = fs.readdirSync(DECKS_DIR).filter((f) => f.endsWith('.json')).sort()
  } catch {
    return []
  }

  const summaries: DeckSummary[] = []
  for (const file of files) {
    const slug = file.replace(/\.json$/, '')
    try {
      const raw = readJson(slug) as Record<string, unknown> | null
      if (!raw) continue
      const meta = (raw.meta ?? {}) as Record<string, string>
      const cards = Array.isArray(raw.cards) ? raw.cards : []
      const title = [meta.title, meta.titleEmphasis].filter(Boolean).join(' ') || slug
      summaries.push({
        slug,
        level: slugToLevel(slug),
        title,
        eyebrow: meta.eyebrow ?? '',
        cardCount: cards.length,
        hasQuiz: Array.isArray(raw.quiz) && (raw.quiz as unknown[]).length > 0,
        hasSounds: Array.isArray(raw.sounds) && (raw.sounds as unknown[]).length > 0,
      })
    } catch {
      // skip malformed
    }
  }
  return summaries
}

/**
 * Resolves the authored deck for a lesson.
 * Missing content stays explicit so an unrelated lesson is never shown.
 */
export function getDeckForLesson(slug: string | undefined): GrammarStudyDeckData | null {
  return slug ? getDeckBySlug(slug) : null;
}

/**
 * Derives related-deck links from sibling lessons in the same curriculum level.
 * Used as fallback when a deck's authored `related` field is empty.
 * Returns up to `limit` links, excluding the current lesson's own slug.
 */
export function getDerivedRelated(
  trackId: CoursePathTrackId,
  currentSlug: string,
  limit = 3,
): GrammarRelatedLink[] {
  const level = getLevelById(trackId);
  if (!level) return [];

  const siblings = level.units
    .flatMap((u) => u.lessons)
    .filter((l) => l.slug && l.slug !== currentSlug);

  const result: GrammarRelatedLink[] = [];
  for (const lesson of siblings) {
    if (!lesson.slug) continue;
    // Only suggest decks that actually exist on disk
    const filePath = path.join(process.cwd(), "public", "grammar-decks", `${lesson.slug}.json`);
    if (!fs.existsSync(filePath)) continue;
    result.push({ slug: lesson.slug, label: lesson.title });
    if (result.length >= limit) break;
  }
  return result;
}
