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

  it("renders IPA and qualitative accuracy when data is present", () => {
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
    expect(screen.queryByText(/40%/)).not.toBeInTheDocument();
    expect(screen.getByText(/conviene practicar/i)).toBeInTheDocument();
    expect(screen.getByText(/practicar este sonido/i)).toBeInTheDocument();
    expect(screen.getByRole("link")).toHaveAttribute("href", "/practice/sounds");
  });
});
