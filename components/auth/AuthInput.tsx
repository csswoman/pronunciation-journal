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

  const inputId = label.toLowerCase().replace(/\s+/g, "-");
  const inputClass =
    "w-full bg-surface-sunken border border-border-subtle rounded-lg text-fg px-4 py-3 outline-none transition-all placeholder:text-fg-subtle focus:border-primary focus:bg-surface-raised focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2";

  const isPasswordField = type === "password";
  const inputType = isPasswordField ? (showPassword ? "text" : "password") : type;

  return (
    <div>
      <label htmlFor={inputId} className="block mb-2 text-tiny font-semibold tracking-widest uppercase text-fg-muted">
        {label}
      </label>
      <div className="relative">
        <input
          id={inputId}
          type={inputType}
          autoComplete={autoComplete}
          required={required}
          minLength={minLength}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder={placeholder}
          className={isPasswordField ? `${inputClass} pr-10` : inputClass}
        />
        {isPasswordField && (
          <button
            type="button"
            onClick={() => setShowPassword((v) => !v)}
            className="absolute right-4 top-1/2 -translate-y-1/2 p-1 rounded-md transition-all text-fg-subtle hover:text-fg-muted"
            aria-label={showPassword ? "Hide password" : "Show password"}
          >
            {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
          </button>
        )}
      </div>
    </div>
  );
}
