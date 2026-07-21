import fs from "node:fs";
import path from "node:path";
import { describe, expect, it } from "vitest";
import { auditDeck } from "../content-audit";
import { GrammarStudyDeckSchema } from "../grammar-deck/schema";
import { targetId } from "@/lib/pronunciation/targets/registry";
import { getContentMapIssues } from "@/lib/pronunciation/targets/content-map";

describe("grammar deck content audit", () => {
  it("finds no structural content issues in authored decks", () => {
    const dir = path.join(process.cwd(), "public", "grammar-decks");
    const issues = fs.readdirSync(dir)
      .filter((file) => file.endsWith(".json"))
      .flatMap((file) => {
        const result = GrammarStudyDeckSchema.safeParse(
          JSON.parse(fs.readFileSync(path.join(dir, file), "utf8")),
        );
        if (!result.success) return [`${file}: invalid-schema`];
        const parsed = result.data;
        return auditDeck({
          ...parsed,
          meta: parsed.meta ?? { eyebrow: "", title: "" },
          pronunciationTargetIds: parsed.pronunciationTargetIds?.map(targetId),
          cards: parsed.cards.map((card, index) => ({ ...card, index: index + 1 })),
        }).map((issue) => `${file}: ${issue.code} ${issue.detail}`);
      });

    expect(issues).toEqual([]);
  }, 15_000);

  it("finds no dangling pronunciation-target content references", () => {
    expect(getContentMapIssues()).toEqual([]);
  });
});
