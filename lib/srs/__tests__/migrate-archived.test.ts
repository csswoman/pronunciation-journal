import { describe, expect, it } from "vitest";
import { migrateArchivedRow } from "../migrate-archived";
import { addDaysIso } from "../status";
import type { SRSData } from "@/lib/types";

const base: SRSData = {
  wordId: "c1k:the",
  word: "the",
  ease: 2.5,
  interval: 1,
  repetitions: 1,
  nextReview: "2026-01-01T00:00:00.000Z",
};

describe("migrateArchivedRow", () => {
  it("converts archived to snoozed with +90d from archivedAt", () => {
    const archivedAt = "2026-07-17T12:00:00.000Z";
    const entry = { ...base, archived: true, archivedAt };
    const result = migrateArchivedRow(entry);
    expect(result.status).toBe("snoozed");
    expect(result.snoozedAt).toBe(archivedAt);
    expect(result.nextReview).toBe(addDaysIso(new Date(archivedAt), 90));
  });

  it("leaves rows with status untouched", () => {
    const entry = {
      ...base,
      status: "active" as const,
      archived: true,
      archivedAt: "2026-07-17T12:00:00.000Z",
    };
    const result = migrateArchivedRow(entry);
    expect(result).toBe(entry);
  });
});
