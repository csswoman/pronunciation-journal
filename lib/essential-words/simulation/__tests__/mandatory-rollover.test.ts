import { describe, expect, it } from "vitest";
import {
  advanceMandatoryLedger,
  createRolloverLedger,
} from "../mandatory-rollover";
import { runMandatoryAudit } from "../mandatory-audit";
import { PROFILES } from "../profiles";
import type { SimulationOptions } from "../state";

describe("Task 8.9f §3 — advanceMandatoryLedger (tests B/C)", () => {
  it("test B — rollover no duplica item: reaparecer sin ser servido incrementa rolloverCount, no crea un segundo registro", () => {
    const ledger = createRolloverLedger();
    const identity = { itemId: "item-1", workKind: "overdue-review" as const, modality: "recognition" as const };

    advanceMandatoryLedger(ledger, [identity], new Set(), 0);
    advanceMandatoryLedger(ledger, [identity], new Set(), 1);
    advanceMandatoryLedger(ledger, [identity], new Set(), 2);

    expect(ledger.size).toBe(1);
    const record = ledger.get("item-1")!;
    expect(record.rolloverCount).toBe(3);
    expect(record.firstMandatorySession).toBe(0);
    expect(record.servedSession).toBeNull();
  });

  it("test C — un item servido desaparece del mandatory siguiente sin dejar rastro pendiente", () => {
    const ledger = createRolloverLedger();
    const identity = { itemId: "item-2", workKind: "scheduled-review" as const, modality: "recognition" as const };

    advanceMandatoryLedger(ledger, [identity], new Set(), 0);
    const { served, violations } = advanceMandatoryLedger(ledger, [identity], new Set(["item-2"]), 1);

    expect(served.map((r) => r.itemId)).toEqual(["item-2"]);
    expect(violations).toEqual([]);

    // Sesión siguiente: el item ya no está en mandatory (fue servido).
    const step3 = advanceMandatoryLedger(ledger, [], new Set(), 2);
    expect(step3.violations).toEqual([]);
    const record = ledger.get("item-2")!;
    expect(record.servedSession).toBe(1);
    expect(record.latenessSessions).toBe(1);
  });

  it("detecta como violación un item pendiente que desaparece sin ser servido", () => {
    const ledger = createRolloverLedger();
    const identity = { itemId: "item-3", workKind: "learning-step" as const, modality: "recognition" as const };
    advanceMandatoryLedger(ledger, [identity], new Set(), 0);

    // El item desaparece de mandatory (bug hipotético) sin haber sido servido.
    const { violations } = advanceMandatoryLedger(ledger, [], new Set(), 1);
    expect(violations).toHaveLength(1);
    expect(violations[0]).toMatch(/vanished from mandatory without being served/);
  });

  it("un item servido que vuelve a ser due más tarde crea un NUEVO registro, nunca reescribe el anterior como duplicado", () => {
    const ledger = createRolloverLedger();
    const identity = { itemId: "item-4", workKind: "scheduled-review" as const, modality: "recognition" as const };
    advanceMandatoryLedger(ledger, [identity], new Set(), 0);
    advanceMandatoryLedger(ledger, [identity], new Set(["item-4"]), 0);
    expect(ledger.get("item-4")!.servedSession).toBe(0);

    // Nueva obligación futura para el mismo itemId (próxima revisión FSRS).
    const { arrivals } = advanceMandatoryLedger(ledger, [identity], new Set(), 5);
    expect(arrivals.map((r) => r.itemId)).toEqual(["item-4"]);
    expect(ledger.get("item-4")!.firstMandatorySession).toBe(5);
    expect(ledger.get("item-4")!.servedSession).toBeNull();
    expect(ledger.size).toBe(1);
  });
});

describe("Task 8.9f §3 — 20 sesiones con presión continua (test obligatorio)", () => {
  const options: SimulationOptions = {
    // 90 días calendario garantiza >=20 sesiones activas incluso para
    // "bursty" (ciclo 7 activos / 14 inactivos: ~7 activos cada 21 días).
    days: 90,
    corpusSize: 200,
    seed: 7,
    startAt: "2026-08-01T00:00:00.000Z",
    dailyBudgetSeconds: 900,
    targetNewWords: 10,
  };

  it("no produce violaciones de rollover en ninguno de los cinco perfiles durante 20+ sesiones activas", () => {
    for (const profile of Object.values(PROFILES)) {
      const audit = runMandatoryAudit(profile, options);
      const activeSessions = audit.days.length;
      expect(activeSessions).toBeGreaterThanOrEqual(20);
      expect(audit.violations).toEqual([]);

      // rolloverCount nunca negativo y latenessSessions >= 0 cuando se sirve.
      for (const record of audit.finalLedger.values()) {
        expect(record.rolloverCount).toBeGreaterThanOrEqual(0);
        if (record.servedSession !== null) {
          expect(record.latenessSessions).toBeGreaterThanOrEqual(0);
        }
      }
    }
  // 5 perfiles × 90 días activos: más pesado que el timeout global por
  // defecto (5s) bajo carga concurrente de la suite completa.
  }, 20_000);
});
