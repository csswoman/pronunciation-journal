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
  it("renders the 4 functional groups and expected items", () => {
    render(<Sidebar />);

    // Section headers
    expect(screen.getByText("Hoy")).toBeInTheDocument();
    expect(screen.getByText("Aprender")).toBeInTheDocument();
    expect(screen.getByText("Consultar")).toBeInTheDocument();

    // Group 1: Hoy
    expect(screen.getByRole("link", { name: /Inicio/i })).toHaveAttribute("href", "/");
    expect(screen.getByRole("link", { name: /Mi diario/i })).toHaveAttribute("href", "/journal");
    expect(screen.queryByRole("link", { name: /Plan del día/i })).not.toBeInTheDocument();

    // Group 2: Aprender
    expect(screen.getByRole("link", { name: /^Pronunciación$/i })).toHaveAttribute("href", "/practice/sounds");
    expect(screen.getByRole("link", { name: /Ruta/i })).toHaveAttribute("href", "/courses");
    expect(screen.getByRole("link", { name: /Mini lecciones/i })).toHaveAttribute("href", "/mini-lessons");
    expect(screen.getByRole("link", { name: /Práctica libre/i })).toHaveAttribute("href", "/practice");

    // Group 3: Consultar
    expect(screen.getByRole("link", { name: /Diccionario/i })).toHaveAttribute("href", "/words");
    expect(screen.getByRole("link", { name: /Guardadas/i })).toHaveAttribute("href", "/tracking");

    // Group 4: Progreso
    expect(screen.getByRole("link", { name: /Progreso/i })).toHaveAttribute("href", "/progress");

    // Removed direct sidebar items
    expect(screen.queryByRole("link", { name: /Laboratorio de sonidos/i })).not.toBeInTheDocument();
    expect(screen.queryByRole("link", { name: /Palabras esenciales/i })).not.toBeInTheDocument();
    expect(screen.queryByRole("link", { name: /Mazos/i })).not.toBeInTheDocument();
    expect(screen.queryByRole("link", { name: /Repaso/i })).not.toBeInTheDocument();
  });

  it("toggles the Pronunciación accordion to reveal mode sub-links", async () => {
    const { userEvent } = await import("@testing-library/user-event");
    const user = userEvent.setup();
    render(<Sidebar />);

    // Initially collapsed (since mockPathname is /)
    expect(screen.queryByRole("link", { name: /^Fonemas$/i })).not.toBeInTheDocument();
    expect(screen.queryByRole("link", { name: /^Pares mínimos$/i })).not.toBeInTheDocument();

    // Click toggle button for Pronunciación
    const expandButton = screen.getByRole("button", { name: /Expandir Pronunciación/i });
    await user.click(expandButton);

    // Sub-items should now be visible
    expect(screen.getByRole("link", { name: /^Fonemas$/i })).toHaveAttribute("href", "/practice/sounds");
    expect(screen.getByRole("link", { name: /^Pares mínimos$/i })).toHaveAttribute("href", "/practice/sounds?tab=minimal-pairs");
    expect(screen.getByRole("link", { name: /^Entonación$/i })).toHaveAttribute("href", "/practice/intonation");
    expect(screen.getByRole("link", { name: /^Habla conectada$/i })).toHaveAttribute("href", "/practice/connected-speech");
    expect(screen.getByRole("link", { name: /^Tu progreso$/i })).toHaveAttribute("href", "/practice/sounds?tab=path");
  });
});
