"use client";

type Mode = "login" | "register";

interface AuthTabsProps {
  mode: Mode;
  onModeChange: (mode: Mode) => void;
}

const TABS: { value: Mode; label: string }[] = [
  { value: "login", label: "Iniciar sesión" },
  { value: "register", label: "Crear cuenta" },
];

export function AuthTabs({ mode, onModeChange }: AuthTabsProps) {
  return (
    <div
      role="tablist"
      className="flex mb-8 gap-6 border-b border-border-subtle"
    >
      {TABS.map(({ value, label }) => {
        const active = mode === value;
        return (
          <button
            key={value}
            type="button"
            role="tab"
            aria-selected={active}
            onClick={() => onModeChange(value)}
            className={[
              "relative -mb-px border-b-2 pb-3 pt-1 text-body-sm font-medium transition-colors duration-200 motion-reduce:transition-none focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2",
              active
                ? "border-fg text-fg"
                : "border-transparent text-fg-muted hover:text-fg hover:border-border-strong",
            ].join(" ")}
          >
            {label}
          </button>
        );
      })}
    </div>
  );
}
