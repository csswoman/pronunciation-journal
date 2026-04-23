"use client";

import { Mail, Lock, User, Eye, EyeOff } from "lucide-react";
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

  const icons = {
    email: <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 transition-colors" style={{ color: "#4a5070" }} />,
    password: <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4" style={{ color: "#4a5070" }} />,
    text: <User className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4" style={{ color: "#4a5070" }} />,
  };

  const inputClass =
    "w-full bg-[#181b25] border border-[#252a3a] rounded-[10px] text-[#eef0f7] text-[14.5px] py-3.5 pl-[42px] pr-4 outline-none transition-all placeholder:text-[#4a5070] focus:border-[var(--color-accent)] focus:shadow-[0_0_0_3px_color-mix(in_srgb,var(--color-accent)_15%,transparent)]";

  const isPasswordField = type === "password";
  const inputType = isPasswordField ? (showPassword ? "text" : "password") : type;

  return (
    <div>
      <label className="block text-[11px] font-medium uppercase tracking-[0.6px] mb-1.5" style={{ color: "#6b7191" }}>
        {label}
      </label>
      <div className="relative">
        {icons[type]}
        <input
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
            tabIndex={-1}
            onClick={() => setShowPassword((v) => !v)}
            className="absolute right-3 top-1/2 -translate-y-1/2 p-1 rounded-md transition-colors"
            style={{ color: "#4a5070" }}
          >
            {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
          </button>
        )}
      </div>
    </div>
  );
}
