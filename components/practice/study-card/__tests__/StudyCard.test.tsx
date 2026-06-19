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
    fireEvent.click(screen.getByRole("button", { name: /practicar/i }));
    expect(onContinue).toHaveBeenCalledOnce();
  });

  it("renders the archive action only when onArchive is provided", () => {
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
    fireEvent.click(screen.getByRole("button", { name: /ya la sé/i }));
    expect(onArchive).toHaveBeenCalledOnce();
  });
});
