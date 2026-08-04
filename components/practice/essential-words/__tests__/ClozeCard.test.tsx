// @vitest-environment jsdom
import { describe, expect, it, vi } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import { ClozeCard } from "../ClozeCard";
import type { EssentialWord } from "@/lib/essential-words/types";
import { selectSentence } from "@/lib/essential-words/sentence-variants";

vi.mock("@/lib/ui-sounds/cues", () => ({ playUiCue: vi.fn() }));

const entry: EssentialWord = {
  rank: 67,
  word: "work",
  pos: "verb",
  ipa_strong: "/ˈwɜrk/",
  example_sentence: "She works at a hospital downtown every single day.",
  cefr_level: "A1",
  meaning: "to do a job",
  translation: "trabajar",
};

const withVariants: EssentialWord = {
  ...entry,
  example_sentences: [
    {
      sentence: "They work together on every big project at the office.",
      sentence_ipa: "/ðeɪ wɜrk təˈɡɛðər/",
    },
  ],
};

function setup(onGraded = vi.fn().mockResolvedValue(undefined)) {
  render(<ClozeCard entry={entry} onGraded={onGraded} />);
  return onGraded;
}

describe("ClozeCard", () => {
  it("shows the blanked sentence, not the answer", () => {
    setup();
    expect(
      screen.getByText("She ___ at a hospital downtown every single day."),
    ).toBeInTheDocument();
    expect(screen.queryByText(/^works$/)).not.toBeInTheDocument();
  });

  it("shows the translation as a hint", () => {
    setup();
    expect(screen.getByText(/trabajar/)).toBeInTheDocument();
  });

  it("grades 5 on the exact surface form", () => {
    const onGraded = setup();
    fireEvent.change(screen.getByLabelText("Escribe la palabra que falta"), {
      target: { value: "Works" },
    });
    fireEvent.click(screen.getByRole("button", { name: "Comprobar" }));
    expect(onGraded).toHaveBeenCalledWith(5);
  });

  it("grades 5 on the base form too", () => {
    const onGraded = setup();
    fireEvent.change(screen.getByLabelText("Escribe la palabra que falta"), {
      target: { value: "work" },
    });
    fireEvent.click(screen.getByRole("button", { name: "Comprobar" }));
    expect(onGraded).toHaveBeenCalledWith(5);
  });

  it("grades 2 on a wrong answer and reveals the full sentence", () => {
    const onGraded = setup();
    fireEvent.change(screen.getByLabelText("Escribe la palabra que falta"), {
      target: { value: "sleeps" },
    });
    fireEvent.click(screen.getByRole("button", { name: "Comprobar" }));
    expect(onGraded).toHaveBeenCalledWith(2);
    expect(
      screen.getByText("She works at a hospital downtown every single day."),
    ).toBeInTheDocument();
  });

  it("does not grade an empty answer", () => {
    const onGraded = setup();
    fireEvent.click(screen.getByRole("button", { name: "Comprobar" }));
    expect(onGraded).not.toHaveBeenCalled();
  });

  it("blanks and reveals the selected variant's sentence, not the base one", () => {
    const onGraded = vi.fn().mockResolvedValue(undefined);
    // "work" seeds to index 1 (the variant) at repetitions=0.
    render(<ClozeCard entry={withVariants} onGraded={onGraded} repetitions={0} />);

    const expectedSentence = selectSentence(withVariants, 0).sentence;
    expect(expectedSentence).not.toBe(withVariants.example_sentence);

    fireEvent.change(screen.getByLabelText("Escribe la palabra que falta"), {
      target: { value: "wrong" },
    });
    fireEvent.click(screen.getByRole("button", { name: "Comprobar" }));

    expect(onGraded).toHaveBeenCalledWith(2);
    expect(screen.getByText(expectedSentence)).toBeInTheDocument();
    expect(
      screen.queryByText(withVariants.example_sentence),
    ).not.toBeInTheDocument();
  });
});
