// @vitest-environment jsdom
import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import WeakSoundCard from "@/components/home/WeakSoundCard";

describe("WeakSoundCard", () => {
  it("shows CTA when there is no phoneme data", () => {
    render(<WeakSoundCard weakestPhoneme={null} />);
    expect(screen.queryByText("/ð/")).not.toBeInTheDocument();
    expect(screen.getByText(/laboratorio de sonidos/i)).toBeInTheDocument();
    expect(screen.getByRole("link", { name: /abrir laboratorio/i })).toHaveAttribute(
      "href",
      "/practice/sounds",
    );
  });

  it("renders IPA and a concrete practice reason when data is present", () => {
    render(
      <WeakSoundCard
        weakestPhoneme={{
          ipa: "ð",
          accuracy: 40,
          totalAttempts: 10,
          correctAnswers: 6,
          confusableIpa: "d",
          label: "voiced dental fricative",
        }}
      />,
    );
    expect(screen.getByText("/ð/")).toBeInTheDocument();
    expect(screen.queryByText(/40%/)).not.toBeInTheDocument();
    expect(
      screen.getByText((_, el) => el?.textContent === "Lo confundes con /d/"),
    ).toBeInTheDocument();
    expect(screen.getByText("/d/")).toBeInTheDocument();
    expect(screen.getByText(/practica este sonido/i)).toBeInTheDocument();
    expect(screen.getByRole("link")).toHaveAttribute("href", "/practice/sounds");
  });

  it("falls back to fail count when there is no confusable partner", () => {
    render(
      <WeakSoundCard
        weakestPhoneme={{
          ipa: "θ",
          accuracy: 35,
          totalAttempts: 10,
          correctAnswers: 6,
          confusableIpa: null,
          label: null,
        }}
      />,
    );
    expect(screen.getByText(/lo fallaste 4 de 10 veces/i)).toBeInTheDocument();
  });
});
