"use client";

import { Eye, EyeOff } from "lucide-react";
import { useState } from "react";

type InputType = "email" | "password" | "text";

interface AuthInputProps {
  type: InputType;
  label: string;
  placeholder: string;
  value: string;
  onChange: (value: string) => void;
  required?: boolean;
  autoComplete?: string;
  minLength?: number;
}

export function AuthInput({
  type,
  label,
  placeholder,
  value,
  onChange,
  required = false,
  autoComplete,
  minLength,
}: AuthInputProps) {
  const [showPassword, setShowPassword] = useState(false);

  const inputClass =
    "w-full bg-[var(--surface-sunken)] border border-[var(--border-default)] rounded-[var(--radius-md)] text-[var(--text-primary)] px-[var(--space-4)] py-[var(--space-3)] outline-none transition-all placeholder:text-[var(--text-tertiary)]";

  const isPasswordField = type === "password";
  const inputType = isPasswordField ? (showPassword ? "text" : "password") : type;

  return (
    <div>
      <label className="block mb-[var(--space-2)]" style={{ font: "var(--font-tiny)", letterSpacing: "0.05em", fontWeight: 600, color: "var(--text-secondary)", textTransform: "uppercase" }}>
        {label}
      </label>
      <div className="relative">
        <input
          type={inputType}
          autoComplete={autoComplete}
          required={required}
          minLength={minLength}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder={placeholder}
          className={`${isPasswordField ? `${inputClass} pr-10` : inputClass} auth-input`}
        />
        {isPasswordField && (
          <button
            type="button"
            onClick={() => setShowPassword((v) => !v)}
            className="absolute right-[var(--space-3)] top-1/2 -translate-y-1/2 p-1 rounded-md transition-all text-[var(--text-tertiary)] hover:text-[var(--text-secondary)]"
            aria-label={showPassword ? "Hide password" : "Show password"}
          >
            {showPassword ? <EyeOff className="w-[18px] h-[18px]" /> : <Eye className="w-[18px] h-[18px]" />}
          </button>
        )}
      </div>
      <style>{`
        .auth-input:focus {
          border: 2px solid var(--primary);
          background: var(--surface-raised);
          outline: none;
        }
        .auth-input:focus-visible {
          outline: 2px solid var(--primary);
          outline-offset: 2px;
        }
      `}</style>
    </div>
  );
}
