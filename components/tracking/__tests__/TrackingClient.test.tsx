// @vitest-environment jsdom
import React from "react";
import { fireEvent, render, screen } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";

interface TrackingMockValue {
  items: unknown[];
  reviewSources: unknown[];
  words: unknown[];
  loading: boolean;
  userId: string;
  addWord: ReturnType<typeof vi.fn>;
  updateWord: ReturnType<typeof vi.fn>;
  removeWord: ReturnType<typeof vi.fn>;
}

const trackingState = vi.hoisted(() => ({
  value: { items: [], reviewSources: [], words: [], loading: false, userId: "user-1", addWord: vi.fn(), updateWord: vi.fn(), removeWord: vi.fn() } as TrackingMockValue,
}));

vi.mock("next/navigation", () => ({ useRouter: () => ({ push: vi.fn() }) }));
vi.mock("@/hooks/useTracking", () => ({
  useTracking: () => trackingState.value,
}));
vi.mock("@/components/layout/PageLayout", () => ({ default: ({ children }: { children: React.ReactNode }) => <div>{children}</div> }));
vi.mock("@/components/layout/PageHeader", () => ({ default: ({ title }: { title: string }) => <h1>{title}</h1> }));
vi.mock("@/components/tracking/TrackingEmptyState", () => ({ TrackingEmptyState: () => <p>Vacío</p> }));
vi.mock("@/components/tracking/PhraseCaptureModal", () => ({ PhraseCaptureModal: () => null }));
vi.mock("@/components/vocabulary/words/QuickAddModal", () => ({
  QuickAddModal: ({ open, contextLabel, onEditExisting }: { open: boolean; contextLabel?: string; onEditExisting?: (id: string) => void }) => open ? (
    <div role="dialog">
      {contextLabel}
      <button type="button" onClick={() => onEditExisting?.("word-dup")}>Editar la que ya tienes</button>
    </div>
  ) : null,
}));
vi.mock("@/lib/tracking/review-queue", () => ({ buildTrackingReviewQueue: () => ({ items: [] }) }));

import TrackingClient from "../TrackingClient";

