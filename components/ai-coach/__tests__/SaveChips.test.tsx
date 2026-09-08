// @vitest-environment jsdom
import { describe, it, expect, vi } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import SaveChips from "../SaveChips";
import type { TurnSaveable } from "@/lib/ai-practice/tools/registry";

const SAVEABLES: TurnSaveable[] = [
  { type: "word", text: "creepy", meaning: "escalofriante" },
  { type: "phrase", text: "that sounds creepy", meaning: "eso suena escalofriante" },
];

describe("SaveChips", () => {
  it("renders one chip per saveable", () => {
    render(<SaveChips saveables={SAVEABLES} onSave={vi.fn()} />);
    expect(screen.getByRole("button", { name: /^\+ creepy$/ })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /^\+ that sounds creepy$/ })).toBeInTheDocument();
  });

  it("renders nothing when there are no saveables", () => {
    const { container } = render(<SaveChips saveables={[]} onSave={vi.fn()} />);
    expect(container).toBeEmptyDOMElement();
  });

  it("calls onSave with the saveable when a chip is tapped", async () => {
    const onSave = vi.fn().mockResolvedValue(undefined);
    render(<SaveChips saveables={SAVEABLES} onSave={onSave} />);
    await userEvent.click(screen.getByRole("button", { name: /^\+ creepy$/ }));
    expect(onSave).toHaveBeenCalledWith(SAVEABLES[0]);
  });

  it("shows the saved state and disables the chip after a successful save", async () => {
    render(<SaveChips saveables={SAVEABLES} onSave={vi.fn().mockResolvedValue(undefined)} />);
    const chip = screen.getByRole("button", { name: /^\+ creepy$/ });
    await userEvent.click(chip);
    await waitFor(() => {
      expect(screen.getByRole("button", { name: /Guardada/ })).toBeDisabled();
    });
  });

  it("offers a retry when the save fails", async () => {
    const onSave = vi.fn().mockRejectedValue(new Error("nope"));
    render(<SaveChips saveables={SAVEABLES} onSave={onSave} />);
    await userEvent.click(screen.getByRole("button", { name: /^\+ creepy$/ }));
    await waitFor(() => {
      expect(screen.getByRole("button", { name: /reintentar/i })).toBeEnabled();
    });
  });

  it("retries the same saveable when the retry chip is tapped", async () => {
    const onSave = vi.fn().mockRejectedValueOnce(new Error("nope")).mockResolvedValueOnce(undefined);
    render(<SaveChips saveables={SAVEABLES} onSave={onSave} />);
    await userEvent.click(screen.getByRole("button", { name: /^\+ creepy$/ }));
    const retry = await screen.findByRole("button", { name: /reintentar/i });
    await userEvent.click(retry);
    await waitFor(() => expect(onSave).toHaveBeenCalledTimes(2));
  });

  it("keeps chips with identical text but different type independent", async () => {
    const onSave = vi.fn().mockResolvedValue(undefined);
    render(
      <SaveChips
        saveables={[
          { type: "word", text: "book", meaning: "libro" },
          { type: "phrase", text: "book", meaning: "reservar" },
        ]}
        onSave={onSave}
      />,
    );
    const chips = screen.getAllByRole("button", { name: /^\+ book$/ });
    expect(chips).toHaveLength(2);
    await userEvent.click(chips[0]);
    await waitFor(() => {
      expect(screen.getAllByRole("button", { name: /Guardada/ })).toHaveLength(1);
    });
    const stillIdle = screen.getAllByRole("button", { name: /^\+ book$/ });
    expect(stillIdle).toHaveLength(1);
    expect(stillIdle[0]).toBeEnabled();
  });

  it("saves each chip independently", async () => {
    render(<SaveChips saveables={SAVEABLES} onSave={vi.fn().mockResolvedValue(undefined)} />);
    await userEvent.click(screen.getByRole("button", { name: /^\+ creepy$/ }));
    await waitFor(() => expect(screen.getByRole("button", { name: /Guardada/ })).toBeInTheDocument());
    expect(screen.getByRole("button", { name: /^\+ that sounds creepy$/ })).toBeEnabled();
  });
});
