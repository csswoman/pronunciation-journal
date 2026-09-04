// @vitest-environment jsdom
import { render, screen, waitFor } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { COURSE_PATH_CURRICULUM } from "@/lib/courses/curriculum";

const { bulkGet } = vi.hoisted(() => ({
  bulkGet: vi.fn(),
}));

vi.mock("next/navigation", () => ({
  useRouter: () => ({
    push: vi.fn(),
  }),
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

vi.mock("@/lib/auth/session", () => ({
  getCurrentUser: async () => ({ id: "user-123" }),
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
      expect(screen.getByText("EMPIEZA AQUÍ")).toBeInTheDocument();
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
      expect(screen.getByText("TU SIGUIENTE LECCIÓN")).toBeInTheDocument();
      expect(screen.getByText("Continuar lección")).toBeInTheDocument();
      expect(screen.getByText("Repasa lo que ya aprendiste")).toBeInTheDocument();
      expect(screen.queryByText("Tu lección actual")).not.toBeInTheDocument();
    });
  });

  it("keeps thematic sections collapsible and moves completed lessons into the final disclosure", async () => {
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
      expect(screen.getByText("Completadas")).toBeInTheDocument();
    });

    const completedGroup = screen.getByText("Completadas").closest("details.course-path__lesson-group");
    const coreCard = completedGroup?.closest(".course-path__main-card");
    const groups = coreCard?.querySelectorAll("details.course-path__lesson-group");

    expect(groups?.length).toBeGreaterThan(1);
    expect(groups?.[groups.length - 1]).toBe(completedGroup);
    expect(completedGroup).not.toHaveAttribute("open");
  });

  it("keeps the curriculum visible with an actionable error when progress cannot load", async () => {
    bulkGet.mockRejectedValue(new Error("IndexedDB unavailable"));

    render(<CoursePathProgressClient level={COURSE_PATH_CURRICULUM.levels[0]} />);

    await waitFor(() => {
      expect(screen.getByRole("alert")).toHaveTextContent("No hemos podido leer tu progreso en este dispositivo");
      expect(screen.getByRole("button", { name: "Reintentar" })).toBeInTheDocument();
      expect(screen.getByText("EMPIEZA AQUÍ")).toBeInTheDocument();
    });
  });

  it("displays 3 distinct visual states for unit rows (completed, partial, unstarted)", async () => {
    const mockLevel: (typeof COURSE_PATH_CURRICULUM.levels)[number] = {
      id: "a1",
      spineLabel: "A1",
      spineSubtitle: "Empezar",
      title: "Fundamentos A1",
      hours: "20 h",
      units: [
        {
          id: "u1",
          label: "Unidad 1",
          title: "Unidad 1",
          lessons: [
            { id: "1", number: 1, title: "Lección 1", priority: 1, isOptional: false },
          ],
        },
        {
          id: "u2",
          label: "Unidad 2",
          title: "Unidad 2",
          lessons: [
            { id: "2", number: 2, title: "Lección 2", priority: 1, isOptional: false },
            { id: "3", number: 3, title: "Lección 3", priority: 1, isOptional: false },
          ],
        },
        {
          id: "u3",
          label: "Unidad 3",
          title: "Unidad 3",
          lessons: [
            { id: "4", number: 4, title: "Lección 4", priority: 1, isOptional: false },
          ],
        },
      ],
    };

    bulkGet.mockResolvedValue([
      { lessonSlug: "1" },
      { lessonSlug: "2" },
      null,
      null,
    ]);

    render(<CoursePathProgressClient level={mockLevel} />);

    await waitFor(() => {
      // Completed unit state
      expect(screen.getAllByText(/completado/i).length).toBeGreaterThan(0);
      // Partial unit state (group in progress)
      expect(screen.getAllByText(/completadas/i).length).toBeGreaterThan(0);
      // Unstarted unit state
      expect(screen.getAllByText(/sin empezar/i).length).toBeGreaterThan(0);
    });
  });

  it("does not render the aside sidebar when hideAside is true or level is elective", async () => {
    bulkGet.mockResolvedValue([]);

    const { container } = render(
      <CoursePathProgressClient level={COURSE_PATH_CURRICULUM.levels[0]} hideAside />
    );

    await waitFor(() => {
      expect(screen.getByText("EMPIEZA AQUÍ")).toBeInTheDocument();
    });

    expect(container.querySelector(".course-path__client-aside")).not.toBeInTheDocument();
    expect(container.querySelector(".course-path__client-layout--no-aside")).toBeInTheDocument();
  });

  it("renders elective tracks inside the main layout when passed", async () => {
    bulkGet.mockResolvedValue([]);

    const c1Level = COURSE_PATH_CURRICULUM.levels.find((l) => l.id === "c1")!;

    render(
      <CoursePathProgressClient
        level={c1Level}
        electiveTracks={COURSE_PATH_CURRICULUM.electiveTracks}
      />
    );

    await waitFor(() => {
      expect(screen.getByText("Después de C1: rutas opcionales")).toBeInTheDocument();
    });

    const electivesSection = screen.getByText("Después de C1: rutas opcionales").closest(".course-path__c1-electives");
    const mainColumn = document.querySelector(".course-path__client-main");
    expect(mainColumn).toContainElement(electivesSection as HTMLElement);
  });
});

