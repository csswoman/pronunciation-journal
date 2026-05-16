"use client";

interface AuthCheckboxProps {
  label: string;
  checked: boolean;
  onChange: (checked: boolean) => void;
}

export function AuthCheckbox({ label, checked, onChange }: AuthCheckboxProps) {
  return (
    <label className="flex items-center gap-2 cursor-pointer select-none" onClick={() => onChange(!checked)}>
      <div
        className={`flex h-5 w-5 shrink-0 items-center justify-center rounded border-[1.5px] transition-all ${
          checked ? "border-[var(--primary)] bg-[var(--primary)]" : "border-[var(--border-default)] bg-transparent"
        }`}
      >
        {checked && (
          <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="3.5">
            <polyline points="20 6 9 17 4 12" />
          </svg>
        )}
      </div>
      <span className="text-sm text-[var(--text-secondary)]">
        {label}
      </span>
    </label>
  );
}
