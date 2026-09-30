// @vitest-environment jsdom
import { beforeEach, describe, expect, it, vi } from "vitest";
import { fireEvent, render, screen, waitFor } from "@testing-library/react";

const mocks = vi.hoisted(() => ({
  loadContentIndex: vi.fn(),
  searchContent: vi.fn(),
  searchModuleLoaded: vi.fn(),
}));

vi.mock("@/lib/search/contentIndex", () => ({
  CONTENT_INDEX_ERROR_MESSAGE: "No se pudo cargar el contenido de búsqueda.",
  loadContentIndex: mocks.loadContentIndex,
}));

vi.mock("@/lib/search/searchContent", () => {
  mocks.searchModuleLoaded();
  return { searchContent: mocks.searchContent };
});

vi.mock("next/navigation", () => ({
  useRouter: () => ({ push: vi.fn() }),
}));

import { SearchModal } from "../SearchModal";

const index = [
  {
    id: "sound:schwa",
    type: "sound" as const,
    title: "/ə/ — Schwa",
    tags: ["Sound Lab", "vocal"],
    description: "Vocal sin acento.",
    path: "/practice/sounds",
  },
];

describe("SearchModal", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mocks.loadContentIndex.mockResolvedValue(index);
    mocks.searchContent.mockReturnValue(index);
  });

  it("keeps frequent suggestions available without importing the search runtime", async () => {
    render(<SearchModal open onClose={vi.fn()} />);

    expect(screen.getByText("ACCESOS FRECUENTES")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /Diccionario/ })).toBeInTheDocument();
    await waitFor(() => expect(mocks.loadContentIndex).toHaveBeenCalledOnce());
    expect(mocks.searchModuleLoaded).not.toHaveBeenCalled();
    expect(mocks.searchContent).not.toHaveBeenCalled();
  });

  it("loads search on the first non-empty query and shows matching results", async () => {
    render(<SearchModal open onClose={vi.fn()} />);

    const input = screen.getByPlaceholderText("Busca una lección, sonido o tema…");
    fireEvent.change(input, { target: { value: "schwa" } });

    expect(await screen.findByText("/ə/ — Schwa")).toBeInTheDocument();
    expect(mocks.searchModuleLoaded).toHaveBeenCalledOnce();
    expect(mocks.searchContent).toHaveBeenCalledWith("schwa", index);
  });

  it("shows a retry while keeping frequent suggestions after the index fails", async () => {
    mocks.loadContentIndex
      .mockRejectedValueOnce(new Error("No se pudo cargar el contenido de búsqueda."))
      .mockResolvedValueOnce(index);
    render(<SearchModal open onClose={vi.fn()} />);

    const retry = await screen.findByRole("button", { name: "Reintentar búsqueda" });
    expect(screen.getByText("ACCESOS FRECUENTES")).toBeInTheDocument();
    fireEvent.click(retry);

    await waitFor(() => expect(mocks.loadContentIndex).toHaveBeenCalledTimes(2));
    expect(await screen.findByText("ACCESOS FRECUENTES")).toBeInTheDocument();
    expect(screen.queryByRole("alert")).toBeNull();
  });
});
