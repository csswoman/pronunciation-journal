// @vitest-environment jsdom
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";
import ChromeMicTip from "@/components/speech/ChromeMicTip";
import { CHROME_MIC_TIP_DISMISSED_KEY } from "@/lib/speech/browser-support-message";

vi.mock("@/lib/speech/adapters/webSpeechAdapter", () => ({
  isWebSpeechReliable: () => false,
}));

describe("ChromeMicTip", () => {
  beforeEach(() => {
    window.localStorage.clear();
  });

  it("shows the login tip with Chrome guidance", () => {
    render(<ChromeMicTip variant="login" />);
    const tip = screen.getByRole("note");
    expect(tip).toHaveAccessibleName(/Mejor con Google Chrome/i);
    expect(tip).toHaveTextContent(/Google Chrome/i);
    expect(tip).toHaveTextContent(/Brave/i);
    expect(tip).toHaveTextContent(/Opera/i);
    expect(tip).toHaveTextContent(/Edge/i);
  });

  it("shows and dismisses the app banner when Web Speech is unreliable", async () => {
    const user = userEvent.setup();
    render(<ChromeMicTip variant="app" />);

    expect(
      await screen.findByRole("status", { name: /Mejor con Google Chrome/i }),
    ).toBeInTheDocument();

    await user.click(screen.getByRole("button", { name: "Entendido" }));
    expect(screen.queryByRole("status")).not.toBeInTheDocument();
    expect(window.localStorage.getItem(CHROME_MIC_TIP_DISMISSED_KEY)).toBe("1");
  });
});
