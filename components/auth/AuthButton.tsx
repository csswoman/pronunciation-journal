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
        className="text-xs font-semibold text-[var(--accent-purple)] hover:underline underline-offset-2 transition-colors focus-visible:outline-none cursor-pointer"
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
      className="w-full h-12 rounded-full bg-[var(--accent-purple)] hover:brightness-95 text-white font-semibold text-base flex items-center justify-center gap-2 transition-all duration-200 active:scale-[0.98] shadow-md focus-visible:outline-2 focus-visible:outline-[var(--accent-purple)] focus-visible:outline-offset-2 disabled:opacity-50 select-none cursor-pointer"
    >
      {pending ? (
        <span className="flex items-center gap-2">
          <svg className="animate-spin h-4 w-4 text-white" fill="none" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
          </svg>
          <span>Procesando...</span>
        </span>
      ) : (
        label
      )}
    </button>
  );
}
