// @vitest-environment jsdom
import { describe, it, expect, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import { JournalFeedbackView } from "../JournalFeedbackView";

vi.mock("@/components/auth/AuthProvider", () => ({
  useAuthOptional: () => ({ user: { id: "user-journal" } }),
}));

describe("JournalFeedbackView", () => {
  it("renders errors with report wrong feedback buttons", () => {
    render(
      <JournalFeedbackView
        originalContent="Yesterday I go to market."
        correctedContent="Yesterday I went to the market."
        feedback={{
          errors: [
            {
              type: "grammar",
              topic: "past-simple",
              quote: "I go",
              correction: "I went",
              explanationEs: "Usa el pasado simple para acciones terminadas.",
            },
          ],
          newWords: [],
          scheduledTopics: [],
        }}
      />,
    );

    expect(screen.getByText("Yesterday I went to the market.")).toBeDefined();
    expect(screen.getByText("1 detalle para notar")).toBeDefined();
    expect(screen.getByText("I went")).toBeDefined();
    expect(screen.getByText("Usa el pasado simple para acciones terminadas.")).toBeDefined();
    expect(screen.getByRole("button", { name: "¿Corrección equivocada?" })).toBeDefined();
  });
});
