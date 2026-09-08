// @vitest-environment jsdom
import { beforeAll, describe, expect, it, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import ChatView from "../ChatView";
import type { AIMessage } from "@/lib/ai-practice/types";

beforeAll(() => {
  // jsdom has no layout engine.
  Element.prototype.scrollIntoView = vi.fn();
});

// MessageBubble pulls in the whole chat rendering stack; a stub keeps this test
// focused on which messages ChatView decides to render.
vi.mock("../MessageBubble", () => ({
  default: ({ message, autoSpeak }: { message: AIMessage; autoSpeak?: boolean }) => {
    const text =
      message.role === "model"
        ? message.contentParts.map((p) => (p.type === "text" ? p.text : "[tool]")).join("")
        : message.role === "user"
          ? message.content
          : "";
    return <div data-testid={`bubble-${message.role}`} data-autospeak={autoSpeak ? "true" : "false"}>{text}</div>;
  },
}));
vi.mock("../TypingIndicator", () => ({ default: () => <div data-testid="typing" /> }));

const baseProps = {
  isStreaming: false,
  onSaveWord: vi.fn(),
  onSaveSaveable: vi.fn(async () => {}),
  onSaveAllFromSummary: vi.fn(async () => {}),
  onSuggestionClick: vi.fn(),
  onToolAnswer: vi.fn(),
  onNext: vi.fn(),
};

function model(parts: AIMessage["role"] extends "model" ? never : string): AIMessage {
  return { role: "model", contentParts: parts ? [{ type: "text", text: parts }] : [], toolCalls: new Map(), timestamp: "t" };
}

describe("ChatView message visibility", () => {
  it("hides an empty model bubble stranded in the middle of the list", () => {
    const messages: AIMessage[] = [
      { role: "user", content: "hidden starter", hidden: true, timestamp: "t" },
      model(""), // orphan placeholder left by a superseded stream
      { role: "user", content: "hola", timestamp: "t" },
      model("Hello! Let's look at 'this' and 'that'."),
    ];
    render(<ChatView {...baseProps} messages={messages} />);

    const bubbles = screen.getAllByTestId(/^bubble-/);
    // hidden user + empty model are both dropped: only "hola" and the real answer.
    expect(bubbles).toHaveLength(2);
    expect(screen.getByText("hola")).toBeInTheDocument();
    expect(screen.getByText(/Hello! Let's look/)).toBeInTheDocument();
  });

  it("still renders a model bubble that only carries a tool call", () => {
    const withTool: AIMessage = {
      role: "model",
      contentParts: [{ type: "tool_call", callId: "c1" }],
      toolCalls: new Map([["c1", { id: "c1", name: "render_fill_blank", args: {}, status: "rendered" }]]),
      timestamp: "t",
    };
    render(<ChatView {...baseProps} messages={[withTool]} />);
    expect(screen.getByTestId("bubble-model")).toBeInTheDocument();
  });
});

describe("ChatView autoSpeak propagation", () => {
  it("passes autoSpeak=true only to the newest model message when store autoSpeak is true", async () => {
    const { useAICoachStore } = await import("@/lib/stores/aiCoachStore");
    useAICoachStore.setState({ autoSpeak: true });

    const messages: AIMessage[] = [
      model("First model message"),
      { role: "user", content: "hello", timestamp: "t1" },
      model("Second model message"),
    ];
    render(<ChatView {...baseProps} messages={messages} />);

    const modelBubbles = screen.getAllByTestId("bubble-model");
    expect(modelBubbles).toHaveLength(2);
    expect(modelBubbles[0]).toHaveAttribute("data-autospeak", "false");
    expect(modelBubbles[1]).toHaveAttribute("data-autospeak", "true");
  });

  it("passes autoSpeak=false to all bubbles when store autoSpeak is false", async () => {
    const { useAICoachStore } = await import("@/lib/stores/aiCoachStore");
    useAICoachStore.setState({ autoSpeak: false });

    const messages: AIMessage[] = [
      model("First model message"),
      { role: "user", content: "hello", timestamp: "t1" },
      model("Second model message"),
    ];
    render(<ChatView {...baseProps} messages={messages} />);

    const modelBubbles = screen.getAllByTestId("bubble-model");
    expect(modelBubbles).toHaveLength(2);
    expect(modelBubbles[0]).toHaveAttribute("data-autospeak", "false");
    expect(modelBubbles[1]).toHaveAttribute("data-autospeak", "false");
  });

  it("passes autoSpeak=false if the last message is a user message", async () => {
    const { useAICoachStore } = await import("@/lib/stores/aiCoachStore");
    useAICoachStore.setState({ autoSpeak: true });

    const messages: AIMessage[] = [
      model("First model message"),
      { role: "user", content: "hello", timestamp: "t1" },
    ];
    render(<ChatView {...baseProps} messages={messages} />);

    const modelBubble = screen.getByTestId("bubble-model");
    expect(modelBubble).toHaveAttribute("data-autospeak", "false");
  });
});
