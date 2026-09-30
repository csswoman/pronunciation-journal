// @vitest-environment jsdom
import { describe, it, expect, vi } from "vitest";
import { fireEvent, render, screen } from "@testing-library/react";
import CorrectionCard from "../CorrectionCard";

const { reportWrongFeedbackMock } = vi.hoisted(() => ({
  reportWrongFeedbackMock: vi.fn(async () => ({ id: "report-1" })),
}));

vi.mock("@/lib/ai-feedback/report", () => ({
  reportWrongFeedback: reportWrongFeedbackMock,
}));
vi.mock("@/components/auth/AuthProvider", () => ({
  useAuthOptional: () => ({ user: { id: "user-test" } }),
}));

describe("CorrectionCard", () => {
  it("renders correction and report button", () => {
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
    expect(screen.getByRole("button", { name: "¿Corrección equivocada?" })).toBeDefined();
  });

  it("does not promise a review when the pattern was not recorded", () => {
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

  it("removes the scheduled-review claim after the learner reports the correction", async () => {
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

    fireEvent.click(screen.getByRole("button", { name: "¿Corrección equivocada?" }));
    fireEvent.click(screen.getByRole("button", { name: "Enviar reporte" }));

    expect(await screen.findByRole("status")).toHaveTextContent("Gracias, no lo contaremos como error");
    expect(screen.queryByText(/Lo repasarás en tu práctica/)).toBeNull();
    expect(reportWrongFeedbackMock).toHaveBeenCalledTimes(1);
  });
});
