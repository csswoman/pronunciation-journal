// @vitest-environment jsdom
import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import AssessmentClient from "../AssessmentClient";
import type { AssessmentQuestion } from "@/lib/courses/assessment";
import type { AssessmentConcept } from "@/lib/courses/concept-profile";

const persistAssessmentConceptProfileMock = vi.fn();
const draftRows = vi.hoisted(() => new Map<string, { key: string; value: string; updatedAt: string }>());

vi.mock("@/lib/db", () => ({
  db: { practicePrefs: {
    get: async (key: string) => draftRows.get(key),
    put: async (row: { key: string; value: string; updatedAt: string }) => { draftRows.set(row.key, row); },
    delete: async (key: string) => { draftRows.delete(key); },
  } },
}));

vi.mock("@/lib/courses/assessment-profile", () => ({
  persistAssessmentConceptProfile: (...args: unknown[]) => persistAssessmentConceptProfileMock(...args),
}));

vi.mock("next/link", () => ({
  default: ({ children, href, ...props }: React.ComponentProps<"a">) => (
    <a href={String(href)} {...props}>{children}</a>
  ),
}));

const fetchMock = vi.fn();

const passingResult = {
  assignedLevel: "A2",
  evaluatedLevels: ["a1"],
  confidence: "medium",
  passed: true,
  passedLevels: ["a1"],
  score: 1,
  total: 1,
  listeningScore: 1,
  listeningTotal: 1,
  topicScores: [{ lessonSlug: "a1-topic-one", title: "topic one", correct: 1, total: 1 }],
  strengths: [{ lessonSlug: "a1-topic-one", title: "topic one" }],
  needsReview: [],
  conceptSignals: [],
};

const failedResult = {
  ...passingResult,
  assignedLevel: "A1",
  passed: false,
  passedLevels: [],
  score: 0,
  listeningScore: 0,
  strengths: [],
  needsReview: [{ lessonSlug: "a1-topic-one", title: "topic one" }],
};

const pendingOralResult = {
  ...passingResult,
  assignedLevel: "A1",
  passed: false,
  passedLevels: [],
  oralEvidence: { level: "a1", status: "pending" },
  levelScores: [{
    level: "a1",
    correct: 1,
    total: 1,
    minimumCorrect: 1,
    listeningCorrect: 1,
    listeningTotal: 1,
    minimumListeningCorrect: 1,
    writtenListeningMet: true,
    oralRequired: true,
    oralPassed: false,
    thresholdMet: false,
  }],
};

function responseWithResult(result: typeof passingResult | typeof failedResult) {
  return { ok: true, json: async () => ({ result }) };
}

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

