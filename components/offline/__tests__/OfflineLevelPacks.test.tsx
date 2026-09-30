// @vitest-environment jsdom
import React from "react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { fireEvent, render, screen } from "@testing-library/react";
import type { OfflineResourcePackRecord } from "@/lib/db";
import type { LearnerLevelResolution } from "@/lib/learner-level/core";

const state = vi.hoisted(() => ({
  learnerLevel: null as LearnerLevelResolution | null,
  loading: false,
  online: true,
  receipts: [] as OfflineResourcePackRecord[],
  message: "",
  download: vi.fn(),
  remove: vi.fn(),
}));

vi.mock("@/components/auth/AuthProvider", () => ({
  default: ({ children }: { children: React.ReactNode }) => <>{children}</>,
}));
vi.mock("@/hooks/useUserPreferences", () => ({
  useUserPreferences: () => ({ learnerLevel: state.learnerLevel, loading: state.loading }),
}));
vi.mock("@/hooks/useOnlineStatus", () => ({ useOnlineStatus: () => state.online }));
vi.mock("@/hooks/useOfflineResourcePacks", () => ({
  useOfflineResourcePacks: () => ({
    receipts: state.receipts,
    manifest: {
      schemaVersion: 1,
      contentVersion: "v1",
      generatedAt: "",
      levels: [{ schemaVersion: 1, contentVersion: "v1", level: "A2", estimatedBytes: 2_097_152, required: [], optional: [] }],
    },
    progress: null,
    message: state.message,
    busyLevel: null,
    download: state.download,
    cancel: vi.fn(),
    remove: state.remove,
  }),
}));

vi.mock("@/lib/offline/pack-contents", () => ({
  listPackLessons: async () => [
    { kind: "grammar-deck", slug: "b1-x", title: "Lección X", lessonNumber: 4, url: "/grammar-decks/b1-x.json", estimatedBytes: 1 },
  ],
  loadPackLesson: async () => ({ id: "b1:4", trackId: "b1", lessonNumber: 4, slug: "b1-x", title: "Lección X", deck: { meta: {}, cards: [] }, audioUrls: [], downloadedAt: "" }),
}));

import { OfflineLevelPacks as OfflineLevelPacksBase } from "../OfflineLevelPacks";

const onStudyLesson = vi.fn();
const onStudyWords = vi.fn();
function OfflineLevelPacks() {
  return <OfflineLevelPacksBase onStudyLesson={onStudyLesson} onStudyWords={onStudyWords} />;
}

function level(overrides: Partial<LearnerLevelResolution>): LearnerLevelResolution {
  return { level: "A2", source: "placement", confidence: null, isPlaced: true, updatedAt: null, ...overrides };
}

function receipt(overrides: Partial<OfflineResourcePackRecord>): OfflineResourcePackRecord {
  return {
    id: "B1",
    level: "B1",
    contentVersion: "v1",
    status: "ready",
    cacheName: "offline-pack-B1-v1-x",
    resourceCount: 3,
    estimatedBytes: 1_048_576,
    downloadedAt: "2026-09-28T12:00:00.000Z",
    lastVerifiedAt: "2026-09-28T12:00:00.000Z",
    ...overrides,
  };
}

describe("OfflineLevelPacks", () => {
  beforeEach(() => {
    state.learnerLevel = null;
    state.loading = false;
    state.online = true;
    state.receipts = [];
    state.message = "";
    state.download.mockReset();
    state.remove.mockReset();
    onStudyLesson.mockReset();
    onStudyWords.mockReset();
  });

  it("offers the canonical level with its size before downloading", () => {
    state.learnerLevel = level({ level: "A2" });
    render(<OfflineLevelPacks />);

    expect(screen.getByText(/Tamaño estimado: 2[.,]0 MB/)).toBeTruthy();
    fireEvent.click(screen.getByRole("button", { name: "Descargar mi nivel A2" }));
    expect(state.download).toHaveBeenCalledWith("A2");
  });

  it("asks for a level when it is unknown, with nothing preselected", () => {
    state.learnerLevel = level({ level: "A1", source: "unknown" });
    render(<OfflineLevelPacks />);

    const radios = screen.getAllByRole("radio") as HTMLInputElement[];
    expect(radios).toHaveLength(5);
    expect(radios.some((radio) => radio.checked)).toBe(false);
    expect((screen.getByRole("button", { name: "Descargar paquete" }) as HTMLButtonElement).disabled).toBe(true);
  });

  it("lets a keyboard user pick a level and download it", () => {
    render(<OfflineLevelPacks />);

    const b1 = screen.getByRole("radio", { name: "B1" });
    b1.focus();
    expect(document.activeElement).toBe(b1);
    fireEvent.click(b1);
    fireEvent.click(screen.getByRole("button", { name: "Descargar mi nivel B1" }));
    expect(state.download).toHaveBeenCalledWith("B1");
  });

  it("suggests a labelled C1 pack for C2 learners", () => {
    state.learnerLevel = level({ level: "C2" });
    render(<OfflineLevelPacks />);

    expect(screen.getByText("Tu nivel es C2; el paquete más alto disponible es C1")).toBeTruthy();
    expect(screen.getByRole("button", { name: "Descargar mi nivel C1" })).toBeTruthy();
    expect(screen.queryByText(/paquete C2/)).toBeNull();
  });

  it("lists saved packs of other levels with honest status labels", () => {
    state.learnerLevel = level({ level: "A2" });
    state.receipts = [
      receipt({ id: "B1", level: "B1", status: "ready" }),
      receipt({ id: "A1", level: "A1", status: "stale" }),
      receipt({ id: "C1", level: "C1", status: "failed" }),
    ];
    render(<OfflineLevelPacks />);

    expect(screen.getAllByText("Disponible sin conexión")).toHaveLength(1);
    expect(screen.getByText("Incompleto: vuelve a descargarlo")).toBeTruthy();
    expect(screen.getByText("Descarga fallida")).toBeTruthy();
    fireEvent.click(screen.getByRole("button", { name: "Quitar paquete B1" }));
    expect(state.remove).toHaveBeenCalledWith("B1");
  });

  it("opens a ready pack's lessons and Essential Words for offline study", async () => {
    state.learnerLevel = level({ level: "A2" });
    state.receipts = [receipt({ id: "B1", level: "B1", status: "ready" })];
    render(<OfflineLevelPacks />);

    fireEvent.click(screen.getByRole("button", { name: "Estudiar" }));
    fireEvent.click(await screen.findByRole("button", { name: "Lección X" }));
    await vi.waitFor(() => expect(onStudyLesson).toHaveBeenCalledWith(expect.objectContaining({ id: "b1:4" })));

    fireEvent.click(screen.getByRole("button", { name: "Practicar Essential Words B1" }));
    expect(onStudyWords).toHaveBeenCalledWith("B1");
  });

  it("surfaces a quota refusal message", () => {
    state.learnerLevel = level({ level: "A2" });
    state.message = "No hay espacio suficiente en este dispositivo para el paquete A2.";
    render(<OfflineLevelPacks />);

    expect(screen.getByText(/No hay espacio suficiente/)).toBeTruthy();
  });

  it("disables downloading while offline", () => {
    state.learnerLevel = level({ level: "A2" });
    state.online = false;
    render(<OfflineLevelPacks />);

    expect((screen.getByRole("button", { name: "Descargar mi nivel A2" }) as HTMLButtonElement).disabled).toBe(true);
    expect(screen.getByText(/Conéctate para descargar/)).toBeTruthy();
  });
});
