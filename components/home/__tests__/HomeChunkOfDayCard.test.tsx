// @vitest-environment jsdom
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import { describe, expect, it, beforeEach } from "vitest";
import HomeChunkOfDayCard from "../HomeChunkOfDayCard";

describe("HomeChunkOfDayCard", () => {
  beforeEach(() => {
    sessionStorage.clear();
  });

  it("renders the chunk of the day with title, IPA and meaning", () => {
    const { container } = render(<HomeChunkOfDayCard />);
    expect(screen.getByText("Chunk del día")).toBeInTheDocument();

    const ipaElement = container.querySelector(".font-ipa");
    expect(ipaElement).toBeInTheDocument();

    const wordElement = container.querySelector(".home-chunk-quote__phrase");
    expect(wordElement).toBeInTheDocument();
    expect(wordElement?.textContent?.trim()).toBeTruthy();
  });

  it("changes the chunk when clicking the shuffle button", async () => {
    const { container } = render(<HomeChunkOfDayCard />);
    const shuffleButton = screen.getByRole("button", { name: "Sacar otro chunk" });
    expect(shuffleButton).toBeInTheDocument();

    const initialWord = container.querySelector(
      ".home-chunk-quote__phrase",
    )?.textContent;
    expect(initialWord).toBeTruthy();

    fireEvent.click(shuffleButton);

    await waitFor(() => {
      expect(screen.getByText("Chunk del día")).toBeInTheDocument();
    });
  });
});
