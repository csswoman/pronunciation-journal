"use client";

import { ArrowRight } from "lucide-react";

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
        className="w-full text-[13px] font-medium bg-transparent border-none cursor-pointer transition-opacity hover:opacity-70"
        style={{ color: "color-mix(in srgb, var(--color-accent) 80%, white)" }}
      >
        {label}
      </button>
    );
  }

  return (
    <button
      type={type}
      onClick={onClick}
      disabled={pending}
      className="w-full flex items-center justify-center gap-2 py-[15px] rounded-[10px] text-[15px] font-semibold text-white disabled:opacity-50 transition-all hover:-translate-y-px group"
      style={{
        background: "var(--color-accent)",
        boxShadow: "0 8px 24px color-mix(in srgb, var(--color-accent) 35%, transparent)",
        fontFamily: "'Sora', sans-serif",
      }}
    >
      {pending ? "Espera…" : label}
      {!pending && <ArrowRight className="w-4 h-4 transition-transform group-hover:translate-x-0.5" />}
    </button>
  );
}
