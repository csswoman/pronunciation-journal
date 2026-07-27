// @vitest-environment jsdom
import { describe, expect, it } from "vitest";
import { render, screen } from "@testing-library/react";
import PageLayout from "@/components/layout/PageLayout";

describe("PageLayout canonical", () => {
  it("does not wrap children in a page-level card by default", () => {
    const { container } = render(
      <PageLayout>
        <p>contenido</p>
      </PageLayout>,
    );
    expect(container.querySelector(".rounded-2xl")).toBeNull();
    expect(container.textContent).toContain("contenido");
  });

  it("ignores cardWrapper=true for default variant", () => {
    const { container } = render(
      <PageLayout cardWrapper>
        <p>x</p>
      </PageLayout>,
    );
    expect(container.querySelector(".rounded-2xl")).toBeNull();
  });

  it("applies catalog archetype by default", () => {
    const { container } = render(
      <PageLayout>
        <p>hub</p>
      </PageLayout>,
    );
    expect(container.firstElementChild).toHaveClass("page-shell--catalog");
  });

  it("applies session archetype max-width class", () => {
    const { container } = render(
      <PageLayout archetype="session">
        <p>focus</p>
      </PageLayout>,
    );
    expect(container.firstElementChild).toHaveClass("page-shell--session");
  });

  it("renders dashboard main + rail when rail is provided", () => {
    const { container } = render(
      <PageLayout archetype="dashboard" rail={<p>aside</p>} railLabel="Práctica sugerida">
        <p>main</p>
      </PageLayout>,
    );
    expect(container.firstElementChild).toHaveClass("page-shell--dashboard");
    expect(container.querySelector(".page-dashboard__main")).toHaveTextContent("main");
    expect(screen.getByRole("complementary", { name: "Práctica sugerida" })).toHaveTextContent(
      "aside",
    );
  });

  it("renders dashboard banner full-width above columns", () => {
    const { container } = render(
      <PageLayout archetype="dashboard" banner={<p>due</p>} rail={<p>rail</p>}>
        <p>main</p>
      </PageLayout>,
    );
    expect(container.querySelector(".page-dashboard__banner")).toHaveTextContent("due");
  });
});
