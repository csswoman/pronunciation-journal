"use client";

interface AuthCheckboxProps {
  label: string;
  checked: boolean;
  onChange: (checked: boolean) => void;
}

export function AuthCheckbox({ label, checked, onChange }: AuthCheckboxProps) {
  return (
    <label className="flex items-center gap-2 cursor-pointer select-none py-1" onClick={() => onChange(!checked)}>
      <div
        className={`flex h-5 w-5 shrink-0 items-center justify-center rounded-md border transition-all ${
          checked
            ? "border-[var(--accent-purple)] bg-[var(--accent-purple)]"
            : "border-border-strong bg-white dark:bg-surface-sunken"
        }`}
      >
        {checked && (
          <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="3.5" strokeLinecap="round" strokeLinejoin="round">
            <polyline points="20 6 9 17 4 12" />
          </svg>
        )}
      </div>
      <span className="text-body-sm text-fg-muted font-medium">
        {label}
      </span>
    </label>
  );
}

