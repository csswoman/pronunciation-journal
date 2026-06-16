"use client";

type Mode = "login" | "register";

interface AuthTabsProps {
  mode: Mode;
  onModeChange: (mode: Mode) => void;
}

const TABS: { value: Mode; label: string }[] = [
  { value: "login",    label: "Sign in" },
  { value: "register", label: "Create account" },
];

export function AuthTabs({ mode, onModeChange }: AuthTabsProps) {
  return (
    <div
      role="tablist"
      className="flex mb-8 p-1 rounded-xl bg-surface-sunken gap-1"
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
              "flex-1 py-2 px-3 rounded-lg text-sm font-medium transition-all duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 focus-visible:ring-offset-surface-sunken",
              active
                ? "bg-primary text-white shadow-sm"
                : "text-fg-muted hover:text-fg",
            ].join(" ")}
          >
            {label}
          </button>
        );
      })}
    </div>
  );
}
