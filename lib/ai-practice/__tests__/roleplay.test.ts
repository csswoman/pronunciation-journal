import { describe, it, expect } from "vitest";
import { buildRoleplayPrompt, type RoleplayScenario } from "../modes/roleplay";
import { BASE_TUTOR_PROMPT } from "../prompts";

const SCENARIOS: RoleplayScenario[] = ["interview", "cafe", "airport", "doctor", "store"];

describe("buildRoleplayPrompt", () => {
  it.each(SCENARIOS)("includes BASE_TUTOR_PROMPT for scenario %s", (scenario) => {
    const prompt = buildRoleplayPrompt(scenario);
    expect(prompt).toContain(BASE_TUTOR_PROMPT.slice(0, 40));
  });

  it.each(SCENARIOS)("includes the scenario name uppercased for %s", (scenario) => {
    const prompt = buildRoleplayPrompt(scenario);
    expect(prompt).toContain(scenario.toUpperCase());
  });

  it("includes compactState when provided", () => {
    const compact = "Student: B1, conf 0.7\nWeak grammar: articles(40%)";
    const prompt = buildRoleplayPrompt("cafe", compact);
    expect(prompt).toContain(compact);
    expect(prompt).toContain("STUDENT PROFILE");
  });

  it("omits STUDENT PROFILE section when compact is not provided", () => {
    const prompt = buildRoleplayPrompt("interview");
    expect(prompt).not.toContain("STUDENT PROFILE");
  });

  it("scenario-specific content: interview asks candidate to introduce themselves", () => {
    const prompt = buildRoleplayPrompt("interview");
    expect(prompt).toMatch(/introduc/i);
  });

  it("scenario-specific content: cafe mentions barista", () => {
    const prompt = buildRoleplayPrompt("cafe");
    expect(prompt).toMatch(/barista/i);
  });

  it("scenario-specific content: airport mentions check-in", () => {
    const prompt = buildRoleplayPrompt("airport");
    expect(prompt).toMatch(/check-in|airline/i);
  });

  it("scenario-specific content: doctor mentions symptoms", () => {
    const prompt = buildRoleplayPrompt("doctor");
    expect(prompt).toMatch(/symptom/i);
  });

  it("scenario-specific content: store mentions clothing or customer", () => {
    const prompt = buildRoleplayPrompt("store");
    expect(prompt).toMatch(/clothing|customer/i);
  });
});
