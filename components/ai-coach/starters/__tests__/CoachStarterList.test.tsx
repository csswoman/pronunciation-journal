// @vitest-environment jsdom
import { describe, it, expect, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import CoachStarterList from "../CoachStarterList";
import type { ResolvedStarter } from "@/lib/ai-practice/starters/types";

const STARTERS: ResolvedStarter[] = [
  { id: "review", title: "Repasa lo que fallaste", subtitle: "past-simple · 3 errores", prompt: "p1", angle: "a1" },
  { id: "free", title: "Habla de lo que quieras", subtitle: "Tú empiezas", prompt: "p2", angle: "free" },
];

describe("CoachStarterList", () => {
  it("renders a row per starter with its title and subtitle", () => {
    render(<CoachStarterList starters={STARTERS} loading={false} onSelect={vi.fn()} />);
    expect(screen.getByText("Repasa lo que fallaste")).toBeInTheDocument();
    expect(screen.getByText("past-simple · 3 errores")).toBeInTheDocument();
  });

  it("reports the whole starter when a row is tapped", async () => {
    const onSelect = vi.fn();
    render(<CoachStarterList starters={STARTERS} loading={false} onSelect={onSelect} />);
    await userEvent.click(screen.getByRole("button", { name: /Repasa lo que fallaste/ }));
    expect(onSelect).toHaveBeenCalledWith(STARTERS[0]);
  });

  it("shows skeleton rows while loading, with no subtitles", () => {
    render(<CoachStarterList starters={null} loading onSelect={vi.fn()} />);
    expect(screen.getAllByRole("button")).toHaveLength(4);
    expect(screen.queryByText("past-simple · 3 errores")).not.toBeInTheDocument();
  });

  it("does not fire onSelect while loading", async () => {
    const onSelect = vi.fn();
    render(<CoachStarterList starters={null} loading onSelect={onSelect} />);
    await userEvent.click(screen.getAllByRole("button")[0]);
    expect(onSelect).not.toHaveBeenCalled();
  });
});
