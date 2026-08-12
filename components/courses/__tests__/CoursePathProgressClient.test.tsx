// @vitest-environment jsdom
import { render, screen, waitFor } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { COURSE_PATH_CURRICULUM } from "@/lib/courses/curriculum";

const { bulkGet } = vi.hoisted(() => ({
  bulkGet: vi.fn(),
}));

vi.mock("next/link", () => ({
  default: ({ href, children, ...props }: React.ComponentProps<"a">) => <a href={String(href)} {...props}>{children}</a>,
}));

vi.mock("@/lib/db", () => ({
  db: {
    completedLessons: {
      bulkGet,
    },
  },
}));

vi.mock("@/lib/supabase/client", () => ({
  getSupabaseBrowserClient: () => ({ auth: { getUser: async () => ({ data: { user: { id: "user-1" } } }) } }),
}));

vi.mock("@/hooks/useLoadingWords", () => ({
  useLoadingWords: () => [{ text: "thought", ipa: "/θɔːt/" }],
}));

vi.mock("@/components/practice/session/WordCarousel", () => ({
  WordCarousel: () => <div data-testid="page-loader">Cargando…</div>,
}));

import CoursePathProgressClient from "../CoursePathProgressClient";

describe("CoursePathProgressClient", () => {
  beforeEach(() => {
    bulkGet.mockReset();
  });

  it("shows the centered page loader while progress hydrates", () => {
    bulkGet.mockImplementation(() => new Promise(() => {}));

    render(<CoursePathProgressClient level={COURSE_PATH_CURRICULUM.levels[0]} />);

    expect(screen.getByLabelText("Comprobando tu progreso")).toBeInTheDocument();
    expect(screen.getByTestId("page-loader")).toBeInTheDocument();
  });

  it("shows the first lesson CTA when there is no local progress", async () => {
    bulkGet.mockResolvedValue([]);

    render(<CoursePathProgressClient level={COURSE_PATH_CURRICULUM.levels[0]} />);

    await waitFor(() => {
      expect(screen.getByText("Empieza aquí")).toBeInTheDocument();
    });
  });

  it("shows resume and review suggestions from Dexie progress", async () => {
    bulkGet.mockResolvedValue([
      { lessonSlug: "1" },
      { lessonSlug: "2" },
      null,
      null,
      null,
      null,
    ]);

    render(<CoursePathProgressClient level={COURSE_PATH_CURRICULUM.levels[0]} />);

    await waitFor(() => {
      expect(screen.getByText("Siguiente lección")).toBeInTheDocument();
      expect(screen.getByText("Abrir lección")).toBeInTheDocument();
      expect(screen.getByText("Repasa lo que ya aprendiste")).toBeInTheDocument();
      expect(screen.queryByText("Tu lección actual")).not.toBeInTheDocument();
    });
  });

  it("keeps the curriculum visible with an actionable error when progress cannot load", async () => {
    bulkGet.mockRejectedValue(new Error("IndexedDB unavailable"));

    render(<CoursePathProgressClient level={COURSE_PATH_CURRICULUM.levels[0]} />);

    await waitFor(() => {
      expect(screen.getByRole("alert")).toHaveTextContent("No hemos podido leer tu progreso en este dispositivo");
      expect(screen.getByRole("button", { name: "Reintentar" })).toBeInTheDocument();
      expect(screen.getByText("Empieza aquí")).toBeInTheDocument();
    });
  });
});
