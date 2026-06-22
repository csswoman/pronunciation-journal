// @vitest-environment jsdom
import { render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import DeckUnavailable from "@/components/courses/grammar-deck/DeckUnavailable";

vi.mock("next/link", () => ({
  default: ({ children, href, ...props }: React.ComponentProps<"a">) => (
    <a href={String(href)} {...props}>{children}</a>
  ),
}));

describe("DeckUnavailable", () => {
  it("explains that missing content is not an available lesson", () => {
    render(<DeckUnavailable lessonTitle="Tema futuro" />);

    expect(screen.getByText("Contenido en preparación")).toBeInTheDocument();
    expect(screen.getByRole("heading", { name: "Tema futuro" })).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "Ver otras lecciones" })).toHaveAttribute(
      "href",
      "/courses",
    );
  });
});
