// @vitest-environment jsdom
import React from "react";
import { describe, expect, it, vi } from "vitest";
import { render, screen } from "@testing-library/react";

let mockPathname = "/";

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
  default: (loader: () => Promise<unknown>) => {
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
    expect(screen.getByText("Práctica")).toBeInTheDocument();
    expect(screen.getByText("Explorar")).toBeInTheDocument();

    // Group 1: Hoy
    expect(screen.getByRole("link", { name: /Inicio/i })).toHaveAttribute("href", "/");
    expect(screen.getByRole("link", { name: /Diario/i })).toHaveAttribute("href", "/journal");

    // Group 2: Práctica
    expect(screen.getByRole("link", { name: /Práctica libre/i })).toHaveAttribute("href", "/practice");

    // Group 3: Explorar
    expect(screen.getByRole("link", { name: /Ruta/i })).toHaveAttribute("href", "/courses");
    expect(screen.getByRole("link", { name: /Mini lecciones/i })).toHaveAttribute("href", "/mini-lessons");
    expect(screen.getByRole("link", { name: /Diccionario/i })).toHaveAttribute("href", "/dictionary");

    // Group 4: Progreso
    expect(screen.getByRole("link", { name: /Progreso/i })).toHaveAttribute("href", "/progress");

    // Removed direct sidebar items
    expect(screen.queryByRole("link", { name: /Laboratorio de sonidos/i })).not.toBeInTheDocument();
    expect(screen.queryByRole("link", { name: /Palabras esenciales/i })).not.toBeInTheDocument();
    expect(screen.queryByRole("link", { name: /Mazos/i })).not.toBeInTheDocument();
    expect(screen.queryByRole("link", { name: /Repaso/i })).not.toBeInTheDocument();
    expect(screen.queryByRole("link", { name: /Guardado/i })).not.toBeInTheDocument();
  });
});
