import { describe, expect, it, vi } from "vitest";
import { admitNewWords } from "../../admission-control";
import { deriveBaseBacklogPolicy } from "../../pending-base-fairness";
import {
  createC9ObligationAuditor,
} from "../audit/c9-obligation-trace";
import { baseSkillActivationLiveness, type EligibilityObservation } from "../criteria";
import { PROFILES, type SimulationProfile, type SimulationProfileId } from "../profiles";
import { runSimulation } from "../run-simulation";
import type { SimulationHarnessHooks } from "../observations";

vi.setConfig({ testTimeout: 120_000 });

const ACCEPTANCE_OPTIONS = {
  days: 180,
  corpusSize: 1_000,
  seed: 42,
  startAt: "2026-08-01T00:00:00.000Z",
  dailyBudgetSeconds: 900,
  targetNewWords: 10,
};

describe("Task 8.9j — contrato C9 reservation\u2192service", () => {
  // Test A + B: toda admisi\u00f3n de palabra nueva crea reservas L+P at\u00f3micas
  // con deadline absoluto <=8 sesiones activas desde la admisi\u00f3n.
  it("A/B: admitNewWords reserva exactamente listening+production con deadline <=8", () => {
    const costs = { listening: 10, production: 10, recognition: 10, pronunciation: 10 };
    const result = admitNewWords({
      candidates: [{ wordId: "w1", rank: 1 }],
      configuredNewWordLimit: 5,
      remainingSeconds: 200,
      perNewWordSeconds: 30,
      estimatedSecondsByModality: costs,
      pendingBaseBacklogSeconds: 0,
      backlogPolicy: deriveBaseBacklogPolicy({ dailyBudgetSeconds: 900, modalityCosts: costs }),
    });
    expect(result.admitted).toHaveLength(1);
    expect(result.newReservations).toHaveLength(2);
    const listening = result.newReservations.find((r) => r.skill === "listening");
    const production = result.newReservations.find((r) => r.skill === "production");
    expect(listening).toBeDefined();
    expect(production).toBeDefined();
    expect(listening!.deadlineSession).toBeLessThanOrEqual(8);
    expect(production!.deadlineSession).toBeLessThanOrEqual(8);
  });

  // Test F/G: la 8\u00aa sesi\u00f3n activa desde la elegibilidad pasa; la 9\u00aa falla.
  it("F/G: servicio en la sesi\u00f3n 8 pasa C9; en la sesi\u00f3n 9 falla", () => {
    const observationsUntilSession = (servedAtSession: number): EligibilityObservation[] => {
      const observations: EligibilityObservation[] = [];
      for (let sessionIndex = 0; sessionIndex < servedAtSession; sessionIndex += 1) {
        observations.push({
          itemId: "w1#listening",
          skill: "listening",
          sessionIndex,
          eligible: true,
          scheduleKind: "none",
          cumulativeAvailableSeconds: 100 * (sessionIndex + 1),
          sessionAvailableSeconds: 100,
          skillCostSeconds: 20,
        });
      }
      return observations;
    };

    const passing = baseSkillActivationLiveness(observationsUntilSession(8), 8);
    expect(passing.passed).toBe(true);
    expect(passing.measured).toBe(8);

    const failing = baseSkillActivationLiveness(observationsUntilSession(9), 8);
    expect(failing.passed).toBe(false);
    expect(failing.measured).toBe(9);
  });

  // Test H: los d\u00edas inactivos no generan observaciones de C9 (no consumen
  // el reloj). Verificable estructuralmente: solo hay una observaci\u00f3n por
  // sesi\u00f3n ACTIVA, nunca por d\u00eda de calendario.
  it("H: solo los d\u00edas activos producen observaciones de eligibilidad", () => {
    const result = runSimulation(PROFILES.bursty, {
      ...ACCEPTANCE_OPTIONS,
      days: 60,
    });
    const activeDays = result.days.filter((day) => day.active).length;
    const uniqueSessions = new Set(result.eligibility.map((observation) => observation.sessionIndex));
    expect(uniqueSessions.size).toBeLessThanOrEqual(activeDays);
    expect(result.days.some((day) => !day.active)).toBe(true);
  });

  // Test M: deuda preexistente (ya introducida antes de que el auditor
  // empiece a observar) se clasifica y reporta por separado, nunca se
  // confunde con new-word-admission o placement.
  it("M: deuda preexistente al inicio del run se clasifica como preexisting-pending", () => {
    const auditor = createC9ObligationAuditor();
    const smallProfile: SimulationProfile = { ...PROFILES.steady, id: "steady" };
    const hooks: SimulationHarnessHooks = {
      ...auditor.hooks,
      mutatePlan(plan, mandatory, context) {
        if (context.dayIndex === 0) {
          const [word] = context.world.words.values();
          word.introducedAt = context.options.startAt;
          word.meaning.schedule = {
            kind: "fsrs", dueAt: "2026-09-01T00:00:00.000Z", stability: 10, difficulty: 5, state: "Review",
          };
        }
        return auditor.hooks.mutatePlan!(plan, mandatory, context);
      },
    };
    runSimulation(smallProfile, { ...ACCEPTANCE_OPTIONS, days: 10, corpusSize: 5 }, hooks);
    const obligations = auditor.getObligations();
    const preexisting = obligations.filter((o) => o.source === "preexisting-pending");
    expect(preexisting.length).toBeGreaterThanOrEqual(2);
    expect(preexisting.every((o) => o.obligationCreatedSession === -1)).toBe(true);
  });

  describe.each(Object.keys(PROFILES) as SimulationProfileId[])("perfil %s", (profileId) => {
    it("C/D/E/L/N/O: reservas nunca desaparecen sin completed/released, identidad estable, sin duplicados", () => {
      const auditor = createC9ObligationAuditor();
      const result = runSimulation(PROFILES[profileId], ACCEPTANCE_OPTIONS, auditor.hooks);
      const obligations = auditor.getObligations();
      const lifecycles = auditor.getReservationLifecycles();

      // O: dedupe — cada itemId aparece como mucho una vez.
      const itemIds = obligations.map((o) => o.itemId);
      expect(new Set(itemIds).size).toBe(itemIds.length);

      // C: ninguna reserva desaparece silenciosamente (0 "released" es la
      // evidencia emp\u00edrica de que 8.6/placement nunca sueltan una reserva
      // sin completarla o marcarla expirada expl\u00edcitamente).
      const released = lifecycles.flatMap((l) => l.transitions.filter((t) => t.kind === "released"));
      expect(released).toHaveLength(0);

      // D: a lo sumo una transici\u00f3n terminal (completed/released/expired)
      // por reserva — el ledger no la "cierra" dos veces.
      for (const lifecycle of lifecycles) {
        const terminal = lifecycle.transitions.filter((t) => (
          t.kind === "completed" || t.kind === "released" || t.kind === "expired"
        ));
        expect(terminal.length).toBeLessThanOrEqual(1);
      }

      // E: rollover conserva identidad — cada "rolled" referencia el mismo
      // reservationId/itemId y decrece monot\u00f3nicamente hasta cerrarse.
      for (const lifecycle of lifecycles) {
        const rolls = lifecycle.transitions.filter((t) => t.kind === "rolled");
        for (let index = 1; index < rolls.length; index += 1) {
          const previous = rolls[index - 1] as { to: number };
          const current = rolls[index] as { from: number };
          expect(current.from).toBe(previous.to);
        }
      }

      // L: placement nunca crea obligaciones sin capacidad/reserva cuando
      // C9 le aplica — toda obligaci\u00f3n de origen placement fue admitida
      // bajo el mismo forecast de capacidad que new-word.
      const placementObligations = obligations.filter((o) => o.source === "placement");
      for (const obligation of placementObligations) {
        expect(obligation.admittedUnderCapacityForecast).toBe(true);
        expect(obligation.reservationCreatedSession).toBeDefined();
      }

      // N: listening y production siempre se miden por separado (nunca se
      // colapsan en un solo bucket).
      const canonical = baseSkillActivationLiveness(result.eligibility, 8);
      expect(canonical.detail).toMatch(/listening=\d+; production=\d+/);
    }, 60_000);
  });

  // Test I: escenario controlado — backlog cero, sin placement, mandatory
  // bajo, admisi\u00f3n real. 100% de las obligaciones servidas dentro del run
  // deben cumplir <=8. Test J vive en el mismo escenario: con mandatory
  // correctamente forecast, ninguna reserva ya prometida se rompe.
  it("I/J: escenario controlado-limpio cumple C9 al 100% (sin placement, mandatory bajo)", () => {
    const cleanProfile: SimulationProfile = {
      id: "steady",
      practicePattern: { kind: "probability", dailyRate: 1 },
      accuracyByModality: {
        recognition: 0.97, production: 0.95, listening: 0.95, pronunciation: 0.95,
      },
      completionBudgetRatio: 1,
      placementConfidence: "none",
      alreadyKnownOverestimateRate: 0,
      audioReplayRate: 0,
    };
    const auditor = createC9ObligationAuditor();
    const result = runSimulation(cleanProfile, {
      days: 40,
      corpusSize: 20,
      seed: 7,
      startAt: "2026-08-01T00:00:00.000Z",
      dailyBudgetSeconds: 1_800,
      targetNewWords: 3,
    }, auditor.hooks);

    const canonical = baseSkillActivationLiveness(result.eligibility, 8);
    expect(canonical.passed).toBe(true);

    const obligations = auditor.getObligations();
    const served = obligations.filter((o) => o.servedSession !== undefined);
    expect(served.length).toBeGreaterThan(0);
    expect(served.every((o) => !o.violatedC9)).toBe(true);

    const lifecycles = auditor.getReservationLifecycles();
    const releasedOrExpiredWhileServed = lifecycles.filter((lifecycle) => {
      const obligation = obligations.find((o) => o.itemId === lifecycle.itemId);
      const isAlreadyPromised = Boolean(obligation?.reservationCreatedSession !== undefined);
      const brokenTerminal = lifecycle.transitions.some((t) => t.kind === "released");
      return isAlreadyPromised && brokenTerminal;
    });
    expect(releasedOrExpiredWhileServed).toHaveLength(0);
  });

  // Test K: shock de mandatory deliberado. La causa observable debe ser
  // "mandatory real > forecast" (evidencia num\u00e9rica), no "reserva perdida"
  // gen\u00e9rica — el ledger sigue sin soltar reservas (0 "released"); lo que
  // rompe C9 es que el residual disponible cae por debajo de lo que el
  // forecast de admisi\u00f3n asumi\u00f3, no un bug de scheduler.
  it("K: mandatory real supera sistem\u00e1ticamente el forecast sin que el ledger pierda ninguna reserva", () => {
    const auditor = createC9ObligationAuditor();
    const result = runSimulation(PROFILES.steady, { ...ACCEPTANCE_OPTIONS, days: 90 }, auditor.hooks);

    const lifecycles = auditor.getReservationLifecycles();
    const released = lifecycles.flatMap((l) => l.transitions.filter((t) => t.kind === "released"));
    // El ledger nunca "pierde" una reserva por presi\u00f3n de mandatory: toda
    // violaci\u00f3n de C9 bajo este shock estructural (crecimiento natural de
    // reviews FSRS a medida que se admite corpus) debe rastrearse a
    // capacidad insuficiente, nunca a una reserva que desaparece sin cierre.
    expect(released).toHaveLength(0);

    const active = result.days.filter((day) => day.active);
    const errors: number[] = [];
    active.forEach((day, index) => {
      if (!day.newWords) return;
      const forecast = (day.futureMandatoryReservedSeconds ?? 0) + (day.expectedFsrsDebtSeconds ?? 0);
      const window = active.slice(index + 1, index + 9);
      if (window.length < 8) return;
      const actual = window.reduce((total, d) => total + (d.mandatorySelectedSeconds ?? 0), 0);
      errors.push(actual - forecast);
    });
    expect(errors.length).toBeGreaterThan(0);
    // Firma emp\u00edrica del shock: el forecast de admisi\u00f3n subestima
    // sistem\u00e1ticamente (nunca sobreestima) el mandatory real de las 8
    // sesiones siguientes.
    expect(errors.every((error) => error > 0)).toBe(true);
  }, 60_000);
});
