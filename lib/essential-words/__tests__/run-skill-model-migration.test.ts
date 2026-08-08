import { beforeEach, describe, expect, it, vi } from "vitest";
import { runSkillModelMigration } from "../run-skill-model-migration";
import { srsMigrationSet } from "./fixtures/srs-fixtures";

const store = {
  items: [] as unknown[],
  srs: srsMigrationSet(),
};

vi.mock("@/lib/db", () => ({
  db: {
    learningItems: {
      where: () => ({
        equals: () => ({ toArray: async () => store.items }),
      }),
      bulkPut: async (rows: unknown[]) => {
        store.items.push(...rows);
      },
    },
    srsData: {
      where: () => ({
        equals: () => ({ toArray: async () => store.srs }),
      }),
    },
    transaction: async (
      _mode: string,
      _table: unknown,
      fn: () => Promise<void>,
    ) => fn(),
  },
}));

describe("runSkillModelMigration", () => {
  beforeEach(() => {
    store.items = [];
  });

  it("no migra a ciegas sin userId", async () => {
    const result = await runSkillModelMigration(undefined, new Date());
    expect(result).toEqual({ created: 0, skipped: true });
    expect(store.items).toHaveLength(0);
  });

  it("crea tres ítems por palabra", async () => {
    const result = await runSkillModelMigration(
      "user-1",
      new Date("2026-08-06T10:00:00.000Z"),
    );
    expect(result.created).toBe(9);
    expect(store.items).toHaveLength(9);
  });

  it("es idempotente end-to-end: la segunda pasada no crea nada", async () => {
    const now = new Date("2026-08-06T10:00:00.000Z");
    await runSkillModelMigration("user-1", now);
    const second = await runSkillModelMigration("user-1", now);
    expect(second.created).toBe(0);
    expect(store.items).toHaveLength(9);
  });

  it("no borra ningún SRSData (migración conservadora)", async () => {
    await runSkillModelMigration(
      "user-1",
      new Date("2026-08-06T10:00:00.000Z"),
    );
    expect(store.srs).toHaveLength(3);
  });
});
