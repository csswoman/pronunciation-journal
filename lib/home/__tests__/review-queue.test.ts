import { describe, it, expect, vi } from "vitest";

// server-only guard is irrelevant in unit tests; mock it out
vi.mock("server-only", () => ({}));
// getReviewQueueSummary calls server queries — not under test here
vi.mock("@/lib/word-bank/server-queries", () => ({ getWordsDueForReview: vi.fn(), countWordsDueForReview: vi.fn() }));
vi.mock("@/lib/home/queries", () => ({ getSoundsDueForHome: vi.fn() }));
vi.mock("@/lib/supabase/server", () => ({ createSupabaseServerClient: vi.fn() }));

import { buildServerSummary } from "@/lib/home/review-queue";
import type { WordBankEntry } from "@/lib/word-bank/types";
import type { SoundDueHome } from "@/lib/home/constants";

const word = (id: string, text: string): WordBankEntry =>
  ({ id, text, ipa: `/${text}/`, translation: "x" } as WordBankEntry);
const sound = (id: number, ipa: string): SoundDueHome =>
  ({ soundId: id, ipa, example: null, accuracy: 50, daysOverdue: 0 });

describe("buildServerSummary", () => {
  it("includes only sources with count > 0, ordered by count desc", () => {
    const s = buildServerSummary({
      dueWords: [word("1", "a"), word("2", "b")],
      dueWordCount: 12,
      soundsDue: [sound(1, "/ð/")],
      newWordAvailable: 5,
    });
    expect(s.sources.map((x) => x.id)).toEqual(["vocabulary", "sounds"]);
    expect(s.total).toBe(13);
  });

  it("sets warning tone at or above the threshold", () => {
    const s = buildServerSummary({
      dueWords: [], dueWordCount: 10, soundsDue: [], newWordAvailable: 0,
    });
    expect(s.sources[0]).toMatchObject({ id: "vocabulary", tone: "warning" });
  });

  it("omits zero-count sources and builds vocabulary preview", () => {
    const s = buildServerSummary({
      dueWords: [word("1", "a")], dueWordCount: 1, soundsDue: [], newWordAvailable: 0,
    });
    expect(s.sources.map((x) => x.id)).toEqual(["vocabulary"]);
    expect(s.preview[0]).toMatchObject({ text: "a", sourceId: "vocabulary" });
  });
});
