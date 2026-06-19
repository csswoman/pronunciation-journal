import { describe, expect, it } from "vitest";
import {
  coreWordToStudyCard,
  wordBankEntryToStudyCard,
} from "../model";
import type { CoreWord } from "@/lib/core-1000/types";
import type { WordBankEntry } from "@/lib/word-bank/types";

const coreFunctionWord: CoreWord = {
  rank: 3,
  word: "to",
  pos: "preposition",
  ipa_strong: "/tuː/",
  ipa_weak: "/tə/",
  example_sentence: "I want to go home.",
  sentence_ipa: "/aɪ wɑnt tə ɡoʊ hoʊm/",
  cefr_level: "A1",
};

const coreContentWord: CoreWord = {
  rank: 120,
  word: "house",
  pos: "noun",
  ipa_strong: "/haʊs/",
  example_sentence: "The house is big.",
  cefr_level: "A1",
};

function wordBank(overrides: Partial<WordBankEntry>): WordBankEntry {
  return {
    id: "wb-1",
    user_id: "u-1",
    text: "ephemeral",
    meaning: "lasting a very short time",
    translation: "efímero",
    ipa: "/ɪˈfem(ə)rəl/",
    example: "Fame can be ephemeral.",
    audio_url: null,
    synonyms: null,
    image_prompt: null,
    source: null,
    source_ref: null,
    context: null,
    status: "active",
    srs_status: "new",
    difficulty: 3,
    ease_factor: 2.5,
    interval_days: 1,
    repetitions: 0,
    review_count: 0,
    next_review_at: null,
    last_reviewed_at: null,
    has_audio: null,
    audio_fetch_attempts: 0,
    error_reason: null,
    created_at: "2026-06-19T00:00:00.000Z",
    updated_at: "2026-06-19T00:00:00.000Z",
    ...overrides,
  } as WordBankEntry;
}

describe("coreWordToStudyCard", () => {
  it("maps the common fields and includes the weak form when present", () => {
    const model = coreWordToStudyCard(coreFunctionWord);
    expect(model.word).toBe("to");
    expect(model.ipa).toBe("/tuː/");
    expect(model.sentence).toBe("I want to go home.");
    expect(model.sentenceIpa).toBe("/aɪ wɑnt tə ɡoʊ hoʊm/");
    expect(model.weakForm).toEqual({ ipa: "/tə/", phrase: "to go" });
    expect(model.chips).toEqual(["#3", "preposition", "A1"]);
  });

  it("omits weakForm and sentenceIpa for content words", () => {
    const model = coreWordToStudyCard(coreContentWord);
    expect(model.weakForm).toBeUndefined();
    expect(model.sentenceIpa).toBeUndefined();
    expect(model.ipa).toBe("/haʊs/");
  });
});

describe("wordBankEntryToStudyCard", () => {
  it("maps text→word and the enrichment fields", () => {
    const model = wordBankEntryToStudyCard(wordBank({}));
    expect(model.word).toBe("ephemeral");
    expect(model.meaning).toBe("lasting a very short time");
    expect(model.translation).toBe("efímero");
    expect(model.ipa).toBe("/ɪˈfem(ə)rəl/");
    expect(model.sentence).toBe("Fame can be ephemeral.");
  });

  it("never carries weakForm or sentenceIpa (not applicable to word_bank)", () => {
    const model = wordBankEntryToStudyCard(wordBank({}));
    expect(model.weakForm).toBeUndefined();
    expect(model.sentenceIpa).toBeUndefined();
  });

  it("drops null fields rather than leaking them into the model", () => {
    const model = wordBankEntryToStudyCard(
      wordBank({ ipa: null, example: null, meaning: null, translation: null }),
    );
    expect(model.word).toBe("ephemeral");
    expect(model.ipa).toBeUndefined();
    expect(model.sentence).toBeUndefined();
    expect(model.meaning).toBeUndefined();
    expect(model.translation).toBeUndefined();
  });
});
