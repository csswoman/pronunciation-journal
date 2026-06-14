import { describe, it, expect } from "vitest";
import { applyWordBankChange, makePendingKey } from "../apply-word-bank-change";
import type { WordBankChangeEvent } from "../change-events";
import type { WordBankEntry } from "../types";

function entry(overrides: Partial<WordBankEntry> & Pick<WordBankEntry, "id">): WordBankEntry {
  const { id, ...rest } = overrides;
  return {
    user_id: "user-1",
    text: "hello",
    context: null,
    meaning: null,
    translation: null,
    ipa: null,
    example: null,
    synonyms: null,
    image_prompt: null,
    audio_url: null,
    status: "ready",
    difficulty: 0,
    error_reason: null,
    audio_fetch_attempts: 0,
    has_audio: null,
    ease_factor: 2.5,
    interval_days: 1,
    repetitions: 0,
    srs_status: "new",
    next_review_at: null,
    last_reviewed_at: null,
    review_count: 0,
    source: null,
    source_ref: null,
    created_at: "2026-01-01T00:00:00Z",
    updated_at: "2026-01-01T00:00:00Z",
    ...rest,
    id,
  } as WordBankEntry;
}

function apply(
  current: WordBankEntry[],
  event: WordBankChangeEvent,
  pending = new Map<string, string>(),
  processing = new Map<string, number>(),
) {
  return {
    words: applyWordBankChange(current, event, pending, processing),
    pending,
    processing,
  };
}

describe("makePendingKey", () => {
  it("normalizes text and context case", () => {
    expect(makePendingKey(" Hello ", " World ")).toBe("hello::world");
    expect(makePendingKey("Hello", null)).toBe("hello::");
  });
});

describe("applyWordBankChange", () => {
  it("INSERT normal prepends a new row", () => {
    const existing = entry({ id: "w1", text: "cat" });
    const inserted = entry({ id: "w2", text: "dog" });

    const { words } = apply([existing], { type: "INSERT", new: inserted });

    expect(words).toHaveLength(2);
    expect(words[0]).toEqual(inserted);
    expect(words[1]).toEqual(existing);
  });

  it("INSERT duplicado no cambia la lista si el id ya existe", () => {
    const existing = entry({ id: "w1", text: "cat" });
    const duplicate = entry({ id: "w1", text: "cat-updated" });
    const list = [existing];

    const { words } = apply(list, { type: "INSERT", new: duplicate });

    expect(words).toBe(list);
    expect(words[0]).toBe(existing);
  });

  it("INSERT reemplaza tempId por la fila real via pendingAddRef", () => {
    const temp = entry({ id: "temp_1", text: "dog", status: "processing" });
    const real = entry({ id: "real-1", text: "dog", status: "processing" });
    const pending = new Map([[makePendingKey("dog", null), "temp_1"]]);

    const { words, pending: pendingAfter } = apply(
      [temp],
      { type: "INSERT", new: real },
      pending,
    );

    expect(words).toHaveLength(1);
    expect(words[0]).toEqual(real);
    expect(pendingAfter.has(makePendingKey("dog", null))).toBe(false);
  });

  it("UPDATE reemplaza la fila por id", () => {
    const before = entry({ id: "w1", text: "cat", status: "processing" });
    const after = entry({ id: "w1", text: "cat", status: "ready", meaning: "gato" });

    const { words } = apply([before], { type: "UPDATE", new: after });

    expect(words).toHaveLength(1);
    expect(words[0]).toEqual(after);
  });

  it("DELETE elimina la fila por id", () => {
    const a = entry({ id: "w1" });
    const b = entry({ id: "w2" });

    const { words } = apply([a, b], { type: "DELETE", old: { id: "w1" } });

    expect(words).toEqual([b]);
  });

  it("UPDATE limpia processingSinceRef cuando status deja de ser processing", () => {
    const before = entry({ id: "w1", status: "processing" });
    const after = entry({ id: "w1", status: "ready" });
    const processing = new Map([["w1", Date.now()]]);

    apply([before], { type: "UPDATE", new: after }, new Map(), processing);

    expect(processing.has("w1")).toBe(false);
  });

  it("DELETE limpia processingSinceRef", () => {
    const row = entry({ id: "w1", status: "processing" });
    const processing = new Map([["w1", Date.now()]]);

    apply([row], { type: "DELETE", old: { id: "w1" } }, new Map(), processing);

    expect(processing.has("w1")).toBe(false);
  });

  it("eventos fuera de orden: UPDATE de id inexistente no altera filas", () => {
    const existing = entry({ id: "w1" });
    const ghost = entry({ id: "missing", text: "ghost" });

    const { words } = apply([existing], { type: "UPDATE", new: ghost });

    expect(words).toHaveLength(1);
    expect(words[0]).toEqual(existing);
  });

  it("eventos fuera de orden: DELETE de id inexistente conserva la lista", () => {
    const existing = entry({ id: "w1" });

    const { words } = apply([existing], { type: "DELETE", old: { id: "missing" } });

    expect(words).toEqual([existing]);
  });

  it("eventos fuera de orden: INSERT con pendingKey pero sin temp en lista", () => {
    const existing = entry({ id: "w1" });
    const real = entry({ id: "real-1", text: "dog" });
    const pending = new Map([[makePendingKey("dog", null), "temp_missing"]]);

    const { words, pending: pendingAfter } = apply(
      [existing],
      { type: "INSERT", new: real },
      pending,
    );

    expect(words).toEqual([existing]);
    expect(pendingAfter.has(makePendingKey("dog", null))).toBe(false);
  });

  it("eventos fuera de orden: UPDATE ready tras INSERT duplicado conserva una sola fila", () => {
    const real = entry({ id: "real-1", text: "dog", status: "ready" });
    const afterInsert = apply([], { type: "INSERT", new: real }).words;
    const afterDuplicateInsert = apply(afterInsert, {
      type: "INSERT",
      new: entry({ id: "real-1", text: "dog", meaning: "perro" }),
    }).words;

    expect(afterDuplicateInsert).toBe(afterInsert);

    const afterUpdate = apply(afterDuplicateInsert, {
      type: "UPDATE",
      new: entry({ id: "real-1", text: "dog", status: "ready", meaning: "perro" }),
    }).words;

    expect(afterUpdate).toHaveLength(1);
    expect(afterUpdate[0].meaning).toBe("perro");
  });
});
