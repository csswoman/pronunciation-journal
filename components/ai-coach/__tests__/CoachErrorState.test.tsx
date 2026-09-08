// @vitest-environment jsdom
import { describe, expect, it, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import CoachErrorState from "../CoachErrorState";

describe("CoachErrorState", () => {
  it("shows the given message and a retry / dismiss pair", () => {
    render(
      <CoachErrorState message="El coach no pudo responder." onRetry={vi.fn()} onDismiss={vi.fn()} />,
    );
    expect(screen.getByText("El coach no pudo responder.")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /reintentar/i })).toBeEnabled();
    expect(screen.getByRole("button", { name: /descartar/i })).toBeInTheDocument();
  });

  it("falls back to a generic line when no message is supplied", () => {
    render(<CoachErrorState onRetry={vi.fn()} onDismiss={vi.fn()} />);
    expect(screen.getByText(/no pudimos preparar tu práctica/i)).toBeInTheDocument();
  });

  it("calls the handlers on click and disables retry while retrying", async () => {
    const onRetry = vi.fn();
    const onDismiss = vi.fn();
    const { rerender } = render(
      <CoachErrorState message="x" onRetry={onRetry} onDismiss={onDismiss} />,
    );

    await userEvent.click(screen.getByRole("button", { name: /reintentar/i }));
    await userEvent.click(screen.getByRole("button", { name: /descartar/i }));
    expect(onRetry).toHaveBeenCalledOnce();
    expect(onDismiss).toHaveBeenCalledOnce();

    rerender(<CoachErrorState message="x" onRetry={onRetry} onDismiss={onDismiss} retrying />);
    expect(screen.getByRole("button", { name: /reintentando/i })).toBeDisabled();
  });
});
