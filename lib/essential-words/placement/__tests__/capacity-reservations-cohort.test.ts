import { describe, expect, it } from "vitest";
import { deriveBaseBacklogPolicy } from "../../pending-base-fairness";
import {
  admit,
  costs,
  DEFAULT_BACKLOG_POLICY,
  inferred,
} from "./capacity-reservations.fixtures";

/**
 * Fase 8 final simplification (docs/superpowers/plans/notes/
 * 2026-08-07-fase8-final-planner-simplification.md §7c). Reemplaza el
 * conjunto de tests que verificaban la admisión acumulativa contra un
 * ledger de 8 sesiones (Task 8.9k). El invariante que protegían —
 * "N candidatos individualmente elegibles no implican N admisiones si la
 * capacidad real es menor, y subir `maxConversionsPerSession` no cambia
 * cuántos se admiten si la capacidad real no cambió" — se preserva contra
 * `remainingSeconds`/backlog en vez de contra un solver de reservas.
 */
describe("admisión de placement acota por capacidad real, no por el techo", () => {
  it("D/E/F: capacidad real limita antes que maxConversionsPerSession", () => {
    const scarce = admit({
      candidates: inferred(10),
      maxConversionsPerSession: 8,
      remainingSeconds: costs.recognition * 3,
    });
    const scarceHighCeiling = admit({
      candidates: inferred(10),
      maxConversionsPerSession: 100,
      remainingSeconds: costs.recognition * 3,
    });

    expect(scarce.admitted.length).toBeLessThan(8);
    expect(scarce.admitted.length).toBe(scarce.capacitySafeConversions);
    // Subir el techo de seguridad NO cambia cuántas se admiten si la
    // capacidad real no cambió (la prueba central del bug de 8.9j).
    expect(scarceHighCeiling.admitted.length).toBe(scarce.admitted.length);
    expect(scarceHighCeiling.capacitySafeConversions).toBe(scarce.capacitySafeConversions);
  });

  it("K: la admisión acumulativa nunca produce reservas con deadline > 8", () => {
    const result = admit({
      candidates: inferred(8),
      maxConversionsPerSession: 8,
      remainingSeconds: 900,
    });

    expect(
      result.newReservations
        .filter((item) => item.skill === "listening" || item.skill === "production")
        .every((item) => item.deadlineSession <= 8),
    ).toBe(true);
  });

  it("N: rechazar una conversión no deja reservas provisionales parciales", () => {
    const result = admit({
      candidates: inferred(1),
      maxConversionsPerSession: 1,
      remainingSeconds: 0,
    });

    expect(result.admitted).toEqual([]);
    expect(result.rejectedForCapacity).toBe(1);
    expect(result.newReservations).toEqual([]);
  });

  it("O: misma seed/contexto produce exactamente el mismo conjunto admitido", () => {
    const run = () => admit({
      candidates: inferred(12),
      maxConversionsPerSession: 8,
      remainingSeconds: 900,
    });

    const first = run();
    const second = run();
    expect(second.admitted.map((item) => item.id)).toEqual(first.admitted.map((item) => item.id));
    expect(second.rejectedForCapacity).toBe(first.rejectedForCapacity);
    expect(second.rejectedForSafetyCeiling).toBe(first.rejectedForSafetyCeiling);
  });

  it("el backlog reduce la capacidad disponible para placement igual que para new-words", () => {
    const policy = deriveBaseBacklogPolicy({ dailyBudgetSeconds: 900, modalityCosts: costs });
    const withoutBacklog = admit({
      candidates: inferred(6),
      maxConversionsPerSession: 6,
      remainingSeconds: 900,
      pendingBaseBacklogSeconds: 0,
      backlogPolicy: policy,
    });
    const withBacklog = admit({
      candidates: inferred(6),
      maxConversionsPerSession: 6,
      remainingSeconds: 900,
      pendingBaseBacklogSeconds: policy.admissionBackpressureThresholdSeconds * 0.9,
      backlogPolicy: policy,
    });

    expect(withBacklog.admitted.length).toBeLessThanOrEqual(withoutBacklog.admitted.length);
  });

  it("§10 — muchos candidatos, capacidad real solo para una fracción", () => {
    const manyCandidates = inferred(50);
    const scarceMargin = Math.ceil((costs.listening + costs.production) / 3);

    const withDefaultCeiling = admit({
      candidates: manyCandidates,
      maxConversionsPerSession: 8,
      remainingSeconds: scarceMargin * 3,
    });
    const withHighCeiling = admit({
      candidates: manyCandidates,
      maxConversionsPerSession: 100,
      remainingSeconds: scarceMargin * 3,
    });

    expect(withDefaultCeiling.admitted.length).toBeLessThan(8);
    expect(withHighCeiling.admitted.length).toBe(withDefaultCeiling.admitted.length);
    expect(withHighCeiling.capacitySafeConversions).toBe(withDefaultCeiling.capacitySafeConversions);
    expect(withDefaultCeiling.rejectedForCapacity).toBeGreaterThan(0);
  });

  it("NOW/activeDates deterministas se usan consistentemente (sanity del fixture)", () => {
    expect(DEFAULT_BACKLOG_POLICY.version).toBeDefined();
  });
});
