// @vitest-environment jsdom
import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import ReviewQueueCard from "@/components/home/ReviewQueueCard";
import type { ReviewQueueSummary } from "@/lib/home/constants";

const summary = (over: Partial<ReviewQueueSummary>): ReviewQueueSummary => ({
  total: 0, newAvailable: 0, sources: [], preview: [], ...over,
});

describe("ReviewQueueCard", () => {
  it("shows Start review when items are due", () => {
    render(<ReviewQueueCard summary={summary({ total: 5 })} />);
    expect(screen.getByRole("link", { name: /start review/i })).toBeInTheDocument();
    expect(screen.getByText("5")).toBeInTheDocument();
  });

  it("shows Learn new words when nothing due but new available", () => {
    render(<ReviewQueueCard summary={summary({ total: 0, newAvailable: 4 })} />);
    expect(screen.getByRole("link", { name: /learn new words/i })).toBeInTheDocument();
  });

  it("shows caught-up state when nothing due and nothing new", () => {
    render(<ReviewQueueCard summary={summary({ total: 0, newAvailable: 0 })} />);
    expect(screen.getByText(/all caught up/i)).toBeInTheDocument();
    expect(screen.queryByRole("link", { name: /start review/i })).not.toBeInTheDocument();
  });
});
