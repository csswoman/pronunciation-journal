// Gate de CI para el dataset completo: schema Zod (vía loadCoreWords) +
// validate-core. Pasa trivialmente con 0 chunks; rompe el build si alguien
// commitea un chunk inválido. npm run validate:core1000 ejecuta solo este file.
import fs from "fs";
import path from "path";
import { describe, expect, it } from "vitest";
import { loadCoreWords } from "../data";
import { validateEntry } from "../validate-core";

const EXCEPTIONS_PATH = path.join(
  process.cwd(), "scripts", "core-1000", "data", "ipa-exceptions.json"
);

function loadExceptions(): Record<string, string> {
  const raw = JSON.parse(fs.readFileSync(EXCEPTIONS_PATH, "utf-8")) as Record<string, string>;
  return Object.fromEntries(Object.entries(raw).filter(([k]) => !k.startsWith("_")));
}

describe("Core 1000 dataset", () => {
  const words = loadCoreWords(); // throws si un chunk es inválido (dev/test)

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
});
