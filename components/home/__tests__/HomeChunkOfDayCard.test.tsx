// @vitest-environment jsdom
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import { describe, expect, it, beforeEach } from "vitest";
import HomeChunkOfDayCard from "../HomeChunkOfDayCard";

describe("HomeChunkOfDayCard", () => {
  beforeEach(() => {
    sessionStorage.clear();
  });

  it("renders the chunk of the day with title, IPA and meaning", () => {
    const { container } = render(<HomeChunkOfDayCard />);
    expect(screen.getByText("Frase del día")).toBeInTheDocument();

    const ipaElement = container.querySelector(".font-ipa");
    expect(ipaElement).toBeInTheDocument();

    const wordElement = container.querySelector(".home-chunk-quote__phrase");
    expect(wordElement).toBeInTheDocument();
    expect(wordElement?.textContent?.trim()).toBeTruthy();
  });

  it("changes the chunk when clicking the shuffle button", async () => {
    const { container } = render(<HomeChunkOfDayCard />);
    const shuffleButton = screen.getByRole("button", { name: "Sacar otra frase" });
    expect(shuffleButton).toBeInTheDocument();

    const initialWord = container.querySelector(
      ".home-chunk-quote__phrase",
    )?.textContent;
    expect(initialWord).toBeTruthy();

    fireEvent.click(shuffleButton);

    await waitFor(() => {
      expect(screen.getByText("Frase del día")).toBeInTheDocument();
    });
  });

  it("toggles content language between ES (meaning) and EN (example)", () => {
    render(<HomeChunkOfDayCard />);
    const esButton = screen.getByRole("button", { name: "ES" });
    const enButton = screen.getByRole("button", { name: "EN" });

    expect(esButton).toHaveAttribute("aria-pressed", "true");
    expect(enButton).toHaveAttribute("aria-pressed", "false");
    expect(screen.getByText("Significado")).toBeInTheDocument();

    fireEvent.click(enButton);

    expect(enButton).toHaveAttribute("aria-pressed", "true");
    expect(esButton).toHaveAttribute("aria-pressed", "false");
    expect(screen.getByText("Ejemplo")).toBeInTheDocument();
    expect(screen.getByText("Ejemplo").classList.contains("animate-state-in")).toBe(
      true,
    );
    const example = screen.getByText(/^“/);
    expect(example.classList.contains("animate-state-in")).toBe(true);

    fireEvent.click(esButton);
    expect(esButton).toHaveAttribute("aria-pressed", "true");
    expect(screen.getByText("Significado")).toBeInTheDocument();
    expect(
      screen.getByText("Significado").classList.contains("animate-state-in"),
    ).toBe(true);
  });
});
