import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import CorrectionCard from "../CorrectionCard";

describe("CorrectionCard", () => {
  it("confirms a scheduled review after it was saved", () => {
    render(
      <CorrectionCard
        correction={{
          original: "I plays football",
          corrected: "I play football",
          rule: "Subject-verb agreement",
          kind: "error",
          errorPattern: "subject_verb_agreement",
          recurrenceStatus: "saved",
        }}
      />,
    );

    expect(screen.getByText("I play football")).toBeDefined();
    expect(screen.getByText(/Subject-verb agreement/)).toBeDefined();
    expect(screen.getByText(/Lo repasarás en tu práctica/)).toBeDefined();
  });

  it("does not promise a review when there is no persistence result", () => {
    render(
      <CorrectionCard
        correction={{
          original: "I plays football",
          corrected: "I play football",
          rule: "Subject-verb agreement",
          kind: "error",
          errorPattern: "subject_verb_agreement",
        }}
      />,
    );

    expect(screen.getByText(/Patrón detectado/)).toBeDefined();
    expect(screen.queryByText(/Lo repasarás en tu práctica/)).toBeNull();
  });

  it("explains when saving the review failed", () => {
    render(
      <CorrectionCard
        correction={{
          original: "I plays football",
          corrected: "I play football",
          rule: "Subject-verb agreement",
          kind: "error",
          errorPattern: "subject_verb_agreement",
          recurrenceStatus: "failed",
        }}
      />,
    );

    expect(screen.getByText(/No se pudo guardar el repaso/)).toBeDefined();
  });
});
