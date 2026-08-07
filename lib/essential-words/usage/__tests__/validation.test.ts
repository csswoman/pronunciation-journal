import { describe, expect, it } from "vitest";
import { validateUsagePayload, type NonAppearanceReason } from "../validation";
import type { UsagePayload } from "../../verification/types";

const valid = (over: Partial<UsagePayload> = {}): UsagePayload => ({
  usageKind: "advanced_usage",
  expression: "depend on",
  sentence: "The result depends on the weather.",
  acceptedVariants: ["depends on"],
  generationStatus: "ready",
  metadata: { schemaVersion: 1 },
  ...over,
});

describe("validateUsagePayload", () => {
  it("acepta un payload correcto", () => {
    expect(validateUsagePayload(valid(), [])).toEqual({ ok: true });
  });

  it("rechaza si la frase no contiene la expresión", () => {
    const result = validateUsagePayload(
      valid({ sentence: "The weather is nice today." }),
      [],
    );
    expect(result.ok).toBe(false);
  });

  it("rechaza un payload sin generar", () => {
    const result = validateUsagePayload(valid({ generationStatus: "pending" }), []);
    expect(result.ok).toBe(false);
    if (!result.ok) expect(result.reason).toBe("not_generated");
  });

  it("rechaza una generación fallida", () => {
    const result = validateUsagePayload(valid({ generationStatus: "failed" }), []);
    if (!result.ok) expect(result.reason).toBe("generation_failed");
  });

  it("rechaza un duplicado de un ítem existente", () => {
    const result = validateUsagePayload(valid(), ["depend on"]);
    expect(result.ok).toBe(false);
    if (!result.ok) expect(result.reason).toBe("invalid_content");
  });

  it("rechaza una frase demasiado corta para evaluar el uso", () => {
    const result = validateUsagePayload(valid({ sentence: "Depend on." }), []);
    expect(result.ok).toBe(false);
  });

  it("exige schemaVersion: una actualización del generador invalida lo viejo", () => {
    const noVersion = { ...valid(), metadata: {} } as UsagePayload;
    expect(validateUsagePayload(noVersion, []).ok).toBe(false);
  });
});

describe("motivos de no-aparición", () => {
  it("cubre los cinco casos de la spec", () => {
    const reasons: NonAppearanceReason[] = [
      "not_generated",
      "generation_failed",
      "offline",
      "invalid_content",
      "daily_capacity_reached",
    ];
    expect(reasons).toHaveLength(5);
  });
});
