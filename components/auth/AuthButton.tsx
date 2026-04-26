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
        style={{ color: "var(--color-accent)" }}
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
      className="w-full flex items-center justify-center gap-2 py-[14px] rounded-[10px] text-[15px] font-semibold text-white disabled:opacity-50 transition-all hover:-translate-y-px active:translate-y-0 group"
      style={{
        background: "var(--color-accent)",
        fontFamily: "'Sora', sans-serif",
      }}
    >
      {pending ? "Please wait…" : label}
      {!pending && <ArrowRight className="w-4 h-4 transition-transform group-hover:translate-x-0.5" />}
    </button>
  );
}
