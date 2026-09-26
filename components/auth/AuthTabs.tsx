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
      className="grid grid-cols-2 p-1 bg-surface dark:bg-field border border-border rounded-full mb-6 w-full select-none"
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
              "w-full py-2.5 rounded-full text-base transition-all duration-200 focus-visible:outline-2 focus-visible:outline-[var(--accent-purple)] focus-visible:outline-offset-2 cursor-pointer active:scale-95",
              active
                ? "bg-[var(--accent-purple)] text-white font-semibold shadow-xs"
                : "text-fg-muted font-medium hover:text-fg bg-transparent",
            ].join(" ")}
          >
            {label}
          </button>
        );
      })}
    </div>
  );
}
