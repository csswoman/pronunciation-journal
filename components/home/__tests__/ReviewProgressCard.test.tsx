// @vitest-environment jsdom
import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import ReviewProgressCard from "@/components/home/ReviewProgressCard";

describe("ReviewProgressCard", () => {
  it("does NOT render a hardcoded /ð/ when there is no phoneme data", () => {
    render(<ReviewProgressCard lexicon={null} weakestPhoneme={null} />);
    expect(screen.queryByText("/ð/")).not.toBeInTheDocument();
    expect(screen.getByText(/find your weakest sound/i)).toBeInTheDocument();
  });

  it("renders the weakest sound when data is present", () => {
    render(
      <ReviewProgressCard
        lexicon={{ learned: 10, total: 100, percent: 10 }}
        weakestPhoneme={{ ipa: "ð", accuracy: 40, totalAttempts: 12, label: "voiced dental fricative" }}
      />,
    );
    expect(screen.getByText("/ð/")).toBeInTheDocument();
    expect(screen.getByText(/voiced dental fricative/i)).toBeInTheDocument();
  });
});
