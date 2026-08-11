import { describe, expect, it } from "vitest";
import { runMandatoryAudit } from "../mandatory-audit";
import { PROFILES } from "../profiles";
import type { SimulationOptions } from "../state";

const options: SimulationOptions = {
  days: 60,
  corpusSize: 300,
  seed: 42,
  startAt: "2026-08-01T00:00:00.000Z",
  dailyBudgetSeconds: 900,
  targetNewWords: 10,
};

describe("Task 8.9f §8 — reconciliación de backlog (test G)", { timeout: 30_000 }, () => {
  it("test G — backlog(t+1) = backlog(t) + arrival - service reconcilia exactamente, de forma determinista, para los cinco perfiles", () => {
    for (const profile of Object.values(PROFILES)) {
      const audit = runMandatoryAudit(profile, options);
      expect(audit.days.length).toBeGreaterThan(0);
      for (const day of audit.days) {
        expect(day.reconciliationErrorSeconds).toBe(0);
        expect(day.backlogSecondsEnd).toBe(
          day.backlogSecondsStart + day.arrivalSeconds - day.serviceSeconds,
        );
      }
    }
  });

  it("es determinista: dos corridas con el mismo seed producen la misma serie de backlog", () => {
    const first = runMandatoryAudit(PROFILES.steady, options);
    const second = runMandatoryAudit(PROFILES.steady, options);
    expect(first.days.map((day) => day.backlogSecondsEnd))
      .toEqual(second.days.map((day) => day.backlogSecondsEnd));
    expect(first.violations).toEqual([]);
    expect(second.violations).toEqual([]);
  });
});

describe("Task 8.9f §2/§6 — ownership sin duplicación provisional+FSRS (test D)", () => {
  it("test D — a lo largo de 60 sesiones activas con placement de alta confianza, ninguna sesión muestra el mismo itemId como provisional y FSRS a la vez", () => {
    // El perfil "advanced" es el único con placementConfidence "high": genera
    // placement inferences que se convierten a provisional y luego a FSRS.
    const audit = runMandatoryAudit(PROFILES.advanced, options);
    expect(audit.violations).toEqual([]);
    // Si hubiera doble contabilización provisional+FSRS para el mismo
    // itemId, `assertMandatoryOwnership` (invocada dentro de cada
    // `buildMandatoryLoadBreakdown`) habría lanzado y el audit no llegaría
    // a completarse — esta corrida completa es la prueba positiva.
    expect(audit.days.some((day) => day.counts.provisionalDue > 0)).toBe(true);
  });
});

describe("Task 8.9f §5 — learning-step y scheduled-review sólo coexisten como eventos distintos (test E)", () => {
  it("test E — ningún LearningItem (itemId) recibe más de un srsEvent en la misma sesión (nunca aparece a la vez como learning-step y scheduled-review para el mismo trabajo)", () => {
    // `occurredAt` es constante dentro de una sesión (proviene de `context.now`
    // en `applyCompletedSession`), así que comparar `occurredAt` entre
    // attemptLogs de la misma sesión es trivialmente siempre igual y no sirve
    // como discriminador. El invariante real de §5/§2 es a nivel de
    // LearningItem: `srsEvents` sí guarda `learningItemId` — cada itemId debe
    // recibir como máximo UN srsEvent por `sessionId` (el fix de ownership de
    // apply-session.ts garantiza esto tanto para completion propia + sibling
    // como para dos siblings distintos observando el mismo item).
    const audit = runMandatoryAudit(PROFILES.beginner, options);
    const sessionByAttemptLogId = new Map(
      audit.simulation.attemptLogs.map((attempt) => [attempt.id, attempt.sessionId]),
    );
    const bySessionAndItem = new Map<string, number>();
    for (const event of audit.simulation.srsEvents) {
      const sessionId = sessionByAttemptLogId.get(event.attemptLogId);
      if (!sessionId) continue;
      const key = `${sessionId}:${event.learningItemId}`;
      bySessionAndItem.set(key, (bySessionAndItem.get(key) ?? 0) + 1);
    }
    const duplicated = [...bySessionAndItem.entries()].filter(([, count]) => count > 1);
    expect(duplicated).toEqual([]);
  });
});
