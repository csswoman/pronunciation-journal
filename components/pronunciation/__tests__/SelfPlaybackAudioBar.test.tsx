// @vitest-environment jsdom
import { render, screen } from "@testing-library/react";
import { describe, it, expect } from "vitest";
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
});
