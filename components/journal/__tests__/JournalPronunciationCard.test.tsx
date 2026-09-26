// @vitest-environment jsdom
import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import { JournalPronunciationCard } from "@/components/journal/JournalPronunciationCard";

describe("JournalPronunciationCard", () => {
  it("renders default vocabulary when there are no saved words", () => {
    render(<JournalPronunciationCard savedWords={[]} />);
    expect(screen.getByText("VOCABULARIO DE HOY")).toBeInTheDocument();
    expect(screen.getByText("overwhelmed")).toBeInTheDocument();
  });

  it("renders saved words when provided", () => {
    render(<JournalPronunciationCard savedWords={["grateful"]} />);
    expect(screen.getByText("grateful")).toBeInTheDocument();
  });
});
