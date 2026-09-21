import fs from "node:fs";
import path from "node:path";
import { describe, expect, it } from "vitest";

import { LANDING_STATS } from "@/lib/landing/content";
import { CANONICAL_SOUNDS } from "@/lib/sounds/inventory";

function findStat(label: string) {
  const stat = LANDING_STATS.find((s) => s.label === label);
  if (!stat) {
    throw new Error(`Expected a LANDING_STATS entry with label "${label}"`);
  }
  return stat;
}

describe("LANDING_STATS", () => {
  it("grammar-decks stat matches the actual number of files in public/grammar-decks/", () => {
    const decksDir = path.join(process.cwd(), "public", "grammar-decks");
    const deckFileCount = fs
      .readdirSync(decksDir)
      .filter((file) => file.endsWith(".json")).length;

    const stat = findStat("mazos de patrones gramaticales");
    expect(stat.value).toBe(String(deckFileCount));
  });

  it("sounds stat matches CANONICAL_SOUNDS, the app's real English phoneme inventory", () => {
    const stat = findStat("sonidos del inglés con audio de referencia");
    expect(stat.value).toBe(String(CANONICAL_SOUNDS.length));
  });
});
