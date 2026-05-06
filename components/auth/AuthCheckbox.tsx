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
        className="w-[18px] h-[18px] rounded-[4px] flex items-center justify-center shrink-0 transition-all"
        style={{
          background: checked ? "var(--primary)" : "transparent",
          border: `1.5px solid ${checked ? "var(--primary)" : "var(--border-default)"}`,
        }}
      >
        {checked && (
          <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="3.5">
            <polyline points="20 6 9 17 4 12" />
          </svg>
        )}
      </div>
      <span style={{ font: "var(--font-body-sm)", color: "var(--text-secondary)" }}>
        {label}
      </span>
    </label>
  );
}
