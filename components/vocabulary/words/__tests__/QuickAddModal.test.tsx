// @vitest-environment jsdom
import React from "react";
import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

vi.mock("@/components/auth/AuthProvider", () => ({ useAuth: () => ({ user: { id: "user-1" } }) }));
vi.mock("@/lib/decks/queries", () => ({ getUserDecks: () => Promise.resolve([]) }));

import { QuickAddModal } from "../QuickAddModal";
import { DuplicateWordError } from "@/lib/word-bank/queries";

function renderModal(overrides: Partial<React.ComponentProps<typeof QuickAddModal>> = {}) {
  const props = { open: true, onClose: vi.fn(), onSubmit: vi.fn(), ...overrides };
  render(<QuickAddModal {...props} />);
  return props;
}

async function submitDuplicate(overrides: Partial<React.ComponentProps<typeof QuickAddModal>> = {}) {
  const onSubmit = vi.fn().mockRejectedValue(new DuplicateWordError("word-dup", "resilient"));
  const props = renderModal({ onSubmit, ...overrides });
  fireEvent.change(screen.getByPlaceholderText("Por ejemplo: resilient"), { target: { value: "resilient" } });
  fireEvent.click(screen.getByRole("button", { name: "Guardar palabra" }));
  await screen.findByRole("alert");
  return props;
}

describe("QuickAddModal duplicate handling", () => {
  it("warns instead of saving when the word is already in the list", async () => {
    await submitDuplicate();

    expect(screen.getByRole("alert")).toHaveTextContent("Ya tienes resilient en tu lista.");
    expect(screen.getByRole("button", { name: "Guardar palabra" })).toBeDisabled();
  });

  it("offers to edit the existing word, passing its id", async () => {
    const onEditExisting = vi.fn();
    await submitDuplicate({ onEditExisting });

    fireEvent.click(screen.getByRole("button", { name: "Editar la que ya tienes" }));

    expect(onEditExisting).toHaveBeenCalledWith("word-dup");
  });

  it("clears the warning once the user edits the word, re-enabling save", async () => {
    await submitDuplicate();

    fireEvent.change(screen.getByPlaceholderText("Por ejemplo: resilient"), { target: { value: "resilience" } });

    await waitFor(() => expect(screen.queryByRole("alert")).not.toBeInTheDocument());
    expect(screen.getByRole("button", { name: "Guardar palabra" })).not.toBeDisabled();
  });

  it("does not offer the edit jump when no handler is wired", async () => {
    await submitDuplicate({ onEditExisting: undefined });

    expect(screen.queryByRole("button", { name: "Editar la que ya tienes" })).not.toBeInTheDocument();
  });
});
