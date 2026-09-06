// @vitest-environment jsdom
import { describe, it, expect, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { TrackingCard } from "../TrackingCard";
import type { TrackingReviewSource } from "@/lib/tracking/review-queue";

function explanationSource(): TrackingReviewSource {
  return {
    item: {
      id: "x1",
      kind: "explanation",
      title: '"actually" — falso amigo',
      description: "Line one of the explanation.\nLine two with an example.",
      fromCoach: true,
    },
    trackedItem: {
      id: "x1",
      userId: "u1",
      kind: "explanation",
      ref: '"actually" — falso amigo',
      title: '"actually" — falso amigo',
      payload: { body: "Line one of the explanation.\nLine two with an example.", source: "ai_coach" },
      createdAt: "2026-09-06T00:00:00.000Z",
      updatedAt: "2026-09-06T00:00:00.000Z",
    },
  } as TrackingReviewSource;
}

describe("TrackingCard — explanation", () => {
  it("shows the title, the Explicación badge and the coach badge", () => {
    render(
      <TrackingCard
        source={explanationSource()}
        onEditWord={vi.fn()}
        onDeleteWord={vi.fn()}
        onDeleteExplanation={vi.fn()}
      />,
    );
    expect(screen.getByText('"actually" — falso amigo')).toBeInTheDocument();
    expect(screen.getByText("Explicación")).toBeInTheDocument();
    expect(screen.getByText(/coach/i)).toBeInTheDocument();
  });

  it("renders the body text and a Ver más toggle", async () => {
    render(
      <TrackingCard
        source={explanationSource()}
        onEditWord={vi.fn()}
        onDeleteWord={vi.fn()}
        onDeleteExplanation={vi.fn()}
      />,
    );
    expect(screen.getByText(/Line one of the explanation/)).toBeInTheDocument();
    const toggle = screen.getByRole("button", { name: /ver más/i });
    await userEvent.click(toggle);
    expect(screen.getByRole("button", { name: /ver menos/i })).toBeInTheDocument();
  });

  it("calls onDeleteExplanation when the delete button is tapped", async () => {
    const onDeleteExplanation = vi.fn();
    const source = explanationSource();
    render(
      <TrackingCard
        source={source}
        onEditWord={vi.fn()}
        onDeleteWord={vi.fn()}
        onDeleteExplanation={onDeleteExplanation}
      />,
    );
    await userEvent.click(screen.getByRole("button", { name: /eliminar/i }));
    expect(onDeleteExplanation).toHaveBeenCalledWith(source);
  });
});
