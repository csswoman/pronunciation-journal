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
    expect(screen.getByText(/12 due/i)).toBeInTheDocument();
    expect(screen.getByText(/8 words/i)).toBeInTheDocument();
    expect(screen.getByText(/4 sounds/i)).toBeInTheDocument();
    expect(screen.getByRole("link", { name: /review now/i })).toHaveAttribute(
      "href",
      "/practice/review",
    );
  });

  it("links to review when only words are due", () => {
    render(<HomeReviewBanner wordsDueCount={5} soundsDueCount={0} />);
    expect(screen.getByText(/5 due/i)).toBeInTheDocument();
    expect(screen.getByText(/5 words/i)).toBeInTheDocument();
    expect(screen.queryByText(/sound/i)).not.toBeInTheDocument();
    expect(screen.getByRole("link", { name: /review now/i })).toHaveAttribute(
      "href",
      "/practice/review",
    );
  });

  it("links to sounds when only sounds are due", () => {
    render(<HomeReviewBanner wordsDueCount={0} soundsDueCount={3} />);
    expect(screen.getByText(/3 due/i)).toBeInTheDocument();
    expect(screen.getByText(/3 sounds/i)).toBeInTheDocument();
    expect(screen.getByRole("link", { name: /review now/i })).toHaveAttribute(
      "href",
      "/practice/sounds",
    );
  });
});
