// @vitest-environment jsdom
import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import ProfileSettings from "../ProfileSettings";

const updateCefrLevel = vi.fn().mockResolvedValue(undefined);

vi.mock("@/components/auth/AuthProvider", () => ({
  useAuth: () => ({
    user: {
      id: "user-12345678",
      email: "learner@example.com",
      user_metadata: { full_name: "Learner" },
    },
  }),
}));

vi.mock("@/hooks/useUserPreferences", () => ({
  useUserPreferences: () => ({
    preferences: { full_name: "Learner", avatar_url: "", cefr_level: "A2", interests: [] },
    loading: false,
    updateFullName: vi.fn(),
    updateAvatar: vi.fn(),
    updatePassword: vi.fn(),
    updateCefrLevel,
    updateInterests: vi.fn(),
  }),
}));

vi.mock("@/hooks/useOKLCHTheme", () => ({
  useOKLCHTheme: () => ({
    hue: 250,
    setHue: vi.fn(),
    resetHue: vi.fn(),
    mode: "light",
    toggleMode: vi.fn(),
    mounted: true,
  }),
}));

vi.mock("@/components/profile/ProfileAvatarCard", () => ({ default: () => <div>Avatar</div> }));
vi.mock("@/components/profile/ProfileNameCard", () => ({ default: () => <div>Name</div> }));
vi.mock("@/components/profile/ProfilePasswordCard", () => ({ default: () => <div>Password</div> }));

describe("ProfileSettings", () => {
  it("shows and updates the persisted CEFR level", async () => {
    render(<ProfileSettings />);

    expect(screen.getByRole("button", { name: "A2" })).toHaveAttribute("aria-pressed", "true");

    fireEvent.click(screen.getByRole("button", { name: "B1" }));

    await waitFor(() => expect(updateCefrLevel).toHaveBeenCalledWith("B1"));
  });

  it("orders preferences with theme before study level", () => {
    render(<ProfileSettings />);

    const theme = screen.getByLabelText("Color del tema");
    const levelGroup = screen.getByRole("group", { name: "Nivel de estudio" });
    expect(theme.compareDocumentPosition(levelGroup) & Node.DOCUMENT_POSITION_FOLLOWING).toBeTruthy();
  });
});
