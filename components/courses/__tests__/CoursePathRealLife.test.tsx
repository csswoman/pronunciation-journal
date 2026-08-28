// @vitest-environment jsdom
import { describe, expect, it } from "vitest";
import { fireEvent, render, screen } from "@testing-library/react";
import CoursePathRealLife from "../CoursePathRealLife";
import type { RealLifeScenario } from "@/lib/courses/types";

const mockScenarios: RealLifeScenario[] = [
  {
    id: "restaurant",
    title: "En el restaurante",
    icon: "utensils",
    phrases: [
      "A table for two, please.",
      "Can I see the menu?",
      "I'd like the chicken, please.",
      "Can we get the bill?",
    ],
    vocab: [
      { word: "menu", meaning: "lista de comidas y precios" },
      { word: "bill", meaning: "la cuenta" },
      { word: "tip", meaning: "propina" },
      { word: "waiter", meaning: "mesero" },
    ],
  },
  {
    id: "airport",
    title: "En el aeropuerto",
    icon: "map",
    phrases: [
      "Where is gate 4?",
      "Here is my passport.",
    ],
    vocab: [
      { word: "boarding pass", meaning: "tarjeta de embarque" },
      { word: "gate", meaning: "puerta de embarque" },
    ],
  },
];

describe("CoursePathRealLife", () => {
  it("renders the first scenario with phrases and vocab", () => {
    render(<CoursePathRealLife scenarios={mockScenarios} />);

    expect(screen.getByText("En contexto")).toBeInTheDocument();
    expect(screen.getByText("1/2")).toBeInTheDocument();
    expect(screen.getByText("Situaciones reales")).toBeInTheDocument();
    expect(screen.getByText("En el restaurante")).toBeInTheDocument();
    expect(screen.getByText("A table for two, please.")).toBeInTheDocument();
    expect(screen.getByText("menu")).toBeInTheDocument();
    expect(screen.getByText("lista de comidas y precios")).toBeInTheDocument();
  });

  it("navigates to next and previous scenarios", () => {
    render(<CoursePathRealLife scenarios={mockScenarios} />);

    const nextBtn = screen.getByRole("button", { name: "Siguiente situación" });
    const prevBtn = screen.getByRole("button", { name: "Situación anterior" });

    expect(prevBtn).toBeDisabled();
    expect(nextBtn).not.toBeDisabled();

    fireEvent.click(nextBtn);

    expect(screen.getByText("2/2")).toBeInTheDocument();
    expect(screen.getByText("En el aeropuerto")).toBeInTheDocument();
    expect(screen.getByText("Where is gate 4?")).toBeInTheDocument();
    expect(nextBtn).toBeDisabled();
    expect(prevBtn).not.toBeDisabled();

    fireEvent.click(prevBtn);

    expect(screen.getByText("1/2")).toBeInTheDocument();
    expect(screen.getByText("En el restaurante")).toBeInTheDocument();
  });
});
