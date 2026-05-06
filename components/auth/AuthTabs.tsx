"use client";

type Mode = "login" | "register";

interface AuthTabsProps {
  mode: Mode;
  onModeChange: (mode: Mode) => void;
}

export function AuthTabs({ mode, onModeChange }: AuthTabsProps) {
  const tabBase = {
    border: "none",
    padding: "var(--space-3) var(--space-6)",
    borderRadius: "var(--radius-md)",
    transition: "all var(--transition-fast)",
  } as const;

  return (
    <div
      className="auth-tabs flex gap-[var(--space-2)] p-[var(--space-1)] mb-[var(--space-6)]"
      style={{ background: "var(--surface-sunken)", borderRadius: "var(--radius-lg)" }}
    >
      <button
        type="button"
        onClick={() => onModeChange("login")}
        className="auth-tab flex-1 flex items-center justify-center text-body-sm"
        style={mode === "login" ? {
          ...tabBase,
          background: "var(--primary)",
          color: "var(--on-primary)",
          fontWeight: 600,
        } : {
          ...tabBase,
          background: "transparent",
          color: "var(--text-secondary)",
          fontWeight: 500,
        }}
      >
        Sign in
      </button>

      <button
        type="button"
        onClick={() => onModeChange("register")}
        className="auth-tab flex-1 flex items-center justify-center text-body-sm"
        style={mode === "register" ? {
          ...tabBase,
          background: "var(--primary)",
          color: "var(--on-primary)",
          fontWeight: 600,
        } : {
          ...tabBase,
          background: "transparent",
          color: "var(--text-secondary)",
          fontWeight: 500,
        }}
      >
        Create account
      </button>
      <style>{`
        .auth-tab:hover { background: var(--surface-sunken) !important; }
        .auth-tab:focus-visible { outline: 2px solid var(--primary); outline-offset: 2px; }
        @media (max-width: 479px) { .auth-tabs { flex-direction: column; } }
      `}</style>
    </div>
  );
}
