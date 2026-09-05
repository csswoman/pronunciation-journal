// @vitest-environment jsdom
import { render, screen, fireEvent } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import CustomPromptPanel from "../CustomPromptPanel";

describe("CustomPromptPanel", () => {
  it("sends a typed message on submit", () => {
    const onSubmit = vi.fn();
    render(<CustomPromptPanel onSubmit={onSubmit} isDisabled={false} variant="chat" />);

    const textarea = screen.getByPlaceholderText(/escribe a tu ai coach|escribe tu mensaje\.\.\.|type your message\.\.\./i);
    fireEvent.change(textarea, { target: { value: "hello there" } });
    fireEvent.click(screen.getByLabelText(/enviar|send/i));

    expect(onSubmit).toHaveBeenCalledWith("hello there");
  });

  it("sends a message on Enter key press without Shift", () => {
    const onSubmit = vi.fn();
    render(<CustomPromptPanel onSubmit={onSubmit} isDisabled={false} variant="chat" />);

    const textarea = screen.getByPlaceholderText(/escribe a tu ai coach|escribe tu mensaje\.\.\.|type your message\.\.\./i);
    fireEvent.change(textarea, { target: { value: "good morning" } });
    fireEvent.keyDown(textarea, { key: "Enter", shiftKey: false });

    expect(onSubmit).toHaveBeenCalledWith("good morning");
  });

  it("does not send on Shift+Enter", () => {
    const onSubmit = vi.fn();
    render(<CustomPromptPanel onSubmit={onSubmit} isDisabled={false} variant="chat" />);

    const textarea = screen.getByPlaceholderText(/escribe a tu ai coach|escribe tu mensaje\.\.\.|type your message\.\.\./i);
    fireEvent.change(textarea, { target: { value: "good morning" } });
    fireEvent.keyDown(textarea, { key: "Enter", shiftKey: true });

    expect(onSubmit).not.toHaveBeenCalled();
  });

  it("does not send empty text", () => {
    const onSubmit = vi.fn();
    render(<CustomPromptPanel onSubmit={onSubmit} isDisabled={false} variant="chat" />);

    const textarea = screen.getByPlaceholderText(/escribe a tu ai coach|escribe tu mensaje\.\.\.|type your message\.\.\./i);
    fireEvent.change(textarea, { target: { value: "   " } });
    fireEvent.click(screen.getByLabelText(/enviar|send/i));

    expect(onSubmit).not.toHaveBeenCalled();
  });
});

