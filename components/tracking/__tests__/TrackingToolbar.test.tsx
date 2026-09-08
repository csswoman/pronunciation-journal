// @vitest-environment jsdom
import { describe, it, expect, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { TrackingToolbar } from "../TrackingToolbar";

const BASE_PROPS = {
  filter: "all" as const,
  onFilterChange: vi.fn(),
  searchQuery: "",
  onSearchChange: vi.fn(),
  canReview: false,
  availableReviewCount: 0,
  startingReview: false,
  onStartReview: vi.fn(),
};

describe("TrackingToolbar coach filter", () => {
  it("renders a 'Del coach' filter alongside the type filters", () => {
    render(<TrackingToolbar {...BASE_PROPS} />);
    expect(screen.getByRole("button", { name: "Del coach" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Palabras" })).toBeInTheDocument();
  });

  it("reports the ai_coach filter when tapped", async () => {
    const onFilterChange = vi.fn();
    render(<TrackingToolbar {...BASE_PROPS} onFilterChange={onFilterChange} />);
    await userEvent.click(screen.getByRole("button", { name: "Del coach" }));
    expect(onFilterChange).toHaveBeenCalledWith("ai_coach");
  });

  it("marks the coach filter as pressed when it is active", () => {
    render(<TrackingToolbar {...BASE_PROPS} filter="ai_coach" />);
    expect(screen.getByRole("button", { name: "Del coach" })).toHaveAttribute("aria-pressed", "true");
  });
});
