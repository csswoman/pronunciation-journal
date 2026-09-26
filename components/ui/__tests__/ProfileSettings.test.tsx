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
    preferences: { full_name: "Learner", avatar_url: "", interests: [] },
    learnerLevel: { level: "A2", source: "manual", confidence: null, isPlaced: false, updatedAt: null },
    loading: false,
    appLanguage: "Español",
    learningTarget: "Inglés · acento americano",
    dailyGoal: "10 min",
    setAppLanguage: vi.fn(),
    setLearningTarget: vi.fn(),
    setDailyGoal: vi.fn(),
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
    accent: "pink",
    setAccent: vi.fn(),
    preference: "dark",
    setPreference: vi.fn(),
    mode: "dark",
    toggleMode: vi.fn(),
    mounted: true,
  }),
}));

describe("ProfileSettings", () => {
  it("shows and updates the persisted CEFR level", async () => {
    render(<ProfileSettings />);

    expect(screen.getByRole("button", { name: "A2" })).toHaveAttribute("aria-pressed", "true");

    fireEvent.click(screen.getByRole("button", { name: "B1" }));

    await waitFor(() => expect(updateCefrLevel).toHaveBeenCalledWith("B1"));
  });

  it("renders profile sections including account controls and appearance", () => {
    render(<ProfileSettings />);

    expect(screen.getByRole("heading", { name: "Apariencia" })).toBeInTheDocument();
    expect(screen.getByRole("heading", { name: "Cómo estudias" })).toBeInTheDocument();
    expect(screen.getByRole("heading", { name: "Cuenta y seguridad" })).toBeInTheDocument();
  });
});
