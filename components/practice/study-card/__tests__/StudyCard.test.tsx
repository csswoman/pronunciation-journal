// @vitest-environment jsdom
import { describe, it, expect, vi } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import { StudyCard } from "../StudyCard";
import type { StudyCardModel } from "@/lib/practice/study-card/model";

const full: StudyCardModel = {
  word: "ephemeral",
  ipa: "/ɪˈfem(ə)rəl/",
  meaning: "lasting a very short time",
  translation: "efímero",
  sentence: "Fame can be ephemeral.",
  chips: ["B2", "adjective"],
};

const minimal: StudyCardModel = { word: "house" };

describe("StudyCard", () => {
  it("always renders the word", () => {
    render(<StudyCard model={minimal} onContinue={() => {}} onListen={() => {}} />);
    expect(screen.getByRole("heading", { name: "house" })).toBeInTheDocument();
  });

  it("renders meaning, translation, ipa and sentence when present", () => {
    render(<StudyCard model={full} onContinue={() => {}} onListen={() => {}} />);
    expect(screen.getByText("lasting a very short time")).toBeInTheDocument();
    expect(screen.getByText("efímero")).toBeInTheDocument();
    expect(screen.getByText("/ɪˈfem(ə)rəl/")).toBeInTheDocument();
    // Sentence renders with the target word highlighted in its own <mark>, so it
    // is split across nodes; assert the surrounding fragment + the mark.
    expect(screen.getByText(/Fame can be/)).toBeInTheDocument();
    expect(screen.getByText("ephemeral", { selector: "mark" })).toBeInTheDocument();
  });

  it("omits optional sections when absent", () => {
    render(<StudyCard model={minimal} onContinue={() => {}} onListen={() => {}} />);
    expect(screen.queryByText("efímero")).not.toBeInTheDocument();
    expect(screen.queryByText(/Fame can be/)).not.toBeInTheDocument();
  });

  it("renders the weak-form row only when the model carries one", () => {
    const weak: StudyCardModel = {
      word: "to",
      ipa: "/tuː/",
      weakForm: { ipa: "/tə/", phrase: "to go" },
    };
    render(<StudyCard model={weak} onContinue={() => {}} onListen={() => {}} />);
    expect(screen.getByText("/tə/")).toBeInTheDocument();
  });

  it("fires onContinue when the primary action is pressed", () => {
    const onContinue = vi.fn();
    render(<StudyCard model={minimal} onContinue={onContinue} onListen={() => {}} />);
    fireEvent.click(screen.getByRole("button", { name: /continuar/i }));
    expect(onContinue).toHaveBeenCalledOnce();
  });

  it("respects continueLabel", () => {
    render(
      <StudyCard
        model={minimal}
        onContinue={() => {}}
        onListen={() => {}}
        continueLabel="Practicar"
      />,
    );
    expect(screen.getByRole("button", { name: /practicar/i })).toBeInTheDocument();
  });

  it("fires onOmit when Ya conozco esta palabra is pressed", () => {
    const onOmit = vi.fn();
    render(
      <StudyCard
        model={minimal}
        onContinue={() => {}}
        onListen={() => {}}
        onOmit={onOmit}
      />,
    );
    fireEvent.click(screen.getByRole("button", { name: /ya conozco esta palabra/i }));
    expect(onOmit).toHaveBeenCalledOnce();
  });

  it("renders the known-word claim as a centered, keyboard-accessible secondary action", () => {
    render(
      <StudyCard
        model={minimal}
        onContinue={() => {}}
        onListen={() => {}}
        onOmit={() => {}}
      />,
    );

    expect(screen.getByRole("button", { name: /ya conozco esta palabra/i })).toHaveClass(
      "self-center",
      "min-h-11",
      "min-w-11",
      "font-normal",
      "text-fg-muted",
      "hover:bg-surface-sunken",
      "hover:text-fg",
      "focus-ring",
    );
  });

  it("uses claim copy that does not promise to skip the word", () => {
    render(
      <StudyCard
        model={minimal}
        onContinue={() => {}}
        onListen={() => {}}
        onOmit={() => {}}
      />,
    );

    expect(
      screen.getByRole("button", { name: /ya conozco esta palabra/i }),
    ).toBeInTheDocument();
    expect(screen.queryByText(/sáltala/i)).not.toBeInTheDocument();
  });

  it("uses the skip link label when onOmit is provided", () => {
    render(
      <StudyCard
        model={minimal}
        onContinue={() => {}}
        onListen={() => {}}
        onOmit={() => {}}
        onArchive={() => {}}
      />,
    );
    expect(screen.getByRole("button", { name: /ya conozco esta palabra/i })).toBeInTheDocument();
    expect(screen.queryByRole("button", { name: /^ya la sé$/i })).not.toBeInTheDocument();
  });

  it("renders the archive action only when onArchive is provided without onOmit", () => {
    const onArchive = vi.fn();
    const { rerender } = render(
      <StudyCard model={minimal} onContinue={() => {}} onListen={() => {}} />,
    );
    expect(screen.queryByRole("button", { name: /ya la sé/i })).not.toBeInTheDocument();

    rerender(
      <StudyCard
        model={minimal}
        onContinue={() => {}}
        onListen={() => {}}
        onArchive={onArchive}
      />,
    );
    // Archiving is a two-step flow: "Ya la sé" opens a confirmation and only
    // "Sí, pausar" fires onArchive.
    fireEvent.click(screen.getByRole("button", { name: /ya la sé/i }));
    fireEvent.click(screen.getByRole("button", { name: /sí, pausar/i }));
    expect(onArchive).toHaveBeenCalledOnce();
  });

  it("keeps a repeated definition out of the hero and collapses pronunciation", () => {
    render(
      <StudyCard
        model={{
          word: 'the',
          study: {
            translation: ['el', 'la', 'los', 'las'],
            definitionEs: 'Se usa cuando ya se sabe de cuál hablas.',
            usageRuleEs: 'Se omite al hablar en general; se usa cuando ya se sabe de cuál hablas.',
            pronunciation: {
              soundAnchors: [],
              variants: [{
                id: 'before_consonant',
                labelEs: 'Antes de sonido de consonante',
                ipa: '/ðə/',
                spokenExample: { text: 'the book', highlights: [{ start: 0, end: 3 }] },
                ttsText: 'the book',
                anchorIds: [],
              }],
            },
            contrasts: {
              titleEs: 'En inglés se omite',
              pairs: [{
                pattern: 'omission',
                spanish: { text: 'Me gusta el café', highlights: [{ start: 9, end: 11 }] },
                english: { text: 'I like coffee', highlights: [] },
                ttsText: 'I like coffee',
              }],
            },
          },
        }}
        onContinue={() => {}}
        onListen={() => {}}
      />,
    )

    expect(screen.queryAllByText('Se usa cuando ya se sabe de cuál hablas.')).toHaveLength(0)
    expect(screen.getByText('Cuándo se usa')).toBeInTheDocument()
    expect(screen.getByText(/Se omite al hablar en general/)).toBeInTheDocument()
    expect(screen.queryByText('En inglés se omite')).not.toBeInTheDocument()
    expect(screen.getByText('Aquí no va “the”.')).toBeInTheDocument()
    expect(screen.getByText('Cómo suena').closest('details')).not.toHaveAttribute('open')
  })
});
