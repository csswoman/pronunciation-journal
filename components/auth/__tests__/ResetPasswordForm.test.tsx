// @vitest-environment jsdom
import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { ResetPasswordForm } from "../ResetPasswordForm";

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
  AuthButton: ({ label, pending }: { label: string; pending?: boolean }) => (
    <button type="submit" disabled={pending}>
      {label}
    </button>
  ),
}));

describe("ResetPasswordForm", () => {
  it("renders the recovery copy and submit button", () => {
    const onSubmit = vi.fn((e: React.FormEvent) => e.preventDefault());
    const setPassword = vi.fn();
    const setConfirmPassword = vi.fn();

    render(
      <ResetPasswordForm
        password=""
        setPassword={setPassword}
        confirmPassword=""
        setConfirmPassword={setConfirmPassword}
        pending={false}
        onSubmit={onSubmit}
      />
    );

    fireEvent.click(screen.getByRole("button", { name: "Update password" }));
    expect(onSubmit).not.toHaveBeenCalled();
  });
});
