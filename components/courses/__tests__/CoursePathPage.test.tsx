// @vitest-environment jsdom
import { describe, expect, it, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import CoursePathPage from "../CoursePathPage";

vi.mock("next/link", () => ({
  default: ({ href, children, ...props }: React.ComponentProps<"a">) => <a href={String(href)} {...props}>{children}</a>,
}));

vi.mock("../CoursePathAutoLevelSync", () => ({
  default: () => null,
}));

vi.mock("../CoursePathLevelPanel", () => ({
  default: ({ level }: { level: { id: string; title: string } }) => <div>{level.title}</div>,
}));

vi.mock("../CoursePathIcons", () => ({
  CoursePathLegendIconDisplay: ({ icon }: { icon: string }) => <span>{icon}</span>,
}));

describe("CoursePathPage", () => {
  it("defaults to A1 when no level is provided", () => {
    render(<CoursePathPage />);

    expect(screen.getByText("Fundamentos A1")).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "A1" })).toHaveAttribute("href", "/courses#course-level-a1");
  });

  it("selects the requested CEFR level", () => {
    render(<CoursePathPage levelParam="b1" />);

    expect(screen.getByText("Inglés en acción B1")).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "B1" })).toHaveAttribute("aria-current", "page");
    expect(screen.getByRole("link", { name: "B1" })).toHaveAttribute("href", "/courses?level=b1#course-level-b1");
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

  it("keeps rationale and legend visible", () => {
    render(<CoursePathPage levelParam="a2" />);

    expect(screen.getByText("Cómo se conecta con Sound Lab")).toBeInTheDocument();
    expect(screen.getByText("Gramática y pronunciación van en paralelo. Las lecciones con micrófono desbloquean secciones de Sound Lab al mismo nivel.")).toBeInTheDocument();
    expect(screen.getByText("Prioridad alta (meta laboral)")).toBeInTheDocument();
    expect(screen.getByText("Conecta con Sound Lab")).toBeInTheDocument();
  });
});
