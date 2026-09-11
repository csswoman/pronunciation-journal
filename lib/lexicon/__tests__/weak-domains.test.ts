import { describe, it, expect } from "vitest";
import { deriveWeakDomains, type WeakVocabRow } from "../weak-domains";

/** `etl` sits in two categories, which is the interesting case for counting. */
const INDEX = new Map<string, readonly string[]>([
  ["etl", ["backend-infra", "data-science"]],
  ["idempotent", ["backend-infra"]],
  ["throughput", ["backend-infra"]],
  ["latency", ["backend-infra"]],
  ["affordance", ["ux-design"]],
  ["kerning", ["ux-design"]],
  ["baseline", ["ux-design"]],
]);

const NAMES = new Map([
  ["backend-infra", "Backend e infraestructura"],
  ["ux-design", "Diseño UX"],
]);

function row(sourceRef: string, easeFactor: number, srsStatus = "learning"): WeakVocabRow {
  return { source: "lexicon", source_ref: sourceRef, ease_factor: easeFactor, srs_status: srsStatus };
}

describe("deriveWeakDomains", () => {
  it("returns nothing when there are no rows", () => {
    expect(deriveWeakDomains([], INDEX, NAMES)).toEqual([]);
  });

  it("surfaces a category whose words the learner keeps failing", () => {
    const weak = deriveWeakDomains(
      [row("idempotent", 1.5), row("throughput", 1.6), row("latency", 1.7)],
      INDEX,
      NAMES,
    );

    expect(weak).toHaveLength(1);
    expect(weak[0]).toMatchObject({
      categoryId: "backend-infra",
      label: "Backend e infraestructura",
      wordCount: 3,
    });
  });

  it("ignores a category the learner handles comfortably", () => {
    const weak = deriveWeakDomains(
      [row("idempotent", 2.8), row("throughput", 2.9), row("latency", 2.7)],
      INDEX,
      NAMES,
    );

    expect(weak).toEqual([]);
  });

  it("ignores a category with too few struggling words to be signal", () => {
    const weak = deriveWeakDomains([row("idempotent", 1.3), row("throughput", 1.4)], INDEX, NAMES);

    expect(weak).toEqual([]);
  });

  it("ignores rows that are not lexicon-sourced", () => {
    const rows: WeakVocabRow[] = [
      { source: "manual", source_ref: "idempotent", ease_factor: 1.3, srs_status: "learning" },
      { source: "manual", source_ref: "throughput", ease_factor: 1.3, srs_status: "learning" },
      { source: "manual", source_ref: "latency", ease_factor: 1.3, srs_status: "learning" },
    ];

    expect(deriveWeakDomains(rows, INDEX, NAMES)).toEqual([]);
  });

  it("ignores source_refs the word index does not resolve", () => {
    const weak = deriveWeakDomains(
      [row("ghost-a", 1.3), row("ghost-b", 1.3), row("ghost-c", 1.3)],
      INDEX,
      NAMES,
    );

    expect(weak).toEqual([]);
  });

  it("counts a word in every category it belongs to", () => {
    const weak = deriveWeakDomains(
      [
        row("etl", 1.4),
        row("idempotent", 1.4),
        row("throughput", 1.4),
        row("affordance", 1.4),
        row("kerning", 1.4),
      ],
      INDEX,
      NAMES,
    );

    const backend = weak.find((w) => w.categoryId === "backend-infra");
    // `etl` counts here as well as under data-science.
    expect(backend?.wordCount).toBe(3);
  });

  it("orders the hardest category first", () => {
    const weak = deriveWeakDomains(
      [
        // ux-design: avg 1.3 — harder.
        row("affordance", 1.3),
        row("kerning", 1.3),
        row("baseline", 1.3),
        // backend-infra: avg 1.9 — still weak, but less so.
        row("idempotent", 1.9),
        row("throughput", 1.9),
        row("latency", 1.9),
      ],
      INDEX,
      NAMES,
    );

    expect(weak.map((w) => w.categoryId)).toEqual(["ux-design", "backend-infra"]);
  });

  it("falls back to the raw id when no display name is known", () => {
    const weak = deriveWeakDomains(
      [row("idempotent", 1.4), row("throughput", 1.4), row("latency", 1.4)],
      INDEX,
      new Map(),
    );

    expect(weak[0].label).toBe("backend-infra");
  });

  it("skips mastered words, which no longer describe a weakness", () => {
    const weak = deriveWeakDomains(
      [
        row("idempotent", 1.3, "review"),
        row("throughput", 1.3, "review"),
        row("latency", 1.3, "review"),
      ],
      INDEX,
      NAMES,
    );

    expect(weak).toEqual([]);
  });

  it("tolerates a null ease factor instead of throwing", () => {
    const rows: WeakVocabRow[] = [
      { source: "lexicon", source_ref: "idempotent", ease_factor: null, srs_status: "learning" },
      row("throughput", 1.4),
      row("latency", 1.4),
      row("etl", 1.4),
    ];

    const backend = deriveWeakDomains(rows, INDEX, NAMES).find(
      (w) => w.categoryId === "backend-infra",
    );
    // The null-ease row still counts: its unsettled status is evidence enough.
    expect(backend?.wordCount).toBe(4);
  });
});
