// @vitest-environment jsdom
import React from "react";
import { describe, expect, it, vi, beforeEach } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";

const push = vi.fn();

vi.mock("next/navigation", () => ({
  useRouter: () => ({ push, replace: vi.fn() }),
}));

vi.mock("@/components/auth/AuthProvider", () => ({
  useAuth: () => ({ user: { is_anonymous: true }, signOutUser: vi.fn() }),
}));

vi.mock("@/hooks/useUserPreferences", () => ({
  useUserPreferences: () => ({ preferences: null }),
}));

import { useSidebar } from "@/components/theme/sidebar/SidebarContext";
vi.mock("@/components/theme/sidebar/SidebarContext", () => ({
  useSidebar: vi.fn(() => ({ collapsed: false })),
}));

vi.mock("@/lib/ui-sounds/cues", () => ({ playUiCue: vi.fn() }));

vi.mock("@/components/layout/QuickSettingsControls", () => ({
  QuickSettingsAccordion: () => <div data-testid="quick-settings" />,
}));

import SidebarFooter from "../SidebarFooter";

describe("SidebarFooter — guest", () => {
  beforeEach(() => {
    push.mockClear();
  });

  it("routes the primary save button to the login page with both tabs", () => {
    render(<SidebarFooter />);
    fireEvent.click(screen.getAllByRole("button", { name: /guardar progreso/i })[0]);
    expect(push).toHaveBeenCalledWith("/login?intent=save");
  });

  it("exposes a settings link for guests and drops the redundant sign-in sub-link", () => {
    render(<SidebarFooter />);
    // open the quick-settings panel (the gear button)
    fireEvent.click(screen.getByRole("button", { name: /ajustes rápidos/i }));

    const verAjustes = screen.getByRole("button", { name: /ver ajustes/i });
    fireEvent.click(verAjustes);
    expect(push).toHaveBeenCalledWith("/profile");

    expect(screen.queryByText(/ya tienes cuenta/i)).not.toBeInTheDocument();
  });

  it("positions quick settings panel near collapsed sidebar when collapsed is true", () => {
    vi.mocked(useSidebar).mockReturnValue({ collapsed: true });

    render(<SidebarFooter />);
    fireEvent.click(screen.getByRole("button", { name: /ajustes rápidos/i }));

    const dialog = screen.getByRole("dialog", { name: /ajustes rápidos/i });
    expect(dialog.className).toContain("left-[calc(60px+0.75rem)]");
  });
});
