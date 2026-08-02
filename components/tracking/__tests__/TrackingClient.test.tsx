// @vitest-environment jsdom
import React from "react";
import { fireEvent, render, screen } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";

interface TrackingMockValue {
  items: unknown[];
  reviewSources: unknown[];
  loading: boolean;
  userId: string;
  addWord: ReturnType<typeof vi.fn>;
  updateWord: ReturnType<typeof vi.fn>;
  removeWord: ReturnType<typeof vi.fn>;
}

const trackingState = vi.hoisted(() => ({
  value: { items: [], reviewSources: [], loading: false, userId: "user-1", addWord: vi.fn(), updateWord: vi.fn(), removeWord: vi.fn() } as TrackingMockValue,
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
  QuickAddModal: ({ open, contextLabel }: { open: boolean; contextLabel?: string }) => open ? <div role="dialog">{contextLabel}</div> : null,
}));
vi.mock("@/lib/tracking/review-queue", () => ({ buildTrackingReviewQueue: () => ({ items: [] }) }));

import TrackingClient from "../TrackingClient";

describe("TrackingClient capture shortcut", () => {
  beforeEach(() => {
    trackingState.value = { items: [], reviewSources: [], loading: false, userId: "user-1", addWord: vi.fn(), updateWord: vi.fn(), removeWord: vi.fn() };
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
});
