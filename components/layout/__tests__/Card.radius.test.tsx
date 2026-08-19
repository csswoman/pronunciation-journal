// @vitest-environment jsdom
import { describe, expect, it } from "vitest";
import { render } from "@testing-library/react";
import Card from "@/components/layout/Card";

describe("Card radius", () => {
  it("uses the work radius (rounded-md / 12px), not rounded-lg", () => {
    const { container } = render(<Card>tarea</Card>);
    expect(container.firstElementChild).toHaveClass("rounded-md");
    expect(container.firstElementChild).not.toHaveClass("rounded-lg");
  });
});
