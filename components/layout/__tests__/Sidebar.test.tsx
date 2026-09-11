// @vitest-environment jsdom
import React from "react";
import { describe, expect, it, vi } from "vitest";
import { render, screen } from "@testing-library/react";

const mockPathname = "/";

vi.mock("next/navigation", () => ({
  usePathname: () => mockPathname,
}));

vi.mock("@/components/auth/AuthProvider", () => ({
  useAuth: () => ({ user: null, signOutUser: vi.fn() }),
}));

vi.mock("@/hooks/useUserPreferences", () => ({
  useUserPreferences: () => ({ preferences: null, updateCefrLevel: vi.fn() }),
}));

vi.mock("../SidebarFooter", () => ({
  default: () => <div data-testid="sidebar-footer">Footer</div>,
}));

vi.mock("./SidebarFooter", () => ({
  default: () => <div data-testid="sidebar-footer">Footer</div>,
}));

vi.mock("@/components/layout/SidebarFooter", () => ({
  default: () => <div data-testid="sidebar-footer">Footer</div>,
}));

vi.mock("next/dynamic", () => ({
  default: () => {
    return function DynamicMock() {
      return <div data-testid="sidebar-footer">Footer</div>;
    };
  },
}));

import Sidebar from "../Sidebar";



describe("Sidebar component", () => {
  /**
   * Reads every sidebar link once into a name→href map. Querying each link
   * individually with getByRole re-walks the accessibility tree per assertion,
   * which is slow enough to time out when the full suite runs in parallel.
   */
  function renderNavMap(): Map<string, string | null> {
    render(<Sidebar />);
    const map = new Map<string, string | null>();
    for (const link of screen.getAllByRole("link")) {
      map.set((link.textContent ?? "").trim(), link.getAttribute("href"));
    }
    return map;
  }

  it("renders the 4 functional groups and expected items", () => {
    const links = renderNavMap();

    // Section headers
    expect(screen.getByText("Hoy")).toBeInTheDocument();
    expect(screen.getByText("Aprender")).toBeInTheDocument();
    expect(screen.getByText("Practicar")).toBeInTheDocument();
    expect(screen.getByText("Consultar")).toBeInTheDocument();

    expect(Object.fromEntries(links)).toMatchObject({
      // Group 1: Hoy
      Inicio: "/",
      "Plan del día": "/daily",
      "Mi diario": "/journal",
      // Group 2: Aprender
      Ruta: "/courses",
      "Modo Foco": "/focus",
      "Pronunciación": "/practice/sounds",
      Vocabulario: "/practice/essential-words",
      "Inmersión": "/practice/immersion",
      "Mini lecciones": "/mini-lessons",
      // Group 3: Practicar
      "Práctica libre": "/practice",
      Mazos: "/practice/decks",
      Juegos: "/practice/games",
      // Group 4: Consultar — Repaso is a dashboard, not a drill
      Diccionario: "/words",
      Guardadas: "/tracking",
      Repaso: "/practice/review",
      Progreso: "/progress",
    });
  });

  it("renders Pronunciación as a single link, not an accordion", () => {
    const links = renderNavMap();

    // Modes are tabs inside /practice/sounds, so no sub-menu is exposed.
    expect(screen.queryByRole("button", { name: /Expandir Pronunciación/i })).not.toBeInTheDocument();
    expect(links.has("Fonemas")).toBe(false);
    expect(links.has("Pares mínimos")).toBe(false);
    expect(links.has("Habla conectada")).toBe(false);
  });
});
