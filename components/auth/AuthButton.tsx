"use client";

import Button from "@/components/ui/Button";

interface AuthButtonProps {
  label: string;
  pending: boolean;
  type?: "submit" | "button";
  variant?: "primary" | "secondary";
  onClick?: () => void;
}

export function AuthButton({ label, pending, type = "submit", variant = "primary", onClick }: AuthButtonProps) {
  if (variant === "secondary") {
    return (
      <Button type={type} variant="ghost" onClick={onClick} className="text-sm text-[var(--primary)] hover:underline">
        {label}
      </Button>
    );
  }

  return (
    <Button
      type={type}
      variant="primary"
      disabled={pending}
      fullWidth
      onClick={onClick}
    >
      {pending ? "Please wait…" : `${label} →`}
    </Button>
  );
}
