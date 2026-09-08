// @vitest-environment jsdom
import { describe, it, expect, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import CoachSessionEndButton from "../CoachSessionEndButton";

describe("CoachSessionEndButton", () => {
  it("stays hidden until the conversation is worth summarising", () => {
    const { container } = render(
      <CoachSessionEndButton userTurns={2} isStreaming={false} onEnd={vi.fn()} />,
    );
    expect(container).toBeEmptyDOMElement();
  });

  it("appears at three user turns", () => {
    render(<CoachSessionEndButton userTurns={3} isStreaming={false} onEnd={vi.fn()} />);
    expect(screen.getByRole("button", { name: /Terminar/ })).toBeInTheDocument();
  });

  it("asks to end the session when tapped", async () => {
    const onEnd = vi.fn();
    render(<CoachSessionEndButton userTurns={5} isStreaming={false} onEnd={onEnd} />);
    await userEvent.click(screen.getByRole("button", { name: /Terminar/ }));
    expect(onEnd).toHaveBeenCalledTimes(1);
  });

  it("is disabled while the coach is still answering", () => {
    render(<CoachSessionEndButton userTurns={5} isStreaming onEnd={vi.fn()} />);
    expect(screen.getByRole("button", { name: /Terminar/ })).toBeDisabled();
  });
});
