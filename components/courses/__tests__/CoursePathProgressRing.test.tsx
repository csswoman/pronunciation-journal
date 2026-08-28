// @vitest-environment jsdom
import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import CoursePathProgressRing from "../CoursePathProgressRing";

describe("CoursePathProgressRing", () => {
  it("renders check icon for done status", () => {
    const { container } = render(
      <CoursePathProgressRing status="done" ariaLabel="1 lección completada" />
    );

    expect(screen.getByRole("img", { name: "1 lección completada" })).toBeInTheDocument();
    expect(container.querySelector("svg")).toBeInTheDocument();
  });

  it("renders progressbar circle for partial status with strokeDashoffset", () => {
    const { container } = render(
      <CoursePathProgressRing
        status="partial"
        progressPercent={50}
        ariaLabel="4 de 8 completadas"
      />
    );

    const progressbar = screen.getByRole("progressbar", { name: "4 de 8 completadas" });
    expect(progressbar).toBeInTheDocument();
    expect(progressbar).toHaveAttribute("aria-valuenow", "50");

    const circles = container.querySelectorAll("circle");
    expect(circles.length).toBe(2);
  });

  it("renders empty circle for unstarted status", () => {
    const { container } = render(
      <CoursePathProgressRing status="unstarted" ariaLabel="Sin empezar" />
    );

    expect(screen.getByRole("img", { name: "Sin empezar" })).toBeInTheDocument();
    const circles = container.querySelectorAll("circle");
    expect(circles.length).toBe(1);
  });
});
