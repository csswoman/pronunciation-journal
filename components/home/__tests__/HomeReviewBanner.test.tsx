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

  it("shows action CTAs and prefers words when both exist", () => {
    render(<HomeReviewBanner wordsDueCount={8} soundsDueCount={4} />);
    expect(screen.getByText(/te toca repasar/i)).toBeInTheDocument();
    expect(screen.getByRole("link", { name: /repasar 8 palabras/i })).toHaveAttribute(
      "href",
      "/practice/review",
    );
    expect(screen.getByRole("link", { name: /o 4 sonidos/i })).toHaveAttribute(
      "href",
      "/practice/sounds",
    );
  });

  it("links to review when only words are due", () => {
    render(<HomeReviewBanner wordsDueCount={5} soundsDueCount={0} />);
    expect(screen.getByRole("link", { name: /repasar 5 palabras/i })).toHaveAttribute(
      "href",
      "/practice/review",
    );
  });

  it("links to sounds when only sounds are due", () => {
    render(<HomeReviewBanner wordsDueCount={0} soundsDueCount={3} />);
    expect(screen.getByRole("link", { name: /repasar 3 sonidos/i })).toHaveAttribute(
      "href",
      "/practice/sounds",
    );
  });
});
