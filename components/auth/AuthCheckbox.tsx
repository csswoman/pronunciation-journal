"use client";

interface AuthCheckboxProps {
  label: string;
  checked: boolean;
  onChange: (checked: boolean) => void;
}

export function AuthCheckbox({ label, checked, onChange }: AuthCheckboxProps) {
  return (
    <label className="flex items-center gap-2 cursor-pointer select-none w-full" onClick={() => onChange(!checked)}>
      <div
        className="w-[17px] h-[17px] rounded-[5px] flex items-center justify-center shrink-0 transition-all"
        style={{
          background: checked ? "var(--color-accent)" : "#181b25",
          border: `1.5px solid ${checked ? "var(--color-accent)" : "#252a3a"}`,
        }}
      >
        {checked && (
          <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="3.5">
            <polyline points="20 6 9 17 4 12" />
          </svg>
        )}
      </div>
      <span className="text-[13.5px]" style={{ color: "#6b7191" }}>
        {label}
      </span>
    </label>
  );
}
