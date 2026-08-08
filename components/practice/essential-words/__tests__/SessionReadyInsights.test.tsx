// @vitest-environment jsdom
import { describe, expect, it } from "vitest";
import { render, screen } from "@testing-library/react";

import { SessionReadyInsights } from "../SessionReadyInsights";
import type { EssentialWordsStats } from "@/hooks/useEssentialWordsSession";

const baseStats: EssentialWordsStats = {
  totalWords: 740, learned: 10, dueCount: 20, dueTomorrow: 4,
  newToday: 0, newQuota: 10, vaulted: 0,
};

describe("SessionReadyInsights", () => {
  it("shows dueTomorrow (not dueCount) under Mañana", () => {
    render(<SessionReadyInsights stats={baseStats} streak={0} />);
    expect(screen.getByText("4 repasos")).toBeInTheDocument();
    expect(screen.queryByText("20 repasos")).not.toBeInTheDocument();
  });

  it("renders the streak prop instead of reading Dexie userStats", () => {
    render(<SessionReadyInsights stats={baseStats} streak={5} />);
    expect(screen.getByText("5 días")).toBeInTheDocument();
  });

  it("singularizes 1 repaso / 1 día", () => {
    render(<SessionReadyInsights stats={{ ...baseStats, dueTomorrow: 1 }} streak={1} />);
    expect(screen.getByText("1 repaso")).toBeInTheDocument();
    expect(screen.getByText("1 día")).toBeInTheDocument();
  });
});
