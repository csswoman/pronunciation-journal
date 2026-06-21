// @vitest-environment jsdom
import React, { useEffect, useState } from "react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { fireEvent, render, screen, waitFor } from "@testing-library/react";

const lexiconMount = vi.fn();
const myWordsMount = vi.fn();
const decksMount = vi.fn();
const replace = vi.fn();

let mockTab: string | null = "lexicon";

vi.mock("next/navigation", () => ({
  useRouter: () => ({ replace }),
  useSearchParams: () => ({ get: (key: string) => (key === "tab" ? mockTab : null) }),
}));

vi.mock("@/components/layout/PageLayout", () => ({
  default: ({ children }: { children: React.ReactNode }) => <div data-testid="page-layout">{children}</div>,
}));

vi.mock("@/components/layout/Section", () => ({
  default: ({ children }: { children: React.ReactNode }) => <section>{children}</section>,
}));

vi.mock("@/components/words/tabs/LexiconTabRuntime", () => ({
  default: () => {
    lexiconMount();
    return <div data-testid="lexicon-runtime">Lexicon</div>;
  },
}));

vi.mock("@/components/words/tabs/MyWordsTabRuntime", () => ({
  default: () => {
    myWordsMount();
    return <div data-testid="my-words-runtime">My Words</div>;
  },
}));

vi.mock("@/components/words/tabs/DecksTabRuntime", () => ({
  default: () => {
    decksMount();
    return <div data-testid="decks-runtime">Decks</div>;
  },
}));

vi.mock("next/dynamic", () => ({
  default: (loader: () => Promise<{ default?: React.ComponentType }>) => {
    return function DynamicMock(props: Record<string, unknown>) {
      const [Component, setComponent] = useState<React.ComponentType | null>(null);

      useEffect(() => {
        let cancelled = false;
        loader().then((mod) => {
          if (cancelled) return;
          setComponent(() => mod.default ?? null);
        });
        return () => {
          cancelled = true;
        };
      }, []);

      if (!Component) return null;
      return <Component {...props} />;
    };
  },
}));

import { WordsClient } from "../WordsClient";

describe("WordsClient tab isolation", () => {
  beforeEach(() => {
    lexiconMount.mockClear();
    myWordsMount.mockClear();
    decksMount.mockClear();
    replace.mockClear();
    mockTab = "lexicon";
  });

  it("mounts only the lexicon runtime for the default tab", async () => {
    render(
      <WordsClient
        lexiconLessons={[]}
        lexiconLearned={0}
        lexiconInProgress={0}
        lexiconTotal={0}
        lexiconPercent={0}
        myWordsCount={0}
        deckCount={0}
      />,
    );

    await waitFor(() => {
      expect(screen.getByTestId("lexicon-runtime")).toBeInTheDocument();
    });

    expect(lexiconMount).toHaveBeenCalled();
    expect(myWordsMount).not.toHaveBeenCalled();
    expect(decksMount).not.toHaveBeenCalled();
  });

  it("switches tabs through the router without a full navigation", async () => {
    render(
      <WordsClient
        lexiconLessons={[]}
        lexiconLearned={0}
        lexiconInProgress={0}
        lexiconTotal={0}
        lexiconPercent={0}
        myWordsCount={2}
        deckCount={3}
      />,
    );

    await waitFor(() => {
      expect(screen.getByRole("tab", { name: /My Words/i })).toBeInTheDocument();
    });

    fireEvent.click(screen.getByRole("tab", { name: /My Words/i }));

    expect(replace).toHaveBeenCalledWith("/words?tab=my-words", { scroll: false });
  });

  it("mounts the my-words runtime when opened directly", async () => {
    mockTab = "my-words";

    render(
      <WordsClient
        lexiconLessons={[]}
        lexiconLearned={0}
        lexiconInProgress={0}
        lexiconTotal={0}
        lexiconPercent={0}
        myWordsCount={4}
        deckCount={1}
      />,
    );

    await waitFor(() => {
      expect(screen.getByTestId("my-words-runtime")).toBeInTheDocument();
    });

    expect(myWordsMount).toHaveBeenCalled();
    expect(lexiconMount).not.toHaveBeenCalled();
    expect(decksMount).not.toHaveBeenCalled();
  });

  it("mounts the decks runtime when opened directly", async () => {
    mockTab = "decks";

    render(
      <WordsClient
        lexiconLessons={[]}
        lexiconLearned={0}
        lexiconInProgress={0}
        lexiconTotal={0}
        lexiconPercent={0}
        myWordsCount={4}
        deckCount={1}
      />,
    );

    await waitFor(() => {
      expect(screen.getByTestId("decks-runtime")).toBeInTheDocument();
    });

    expect(decksMount).toHaveBeenCalled();
    expect(lexiconMount).not.toHaveBeenCalled();
    expect(myWordsMount).not.toHaveBeenCalled();
  });
});
