// @vitest-environment jsdom
import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import ProfileSettings from "../ProfileSettings";

const routerPush = vi.fn();

vi.mock("next/navigation", () => ({
  useRouter: () => ({ push: routerPush }),
}));

vi.mock("@/components/auth/AuthProvider", () => ({
  useAuth: () => ({ user: { id: "user-1", email: "learner@example.com", user_metadata: {} } }),
}));

vi.mock("@/hooks/useUserPreferences", () => ({
  useUserPreferences: () => ({
    preferences: { full_name: "Learner", avatar_url: "", interests: [] },
    learnerLevel: { level: "A2", source: "manual", confidence: null, isPlaced: false, updatedAt: null },
    loading: false,
    dailyGoal: "10 min",
    setDailyGoal: vi.fn(),
    updateFullName: vi.fn(),
    updateAvatar: vi.fn(),
    updatePassword: vi.fn(),
    updateCefrLevel: vi.fn(),
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

vi.mock("next/dynamic", () => ({
  default: () =>
    function StubProfileOfflineCard({
      onStudyLesson,
      onStudyWords,
    }: {
      onStudyLesson: (lesson: { lessonNumber: number; trackId: string }) => void;
      onStudyWords: (level: string) => void;
    }) {
      return (
        <div>
          <button type="button" onClick={() => onStudyLesson({ lessonNumber: 3, trackId: "a2" })}>
            study-lesson
          </button>
          <button type="button" onClick={() => onStudyWords("A2")}>
            study-words
          </button>
        </div>
      );
    },
}));

describe("ProfileSettings offline study navigation", () => {
  it("sends a downloaded-lesson study request to the real course-study route", () => {
    render(<ProfileSettings />);

    fireEvent.click(screen.getByRole("button", { name: "study-lesson" }));

    expect(routerPush).toHaveBeenCalledWith("/courses/study/3?level=a2");
  });

  it("sends an Essential Words study request to the real practice route", () => {
    render(<ProfileSettings />);

    fireEvent.click(screen.getByRole("button", { name: "study-words" }));

    expect(routerPush).toHaveBeenCalledWith("/practice/essential-words");
  });
});
