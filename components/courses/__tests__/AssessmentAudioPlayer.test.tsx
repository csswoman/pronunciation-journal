// @vitest-environment jsdom
import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { AssessmentAudioPlayer } from "../AssessmentAudioPlayer";

describe("AssessmentAudioPlayer", () => {
  it("preserves audio duration and seek functionality when changing questionId with the same audioSrc", () => {
    const audioSrc = "/audio/shared-dialogue.mp3";
    const onReadyChange = vi.fn();

    const { rerender } = render(
      <AssessmentAudioPlayer questionId="q1" audioSrc={audioSrc} onReadyChange={onReadyChange}>
        <div>Question 1 content</div>
      </AssessmentAudioPlayer>
    );

    const audioEl = screen.getByLabelText("Audio en inglés para la pregunta") as HTMLAudioElement;

    // Mock duration on the audio element (simulating browser HTMLMediaElement)
    Object.defineProperty(audioEl, "duration", {
      configurable: true,
      value: 10,
    });

    // Fire loadedmetadata for question 1
    fireEvent.loadedMetadata(audioEl);

    expect(screen.getByText("0:00 / 0:10")).toBeInTheDocument();

    // Rerender with questionId="q2" and SAME audioSrc
    rerender(
      <AssessmentAudioPlayer questionId="q2" audioSrc={audioSrc} onReadyChange={onReadyChange}>
        <div>Question 2 content</div>
      </AssessmentAudioPlayer>
    );

    // Duration should NOT reset to 0:00 permanently when HTML media element already has duration
    expect(screen.getByText("0:00 / 0:10")).toBeInTheDocument();
    expect(screen.queryByText("0:00 / 0:00")).not.toBeInTheDocument();

    // Simulate playing audio in Question 2
    Object.defineProperty(audioEl, "currentTime", {
      configurable: true,
      writable: true,
      value: 2,
    });
    fireEvent.timeUpdate(audioEl);

    // Should display 0:02 / 0:10 (not 0:02 / 0:00)
    expect(screen.getByText("0:02 / 0:10")).toBeInTheDocument();

    // Slider track should have percentage calculation based on duration = 10, so 2 / 10 = 20%
    const fill = document.querySelector(".assessment-audio-seekbar-fill");
    expect(fill).toHaveStyle("width: 20%");
  });
});
