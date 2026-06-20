// @vitest-environment jsdom
import { describe, it, expect, vi } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import { WordIntroStep } from "../WordIntroStep";
import type { StudyCardModel } from "@/lib/practice/study-card/model";

vi.mock("@/lib/phoneme-practice/tts", () => ({ speak: vi.fn() }));

const cards: StudyCardModel[] = [
  { word: "alpha", meaning: "first" },
  { word: "beta", meaning: "second" },
];

describe("WordIntroStep", () => {
  it("shows the first card initially", () => {
    render(<WordIntroStep cards={cards} onComplete={() => {}} />);
    expect(screen.getByRole("heading", { name: "alpha" })).toBeInTheDocument();
    expect(screen.queryByRole("heading", { name: "beta" })).not.toBeInTheDocument();
  });

  it("advances through cards and calls onComplete after the last", () => {
    const onComplete = vi.fn();
    render(<WordIntroStep cards={cards} onComplete={onComplete} />);

    fireEvent.click(screen.getByRole("button", { name: /practicar/i }));
    expect(screen.getByRole("heading", { name: "beta" })).toBeInTheDocument();
    expect(onComplete).not.toHaveBeenCalled();

    fireEvent.click(screen.getByRole("button", { name: /practicar/i }));
    expect(onComplete).toHaveBeenCalledOnce();
  });

  it("calls onComplete immediately when there are no cards", () => {
    const onComplete = vi.fn();
    render(<WordIntroStep cards={[]} onComplete={onComplete} />);
    expect(onComplete).toHaveBeenCalledOnce();
  });
});
