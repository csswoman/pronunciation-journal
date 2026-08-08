import { describe, expect, it } from "vitest";
import { baseSkillActivationLiveness, type EligibilityObservation } from "../criteria";

/**
 * Task 8.9-final — C9 canónico por service opportunity (docs/superpowers/
 * plans/notes/2026-08-08-fase8-c9-service-opportunity.md). Reemplaza el
 * umbral 80/20 de mandatory-saturation: una sesión cuenta para el wait de
 * una obligación base únicamente cuando, después de mandatory, hay
 * suficiente tiempo para servir esa skill —
 * `sessionAvailableSeconds >= skillCostSeconds` — medido antes de que
 * pending base/placement/new words/usage gasten nada.
 */

function observation(
  overrides: Partial<EligibilityObservation> = {},
): EligibilityObservation {
  return {
    itemId: "c1k:on#listening",
    skill: "listening",
    sessionIndex: 0,
    eligible: true,
    scheduleKind: "none",
    cumulativeAvailableSeconds: 0,
    sessionAvailableSeconds: 30,
    skillCostSeconds: 20,
    ...overrides,
  };
}

function sessions(
  count: number,
  build: (sessionIndex: number) => Partial<EligibilityObservation>,
): EligibilityObservation[] {
  return Array.from({ length: count }, (_, sessionIndex) => (
    observation({ sessionIndex, ...build(sessionIndex) })
  ));
}

