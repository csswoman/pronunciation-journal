// @vitest-environment jsdom
import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import WeakSoundCard from "@/components/home/WeakSoundCard";

describe("WeakSoundCard", () => {
  it("shows CTA when there is no phoneme data", () => {
    render(<WeakSoundCard weakestPhoneme={null} />);
    expect(screen.queryByText("/ð/")).not.toBeInTheDocument();
    expect(screen.getByText(/practicar sonidos/i)).toBeInTheDocument();
  });

  it("renders IPA and accuracy when data is present", () => {
    render(
      <WeakSoundCard
        weakestPhoneme={{
          ipa: "ð",
          accuracy: 40,
          totalAttempts: 12,
          label: "voiced dental fricative",
        }}
      />,
    );
    expect(screen.getByText("/ð/")).toBeInTheDocument();
    expect(screen.getByText(/40%/)).toBeInTheDocument();
    expect(screen.getByText(/practicar este sonido/i)).toBeInTheDocument();
    expect(screen.getByRole("link")).toHaveAttribute("href", "/practice/sounds");
  });
});
