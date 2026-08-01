import { describe, expect, it, vi, beforeEach } from "vitest";
import { readStoredCefrLevel } from "../target-level";
import { db } from "@/lib/db";

vi.mock("@/lib/db", () => ({
  db: {
    learningState: {
      get: vi.fn(),
    },
  },
  ensureDbReady: vi.fn().mockResolvedValue(undefined),
}));

const getMock = vi.mocked(db.learningState.get);

function row(cefrEstimate: unknown) {
  return { userId: "u1", state: { level: { cefrEstimate } }, updatedAt: "" };
}

describe("readStoredCefrLevel", () => {
  beforeEach(() => getMock.mockReset());

  it("returns the stored level when valid", async () => {
    getMock.mockResolvedValue(row("B1") as never);
    expect(await readStoredCefrLevel("u1")).toBe("B1");
  });

  it("folds C2 down to C1", async () => {
    getMock.mockResolvedValue(row("C2") as never);
    expect(await readStoredCefrLevel("u1")).toBe("C1");
  });

  it("returns null when there is no row", async () => {
    getMock.mockResolvedValue(undefined as never);
    expect(await readStoredCefrLevel("u1")).toBeNull();
  });

  it("returns null for an unknown value", async () => {
    getMock.mockResolvedValue(row("Z9") as never);
    expect(await readStoredCefrLevel("u1")).toBeNull();
  });
});
