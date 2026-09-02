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
    expect(screen.getByRole("link", { name: /Práctica libre/i })).toHaveAttribute("href", "/practice");

    // Group 3: Explorar
    expect(screen.getByRole("link", { name: /Ruta/i })).toHaveAttribute("href", "/courses");
    expect(screen.getByRole("link", { name: /Mini lecciones/i })).toHaveAttribute("href", "/mini-lessons");
    expect(screen.getByRole("link", { name: /Diccionario/i })).toHaveAttribute("href", "/words");

    // Group 4: Progreso
    expect(screen.getByRole("link", { name: /Progreso/i })).toHaveAttribute("href", "/progress");
    expect(screen.getByRole("link", { name: /Guardadas/i })).toHaveAttribute("href", "/tracking");

    // Removed direct sidebar items
    expect(screen.queryByRole("link", { name: /Laboratorio de sonidos/i })).not.toBeInTheDocument();
    expect(screen.queryByRole("link", { name: /Palabras esenciales/i })).not.toBeInTheDocument();
    expect(screen.queryByRole("link", { name: /Mazos/i })).not.toBeInTheDocument();
    expect(screen.queryByRole("link", { name: /Repaso/i })).not.toBeInTheDocument();
  });
});
