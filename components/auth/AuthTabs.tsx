"use client";

type Mode = "login" | "register";

interface AuthTabsProps {
  mode: Mode;
  onModeChange: (mode: Mode) => void;
}

const tabBase = "flex-1 flex items-center justify-center text-body-sm px-space-6 py-space-3 rounded-md transition-all border-none";
const tabActive = "bg-primary text-on-primary font-semibold";
const tabInactive = "bg-transparent text-fg-muted font-medium hover:bg-surface-sunken";

export function AuthTabs({ mode, onModeChange }: AuthTabsProps) {
  return (
    <div className="flex flex-col sm:flex-row gap-space-2 p-space-1 mb-space-6 bg-surface-sunken rounded-lg">
      <button
        type="button"
        onClick={() => onModeChange("login")}
        className={`${tabBase} ${mode === "login" ? tabActive : tabInactive}`}
      >
        Sign in
      </button>
      <button
        type="button"
        onClick={() => onModeChange("register")}
        className={`${tabBase} ${mode === "register" ? tabActive : tabInactive}`}
      >
        Create account
      </button>
    </div>
  );
}
