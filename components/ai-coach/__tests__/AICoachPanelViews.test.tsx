// @vitest-environment jsdom
import { describe, expect, it, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { renderHome, type RenderHomeParams } from "../AICoachPanelViews";

vi.mock("../AICoachHome", () => ({ default: () => <div data-testid="coach-home" /> }));

function baseParams(overrides: Partial<RenderHomeParams> = {}): RenderHomeParams {
  return {
    tab: "chat",
    sendMessage: vi.fn(async () => undefined),
    changeMode: vi.fn(async () => undefined),
    isStreaming: false,
    starters: [],
    startersLoading: false,
    noteUse: vi.fn(),
    setInputPrefill: vi.fn(),
    ...overrides,
  };
}

describe("renderHome error surfacing", () => {
  it("keeps the starter home visible when nothing failed", () => {
    render(<>{renderHome(baseParams())}</>);
    expect(screen.getByTestId("coach-home")).toBeInTheDocument();
    expect(screen.queryByRole("alert")).not.toBeInTheDocument();
  });

  it("shows a retryable error card above the home when a hidden turn failed", async () => {
    const onRetry = vi.fn();
    const onDismissError = vi.fn();
    render(
      <>
        {renderHome(
          baseParams({ error: "El coach no pudo preparar tu práctica.", onRetry, onDismissError }),
        )}
      </>,
    );

    expect(screen.getByRole("alert")).toHaveTextContent("El coach no pudo preparar tu práctica.");
    // The starter home is still rendered underneath so the user can pick another.
    expect(screen.getByTestId("coach-home")).toBeInTheDocument();

    await userEvent.click(screen.getByRole("button", { name: /reintentar/i }));
    expect(onRetry).toHaveBeenCalledOnce();
  });

  it("prefers the quota card over the generic error when the limit is hit", () => {
    render(<>{renderHome(baseParams({ error: "whatever", quotaExhausted: true, onDismissError: vi.fn() }))}</>);
    expect(screen.getByText(/límite diario de la IA/i)).toBeInTheDocument();
    expect(screen.queryByRole("button", { name: /reintentar/i })).not.toBeInTheDocument();
  });
});
