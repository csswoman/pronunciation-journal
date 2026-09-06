import { describe, it, expect } from "vitest";
import { buildSessionSummaryPrompt } from "@/lib/ai-prompts";

describe("buildSessionSummaryPrompt", () => {
  it("asks for the summary tool by name", () => {
    expect(buildSessionSummaryPrompt()).toContain("render_session_summary");
  });

  it("forbids inventing content that did not come up", () => {
    expect(buildSessionSummaryPrompt()).toMatch(/do not invent|only.*actually/i);
  });

  it("forbids continuing the conversation afterwards", () => {
    expect(buildSessionSummaryPrompt()).toMatch(/do not ask another question/i);
  });
});
