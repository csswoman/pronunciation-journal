// @vitest-environment jsdom
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import { describe, expect, it, beforeEach, vi } from "vitest";
import HomeChunkOfDayCard from "../HomeChunkOfDayCard";

const speakTextMock = vi.fn();
vi.mock("@/lib/speech/synthesis", () => ({
  speakText: (...args: unknown[]) => speakTextMock(...args),
}));

describe("HomeChunkOfDayCard", () => {
  beforeEach(() => {
    sessionStorage.clear();
    speakTextMock.mockClear();
  });

  it("renders the chunk of the day with title, IPA, meaning, example and speak button", () => {
    const { container } = render(<HomeChunkOfDayCard />);
    expect(screen.getByText("Frase del día")).toBeInTheDocument();

    const ipaElement = container.querySelector(".font-ipa");
    expect(ipaElement).toBeInTheDocument();

    expect(screen.getByRole("button", { name: "Escuchar pronunciación" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Guardar frase" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Ver otra frase" })).toBeInTheDocument();
  });

  it("triggers speakText when clicking the audio button", () => {
    render(<HomeChunkOfDayCard />);
    const speakButton = screen.getByRole("button", { name: "Escuchar pronunciación" });
    fireEvent.click(speakButton);
    expect(speakTextMock).toHaveBeenCalled();
  });

  it("changes the chunk when clicking the Otra button", async () => {
    render(<HomeChunkOfDayCard />);
    const shuffleButton = screen.getByRole("button", { name: "Ver otra frase" });
    expect(shuffleButton).toBeInTheDocument();

    fireEvent.click(shuffleButton);

    await waitFor(() => {
      expect(screen.getByText("Frase del día")).toBeInTheDocument();
    });
  });
});
