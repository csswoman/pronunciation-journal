// @vitest-environment jsdom
import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import { JournalPronunciationCard } from "@/components/journal/JournalPronunciationCard";

describe("JournalPronunciationCard", () => {
  it("renders empty state when there are no saved words", () => {
    render(<JournalPronunciationCard savedWords={[]} />);
    expect(screen.getByText("Aún no has guardado palabras.")).toBeInTheDocument();
    expect(screen.queryByText("thoroughly")).toBeNull();
  });

  it("renders saved words when provided", () => {
    render(<JournalPronunciationCard savedWords={["world"]} />);
    expect(screen.getByText("world")).toBeInTheDocument();
  });
});
