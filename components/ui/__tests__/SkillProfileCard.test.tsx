// @vitest-environment jsdom
import { render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { SkillProfileCard } from "@/components/progress/SkillProfileCard";

vi.mock("next/link", () => ({
  default: ({ children, href }: React.ComponentProps<"a">) => <a href={String(href)}>{children}</a>,
}));

describe("SkillProfileCard", () => {
  it("shows the canonical level and its provenance", () => {
    render(
      <SkillProfileCard
        data={{
          wordsByStatus: { new: 0, learning: 0, review: 0, mastered: 0 },
          weakestPhonemes: [],
          essentialWords: { studied: 0, due: 0 },
        }}
        coach={{
          weakTopics: [],
          avgAccuracy: null,
        }}
        learnerLevel={{ level: "B1", source: "placement", confidence: null, isPlaced: true, updatedAt: null }}
      />,
    );

    expect(screen.getByText("B1")).toBeInTheDocument();
    expect(screen.getByText("Según tu evaluación")).toBeInTheDocument();
  });

  it("explains a temporarily unavailable learner-level read", () => {
    render(
      <SkillProfileCard
        data={{
          wordsByStatus: { new: 0, learning: 0, review: 0, mastered: 0 },
          weakestPhonemes: [],
          essentialWords: { studied: 0, due: 0 },
        }}
        coach={{
          weakTopics: [],
          avgAccuracy: null,
        }}
        learnerLevel={{ level: "A1", source: "unknown", confidence: null, isPlaced: false, updatedAt: null }}
      />,
    );

    expect(screen.getByText("A1")).toBeInTheDocument();
    expect(screen.getByText("No pudimos leer tu nivel ahora")).toBeInTheDocument();
  });
});
