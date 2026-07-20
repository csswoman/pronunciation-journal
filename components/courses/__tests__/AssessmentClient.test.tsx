// @vitest-environment jsdom
import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import AssessmentClient from "../AssessmentClient";
import type { AssessmentQuestion } from "@/lib/courses/assessment";
import type { AssessmentConcept } from "@/lib/courses/concept-profile";

const persistAssessmentConceptProfileMock = vi.fn();

vi.mock("@/lib/courses/assessment-profile", () => ({
  persistAssessmentConceptProfile: (...args: unknown[]) => persistAssessmentConceptProfileMock(...args),
}));

vi.mock("next/link", () => ({
  default: ({ children, href, ...props }: React.ComponentProps<"a">) => (
    <a href={String(href)} {...props}>{children}</a>
  ),
}));

const fetchMock = vi.fn();

const questions: AssessmentQuestion[] = [
  {
    id: "a1:topic-one",
    level: "a1",
    lessonSlug: "a1-topic-one",
    prompt: "Choose one",
    options: ["Wrong", "Right"],
    answer: 1,
  },
];

const placementQuestions: AssessmentQuestion[] = [
  ...questions,
  {
    id: "a2:topic-two",
    level: "a2",
    lessonSlug: "a2-topic-two",
    prompt: "Choose two",
    options: ["Wrong again", "Right again"],
    answer: 1,
  },
];

const concepts: AssessmentConcept[] = [
  { lessonSlug: "a1-topic-one", level: "a1", title: "Present simple", goal: "Hablar de hábitos." },
  { lessonSlug: "a2-topic-two", level: "a2", title: "Past simple", goal: "Hablar del pasado." },
];

describe("AssessmentClient", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.stubGlobal("fetch", fetchMock);
    window.scrollTo = vi.fn();
    const store = new Map<string, string>();
    Object.defineProperty(window, "localStorage", {
      configurable: true,
      value: {
        clear: () => store.clear(),
        getItem: (key: string) => store.get(key) ?? null,
        setItem: (key: string, value: string) => store.set(key, value),
        removeItem: (key: string) => store.delete(key),
      },
    });
    fetchMock.mockResolvedValue({ ok: true });
    persistAssessmentConceptProfileMock.mockResolvedValue(undefined);
    window.localStorage.clear();
  });

  it("requires every concept rating before starting placement questions", () => {
    render(<AssessmentClient mode="placement" questions={placementQuestions} concepts={concepts} />);

    const continueButton = screen.getByRole("button", { name: "Comprobar con preguntas" });
    expect(screen.getByRole("heading", { name: "¿Qué temas ya conoces?" })).toBeInTheDocument();
    expect(continueButton).toBeDisabled();
    expect(screen.queryByText("Choose one")).not.toBeInTheDocument();

    fireEvent.click(screen.getByRole("radio", { name: "Me suena" }));

    expect(continueButton).toBeEnabled();
    expect(screen.getByRole("progressbar")).toHaveAttribute("aria-label", "Temas valorados");
  });

  it("returns to the concept inventory when placement advances a level", () => {
    render(<AssessmentClient mode="placement" questions={placementQuestions} concepts={concepts} />);

    fireEvent.click(screen.getByRole("radio", { name: "Lo uso" }));
    fireEvent.click(screen.getByRole("button", { name: "Comprobar con preguntas" }));
    fireEvent.click(screen.getByText("Right"));
    fireEvent.click(screen.getByRole("button", { name: "Continuar" }));

    expect(screen.getByText("Past simple")).toBeInTheDocument();
    expect(screen.queryByText("Choose two")).not.toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Comprobar con preguntas" })).toBeDisabled();
  });

  it("keeps submission disabled until every question is answered", () => {
    render(<AssessmentClient mode="checkpoint" checkpointLabel="A1" questions={questions} userId="user-1" />);

    const submit = screen.getByRole("button", { name: "Ver resultado" });
    expect(submit).toBeDisabled();

    fireEvent.click(screen.getByText("Right"));
    expect(submit).toBeEnabled();
    expect(screen.getByRole("progressbar")).toHaveAttribute("aria-valuenow", "1");
  });

  it("promotes the learner and persists the new level after a passed checkpoint", async () => {
    render(<AssessmentClient mode="checkpoint" checkpointLabel="A1" questions={questions} userId="user-1" />);

    fireEvent.click(screen.getByText("Right"));
    fireEvent.click(screen.getByRole("button", { name: "Ver resultado" }));

    expect(screen.getByRole("heading", { name: "Avanzas a A2" })).toBeInTheDocument();
    expect(screen.getByText("topic one")).toBeInTheDocument();
    await waitFor(() => expect(fetchMock).toHaveBeenCalledTimes(1));
    expect(fetchMock).toHaveBeenCalledWith(
      "/api/assessment/results",
      expect.objectContaining({
        method: "POST",
      }),
    );
    expect(persistAssessmentConceptProfileMock).toHaveBeenCalledWith("user-1", [], "A2");
    expect(window.localStorage.getItem("assessment:user-1:checkpoint:A1")).toContain('"assignedLevel":"A2"');
  });

  it("offers retry when saving the result fails", async () => {
    fetchMock
      .mockResolvedValueOnce({ ok: false })
      .mockResolvedValueOnce({ ok: true });
    render(<AssessmentClient mode="checkpoint" checkpointLabel="A1" questions={questions} userId="user-1" />);

    fireEvent.click(screen.getByText("Right"));
    fireEvent.click(screen.getByRole("button", { name: "Ver resultado" }));

    const retry = await screen.findByRole("button", { name: "Reintentar" });
    fireEvent.click(retry);

    await waitFor(() => expect(fetchMock).toHaveBeenCalledTimes(2));
    await waitFor(() => expect(screen.queryByRole("button", { name: "Reintentar" })).not.toBeInTheDocument());
  });

  it("completes as a guest without calling authenticated persistence", () => {
    render(<AssessmentClient mode="checkpoint" checkpointLabel="A1" questions={questions} />);

    fireEvent.click(screen.getByText("Right"));
    fireEvent.click(screen.getByRole("button", { name: "Ver resultado" }));

    expect(screen.getByRole("heading", { name: "Avanzas a A2" })).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "Iniciar sesión para continuar" }))
      .toHaveAttribute("href", "/login");
    expect(window.localStorage.getItem("assessment:guest:checkpoint:A1"))
      .toContain('"assignedLevel":"A2"');
    expect(fetchMock).not.toHaveBeenCalled();
    expect(persistAssessmentConceptProfileMock).not.toHaveBeenCalled();
  });
});
