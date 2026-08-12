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

describe("CoursePathPage", () => {
  it("defaults to A1 when no level is provided", () => {
    render(<CoursePathPage />);

    expect(screen.getByText("Fundamentos A1")).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "A1" })).toHaveAttribute("href", "/courses");
  });

  it("selects the requested CEFR level", () => {
    render(<CoursePathPage levelParam="b1" />);

    expect(screen.getByText("Inglés en acción B1")).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "B1" })).toHaveAttribute("aria-current", "page");
    expect(screen.getByRole("link", { name: "B1" })).toHaveAttribute("href", "/courses?level=b1");
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
    expect(screen.getByRole("link", { name: "Prueba de nivel" })).toHaveAttribute("href", "/assessment");
    expect(screen.getByRole("link", { name: "Comprobar nivel" })).toHaveAttribute(
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
    expect(screen.getByRole("link", { name: "C1" })).toHaveAttribute(
      "href",
      "/courses?level=c1",
    );
  });
});
