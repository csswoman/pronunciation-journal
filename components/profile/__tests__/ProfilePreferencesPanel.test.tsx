// @vitest-environment jsdom
import { render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import ProfilePreferencesPanel from "../ProfilePreferencesPanel";

vi.mock("@/components/layout/QuickSettingsControls", () => ({
  StudyLevelControls: () => <div>Level</div>,
}));

vi.mock("@/components/profile/InterestsEditor", () => ({ default: () => <div>Interests</div> }));

describe("ProfilePreferencesPanel", () => {
  it("explains that changing level keeps progress", () => {
    render(
      <ProfilePreferencesPanel
        level="A1"
        onLevelChange={vi.fn()}
        hint="Esto ajusta recomendaciones. Tu progreso se conserva; puedes seguir explorando cualquier contenido."
      />,
    );
    expect(screen.getByText(/Tu progreso se conserva/i)).toBeInTheDocument();
  });
});
