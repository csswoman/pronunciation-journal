import { describe, it, expect } from "vitest";
import { buildMissionPrompt } from "../missions/prompts";
import { getMission } from "../missions/registry";
import { BASE_TUTOR_PROMPT } from "../prompts";

const MISSION_IDS = ["roleplay.interview", "roleplay.cafe", "roleplay.airport", "roleplay.doctor", "roleplay.store"] as const;

function buildPrompt(missionId: typeof MISSION_IDS[number], compact?: string) {
  return buildMissionPrompt(getMission(missionId)!, compact);
}

describe("buildMissionPrompt", () => {
  it.each(MISSION_IDS)("includes BASE_TUTOR_PROMPT for mission %s", (missionId) => {
    const prompt = buildPrompt(missionId);
    expect(prompt).toContain(BASE_TUTOR_PROMPT.slice(0, 40));
  });

  it.each(MISSION_IDS)("includes the mission id uppercased for %s", (missionId) => {
    const prompt = buildPrompt(missionId);
    expect(prompt).toContain(missionId.toUpperCase());
  });

  it("includes compactState when provided", () => {
    const compact = "Student: B1, conf 0.7\nWeak grammar: articles(40%)";
    const prompt = buildPrompt("roleplay.cafe", compact);
    expect(prompt).toContain(compact);
    expect(prompt).toContain("STUDENT PROFILE");
  });

  it("omits STUDENT PROFILE section when compact is not provided", () => {
    const prompt = buildPrompt("roleplay.interview");
    expect(prompt).not.toContain("STUDENT PROFILE");
  });

  it("scenario-specific content: interview asks candidate to introduce themselves", () => {
    const prompt = buildPrompt("roleplay.interview");
    expect(prompt).toMatch(/introduc/i);
  });

  it("scenario-specific content: cafe mentions barista", () => {
    const prompt = buildPrompt("roleplay.cafe");
    expect(prompt).toMatch(/barista/i);
  });

  it("scenario-specific content: airport mentions check-in", () => {
    const prompt = buildPrompt("roleplay.airport");
    expect(prompt).toMatch(/check-in|airline/i);
  });

  it("scenario-specific content: doctor mentions symptoms", () => {
    const prompt = buildPrompt("roleplay.doctor");
    expect(prompt).toMatch(/symptom/i);
  });

  it("scenario-specific content: store mentions clothing or customer", () => {
    const prompt = buildPrompt("roleplay.store");
    expect(prompt).toMatch(/clothing|customer/i);
  });
});
