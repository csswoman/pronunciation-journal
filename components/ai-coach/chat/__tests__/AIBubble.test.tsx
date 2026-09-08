// @vitest-environment jsdom
import { beforeEach, describe, expect, it, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import AIBubble from "../AIBubble";
import type { AIMessage, ToolCall } from "@/lib/ai-practice/types";

describe("AIBubble", () => {
  const dummyProps = {
    showAvatar: true,
    onSaveWord: vi.fn(),
    onSaveSaveable: vi.fn().mockResolvedValue(undefined),
    onSaveConcept: vi.fn().mockResolvedValue(undefined),
    onSaveAllFromSummary: vi.fn().mockResolvedValue(undefined),
    onSuggestionClick: vi.fn(),
    onToolAnswer: vi.fn(),
    onNext: vi.fn(),
  };

  it("strips suggestions block from bubble prose and renders suggestion chips", () => {
    const rawContent = [
      "Here is a quick lesson about possessive adjectives.",
      "For example: 'This is my book.'",
      "How would you say 'Esta es mi casa'?",
      "suggestions:",
      "- I think it is...",
      "- Can you give another example?",
      "- Could you explain it more simply?",
    ].join("\n");

    const message: Extract<AIMessage, { role: "model" }> = {
      role: "model",
      timestamp: "2026-09-07T12:00:00.000Z",
      contentParts: [{ type: "text", text: rawContent }],
      toolCalls: new Map(),
    };

    render(<AIBubble {...dummyProps} message={message} />);

    // Prose should contain lesson text
    expect(screen.getByText(/Here is a quick lesson/i)).toBeInTheDocument();
    expect(screen.getByText(/How would you say/i)).toBeInTheDocument();

    // Prose should NOT contain the raw suggestions block or bullets
    expect(screen.queryByText(/suggestions:/i)).not.toBeInTheDocument();

    // The chips should be rendered separately
    expect(screen.getByRole("button", { name: /I think it is\.\.\./i })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /Can you give another example\?/i })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /Could you explain it more simply\?/i })).toBeInTheDocument();
  });

  it("renders SaveConceptChip and passes stripped text when saved", async () => {
    const onSaveConcept = vi.fn().mockResolvedValue(undefined);
    const rawContent = [
      "Let's practice the /æ/ sound in cat.",
      "Notice how your jaw drops.",
      "• I tried saying it like...",
      "• Could you give another word?",
      "• Can you explain mouth position simply?",
    ].join("\n");

    const toolCalls = new Map<string, ToolCall>([
      [
        "tc-1",
        {
          id: "tc-1",
          name: "annotate_turn",
          args: {
            concept: { title: "Sonido /æ/" },
          },
          status: "rendered",
        },
      ],
    ]);

    const message: Extract<AIMessage, { role: "model" }> = {
      role: "model",
      timestamp: "2026-09-07T12:00:00.000Z",
      contentParts: [
        { type: "text", text: rawContent },
        { type: "tool_call", callId: "tc-1" },
      ],
      toolCalls,
    };

    render(<AIBubble {...dummyProps} onSaveConcept={onSaveConcept} message={message} />);

    // Check that SaveConceptChip is rendered
    const saveButton = screen.getByRole("button", { name: /guardar explicación/i });
    expect(saveButton).toBeInTheDocument();

    // Click to save
    await userEvent.click(saveButton);

    // Verify onSaveConcept was called with title and stripped body
    expect(onSaveConcept).toHaveBeenCalledWith(
      "Sonido /æ/",
      expect.not.stringContaining("• I tried saying it like..."),
    );
    expect(onSaveConcept).toHaveBeenCalledWith(
      "Sonido /æ/",
      expect.stringContaining("Let's practice the /æ/ sound in cat."),
    );
  });

  it("renders a natural follow-up response and does not leave an empty bubble when annotate_turn arrives without text parts", () => {
    const toolCalls = new Map<string, ToolCall>([
      [
        "tc-corr",
        {
          id: "tc-corr",
          name: "annotate_turn",
          args: {
            correction: {
              original: "luch",
              corrected: "lunch",
              rule: "Se escribe lunch con n antes de la ch.",
              kind: "error",
            },
          },
          status: "answered",
        },
      ],
    ]);

    const message: Extract<AIMessage, { role: "model" }> = {
      role: "model",
      timestamp: "2026-09-07T12:00:00.000Z",
      contentParts: [{ type: "tool_call", callId: "tc-corr" }],
      toolCalls,
    };

    render(<AIBubble {...dummyProps} message={message} />);

    // Correction card must be rendered
    expect(screen.getByText(/Corrección rápida/i)).toBeInTheDocument();
    expect(screen.getByText("lunch")).toBeInTheDocument();
    expect(screen.getByText(/Se escribe lunch con n antes de la ch\./i)).toBeInTheDocument();

    // No prose text, no empty bubble — the model will generate the follow-up via Gemini.
    // The content box should NOT appear (no text → hasContentBox === false).
    expect(screen.queryByText(/Tell me more about it!/i)).not.toBeInTheDocument();
    // No empty container with the raised-surface class
    expect(document.querySelector(".bg-surface-raised")).toBeNull();
  });

  describe("TTS and speech playback", () => {
    let speakSpy: ReturnType<typeof vi.fn>;
    let cancelSpy: ReturnType<typeof vi.fn>;

    beforeEach(() => {
      speakSpy = vi.fn((utterance: SpeechSynthesisUtterance) => {
        utterance.onstart?.(new Event("start") as SpeechSynthesisEvent);
      });
      cancelSpy = vi.fn();

      Object.defineProperty(window, "speechSynthesis", {
        configurable: true,
        writable: true,
        value: {
          speak: speakSpy,
          cancel: cancelSpy,
        },
      });

      class MockUtterance {
        text: string;
        lang = "";
        rate = 1;
        onstart: ((e: unknown) => void) | null = null;
        onend: ((e: unknown) => void) | null = null;
        onerror: ((e: unknown) => void) | null = null;
        constructor(text: string) {
          this.text = text;
        }
      }

      Object.defineProperty(window, "SpeechSynthesisUtterance", {
        configurable: true,
        writable: true,
        value: MockUtterance,
      });
    });

    const sampleMessage: Extract<AIMessage, { role: "model" }> = {
      role: "model",
      timestamp: "2026-09-07T12:00:00.000Z",
      contentParts: [{ type: "text", text: "Great pronunciation! Try saying 'apple' again." }],
      toolCalls: new Map(),
    };

    it("renders listen button when prose exists and speechSynthesis is available", () => {
      render(<AIBubble {...dummyProps} message={sampleMessage} />);
      expect(screen.getByRole("button", { name: /escuchar/i })).toBeInTheDocument();
    });

    it("hides listen button when speechSynthesis is unavailable", () => {
      const original = window.speechSynthesis;
      // @ts-expect-error - simulating browser without speechSynthesis
      delete window.speechSynthesis;

      render(<AIBubble {...dummyProps} message={sampleMessage} />);
      expect(screen.queryByRole("button", { name: /escuchar/i })).not.toBeInTheDocument();

      Object.defineProperty(window, "speechSynthesis", {
        configurable: true,
        writable: true,
        value: original,
      });
    });

    it("clicking listen button starts speech and toggles to 'Detener'; clicking again stops", async () => {
      render(<AIBubble {...dummyProps} message={sampleMessage} />);

      const listenBtn = screen.getByRole("button", { name: /escuchar/i });
      await userEvent.click(listenBtn);

      expect(speakSpy).toHaveBeenCalledOnce();
      expect(screen.getByRole("button", { name: /detener/i })).toBeInTheDocument();

      const stopBtn = screen.getByRole("button", { name: /detener/i });
      await userEvent.click(stopBtn);
      expect(cancelSpy).toHaveBeenCalled();
      expect(screen.getByRole("button", { name: /escuchar/i })).toBeInTheDocument();
    });

    it("autoSpeak=true triggers speech exactly once on mount, and does not re-trigger on re-render", () => {
      const { rerender } = render(<AIBubble {...dummyProps} message={sampleMessage} autoSpeak={true} />);

      expect(speakSpy).toHaveBeenCalledOnce();

      // Re-render with same message identity
      rerender(<AIBubble {...dummyProps} message={sampleMessage} autoSpeak={true} />);
      expect(speakSpy).toHaveBeenCalledOnce();
    });
  });
});

