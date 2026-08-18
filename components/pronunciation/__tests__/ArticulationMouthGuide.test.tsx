// @vitest-environment jsdom
import { render, screen } from "@testing-library/react";
import { describe, it, expect } from "vitest";
import { ArticulationMouthGuide } from "../ArticulationMouthGuide";

describe("ArticulationMouthGuide", () => {
  it("renders articulation guide for tense vowel /iː/", () => {
    render(<ArticulationMouthGuide symbolOrIpa="/iː/" />);
    expect(screen.getByText("/iː/")).toBeInTheDocument();
    expect(screen.getByText(/i larga y tensa/i)).toBeInTheDocument();
    expect(screen.getByText(/⚡ Con voz/i)).toBeInTheDocument();
    expect(screen.getAllByText(/Sonrisa amplia/i).length).toBeGreaterThanOrEqual(1);
  });

  it("renders articulation guide for interdental fricative /θ/", () => {
    render(<ArticulationMouthGuide symbolOrIpa="/θ/" />);
    expect(screen.getByText("/θ/")).toBeInTheDocument();
    expect(screen.getByText(/th sorda/i)).toBeInTheDocument();
    expect(screen.getByText(/Sordo \(sin voz\)/i)).toBeInTheDocument();
  });

  it("returns null gracefully for an unknown symbol", () => {
    const { container } = render(<ArticulationMouthGuide symbolOrIpa="/unknown_xyz/" />);
    expect(container.firstChild).toBeNull();
  });
});
