// @vitest-environment jsdom
import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { AuthFeedback } from "../AuthFeedback";

describe("AuthFeedback", () => {
  it("renders error and success messages", () => {
    render(<AuthFeedback error="Bad request" message="Saved" />);

    expect(screen.getByRole("alert")).toHaveTextContent("Bad request");
    expect(screen.getByText("Saved")).toBeInTheDocument();
  });

  it("renders compact success message with compact spacing", () => {
    render(<AuthFeedback message="Saved" compact />);

    expect(screen.getByText("Saved")).toBeInTheDocument();
  });
});
