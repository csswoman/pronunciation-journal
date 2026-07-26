"use client";

import { AuthInput } from "@/components/auth/AuthInput";
import { AuthButton } from "@/components/auth/AuthButton";
import { MIN_PASSWORD_LENGTH, PASSWORD_POLICY_MESSAGE } from "@/lib/auth/password-policy";

interface RecoveryFormProps {
  password: string;
  setPassword: (v: string) => void;
  confirmPassword: string;
  setConfirmPassword: (v: string) => void;
  pending: boolean;
  onSubmit: (e: React.FormEvent) => void;
  onBack: () => void;
}

export function RecoveryForm({
  password,
  setPassword,
  confirmPassword,
  setConfirmPassword,
  pending,
  onSubmit,
  onBack,
}: RecoveryFormProps) {
  return (
    <>
      <div className="mb-6">
        <h2 className="text-fg font-semibold text-base">Create a new password</h2>
        <p className="text-fg-muted text-body-sm mt-1">
          Use the link from your email to set a new password.
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
          minLength={MIN_PASSWORD_LENGTH}
        />
        <AuthInput
          type="password"
          label="Confirm password"
          placeholder="········"
          value={confirmPassword}
          onChange={setConfirmPassword}
          required
          autoComplete="new-password"
          minLength={MIN_PASSWORD_LENGTH}
        />
        <p className="text-caption text-fg-muted">{PASSWORD_POLICY_MESSAGE}</p>
        <AuthButton label="Update password" pending={pending} />
        <AuthButton label="Back to sign in" pending={pending} type="button" variant="secondary" onClick={onBack} />
      </form>
    </>
  );
}
