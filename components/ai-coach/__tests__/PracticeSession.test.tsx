// @vitest-environment jsdom
import { describe, expect, it, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import PracticeSession from "../PracticeSession";
import type { ToolCall } from "@/lib/ai-practice/types";

vi.mock("../chat/ToolWidget", () => ({
  default: ({ onAnswer }: { onAnswer: (callId: string, res: { correct: boolean }) => void }) => (
    <div>
      <p>Mock Widget</p>
      <button type="button" onClick={() => onAnswer("call-1", { correct: true })}>
        Responder correcto
      </button>
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
    expect(screen.getByText("Mock Widget")).toBeInTheDocument();
    expect(screen.getByText(/EJERCICIO 1 DE 1/)).toBeInTheDocument();
  });

  it("shows final completion feedback instead of disappearing when exercise is completed", async () => {
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
    }, { timeout: 3000 });

    expect(screen.getByText(/1 de 1 ejercicio correcto/)).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /Continuar con el Coach/ })).toBeInTheDocument();

    await user.click(screen.getByRole("button", { name: /Continuar con el Coach/ }));
    expect(onComplete).toHaveBeenCalledWith({ total: 1, correct: 1 });
    expect(screen.getByText(/Conversación continuada/)).toBeInTheDocument();
  });
});
