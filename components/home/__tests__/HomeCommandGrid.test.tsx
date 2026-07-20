// @vitest-environment jsdom
import { render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import HomeCommandGrid from "@/components/home/HomeCommandGrid";

vi.mock("@/components/home/HomeDailyCard", () => ({
  default: () => <div>Daily plan</div>,
}));
vi.mock("@/components/home/HomeReviewBanner", () => ({ default: () => null }));
vi.mock("@/components/home/HomeLearnRow", () => ({ default: () => null }));
vi.mock("@/components/home/Core1000ProgressCard", () => ({ default: () => null }));
vi.mock("@/components/home/WeakSoundCard", () => ({ default: () => null }));
vi.mock("@/components/home/HomeWordOfDayCard", () => ({ default: () => <div>Palabra del día</div> }));

const baseProps = {
  conceptLesson: null,
  todaysLesson: null,
};

describe("HomeCommandGrid placement visibility", () => {
  it("shows the prominent setup when placement and progress are absent", () => {
    render(
      <HomeCommandGrid
        {...baseProps}
        placementState={{ hasPlacement: false, hasMeaningfulProgress: false }}
      />,
    );

    expect(screen.getByRole("heading", { name: "Haz que el plan empiece desde tu nivel" }))
      .toBeInTheDocument();
  });

  it("shows the compact reminder after meaningful practice", () => {
    render(
      <HomeCommandGrid
        {...baseProps}
        placementState={{ hasPlacement: false, hasMeaningfulProgress: true }}
      />,
    );

    expect(screen.getByText("Palabra del día")).toBeInTheDocument();
    expect(screen.getByRole("heading", { name: "Afina tu nivel" })).toBeInTheDocument();
  });

  it("hides every placement prompt after completion", () => {
    render(
      <HomeCommandGrid
        {...baseProps}
        placementState={{ hasPlacement: true, hasMeaningfulProgress: true }}
      />,
    );

    expect(screen.queryByText("Ajusta tu ruta")).not.toBeInTheDocument();
  });
});
