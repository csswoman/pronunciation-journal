// @vitest-environment jsdom
import { describe, expect, it, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import PracticeSession from "../PracticeSession";
import type { ToolCall } from "@/lib/ai-practice/types";

vi.mock("../chat/ToolWidget", () => ({
  default: ({ toolCall, onAnswer, onNext }: {
    toolCall: ToolCall;
    onAnswer: (callId: string, res: { correct: boolean }) => void;
    onNext: () => void;
  }) => (
    <div>
      <p>Mock Widget ({toolCall.name})</p>
      <button type="button" onClick={() => onAnswer("call-1", { correct: true })}>
        Responder correcto
      </button>
      <button type="button" onClick={onNext}>Siguiente local</button>
    </div>
  ),
}));

describe("PracticeSession", () => {
  const initialExercises: ToolCall[] = [
    {
      id: "call-1",
      name: "render_multiple_choice",
      args: {
        question: "Choose the correct verb",
        options: ["went", "go"],
        correctIndex: 0,
        topic: "past_simple",
      },
      status: "rendered",
    },
  ];

  it("renders the active exercise initially", () => {
    render(<PracticeSession initialExercises={initialExercises} onAnswer={vi.fn()} />);
    expect(screen.getByText(/Mock Widget/)).toBeInTheDocument();
    expect(screen.getByText(/EJERCICIO 1 DE 1/)).toBeInTheDocument();
  });

  it("renders a word-card-only session without the exercise chrome", () => {
    const wordCards: ToolCall[] = [
      {
        id: "wc-1",
        name: "render_word_card",
        args: { word: "grab", meaning: "tomar algo rápido", ipa: "ɡræb" },
        status: "rendered",
      },
    ];
    render(<PracticeSession initialExercises={wordCards} onAnswer={vi.fn()} />);
    expect(screen.getByText(/Mock Widget \(render_word_card\)/)).toBeInTheDocument();
    expect(screen.queryByText(/EJERCICIO/)).not.toBeInTheDocument();
    expect(screen.queryByText(/Progreso/i)).not.toBeInTheDocument();
  });

  it("shows a local summary and contacts the coach only after explicit confirmation", async () => {
    const user = userEvent.setup({ delay: null });
    const onComplete = vi.fn();
    render(
      <PracticeSession
        initialExercises={initialExercises}
        onAnswer={vi.fn()}
        onComplete={onComplete}
      />,
    );

    await user.click(screen.getByRole("button", { name: "Responder correcto" }));

    await vi.waitFor(() => {
      expect(screen.getByText("¡Práctica finalizada!")).toBeInTheDocument();
    }, { timeout: 4000 });

    expect(screen.getByText(/1 de 1 ejercicio correcto/)).toBeInTheDocument();
    expect(onComplete).not.toHaveBeenCalled();

    await user.click(screen.getByRole("button", { name: "Comentar con el Coach" }));

    expect(onComplete).toHaveBeenCalledWith({ total: 1, correct: 1, reviewItems: [] });
    expect(onComplete).toHaveBeenCalledTimes(1);
  });

  it("consumes a five-exercise set locally without contacting the coach", async () => {
    const user = userEvent.setup();
    const onComplete = vi.fn();
    const fiveExercises = Array.from({ length: 5 }, (_, index): ToolCall => ({
      id: `call-${index + 1}`,
      name: index === 4 ? "render_speaking" : "render_multiple_choice",
      args: index === 4
        ? { prompt: "Tell me about yesterday", topic: "past_simple" }
        : {
            question: `Question ${index + 1}`,
            options: ["a", "b"],
            correctIndex: 0,
            topic: "past_simple",
          },
      status: "rendered",
    }));

    render(
      <PracticeSession
        initialExercises={fiveExercises}
        onAnswer={vi.fn()}
        onComplete={onComplete}
      />,
    );

    for (let current = 1; current <= 5; current += 1) {
      expect(screen.getByText(`EJERCICIO ${current} DE 5`)).toBeInTheDocument();
      await user.click(screen.getByRole("button", { name: "Siguiente local" }));
      expect(onComplete).not.toHaveBeenCalled();
    }

    expect(screen.getByText("¡Práctica finalizada!")).toBeInTheDocument();
    expect(onComplete).not.toHaveBeenCalled();
  });

  it("renders long titles and counter pill in two-row layout", () => {
    const longTopic = "El Posesivo Con 'S (Ana'S Book · The Dog's Ball)";
    const exercisesWithLongTitle: ToolCall[] = [
      {
        id: "call-long",
        name: "render_multiple_choice",
        args: {
          question: "Choose one",
          options: ["a", "b"],
          correctIndex: 0,
          topic: longTopic,
        },
        status: "rendered",
      },
    ];

    render(<PracticeSession initialExercises={exercisesWithLongTitle} onAnswer={vi.fn()} />);
    expect(screen.getByText(/EJERCICIO 1 DE 1/)).toBeInTheDocument();
    expect(screen.getByText(/El Posesivo Con 'S/i)).toBeInTheDocument();
  });
});
