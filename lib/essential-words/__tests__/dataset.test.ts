// Gate de CI para el dataset completo: schema Zod (vía loadEssentialWords) +
// validate-core. Pasa trivialmente con 0 chunks; rompe el build si alguien
// commitea un chunk inválido. npm run validate:essential-words ejecuta solo este file.
import fs from "fs";
import path from "path";
import { describe, expect, it } from "vitest";
import { loadEssentialWords } from "../data";
import { validateEntry } from "../validate-core";

const EXCEPTIONS_PATH = path.join(
  process.cwd(), "scripts", "essential-words", "data", "ipa-exceptions.json"
);

function loadExceptions(): Record<string, string> {
  const raw = JSON.parse(fs.readFileSync(EXCEPTIONS_PATH, "utf-8")) as Record<string, string>;
  return Object.fromEntries(Object.entries(raw).filter(([k]) => !k.startsWith("_")));
}

describe("Core 1000 dataset", () => {
  const words = loadEssentialWords(); // throws si un chunk es inválido (dev/test)

  it("has complete chunks only", () => {
    expect(words.length % 100).toBe(0);
  });

  it("has no unreviewed content issues", () => {
    const exceptions = loadExceptions();
    const issues = words
      .flatMap((w) => validateEntry(w))
      .filter((i) => !(i.kind === "ipa-mismatch" && exceptions[i.word] !== undefined));
    const report = issues.map((i) => `#${i.rank} ${i.word} [${i.kind}] ${i.detail}`).join("\n");
    expect(issues, `\n${report}`).toEqual([]);
  });

  it("every exception still corresponds to a real word in the dataset", () => {
    const known = new Set(words.map((w) => w.word));
    const stale = Object.keys(loadExceptions()).filter((w) => words.length > 0 && !known.has(w));
    expect(stale).toEqual([]);
  });

  it("every entry with example_sentence has sentence_ipa", () => {
    const missing = words.filter(
      (w) =>
        w.example_sentence &&
        (!w.sentence_ipa || !w.sentence_ipa.trim().startsWith("/"))
    );
    const report = missing
      .map((w) => `#${w.rank} ${w.word}`)
      .join("\n");
    expect(missing, `\n${report}`).toEqual([]);
  });

  it("every example_sentences variant has slash-wrapped sentence_ipa", () => {
    const bad = words.flatMap((w) =>
      (w.example_sentences ?? [])
        .map((v, i) => ({ w, v, i }))
        .filter(({ v }) => !v.sentence_ipa || !v.sentence_ipa.trim().startsWith("/"))
    );
    const report = bad.map(({ w, i }) => `#${w.rank} ${w.word} variante ${i + 1}`).join("\n");
    expect(bad, `\n${report}`).toEqual([]);
  });
});
