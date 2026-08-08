import { describe, expect, it } from "vitest";
import { mapDueAtToActiveSession } from "../active-session-map";

function dates(...iso: string[]): Date[] {
  return iso.map((value) => new Date(value));
}

describe("mapDueAtToActiveSession", () => {
  const sessions = dates(
    "2026-08-02T00:00:00.000Z", // 1
    "2026-08-03T00:00:00.000Z", // 2
    "2026-08-05T00:00:00.000Z", // 3 (gap: Aug 4 inactive)
    "2026-08-06T00:00:00.000Z",
    "2026-08-07T00:00:00.000Z",
    "2026-08-08T00:00:00.000Z",
    "2026-08-09T00:00:00.000Z",
    "2026-08-10T00:00:00.000Z",
  );

  it("B: vence antes de sesión 1 → sesión 1", () => {
    expect(mapDueAtToActiveSession(new Date("2026-08-01T12:00:00.000Z"), sessions)).toBe(1);
  });

  it("vence entre sesión 2 y 3 → sesión 3", () => {
    expect(mapDueAtToActiveSession(new Date("2026-08-04T00:00:00.000Z"), sessions)).toBe(3);
  });

  it("B: vence en día inactivo → siguiente sesión activa", () => {
    expect(mapDueAtToActiveSession(new Date("2026-08-04T18:00:00.000Z"), sessions)).toBe(3);
  });

  it("vence fuera del horizonte → null", () => {
    expect(mapDueAtToActiveSession(new Date("2026-08-20T00:00:00.000Z"), sessions)).toBeNull();
  });

  it("vence exactamente en una sesión activa", () => {
    expect(mapDueAtToActiveSession(new Date("2026-08-03T00:00:00.000Z"), sessions)).toBe(2);
  });
});
