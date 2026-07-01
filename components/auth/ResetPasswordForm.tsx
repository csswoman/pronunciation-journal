"use client";

import { AuthButton } from "@/components/auth/AuthButton";
import { AuthInput } from "@/components/auth/AuthInput";

interface ResetPasswordFormProps {
  password: string;
  setPassword: (value: string) => void;
  confirmPassword: string;
  setConfirmPassword: (value: string) => void;
  pending: boolean;
  onSubmit: (e: React.FormEvent) => void;
}

export function ResetPasswordForm({
  password,
  setPassword,
  confirmPassword,
  setConfirmPassword,
  pending,
  onSubmit,
}: ResetPasswordFormProps) {
  return (
    <>
      <div className="mb-6">
        <h1 className="text-fg font-semibold text-base">Create a new password</h1>
        <p className="text-fg-muted text-sm mt-1">
          Pick a new password to finish recovering your account.
        </p>
      </div>
      <form onSubmit={onSubmit} className="flex flex-col gap-space-4">
        <AuthInput
          type="password"
          label="New password"
          placeholder="········"
          value={password}
          onChange={setPassword}
          required
          autoComplete="new-password"
          minLength={6}
        />
        <AuthInput
          type="password"
          label="Confirm password"
          placeholder="········"
          value={confirmPassword}
          onChange={setConfirmPassword}
          required
          autoComplete="new-password"
          minLength={6}
        />
        <AuthButton label="Update password" pending={pending} />
      </form>
    </>
  );
}
