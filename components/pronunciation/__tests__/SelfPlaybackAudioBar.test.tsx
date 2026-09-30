// @vitest-environment jsdom
import { render, screen, fireEvent } from "@testing-library/react";
import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { SelfPlaybackAudioBar } from "../SelfPlaybackAudioBar";

describe("SelfPlaybackAudioBar", () => {
  it("renders native and user playback buttons", () => {
    render(
      <SelfPlaybackAudioBar
        targetWord="ship"
        userAudioUrl="blob:http://localhost:3000/123-abc"
      />,
    );

    expect(screen.getByText("Comparación de Audio")).toBeInTheDocument();
    expect(screen.getByText("Nativo")).toBeInTheDocument();
    expect(screen.getByText("Mi voz")).toBeInTheDocument();
  });

  it("disables user audio button when userAudioUrl is null", () => {
    render(<SelfPlaybackAudioBar targetWord="ship" userAudioUrl={null} />);
    const userBtn = screen.getByRole("button", { name: /Escuchar mi propia voz/i });
    expect(userBtn).toBeDisabled();
  });

  describe("playback", () => {
    const play = vi.fn(() => Promise.resolve());
    const speak = vi.fn();

    beforeEach(() => {
      play.mockClear();
      speak.mockClear();
      vi.spyOn(window.HTMLMediaElement.prototype, "play").mockImplementation(play);
      vi.stubGlobal("speechSynthesis", { speak, cancel: vi.fn(), getVoices: () => [] });
      vi.stubGlobal(
        "SpeechSynthesisUtterance",
        class {
          text: string;
          constructor(text: string) {
            this.text = text;
          }
        },
      );
    });

    afterEach(() => {
      vi.restoreAllMocks();
      vi.unstubAllGlobals();
    });

    it("reproduce la grabación del usuario con el reproductor de audio", () => {
      render(
        <SelfPlaybackAudioBar targetWord="ship" userAudioUrl="blob:http://localhost/abc" />,
      );
      fireEvent.click(screen.getByRole("button", { name: /Escuchar mi propia voz/i }));
      expect(play).toHaveBeenCalled();
    });

    it("reproduce el modelo con el TTS del navegador, no con audio remoto", () => {
      render(
        <SelfPlaybackAudioBar targetWord="ship" userAudioUrl="blob:http://localhost/abc" />,
      );
      fireEvent.click(screen.getByRole("button", { name: /Escuchar modelo nativo/i }));
      expect(speak).toHaveBeenCalledTimes(1);
      expect(speak.mock.calls[0][0]).toMatchObject({ text: "ship" });
      expect(play).not.toHaveBeenCalled();
    });
  });
});
