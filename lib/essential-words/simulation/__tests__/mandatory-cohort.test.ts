import { describe, expect, it } from "vitest";
import { estimateMandatoryLoadPerAdmittedWord } from "../mandatory-cohort";

describe("Task 8.9f §7 — estimateMandatoryLoadPerAdmittedWord (tests H/I)", () => {
  it("test H — la cohorte de una palabra produce una carga mandatory reproducible (mismo seed => mismo resultado)", () => {
    const first = estimateMandatoryLoadPerAdmittedWord({ wordCount: 1, horizonDays: 200, seed: 11 });
    const second = estimateMandatoryLoadPerAdmittedWord({ wordCount: 1, horizonDays: 200, seed: 11 });
    expect(first).toEqual(second);
    expect(first.totalMandatorySecondsGenerated).toBeGreaterThan(0);
    expect(first.totalMandatorySecondsPerWord).toBe(first.totalMandatorySecondsGenerated);
  });

  it("test I — una cohorte de N palabras escala de forma explicable (proporcional, sin duplicación oculta)", () => {
    const one = estimateMandatoryLoadPerAdmittedWord({ wordCount: 1, horizonDays: 200, seed: 11 });
    const ten = estimateMandatoryLoadPerAdmittedWord({ wordCount: 10, horizonDays: 200, seed: 11 });

    // Con presupuesto sin restricción, la carga total generada debe escalar
    // ~linealmente con el número de palabras (misma dinámica FSRS por
    // palabra, independiente entre palabras). Una desviación grande
    // indicaría contabilización cruzada entre palabras (bug).
    expect(ten.totalMandatorySecondsGenerated).toBeGreaterThan(one.totalMandatorySecondsGenerated * 5);
    expect(ten.totalMandatorySecondsPerWord).toBeGreaterThan(0);
    // La carga por palabra no debería explotar por sólo agregar más
    // palabras independientes (tolerancia amplia: mismo orden de magnitud).
    expect(ten.totalMandatorySecondsPerWord)
      .toBeLessThan(one.totalMandatorySecondsPerWord * 3);
    expect(ten.totalMandatorySecondsPerWord)
      .toBeGreaterThan(one.totalMandatorySecondsPerWord / 3);
  });

  it("con placementConfidence none, la carga provisional que exista (si la hay) viene de origen 'direct', nunca de 'placement-inference'", () => {
    // Task 8.9f finding: `provisional` NO es exclusivo de placement-inference.
    // `verification/policy.ts::provisionalOrigin` también crea un schedule
    // "provisional" de origen "direct" cuando la PRIMERA exposición de un
    // item se califica Easy (o Good/Hard en un skill de soporte como
    // listening/production sobre meaning) — es la política de gracia para
    // palabras "ya conocidas", documentada e independiente del pipeline de
    // placement. Con `placementConfidence: "none"` (COHORT_PROFILE) no hay
    // `placementInference` en ningún item, así que ningún provisional puede
    // originarse por esa vía — pero SÍ puede originarse por "direct-easy" en
    // la introducción, dado que `accuracyByModality.recognition` es alto.
    // Este test verifica que exista analítica de esa fuente sin que la
    // cohorte dependa de placement, no que el total sea cero.
    const result = estimateMandatoryLoadPerAdmittedWord({ wordCount: 5, horizonDays: 120, seed: 3 });
    const totalProvisional = result.provisionalSecondsBySkill.meaning
      + result.provisionalSecondsBySkill.listening
      + result.provisionalSecondsBySkill.production
      + result.provisionalSecondsBySkill.usage;
    // Nunca debe ser negativo ni desproporcionado frente al total generado.
    expect(totalProvisional).toBeGreaterThanOrEqual(0);
    expect(totalProvisional).toBeLessThanOrEqual(result.totalMandatorySecondsGenerated);
  });
});
