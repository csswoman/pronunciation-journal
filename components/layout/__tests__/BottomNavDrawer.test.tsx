// @vitest-environment jsdom
import React from "react";
import { describe, expect, it, vi, beforeEach } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";

const push = vi.fn();
const replace = vi.fn();
const signOutUser = vi.fn().mockResolvedValue(undefined);

vi.mock("next/navigation", () => ({
  useRouter: () => ({ push, replace }),
}));

const authState: { user: Record<string, unknown> | null } = { user: null };
vi.mock("@/components/auth/AuthProvider", () => ({
  useAuth: () => ({ user: authState.user, signOutUser }),
}));

vi.mock("@/hooks/useUserPreferences", () => ({
  useUserPreferences: () => ({ preferences: { full_name: "Ada Lovelace" } }),
}));

vi.mock("@/lib/ui-sounds/cues", () => ({ playUiCue: vi.fn() }));

vi.mock("@/components/layout/QuickSettingsControls", () => ({
  QuickSettingsAccordion: () => <div data-testid="quick-settings" />,
}));

import BottomNavDrawer from "../BottomNavDrawer";

const noop = () => {};
const inactive = () => false;

describe("BottomNavDrawer", () => {
  beforeEach(() => {
    push.mockClear();
    replace.mockClear();
    signOutUser.mockClear();
    authState.user = null;
  });

  it("renders the full navConfig sections, including items missing from the old flat menu", () => {
    render(<BottomNavDrawer open onClose={noop} isActive={inactive} />);
    expect(screen.getByRole("link", { name: /modo foco/i })).toBeInTheDocument();
    expect(screen.getByRole("link", { name: /mini lecciones/i })).toBeInTheDocument();
    expect(screen.getByRole("link", { name: /progreso/i })).toBeInTheDocument();
  });

  it("gives a signed-out visitor a way to sign in and no sign-out control", () => {
    render(<BottomNavDrawer open onClose={noop} isActive={inactive} />);

    expect(screen.getByText(/modo invitado/i)).toBeInTheDocument();
    fireEvent.click(screen.getByRole("button", { name: /guardar progreso/i }));
    expect(push).toHaveBeenCalledWith("/login?intent=save");

    expect(screen.queryByRole("button", { name: /cerrar sesión/i })).not.toBeInTheDocument();
  });

  it("treats an anonymous Supabase session as a guest", () => {
    authState.user = { is_anonymous: true };
    render(<BottomNavDrawer open onClose={noop} isActive={inactive} />);

    expect(screen.getByText(/modo invitado/i)).toBeInTheDocument();
    expect(screen.queryByRole("button", { name: /cerrar sesión/i })).not.toBeInTheDocument();
  });

  it("shows the profile row and a sign-out action for a permanent account", async () => {
    authState.user = { id: "u1", email: "ada@example.com" };
    const onClose = vi.fn();
    render(<BottomNavDrawer open onClose={onClose} isActive={inactive} />);

    fireEvent.click(screen.getByRole("button", { name: /ada lovelace/i }));
    expect(onClose).toHaveBeenCalled();
    expect(push).toHaveBeenCalledWith("/profile");

    fireEvent.click(screen.getByRole("button", { name: /cerrar sesión/i }));
    expect(signOutUser).toHaveBeenCalled();
  });

  it("dismisses on Escape and on scrim click", () => {
    const onClose = vi.fn();
    render(<BottomNavDrawer open onClose={onClose} isActive={inactive} />);

    fireEvent.keyDown(window, { key: "Escape" });
    expect(onClose).toHaveBeenCalledTimes(1);

    const scrim = document.querySelector('[role="presentation"]');
    if (scrim) fireEvent.click(scrim);
    expect(onClose).toHaveBeenCalledTimes(2);
  });

  it("closes when a navigation link is tapped", () => {
    const onClose = vi.fn();
    render(<BottomNavDrawer open onClose={onClose} isActive={inactive} />);

    fireEvent.click(screen.getByRole("link", { name: /mi diario/i }));
    expect(onClose).toHaveBeenCalled();
  });
});
