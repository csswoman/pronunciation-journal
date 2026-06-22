// @vitest-environment jsdom
import { render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { SkillProfileCard } from "@/components/progress/SkillProfileCard";

vi.mock("next/link", () => ({
  default: ({ children, href }: React.ComponentProps<"a">) => <a href={String(href)}>{children}</a>,
}));

describe("SkillProfileCard", () => {
  it("shows the persisted level separately from the coach estimate", () => {
    render(
      <SkillProfileCard
        data={{
          wordsByStatus: { new: 0, learning: 0, review: 0, mastered: 0 },
          weakestPhonemes: [],
          core1000Practiced: 0,
          lessonsCompleted: 0,
        }}
        coach={{
          weakTopics: [],
          profileLevel: "A2",
          cefrEstimate: "B1",
          avgAccuracy: null,
        }}
      />,
    );

    expect(screen.getByText("A2")).toBeInTheDocument();
    expect(screen.getByText("current level")).toBeInTheDocument();
    expect(screen.getByText("B1")).toBeInTheDocument();
    expect(screen.getByText("estimated level")).toBeInTheDocument();
  });
});
