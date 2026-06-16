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
      <button
        type={type}
        onClick={onClick}
        className="text-sm text-primary hover:underline underline-offset-2 transition-colors"
      >
        {label}
      </button>
    );
  }

  return (
    <Button
      type={type}
      variant="primary"
      size="lg"
      isLoading={pending}
      fullWidth
      onClick={onClick}
    >
      {pending ? "Please wait…" : label}
    </Button>
  );
}
