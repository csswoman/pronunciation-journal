// @vitest-environment jsdom
import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import { ReportWrongFeedbackButton } from "../ReportWrongFeedbackButton";
import * as reportModule from "@/lib/ai-feedback/report";

const authState = vi.hoisted(() => ({
  userId: "user-123" as string | null,
  loading: false,
}));

vi.mock("@/lib/ai-feedback/report", () => ({
  reportWrongFeedback: vi.fn().mockResolvedValue({ id: "rep-1" }),
}));

vi.mock("@/components/auth/AuthProvider", () => ({
  useAuthOptional: () => ({
    user: authState.userId ? { id: authState.userId } : null,
    loading: authState.loading,
  }),
}));

describe("ReportWrongFeedbackButton", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    authState.userId = "user-123";
    authState.loading = false;
  });

  it("renders trigger button and opens form on click", () => {
    render(
      <ReportWrongFeedbackButton
        feature="coach_correction"
        input="I has a question"
        output="I have a question"
        errorPattern="subject_verb_agreement"
      />,
    );

    const trigger = screen.getByRole("button", { name: "¿Corrección equivocada?" });
    expect(trigger).toBeDefined();

    fireEvent.click(trigger);

    expect(screen.getByPlaceholderText(/Ej: es una expresión válida/)).toBeDefined();
    expect(screen.getByRole("button", { name: "Enviar reporte" })).toBeDefined();
  });

  it("submits report with comment and shows coach confirmation", async () => {
    render(
      <ReportWrongFeedbackButton
        feature="coach_correction"
        input="I has a question"
        output="I have a question"
        errorPattern="subject_verb_agreement"
      />,
    );

    fireEvent.click(screen.getByRole("button", { name: "¿Corrección equivocada?" }));
    const input = screen.getByPlaceholderText(/Ej: es una expresión válida/);
    fireEvent.change(input, { target: { value: "Fue un error tipográfico" } });

    fireEvent.click(screen.getByRole("button", { name: "Enviar reporte" }));

    expect(reportModule.reportWrongFeedback).toHaveBeenCalledWith({
      userId: "user-123",
      feature: "coach_correction",
      promptVersion: "v1",
      input: "I has a question",
      output: "I have a question",
      errorPattern: "subject_verb_agreement",
      comment: "Fue un error tipográfico",
    });

    const confirmation = await screen.findByText("Gracias, no lo contaremos como error");
    expect(confirmation).toBeDefined();
    expect(screen.queryByRole("button", { name: "¿Corrección equivocada?" })).toBeNull();
  });

  it("shows journal-specific confirmation for journal_correction", async () => {
    render(
      <ReportWrongFeedbackButton
        feature="journal_correction"
        input="I went to the store yesterday"
        output="Correction note"
      />,
    );

    fireEvent.click(screen.getByRole("button", { name: "¿Corrección equivocada?" }));
    fireEvent.click(screen.getByRole("button", { name: "Enviar reporte" }));

    expect(reportModule.reportWrongFeedback).toHaveBeenCalledWith(
      expect.objectContaining({
        feature: "journal_correction",
      }),
    );

    const confirmation = await screen.findByText("Gracias, lo revisaremos");
    expect(confirmation).toBeDefined();
  });

  it("does not offer reporting before an authenticated account is available", () => {
    authState.userId = null;

    render(
      <ReportWrongFeedbackButton
        feature="coach_correction"
        input="I has a question"
        output="I have a question"
      />,
    );

    expect(screen.getByText("Inicia sesión para reportar")).toBeDefined();
    expect(screen.queryByRole("button", { name: "¿Corrección equivocada?" })).toBeNull();
    expect(reportModule.reportWrongFeedback).not.toHaveBeenCalled();
  });

  it("shows a retry message when local persistence fails", async () => {
    vi.mocked(reportModule.reportWrongFeedback).mockRejectedValueOnce(
      new Error("IndexedDB unavailable"),
    );
    render(
      <ReportWrongFeedbackButton
        feature="coach_correction"
        input="I has a question"
        output="I have a question"
      />,
    );

    fireEvent.click(screen.getByRole("button", { name: "¿Corrección equivocada?" }));
    fireEvent.click(screen.getByRole("button", { name: "Enviar reporte" }));

    expect(
      await screen.findByRole("alert"),
    ).toHaveTextContent("No se pudo guardar el reporte. Inténtalo otra vez.");
    expect(screen.getByRole("button", { name: "Enviar reporte" })).toBeEnabled();
  });
});
