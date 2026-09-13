// @vitest-environment jsdom
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";
import MicAvailabilityTip from "@/components/speech/MicAvailabilityTip";
import { MIC_TIP_DISMISSED_KEY } from "@/lib/speech/browser-support-message";

const speechMocks = vi.hoisted(() => ({ canScoreSpeech: vi.fn() }));

vi.mock("@/lib/speech/adapters/webSpeechAdapter", () => ({
  isWebSpeechReliable: () => false,
  canScoreSpeech: speechMocks.canScoreSpeech,
  isMobileBrowser: () => false,
}));

describe("MicAvailabilityTip", () => {
  beforeEach(() => {
    window.localStorage.clear();
    speechMocks.canScoreSpeech.mockReset();
  });

  it("shows and dismisses the banner when no microphone is reachable", async () => {
    speechMocks.canScoreSpeech.mockReturnValue(false);
    const user = userEvent.setup();
    render(<MicAvailabilityTip />);

    const banner = await screen.findByRole("status", {
      name: /Micrófono no disponible/i,
    });
    // The cause is the microphone, never the browser brand.
    expect(banner).not.toHaveTextContent(/Chrome|Firefox|Safari|Brave|Edge/i);

    await user.click(screen.getByRole("button", { name: "Entendido" }));
    expect(screen.queryByRole("status")).not.toBeInTheDocument();
    expect(window.localStorage.getItem(MIC_TIP_DISMISSED_KEY)).toBe("1");
  });

  it("stays hidden when the device can score speech", () => {
    speechMocks.canScoreSpeech.mockReturnValue(true);
    render(<MicAvailabilityTip />);

    expect(screen.queryByRole("status")).not.toBeInTheDocument();
  });
});
