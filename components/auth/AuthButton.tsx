"use client";

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
        className="text-caption font-medium bg-transparent border-none cursor-pointer transition-all hover:underline"
        style={{ color: "var(--primary)", font: "var(--font-body-sm)" }}
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
      className="auth-primary-btn w-full disabled:opacity-50 transition-all"
      style={{
        background: "var(--primary)",
        color: "var(--on-primary)",
        border: "none",
        padding: "var(--space-3) var(--space-6)",
        borderRadius: "var(--radius-md)",
        font: "var(--font-body)",
        fontWeight: 600,
        transition: "all var(--transition-base)",
      }}
    >
      {pending ? "Please wait…" : `${label} →`}
      <style>{`
        .auth-primary-btn:hover { background: var(--primary-hover); cursor: pointer; }
        .auth-primary-btn:active { transform: scale(0.98); }
        .auth-primary-btn:focus-visible { outline: 2px solid var(--primary); outline-offset: 2px; }
      `}</style>
    </button>
  );
}
