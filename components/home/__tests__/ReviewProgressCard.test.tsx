// @vitest-environment jsdom
import { describe, it, expect, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import ReviewProgressCard from "@/components/home/ReviewProgressCard";

vi.mock("dexie-react-hooks", () => ({
  useLiveQuery: () => 0,
}));

describe("ReviewProgressCard", () => {
  it("does NOT render a hardcoded /ð/ when there is no phoneme data", () => {
    render(<ReviewProgressCard vocabulary={null} weakestPhoneme={null} />);
    expect(screen.queryByText("/ð/")).not.toBeInTheDocument();
    expect(screen.getByText(/find your weakest sound/i)).toBeInTheDocument();
  });

  it("renders the weakest sound when data is present", () => {
    render(
      <ReviewProgressCard
        vocabulary={{ wordBankMastered: 10, catalogTotal: 3500 }}
        weakestPhoneme={{ ipa: "ð", accuracy: 40, totalAttempts: 12, label: "voiced dental fricative" }}
      />,
    );
    expect(screen.getByText("/ð/")).toBeInTheDocument();
    expect(screen.getByText(/voiced dental fricative/i)).toBeInTheDocument();
  });

  it("shows Essential Words CTA when the user has no vocabulary progress", () => {
    render(
      <ReviewProgressCard
        vocabulary={{ wordBankMastered: 0, catalogTotal: 3500 }}
        weakestPhoneme={null}
      />,
    );
    expect(screen.getByText(/start with essential words/i)).toBeInTheDocument();
  });
});
