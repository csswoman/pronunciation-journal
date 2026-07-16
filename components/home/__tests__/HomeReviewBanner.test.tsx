// @vitest-environment jsdom
import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import HomeReviewBanner from "@/components/home/HomeReviewBanner";

describe("HomeReviewBanner", () => {
  it("renders nothing when there are no due items", () => {
    const { container } = render(
      <HomeReviewBanner wordsDueCount={0} soundsDueCount={0} />,
    );
    expect(container).toBeEmptyDOMElement();
  });

  it("shows total due and breakdown when words and sounds exist", () => {
    render(<HomeReviewBanner wordsDueCount={8} soundsDueCount={4} />);
    expect(screen.getByText(/12 pendientes/i)).toBeInTheDocument();
    expect(screen.getByText(/8 palabras/i)).toBeInTheDocument();
    expect(screen.getByText(/4 sonidos/i)).toBeInTheDocument();
    expect(screen.getByRole("link", { name: /repasar ahora/i })).toHaveAttribute(
      "href",
      "/practice/review",
    );
  });

  it("links to review when only words are due", () => {
    render(<HomeReviewBanner wordsDueCount={5} soundsDueCount={0} />);
    expect(screen.getByText(/5 pendientes/i)).toBeInTheDocument();
    expect(screen.getByText(/5 palabras/i)).toBeInTheDocument();
    expect(screen.queryByText(/sonido/i)).not.toBeInTheDocument();
    expect(screen.getByRole("link", { name: /repasar ahora/i })).toHaveAttribute(
      "href",
      "/practice/review",
    );
  });

  it("links to sounds when only sounds are due", () => {
    render(<HomeReviewBanner wordsDueCount={0} soundsDueCount={3} />);
    expect(screen.getByText(/3 pendientes/i)).toBeInTheDocument();
    expect(screen.getByText(/3 sonidos/i)).toBeInTheDocument();
    expect(screen.getByRole("link", { name: /repasar ahora/i })).toHaveAttribute(
      "href",
      "/practice/sounds",
    );
  });
});
