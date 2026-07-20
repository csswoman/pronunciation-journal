// @vitest-environment jsdom
import React, { useEffect, useState } from "react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { fireEvent, render, screen, waitFor } from "@testing-library/react";

const lexiconMount = vi.fn();
const refresh = vi.fn();
let mockMode: string | null = null;

vi.mock("next/navigation", () => ({
  useRouter: () => ({ refresh }),
  useSearchParams: () => ({ get: (key: string) => (key === "mode" ? mockMode : null) }),
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

vi.mock("next/dynamic", () => ({
  default: (loader: () => Promise<{ default?: React.ComponentType }>) => {
    return function DynamicMock(props: Record<string, unknown>) {
      const [Component, setComponent] = useState<React.ComponentType | null>(null);

      useEffect(() => {
        let cancelled = false;
        loader().then((mod) => {
          if (!cancelled) setComponent(() => mod.default ?? null);
        });
        return () => { cancelled = true; };
      }, []);

      return Component ? <Component {...props} /> : null;
    };
  },
}));

import { WordsClient } from "../WordsClient";

const props = {
  lexiconLessons: [],
  lexiconLearned: 0,
  lexiconInProgress: 0,
  lexiconTotal: 0,
  lexiconPercent: 0,
};

describe("WordsClient", () => {
  beforeEach(() => {
    lexiconMount.mockClear();
    refresh.mockClear();
    mockMode = null;
  });

  it("mounts the vocabulary runtime by default", async () => {
    render(<WordsClient {...props} />);

    await waitFor(() => expect(screen.getByTestId("lexicon-runtime")).toBeInTheDocument());
    expect(lexiconMount).toHaveBeenCalled();
  });

  it("keeps Mis palabras as a direct link to tracking", async () => {
    render(<WordsClient {...props} />);

    await waitFor(() => expect(screen.getByRole("link", { name: /Mis palabras/i })).toBeInTheDocument());
    expect(screen.getByRole("link", { name: /Mis palabras/i })).toHaveAttribute("href", "/tracking");
  });

  it("uses the same runtime for learn mode", async () => {
    mockMode = "learn";
    render(<WordsClient {...props} />);

    await waitFor(() => expect(screen.getByTestId("lexicon-runtime")).toBeInTheDocument());
    expect(lexiconMount).toHaveBeenCalled();
  });

  it("shows a recoverable progress error", () => {
    render(<WordsClient {...props} progressUnavailable />);

    expect(screen.getByRole("status")).toHaveTextContent(/No pudimos cargar tu progreso/i);
    fireEvent.click(screen.getByRole("button", { name: "Reintentar" }));
    expect(refresh).toHaveBeenCalledTimes(1);
  });
});
