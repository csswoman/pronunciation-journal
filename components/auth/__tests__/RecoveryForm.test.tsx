// @vitest-environment jsdom
import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { RecoveryForm } from "../RecoveryForm";

vi.mock("@/components/auth/AuthInput", () => ({
  AuthInput: ({
    label,
    value,
    onChange,
    ...props
  }: {
    label: string;
    value: string;
    onChange: (value: string) => void;
    [key: string]: unknown;
  }) => (
    <label>
      {label}
      <input aria-label={label} value={value} onChange={(e) => onChange((e.target as HTMLInputElement).value)} {...props} />
    </label>
  ),
}));

vi.mock("@/components/auth/AuthButton", () => ({
  AuthButton: ({ label, pending, onClick, type = "submit" }: { label: string; pending?: boolean; onClick?: () => void; type?: "submit" | "button" }) => (
    <button type={type} disabled={pending} onClick={onClick}>
      {label}
    </button>
  ),
}));

describe("RecoveryForm", () => {
  it("submits and supports going back", () => {
    const onSubmit = vi.fn((e: React.FormEvent) => e.preventDefault());
    const onBack = vi.fn();
    const setPassword = vi.fn();
    const setConfirmPassword = vi.fn();

    render(
      <RecoveryForm
        password=""
        setPassword={setPassword}
        confirmPassword=""
        setConfirmPassword={setConfirmPassword}
        pending={false}
        onSubmit={onSubmit}
        onBack={onBack}
      />
    );

    fireEvent.click(screen.getByRole("button", { name: "Back to sign in" }));
    expect(onBack).toHaveBeenCalled();
  });
});
