// @vitest-environment jsdom
import React from "react";
import { describe, expect, it, vi } from "vitest";
import { render, screen } from "@testing-library/react";

vi.mock("next/link", () => ({
  default: ({ children, ...props }: React.PropsWithChildren<Record<string, unknown>>) => (
    <a {...props}>{children}</a>
  ),
}));

vi.mock("@/lib/db", () => ({ setLastPracticeMode: vi.fn() }));

import VocabularyReviewCard from "../VocabularyReviewCard";

describe("VocabularyReviewCard", () => {
  it("shows an inviting empty state when nothing is learned yet", () => {
    render(<VocabularyReviewCard dueCount={null} learnedCount={0} totalCount={1000} />);
    expect(screen.getByText("Empieza aquí")).toBeInTheDocument();
    expect(screen.queryByText(/aprendidas/)).not.toBeInTheDocument();
    expect(screen.getByRole("progressbar")).toHaveAttribute("aria-valuenow", "0");
  });

  it("renders real learned / ahead counts and a matching progress bar", () => {
    render(<VocabularyReviewCard dueCount={null} learnedCount={150} totalCount={600} />);
    expect(screen.getByText("150 aprendidas")).toBeInTheDocument();
    expect(screen.getByText("450 por delante")).toBeInTheDocument();
    expect(screen.getByRole("progressbar")).toHaveAttribute("aria-valuenow", "25");
  });

  it("omits the progress bar entirely when counts are unavailable", () => {
    render(<VocabularyReviewCard dueCount={3} learnedCount={null} totalCount={null} />);
    expect(screen.queryByRole("progressbar")).not.toBeInTheDocument();
    expect(screen.getByText("3 pendientes")).toBeInTheDocument();
  });
});
