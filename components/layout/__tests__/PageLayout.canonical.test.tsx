// @vitest-environment jsdom
import { describe, expect, it } from "vitest";
import { render } from "@testing-library/react";
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
});
