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
    preferences: { full_name: "Learner", avatar_url: "", cefr_level: "A2" },
    loading: false,
    updateFullName: vi.fn(),
    updateAvatar: vi.fn(),
    updatePassword: vi.fn(),
    updateCefrLevel,
  }),
}));

vi.mock("@/components/profile/ProfileAvatarCard", () => ({ default: () => <div>Avatar</div> }));
vi.mock("@/components/profile/ProfileNameCard", () => ({ default: () => <div>Name</div> }));
vi.mock("@/components/profile/ProfilePasswordCard", () => ({ default: () => <div>Password</div> }));

describe("ProfileSettings", () => {
  it("shows and updates the persisted CEFR level", async () => {
    render(<ProfileSettings />);

    const select = screen.getByLabelText("English level");
    expect(select).toHaveValue("A2");

    fireEvent.change(select, { target: { value: "B1" } });

    await waitFor(() => expect(updateCefrLevel).toHaveBeenCalledWith("B1"));
  });
});
