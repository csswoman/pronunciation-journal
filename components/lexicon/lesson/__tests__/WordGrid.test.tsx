// @vitest-environment jsdom
import { render, screen } from "@testing-library/react";
import { describe, it, expect, vi } from "vitest";
import { WordGrid } from "../WordGrid";
import { WordBrowser } from "../WordBrowser";

vi.mock("next/link", () => ({
  default: ({ children, href, ...props }: { children: React.ReactNode; href: string }) => (
    <a href={href} {...props}>{children}</a>
  ),
}));

describe("WordGrid Empty State", () => {
  it("renders EmptyState illustration and text when words list is empty", () => {
    render(<WordGrid words={[]} view="grid" />);

    expect(screen.getByText("No se encontraron palabras")).toBeInTheDocument();
    expect(
      screen.getByText("No hay palabras que coincidan con este filtro o término de búsqueda.")
    ).toBeInTheDocument();
  });
});

describe("WordBrowser Layout", () => {
  it("renders Volver arriba button inside sidebar", () => {
    render(
      <WordBrowser
        words={[
          {
            id: "word-1",
            word: "Server",
            definition: "A computer program or device that provides functionality.",
            partOfSpeech: "noun",
            status: "new",
            difficulty: 1,
          },
        ]}
        categoryId="backend-infra"
        categoryTitle="Backend & Infra"
      />
    );

    const backToTopButton = screen.getByRole("button", { name: /Volver arriba/i });
    expect(backToTopButton).toBeInTheDocument();

    const sidebar = backToTopButton.closest("aside");
    expect(sidebar).toBeInTheDocument();
    expect(sidebar).toHaveClass("lexicon-area__sidebar");
  });

  it("scrolls main-content container to top when clicked", async () => {
    const mainEl = document.createElement("main");
    mainEl.id = "main-content";
    mainEl.scrollTo = vi.fn();
    document.body.appendChild(mainEl);

    render(
      <WordBrowser
        words={[
          {
            id: "word-1",
            word: "Server",
            definition: "A computer program or device that provides functionality.",
            partOfSpeech: "noun",
            status: "new",
            difficulty: 1,
          },
        ]}
        categoryId="backend-infra"
        categoryTitle="Backend & Infra"
      />
    );

    const backToTopButton = screen.getByRole("button", { name: /Volver arriba/i });
    backToTopButton.click();

    expect(mainEl.scrollTo).toHaveBeenCalledWith({ top: 0, behavior: "smooth" });

    document.body.removeChild(mainEl);
  });
});
