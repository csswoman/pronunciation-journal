// @vitest-environment jsdom
import { describe, expect, it, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import CoursePathPage from "../CoursePathPage";

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
      bulkGet: vi.fn().mockResolvedValue([]),
    },
  },
}));

vi.mock("@/lib/auth/session", () => ({
  getCurrentUser: async () => ({ id: "user-123" }),
}));

vi.mock("../CoursePathAutoLevelSync", () => ({
  default: () => null,
}));

vi.mock("../CoursePathLevelPanel", () => ({
  default: ({ level }: { level: { id: string; title: string } }) => <div>{level.title}</div>,
}));

describe("CoursePathPage", () => {
  it("defaults to A1 when no level is provided", () => {
    render(<CoursePathPage />);

    expect(screen.getByRole("heading", { name: "Cursos" })).toBeInTheDocument();
    expect(screen.getByText("Aprender")).toBeInTheDocument();
    expect(screen.getByText("Fundamentos A1")).toBeInTheDocument();
    expect(screen.getAllByRole("link", { name: /A1/i })[0]).toHaveAttribute("href", "/courses");
    expect(screen.getByText("Nivel actual")).toBeInTheDocument();
    expect(document.querySelector(".course-path__level-picker-mobile")).not.toHaveAttribute("open");
  });

  it("selects the requested CEFR level", () => {
    render(<CoursePathPage levelParam="b1" />);

    expect(screen.getByText("Inglés en acción B1")).toBeInTheDocument();
    expect(screen.getAllByRole("link", { name: /B1/i })[0]).toHaveAttribute("aria-current", "page");
    expect(screen.getAllByRole("link", { name: /B1/i })[0]).toHaveAttribute("href", "/courses?level=b1");
  });

  it("falls back to A1 for an invalid level", () => {
    render(<CoursePathPage levelParam="zzz" />);

    expect(screen.getByText("Fundamentos A1")).toBeInTheDocument();
  });

  it("keeps the full curriculum visible while highlighting the selected level", () => {
    render(<CoursePathPage levelParam="a2" />);

    expect(screen.getByText("Base sólida A2")).toBeInTheDocument();
    expect(screen.queryByText("Fundamentos A1")).not.toBeInTheDocument();
    expect(screen.queryByText("Inglés en acción B1")).not.toBeInTheDocument();
  });

  it("keeps assessment actions in the level picker", () => {
    render(<CoursePathPage />);

    expect(screen.queryByRole("heading", { name: "Ruta" })).not.toBeInTheDocument();
    expect(screen.getAllByRole("link", { name: "Prueba de nivel" })[0]).toHaveAttribute("href", "/assessment");
    expect(screen.getAllByRole("link", { name: "Comprobar nivel" })[0]).toHaveAttribute(
      "href",
      "/assessment?mode=checkpoint&level=a1",
    );
  });

  it("links to the pronunciation path from the level aside", () => {
    render(<CoursePathPage levelParam="a2" />);

    expect(screen.getByRole("link", { name: /Ruta de pronunciación/i })).toHaveAttribute(
      "href",
      "/courses/pronunciation",
    );
    expect(screen.queryByText("Cómo leer la ruta")).not.toBeInTheDocument();
    expect(screen.queryByText("Pronunciación en paralelo")).not.toBeInTheDocument();
    expect(screen.queryByRole("link", { name: /Abrir Sound Lab/i })).not.toBeInTheDocument();
  });

  it("keeps every level available for exploration", () => {
    render(<CoursePathPage levelParam="b1" />);

    expect(screen.getByText("Inglés en acción B1")).toBeInTheDocument();
    expect(screen.getAllByRole("link", { name: /C1/i })[0]).toHaveAttribute(
      "href",
      "/courses?level=c1",
    );
  });
});
