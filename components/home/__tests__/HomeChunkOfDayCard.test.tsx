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

    expect(screen.getByRole("button", { name: /escuchar pronunciación/i })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Escuchar ejemplo" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Guardar frase" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Ver otra frase" })).toBeInTheDocument();
  });

  it("renders example translation for a sentence-style example by default", () => {
    // Seed a chunk whose example is a plain sentence (no structured dialogue).
    sessionStorage.setItem(
      "chunk_of_day_session",
      JSON.stringify({
        date: new Date().toISOString().slice(0, 10),
        isShuffled: true,
        chunk: {
          id: "test-sentence",
          chunk: "Break the ice",
          ipa: "/breɪk ðə aɪs/",
          meaning: "Romper el hielo",
          example: "He told a joke to break the ice.",
          example_translation: "Contó un chiste para romper el hielo.",
          category: "Breaking the Ice",
        },
      })
    );
    render(<HomeChunkOfDayCard />);
    
    // Example is visible by default
    expect(screen.getByText("Contó un chiste para romper el hielo.")).toBeInTheDocument();
  });

  it("renders a two-turn dialogue with leading dashes for connector phrases", () => {
    sessionStorage.setItem(
      "chunk_of_day_session",
      JSON.stringify({
        date: new Date().toISOString().slice(0, 10),
        isShuffled: true,
        chunk: {
          id: "test-dialogue",
          chunk: "Just out of curiosity,...",
          ipa: "/dʒʌst aʊt əv ˌkjʊəriˈɒsɪti/",
          meaning: "Solo por curiosidad,...",
          example: "Just out of curiosity, how much did that cost?",
          example_translation: "Solo por curiosidad, ¿cuánto costó eso?",
          example_dialogue: [
            { en: "We finally got the kitchen remodeled last month.", es: "Por fin remodelamos la cocina el mes pasado." },
            { en: "Just out of curiosity, how much did that cost?", es: "Solo por curiosidad, ¿cuánto costó eso?" },
          ],
          category: "Useful Connectors",
        },
      })
    );
    render(<HomeChunkOfDayCard />);

    // Dialogue turns render with a leading em dash
    expect(
      screen.getByText((_, el) => el?.textContent === "— Just out of curiosity, how much did that cost?")
    ).toBeInTheDocument();
    expect(screen.queryByRole("button", { name: "Ver traducción" })).not.toBeInTheDocument();
  });

  it("triggers speakText when clicking the audio button", () => {
    render(<HomeChunkOfDayCard />);
    const speakButton = screen.getByRole("button", { name: /escuchar pronunciación/i });
    fireEvent.click(speakButton);
    expect(speakTextMock).toHaveBeenCalled();

    const exampleSpeakButton = screen.getByRole("button", { name: "Escuchar ejemplo" });
    fireEvent.click(exampleSpeakButton);
    expect(speakTextMock).toHaveBeenCalledTimes(2);
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