const checkpointQuestions: AssessmentQuestion[] = [
  ...questions,
  {
    id: "a1:topic-two",
    level: "a1",
    lessonSlug: "a1-topic-two",
    prompt: "Choose two",
    options: ["Wrong again", "Right again"],
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
    draftRows.clear();
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
    fetchMock.mockImplementation(async (input: string | URL | Request) => {
      if (String(input).startsWith("/api/assessment/oral/attempts?level=")) {
        return { ok: true, json: async () => ({ attemptId: null }) };
      }
      if (String(input) === "/api/assessment/oral/attempts") {
        return {
          ok: true,
          json: async () => ({
            attemptId: "df7539d3-0346-4432-8e93-884eaf79da44",
            challenge: {
              id: "c6d5ab28-911a-4dbd-aa36-28c2e6cb60f6",
              level: "a1",
              prompt: "Describe a fictional person.",
              expiresAt: new Date(Date.now() + 60_000).toISOString(),
            },
          }),
        };
      }
      return responseWithResult(passingResult);
    });
    persistAssessmentConceptProfileMock.mockResolvedValue(undefined);
    window.HTMLMediaElement.prototype.load = vi.fn();
    window.localStorage.clear();
  });

  it("requires every concept rating before starting placement questions", () => {
    render(<AssessmentClient mode="placement" questions={placementQuestions} concepts={concepts} initialLevel="a1" />);

    const continueButton = screen.getByRole("button", { name: "Comprobar con preguntas" });
    expect(screen.getByRole("heading", { name: "¿Qué temas ya conoces?" })).toBeInTheDocument();
    expect(continueButton).toBeDisabled();
    expect(screen.queryByText("Choose one")).not.toBeInTheDocument();

    fireEvent.click(screen.getByRole("radio", { name: "Me suena" }));

    expect(continueButton).toBeEnabled();
    expect(screen.getByRole("progressbar")).toHaveAttribute("aria-label", "Temas valorados");
  });

  it("builds a starter plan without questions when every current concept is new", () => {
    render(<AssessmentClient mode="placement" questions={placementQuestions} concepts={concepts} initialLevel="a1" />);

    fireEvent.click(screen.getByRole("radio", { name: "Todavía no" }));
    fireEvent.click(screen.getByRole("button", { name: "Comprobar con preguntas" }));

    expect(screen.getByRole("heading", { name: "Empezamos por aquí" })).toBeInTheDocument();
    expect(screen.getByText("Para empezar")).toBeInTheDocument();
    expect(screen.getByText("Present simple")).toBeInTheDocument();
    expect(screen.queryByText("Choose one")).not.toBeInTheDocument();
    expect(fetchMock).not.toHaveBeenCalled();
    expect(persistAssessmentConceptProfileMock).not.toHaveBeenCalled();
  });

  it("does not treat A1 as a finished beginner plan when the learner claimed A2", () => {
    render(<AssessmentClient mode="placement" questions={placementQuestions} concepts={concepts} />);

    fireEvent.click(screen.getByRole("radio", { name: /A2Básico/ }));
    fireEvent.click(screen.getByRole("button", { name: "Empezar prueba" }));

    expect(screen.getByText("Present simple")).toBeInTheDocument();

    fireEvent.click(screen.getByRole("radio", { name: "Todavía no" }));
    fireEvent.click(screen.getByRole("button", { name: "Comprobar con preguntas" }));

    expect(screen.queryByRole("heading", { name: "Empezamos por aquí" })).not.toBeInTheDocument();
    expect(screen.getByRole("heading", { name: "Choose one" })).toBeInTheDocument();
  });

  it("shows one question at a time and allows going back", () => {
    render(<AssessmentClient mode="checkpoint" checkpointLabel="A1" questions={checkpointQuestions} />);

    expect(screen.getByRole("heading", { name: "Choose one" })).toBeInTheDocument();
    expect(screen.queryByRole("heading", { name: "Choose two" })).not.toBeInTheDocument();

    fireEvent.click(screen.getByText("Right"));
    fireEvent.click(screen.getByRole("button", { name: "Siguiente pregunta" }));

    expect(screen.getByRole("heading", { name: "Choose two" })).toBeInTheDocument();
    expect(screen.queryByRole("heading", { name: "Choose one" })).not.toBeInTheDocument();

    fireEvent.click(screen.getByRole("button", { name: "Anterior" }));
    expect(screen.getByRole("heading", { name: "Choose one" })).toBeInTheDocument();
    expect(screen.getByRole("radio", { name: "Right" })).toBeChecked();
  });

  it("shows level feedback before moving to the next concept inventory", async () => {
    render(<AssessmentClient mode="placement" questions={placementQuestions} concepts={concepts} initialLevel="a1" />);

    fireEvent.click(screen.getByRole("radio", { name: "Lo uso" }));
    fireEvent.click(screen.getByRole("button", { name: "Comprobar con preguntas" }));
    fireEvent.click(screen.getByText("Right"));
    fireEvent.click(screen.getByRole("button", { name: "Comprobar nivel" }));

    expect(await screen.findByRole("heading", { name: "Ya estás en A2" })).toBeInTheDocument();
    expect(screen.getByText(/1 de 1 correctas/)).toBeInTheDocument();
    fireEvent.click(screen.getByRole("button", { name: "Empezar A2" }));

    await screen.findByText("Past simple");
    expect(screen.getByText("Past simple")).toBeInTheDocument();
    expect(screen.queryByText("Choose two")).not.toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Comprobar con preguntas" })).toBeDisabled();
  });

  it("asks for a level before placement when settings have no level", () => {
    render(<AssessmentClient mode="placement" questions={placementQuestions} concepts={concepts} />);

    expect(screen.getByRole("heading", { name: "¿Qué nivel crees tener?" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Empezar prueba" })).toBeDisabled();

    fireEvent.click(screen.getByRole("radio", { name: /A2Básico/ }));
    fireEvent.click(screen.getByRole("button", { name: "Empezar prueba" }));

    expect(screen.getByText("Present simple")).toBeInTheDocument();
    expect(screen.queryByText("Past simple")).not.toBeInTheDocument();
  });

  it("keeps submission disabled until every question is answered", async () => {
    render(<AssessmentClient mode="checkpoint" checkpointLabel="A1" questions={questions} userId="user-1" />);

    const submit = screen.getByRole("button", { name: "Ver resultado" });
    expect(submit).toBeDisabled();

    fireEvent.click(screen.getByText("Right"));
    await waitFor(() => expect(submit).toBeEnabled());
    expect(screen.getByRole("progressbar")).toHaveAttribute("aria-valuenow", "1");
  });

  it("starts the oral checkpoint before a written pass can promote the learner", async () => {
    render(<AssessmentClient mode="checkpoint" checkpointLabel="A1" questions={questions} userId="user-1" />);

    fireEvent.click(screen.getByText("Right"));
    const submit = screen.getByRole("button", { name: "Ver resultado" });
    await waitFor(() => expect(submit).toBeEnabled());
    fireEvent.click(submit);

    expect(await screen.findByRole("heading", { name: "Di una respuesta breve en inglés" })).toBeInTheDocument();
    expect(screen.getByText("Describe a fictional person.")).toBeInTheDocument();
    await waitFor(() => expect(fetchMock).toHaveBeenCalledTimes(2));
    expect(fetchMock).toHaveBeenCalledWith(
      "/api/assessment/oral/attempts",
      expect.objectContaining({
        method: "POST",
        body: expect.stringContaining('"answers":{"a1:topic-one":1}'),
      }),
    );
    expect(persistAssessmentConceptProfileMock).not.toHaveBeenCalled();
    expect(window.localStorage.getItem("assessment:user-1:checkpoint:A1")).toBeNull();
  });

  it("uses an error state for a failed checkpoint result", async () => {
    fetchMock.mockResolvedValueOnce(responseWithResult(failedResult));
    render(<AssessmentClient mode="checkpoint" checkpointLabel="A1" questions={questions} />);

    fireEvent.click(screen.getByText("Wrong"));
    fireEvent.click(screen.getByRole("button", { name: "Ver resultado" }));

    expect(await screen.findByRole("heading", { name: "Falta afinar la comprensión auditiva" })).toBeInTheDocument();
    expect(document.querySelector(".assessment-result-icon--error")).toBeInTheDocument();
    expect(document.querySelector(".assessment-result-icon--success")).not.toBeInTheDocument();
  });

  it("offers retry when saving a non-pilot checkpoint result to Dexie fails", async () => {
    persistAssessmentConceptProfileMock.mockRejectedValueOnce(new Error("Dexie unavailable"));
    const b1Questions = [{ ...questions[0], id: "b1:topic-one", level: "b1" as const }];
    render(<AssessmentClient mode="checkpoint" checkpointLabel="B1" questions={b1Questions} userId="user-1" />);

    fireEvent.click(screen.getByText("Right"));
    fireEvent.click(screen.getByRole("button", { name: "Ver resultado" }));

    const retry = await screen.findByRole("button", { name: "Reintentar" });
    fireEvent.click(retry);

    await waitFor(() => expect(fetchMock).toHaveBeenCalledTimes(1));
    expect(fetchMock).toHaveBeenCalledWith(
      "/api/assessment/results",
      expect.objectContaining({
        method: "POST",
        body: expect.stringContaining('"answers":{"b1:topic-one":1}'),
      }),
    );
    await waitFor(() => expect(screen.queryByRole("button", { name: "Reintentar" })).not.toBeInTheDocument());
  });

  it("keeps a guest's written and listening pass pending until sign-in for oral evidence", async () => {
    fetchMock.mockResolvedValueOnce(responseWithResult(pendingOralResult));
    render(<AssessmentClient mode="checkpoint" checkpointLabel="A1" questions={questions} />);

    fireEvent.click(screen.getByText("Right"));
    fireEvent.click(screen.getByRole("button", { name: "Ver resultado" }));

    expect(await screen.findByRole("heading", { name: "Falta verificar la tarea oral" })).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "Iniciar sesión y repetir" }))
      .toHaveAttribute("href", "/login?intent=save");
    expect(window.localStorage.getItem("assessment:guest:checkpoint:A1"))
      .toContain('"assignedLevel":"A1"');
    expect(fetchMock).toHaveBeenCalledWith(
      "/api/assessment/score",
      expect.objectContaining({
        method: "POST",
        body: expect.stringContaining('"answers":{"a1:topic-one":1}'),
      }),
    );
    expect(persistAssessmentConceptProfileMock).not.toHaveBeenCalled();
  });

  it("restores the answered question and position after remounting", async () => {
    const first = render(<AssessmentClient mode="checkpoint" checkpointLabel="B1" questions={checkpointQuestions} />);
    await waitFor(() => expect(draftRows.has("assessment-draft:guest:checkpoint:B1")).toBe(true));
    fireEvent.click(screen.getByText("Right"));
    fireEvent.click(screen.getByRole("button", { name: "Siguiente pregunta" }));
    await waitFor(() => {
      const saved = JSON.parse(draftRows.get("assessment-draft:guest:checkpoint:B1")!.value).draft;
      expect(saved.questionIndex).toBe(1);
      expect(saved.answers).toEqual({ "a1:topic-one": 1 });
    });
    first.unmount();

    render(<AssessmentClient mode="checkpoint" checkpointLabel="B1" questions={checkpointQuestions} />);
    expect(await screen.findByRole("heading", { name: "Choose two" })).toBeInTheDocument();
    fireEvent.click(screen.getByRole("button", { name: "Anterior" }));
    expect(screen.getByRole("radio", { name: "Right" })).toBeChecked();
  });

  it("requires a full audio playback and retries after an audio error without losing the answer", () => {
    const audioQuestion: AssessmentQuestion = {
      ...questions[0],
      audioSrc: "/listening/a1-listening-cafe.wav",
      type: "listening",
    };
    render(<AssessmentClient mode="checkpoint" checkpointLabel="A1" questions={[audioQuestion]} />);

    const answer = screen.getByRole("radio", { name: "Right" });
    const audio = screen.getByLabelText("Audio en inglés para la pregunta");
    expect(answer).toBeDisabled();

    fireEvent.ended(audio);
    expect(answer).toBeEnabled();
    fireEvent.click(answer);
    fireEvent.error(audio);

    expect(screen.getByRole("alert")).toHaveTextContent("reintenta");
    expect(answer).toBeDisabled();
    expect(answer).toBeChecked();
    fireEvent.click(screen.getByRole("button", { name: "Reintentar audio" }));
    expect(screen.getByRole("radio", { name: "Right" })).toBeDisabled();
    expect(fetchMock).not.toHaveBeenCalled();
  });
});
