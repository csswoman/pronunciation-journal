import { describe, expect, it } from "vitest";
import { isSkillModelEnabled } from "../feature-flags";

describe("isSkillModelEnabled", () => {
  it("está apagado por defecto", () => {
    expect(isSkillModelEnabled({})).toBe(false);
  });

  it("se enciende solo con el string exacto 'true'", () => {
    expect(isSkillModelEnabled({ NEXT_PUBLIC_SKILL_MODEL: "true" })).toBe(true);
    expect(isSkillModelEnabled({ NEXT_PUBLIC_SKILL_MODEL: "1" })).toBe(false);
    expect(isSkillModelEnabled({ NEXT_PUBLIC_SKILL_MODEL: "yes" })).toBe(false);
    expect(isSkillModelEnabled({ NEXT_PUBLIC_SKILL_MODEL: "TRUE" })).toBe(false);
  });

  it("un valor vacío no lo enciende", () => {
    expect(isSkillModelEnabled({ NEXT_PUBLIC_SKILL_MODEL: "" })).toBe(false);
  });
});
