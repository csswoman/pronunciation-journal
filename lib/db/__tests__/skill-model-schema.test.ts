import { describe, expect, it } from "vitest";
import { db } from "../index";

describe("Dexie v31 — modelo de habilidades", () => {
  it("declara las tres tablas del motor nuevo", () => {
    const names = db.tables.map((table) => table.name);
    expect(names).toContain("learningItems");
    expect(names).toContain("attemptLogs");
    expect(names).toContain("srsReviewEvents");
  });

  it("learningItems permite consultar palabra, habilidad y vencimiento", () => {
    const schema = db.table("learningItems").schema;
    const indexes = schema.indexes.map((index) => index.name);
    expect(schema.primKey.name).toBe("id");
    expect(indexes).toContain("userId");
    expect(indexes).toContain("[userId+wordId]");
    expect(indexes).toContain("[userId+skill]");
    expect(indexes).toContain("[userId+dueAt]");
    expect(indexes).toContain("[userId+scheduleKind]");
  });

  it("attemptLogs permite consultar sesión, palabra y momento", () => {
    const indexes = db.table("attemptLogs").schema.indexes.map((index) => index.name);
    expect(indexes).toContain("[userId+sessionId]");
    expect(indexes).toContain("[userId+wordId]");
    expect(indexes).toContain("[userId+occurredAt]");
  });

  it("srsReviewEvents permite reconstruir cada tarjeta", () => {
    const indexes = db.table("srsReviewEvents").schema.indexes.map((index) => index.name);
    expect(indexes).toContain("[userId+learningItemId]");
    expect(indexes).toContain("[userId+attemptLogId]");
    expect(indexes).toContain("[userId+occurredAt]");
  });

  it("la versión es al menos 31", () => {
    expect(db.verno).toBeGreaterThanOrEqual(31);
  });
});