describe("TrackingClient capture shortcut", () => {
  beforeEach(() => {
    trackingState.value = { items: [], reviewSources: [], words: [], loading: false, userId: "user-1", addWord: vi.fn(), updateWord: vi.fn(), removeWord: vi.fn() };
  });

  it("opens Tracking word capture with N outside an editable field", () => {
    render(<TrackingClient />);

    fireEvent.keyDown(window, { key: "n" });

    expect(screen.getByRole("dialog")).toHaveTextContent("TRACKING");
  });

  it("does not steal N while the user is typing", () => {
    render(<><input aria-label="Escribir" /><TrackingClient /></>);

    fireEvent.keyDown(screen.getByLabelText("Escribir"), { key: "n" });

    expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
  });

  it("shows Dictionary word details instead of reducing a word to its translation", () => {
    trackingState.value = {
      items: [],
      words: [],
      loading: false,
      userId: "user-1",
      addWord: vi.fn(),
      updateWord: vi.fn(),
      removeWord: vi.fn(),
      reviewSources: [{
        item: { id: "word-1", kind: "word", title: "resilient", description: "resistente" },
        word: {
          id: "word-1", text: "resilient", ipa: "rɪˈzɪliənt", translation: "resistente",
          meaning: "able to recover quickly", context: "She is resilient after setbacks.",
        },
      }],
    };

    render(<TrackingClient />);

    expect(screen.getByText("/rɪˈzɪliənt/")).toBeInTheDocument();
    expect(screen.getByText("able to recover quickly")).toBeInTheDocument();
    expect(screen.getByText("“She is resilient after setbacks.”")).toBeInTheDocument();
    fireEvent.click(screen.getByRole("button", { name: "Editar resilient" }));
    expect(screen.getByRole("dialog", { name: "Editar palabra" })).toBeInTheDocument();
    fireEvent.click(screen.getByRole("button", { name: "Cancelar" }));
    fireEvent.click(screen.getByRole("button", { name: "Eliminar resilient" }));
    expect(screen.getByRole("alertdialog", { name: "Eliminar “resilient”" })).toBeInTheDocument();
  });

  it("opens the existing word in the editor instead of saving a duplicate", () => {
    trackingState.value = {
      items: [],
      reviewSources: [],
      words: [{ id: "word-dup", text: "resilient", ipa: null, translation: null, meaning: null, context: null }],
      loading: false,
      userId: "user-1",
      addWord: vi.fn(),
      updateWord: vi.fn(),
      removeWord: vi.fn(),
    };

    render(<TrackingClient />);
    fireEvent.keyDown(window, { key: "n" });
    fireEvent.click(screen.getByRole("button", { name: "Editar la que ya tienes" }));

    const editor = screen.getByRole("dialog", { name: "Editar palabra" });
    expect(editor).toBeInTheDocument();
    expect(screen.getByDisplayValue("resilient")).toBeInTheDocument();
  });

  it("renders kind badge (chip) for saved items", () => {
    trackingState.value = {
      items: [],
      words: [],
      loading: false,
      userId: "user-1",
      addWord: vi.fn(),
      updateWord: vi.fn(),
      removeWord: vi.fn(),
      reviewSources: [
        {
          item: { id: "word-1", kind: "word", title: "cut corners", description: "ahorrar costos" },
          word: { id: "word-1", text: "cut corners", ipa: "kʌt ˈkɔːrnərz", translation: "ahorrar costos" },
        },
        {
          item: { id: "phrase-1", kind: "phrase", title: "Having said that...", description: "Dicho esto" },
          trackedItem: { id: "phrase-1", kind: "phrase", ref: "having said that", title: "Having said that...", payload: {} },
        },
      ],
    };

    render(<TrackingClient />);
    expect(screen.getByText("Palabra")).toBeInTheDocument();
    expect(screen.getByText("Frase")).toBeInTheDocument();
  });

  it("filters items when typing in the search input", () => {
    trackingState.value = {
      items: [],
      words: [],
      loading: false,
      userId: "user-1",
      addWord: vi.fn(),
      updateWord: vi.fn(),
      removeWord: vi.fn(),
      reviewSources: [
        {
          item: { id: "word-1", kind: "word", title: "cut corners", description: "ahorrar costos" },
          word: { id: "word-1", text: "cut corners", ipa: "kʌt ˈkɔːrnərz", translation: "ahorrar costos" },
        },
        {
          item: { id: "word-2", kind: "word", title: "resilient", description: "resistente" },
          word: { id: "word-2", text: "resilient", ipa: "rɪˈzɪliənt", translation: "resistente" },
        },
      ],
    };

    render(<TrackingClient />);
    expect(screen.getByText("cut corners")).toBeInTheDocument();
    expect(screen.getByText("resilient")).toBeInTheDocument();

    const searchInput = screen.getByLabelText("Buscar en guardados");
    fireEvent.change(searchInput, { target: { value: "resil" } });

    expect(screen.queryByText("cut corners")).not.toBeInTheDocument();
    expect(screen.getByText("resilient")).toBeInTheDocument();
  });

  it("paginates items when exceeding PAGE_SIZE", () => {
    const manySources = Array.from({ length: 20 }, (_, i) => ({
      item: { id: `word-${i}`, kind: "word", title: `Word ${i + 1}`, description: `Desc ${i + 1}` },
      word: { id: `word-${i}`, text: `Word ${i + 1}`, translation: `Trans ${i + 1}` },
    }));

    trackingState.value = {
      items: [],
      words: [],
      loading: false,
      userId: "user-1",
      addWord: vi.fn(),
      updateWord: vi.fn(),
      removeWord: vi.fn(),
      reviewSources: manySources,
    };

    render(<TrackingClient />);
    expect(screen.getByText("Word 1")).toBeInTheDocument();
    expect(screen.getByText("Word 15")).toBeInTheDocument();
    expect(screen.queryByText("Word 16")).not.toBeInTheDocument();

    const nextBtn = screen.getByRole("button", { name: "Página siguiente" });
    fireEvent.click(nextBtn);

    expect(screen.getByText("Word 16")).toBeInTheDocument();
    expect(screen.getByText("Word 20")).toBeInTheDocument();
    expect(screen.queryByText("Word 1")).not.toBeInTheDocument();
  });

  it("renders coach badge and filters by coach origin", () => {
    trackingState.value = {
      items: [],
      words: [],
      loading: false,
      userId: "user-1",
      addWord: vi.fn(),
      updateWord: vi.fn(),
      removeWord: vi.fn(),
      reviewSources: [
        {
          item: { id: "word-1", kind: "word", title: "creepy", description: "escalofriante", fromCoach: true },
          word: { id: "word-1", text: "creepy", ipa: "ˈkriːpi", translation: "escalofriante" },
        },
        {
          item: { id: "word-2", kind: "word", title: "resilient", description: "resistente", fromCoach: false },
          word: { id: "word-2", text: "resilient", ipa: "rɪˈzɪliənt", translation: "resistente" },
        },
      ],
    };

    render(<TrackingClient />);
    expect(screen.getByText("✦ coach")).toBeInTheDocument();
    expect(screen.getByText("creepy")).toBeInTheDocument();
    expect(screen.getByText("resilient")).toBeInTheDocument();

    fireEvent.click(screen.getByRole("button", { name: "Del coach" }));
    expect(screen.getByText("creepy")).toBeInTheDocument();
    expect(screen.queryByText("resilient")).not.toBeInTheDocument();
  });
});
