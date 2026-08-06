import { describe, expect, it } from "vitest";
import { deriveObservations } from "../policy";
import type { AttemptAssessment, AttemptModality } from "../types";

const assess = (
  modality: AttemptModality,
  correct: boolean,
): AttemptAssessment => ({
  grade: correct ? "Good" : "Again",
  modality,
  correct,
  latencyMs: 3_000,
  interactionDurationMs: 9_000,
  usedHints: false,
  rescued: false,
  acceptedVariant: false,
  firstTryFailed: false,
  freeAudioReplays: 0,
});

const NOW = new Date("2026-08-06T10:00:00.000Z");

const skillsOf = (assessment: AttemptAssessment) =>
  deriveObservations(assessment, NOW).map((observation) => observation.skill).sort();

describe("deriveObservations — qué habilidades evaluó el intento", () => {
  it("producción observa meaning y production", () => {
    expect(skillsOf(assess("production", true))).toEqual(["meaning", "production"]);
  });

  it("escucha observa meaning y listening", () => {
    expect(skillsOf(assess("listening", true))).toEqual(["listening", "meaning"]);
  });

  it("reconocimiento observa solo meaning", () => {
    expect(skillsOf(assess("recognition", true))).toEqual(["meaning"]);
  });

  it("pronunciación observa production, nunca listening", () => {
    const skills = skillsOf(assess("pronunciation", true));
    expect(skills).toEqual(["production"]);
    expect(skills).not.toContain("listening");
  });

  it("una prueba textual nunca acredita listening", () => {
    for (const modality of ["production", "recognition"] as const) {
      expect(skillsOf(assess(modality, true))).not.toContain("listening");
    }
  });

  it("una prueba auditiva nunca acredita production", () => {
    expect(skillsOf(assess("listening", true))).not.toContain("production");
  });
});

describe("deriveObservations — signo", () => {
  it("una respuesta correcta da outcome success", () => {
    const observations = deriveObservations(assess("production", true), NOW);
    expect(observations.every((observation) => observation.outcome === "success")).toBe(true);
  });

  it("un fallo observa las mismas habilidades, con failure", () => {
    const successfulSkills = skillsOf(assess("production", true));
    const failedSkills = skillsOf(assess("production", false));

    expect(failedSkills).toEqual(successfulSkills);
    expect(deriveObservations(assess("production", false), NOW)
      .every((observation) => observation.outcome === "failure")).toBe(true);
  });

  it("un fallo de producción sigue sin observar listening", () => {
    expect(skillsOf(assess("production", false))).not.toContain("listening");
  });

  it("un Again nunca deja la lista vacía", () => {
    expect(deriveObservations(assess("listening", false), NOW)).toHaveLength(2);
  });
});

describe("deriveObservations — procedencia", () => {
  it("marca source direct y basis attempt con su modalidad", () => {
    const [first] = deriveObservations(assess("listening", true), NOW);
    expect(first.source).toBe("direct");
    expect(first.basis).toEqual({ kind: "attempt", modality: "listening" });
  });

  it("la evidencia directa tiene confianza 1", () => {
    expect(deriveObservations(assess("production", true), NOW)[0].evidenceConfidence).toBe(1);
  });

  it("observedAt viene del reloj inyectado", () => {
    const [first] = deriveObservations(assess("production", true), NOW);
    expect(first.observedAt).toBe(NOW.toISOString());
  });
});
