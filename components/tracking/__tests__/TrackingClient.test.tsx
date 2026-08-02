// @vitest-environment jsdom
import React from "react";
import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

vi.mock("next/navigation", () => ({ useRouter: () => ({ push: vi.fn() }) }));
vi.mock("@/hooks/useTracking", () => ({
  useTracking: () => ({ items: [], reviewSources: [], loading: false, userId: "user-1", addWord: vi.fn() }),
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
});
