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
    
    // Check that an IPA tag with font-ipa is present
    const ipaElement = container.querySelector(".font-ipa");
    expect(ipaElement).toBeInTheDocument();

    // Check that chunk word display is present
    const wordElement = container.querySelector(".text-display-word");
    expect(wordElement).toBeInTheDocument();
    expect(wordElement?.textContent?.trim()).toBeTruthy();
  });

  it("changes the chunk when clicking the shuffle button", async () => {
    const { container } = render(<HomeChunkOfDayCard />);
    const shuffleButton = screen.getByRole("button", { name: "Sacar otro chunk" });
    expect(shuffleButton).toBeInTheDocument();

    const initialWord = container.querySelector(".text-display-word")?.textContent;
    
    fireEvent.click(shuffleButton);

    await waitFor(() => {
      expect(screen.getByText("Chunk del día")).toBeInTheDocument();
    });
  });
});