describe("C9 — service opportunity (Task 8.9-final)", () => {
  it("A: una obligación existente pero ineligible no crea opportunity", () => {
    const obs = sessions(10, () => ({ eligible: false }));
    const result = baseSkillActivationLiveness(obs, 8);
    expect(result).toMatchObject({ passed: true, measured: 0 });
    expect(result.detail).toContain("skipped");
  });

  it("B/C: provisional bloqueado no cuenta y el primer unlock con segundos sí cuenta", () => {
    const obs = [
      observation({ sessionIndex: 0, eligible: false }),
      observation({ sessionIndex: 1, eligible: true }),
    ];
    const result = baseSkillActivationLiveness(obs, 8);
    expect(result).toMatchObject({ passed: true, measured: 1 });
    expect(result.detail).toContain("opportunities counted: listening=1");
  });

  it("H/I/L: source y backlog no alteran la regla de elegibilidad", () => {
    const obs = [
      observation({ itemId: "new-word#listening", sessionIndex: 0 }),
      observation({ itemId: "placement#listening", sessionIndex: 0 }),
    ];
    const result = baseSkillActivationLiveness(obs, 8);
    expect(result).toMatchObject({ passed: true, measured: 1 });
    expect(result.detail).toContain("opportunities counted: listening=2");
  });

  it("una sesión ineligible es neutral y no reinicia oportunidades previas", () => {
    const obs = sessions(10, (sessionIndex) => ({ eligible: sessionIndex !== 5 }));
    expect(baseSkillActivationLiveness(obs, 8))
      .toMatchObject({ passed: false, measured: 9 });
  });

  // A. sesión sin segundos para la skill => no incrementa wait.
  it("A: sesión sin segundos suficientes para la skill no incrementa el wait", () => {
    const obs = sessions(10, () => ({ sessionAvailableSeconds: 5, skillCostSeconds: 20 }));
    const result = baseSkillActivationLiveness(obs, 8);
    expect(result.measured).toBe(0);
    expect(result.detail).toContain("skipped");
  });

  // B. sesión con segundos suficientes => incrementa opportunity.
  it("B: sesión con segundos suficientes incrementa la cuenta de opportunity", () => {
    const obs = sessions(3, () => ({ sessionAvailableSeconds: 30, skillCostSeconds: 20 }));
    const result = baseSkillActivationLiveness(obs, 8);
    expect(result.measured).toBe(3);
    expect(result.detail).toContain("opportunities counted: listening=3");
  });

  // C. servir en la octava opportunity => PASS.
  it("C: servir exactamente en la octava opportunity => PASS", () => {
    const obs = sessions(9, (i) => (
      i === 8
        ? { scheduleKind: "fsrs" }
        : { sessionAvailableSeconds: 30, skillCostSeconds: 20 }
    ));
    const result = baseSkillActivationLiveness(obs, 8);
    expect(result).toMatchObject({ passed: true, measured: 8 });
  });

  // D. no servir tras la octava => FAIL.
  it("D: no servir tras la octava opportunity => FAIL", () => {
    const obs = sessions(9, () => ({ sessionAvailableSeconds: 30, skillCostSeconds: 20 }));
    const result = baseSkillActivationLiveness(obs, 8);
    expect(result).toMatchObject({ passed: false, measured: 9 });
  });

  // E. días inactivos no cuentan (ausencia de observación = sin efecto).
  it("E: días inactivos (sin observación) no cuentan ni resetean el wait", () => {
    // Simula 5 sesiones activas con oportunidad, un "hueco" (día inactivo,
    // no observado en absoluto — el harness ya no emite eligibility en días
    // inactivos), y 5 sesiones activas más — el wait debe seguir acumulando
    // a través del hueco sin resetear.
    const before = sessions(5, (i) => ({ sessionIndex: i, sessionAvailableSeconds: 30, skillCostSeconds: 20 }));
    const after = sessions(5, (i) => ({ sessionIndex: i + 6, sessionAvailableSeconds: 30, skillCostSeconds: 20 }));
    const obs = [...before, ...after];
    const result = baseSkillActivationLiveness(obs, 8);
    // 10 oportunidades reales observadas, el hueco (sessionIndex 5) simplemente
    // no aparece — no se cuenta ni resetea, el wait sigue acumulando.
    expect(result.measured).toBe(10);
  });

  // F. mandatory puede eliminar una opportunity legítimamente.
  it("F: mandatory saturando el budget elimina la opportunity sin penalizar", () => {
    const obs = sessions(20, () => ({ sessionAvailableSeconds: 0, skillCostSeconds: 20 }));
    const result = baseSkillActivationLiveness(obs, 8);
    expect(result).toMatchObject({ passed: true, measured: 0 });
    expect(result.detail).toContain("skipped): listening=20");
  });

  // G. placement/new words/usage no pueden eliminar una opportunity de pending base.
  it("G: el criterio no distingue quién gastó la opportunity — solo mide el estado post-mandatory", () => {
    // sessionAvailableSeconds se mide ANTES de placement/new words/usage
    // (run-simulation.ts pasa availableSeconds = budget - mandatorySelected).
    // Si esa cifra indica oportunidad, cuenta como wait sin importar qué
    // consumió el tiempo después — por diseño (encargo §4/§6): trabajo de
    // menor prioridad que le roba la oportunidad a pending base SÍ debe
    // hacer avanzar el contador de C9.
    const obs = sessions(9, () => ({ sessionAvailableSeconds: 30, skillCostSeconds: 20 }));
    const result = baseSkillActivationLiveness(obs, 8);
    expect(result).toMatchObject({ passed: false, measured: 9 });
  });

  // H. listening y production respetan sus costes distintos.
  it("H: listening y production usan costes por modalidad distintos", () => {
    // 22s disponibles: suficiente para listening (20s) pero no para
    // production (25s) — la misma sesión debe poder ser opportunity para
    // una skill y no para la otra.
    const listeningObs = sessions(5, (i) => ({
      itemId: "c1k:hcost#listening",
      skill: "listening",
      sessionIndex: i,
      sessionAvailableSeconds: 22,
      skillCostSeconds: 20,
    }));
    const productionObs = sessions(5, (i) => ({
      itemId: "c1k:hcost#production",
      skill: "production",
      sessionIndex: i,
      sessionAvailableSeconds: 22,
      skillCostSeconds: 25,
    }));
    const listening = baseSkillActivationLiveness(listeningObs, 8);
    const production = baseSkillActivationLiveness(productionObs, 8);
    expect(listening.detail).toContain("listening=5");
    expect(production.detail).toContain("production=0");
  });

  // I. no se usa threshold 80/20 como sustituto.
  it("I: una sesión con >80% de mandatory pero suficientes segundos SÍ cuenta como opportunity", () => {
    // 900s budget, mandatory consume 750s (83.3% > 80%) pero deja 150s
    // disponibles — mucho más que el coste de la skill (20s). Bajo el
    // umbral 80/20 esta sesión habría sido exenta; bajo service-opportunity
    // cuenta, porque hay capacidad real.
    const obs = sessions(9, () => ({ sessionAvailableSeconds: 150, skillCostSeconds: 20 }));
    const result = baseSkillActivationLiveness(obs, 8);
    expect(result).toMatchObject({ passed: false, measured: 9 });
    expect(result.detail).not.toContain("mandatory-saturated");
  });
});
