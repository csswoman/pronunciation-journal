// @vitest-environment jsdom
import { describe, it, expect, vi } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import SaveConceptChip from "../SaveConceptChip";

describe("SaveConceptChip", () => {
  it("renders the idle label", () => {
    render(<SaveConceptChip onSave={vi.fn()} />);
    expect(screen.getByRole("button", { name: /guardar explicación/i })).toBeInTheDocument();
  });

  it("calls onSave when tapped", async () => {
    const onSave = vi.fn().mockResolvedValue(undefined);
    render(<SaveConceptChip onSave={onSave} />);
    await userEvent.click(screen.getByRole("button", { name: /guardar explicación/i }));
    expect(onSave).toHaveBeenCalledTimes(1);
  });

  it("shows the saved state and disables the button after a successful save", async () => {
    render(<SaveConceptChip onSave={vi.fn().mockResolvedValue(undefined)} />);
    await userEvent.click(screen.getByRole("button", { name: /guardar explicación/i }));
    await waitFor(() => {
      expect(screen.getByRole("button", { name: /guardada/i })).toBeDisabled();
    });
  });

  it("offers a retry when the save fails, and retries on tap", async () => {
    const onSave = vi.fn().mockRejectedValueOnce(new Error("nope")).mockResolvedValueOnce(undefined);
    render(<SaveConceptChip onSave={onSave} />);
    await userEvent.click(screen.getByRole("button", { name: /guardar explicación/i }));
    const retry = await screen.findByRole("button", { name: /reintentar/i });
    await userEvent.click(retry);
    await waitFor(() => expect(onSave).toHaveBeenCalledTimes(2));
  });
});
