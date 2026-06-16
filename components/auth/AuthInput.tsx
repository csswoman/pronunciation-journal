"use client";

import { Eye, EyeOff, AlertCircle } from "lucide-react";
import { useState, useRef } from "react";

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
  error?: string;
}

// Large bullet character — renders at full font-size unlike browser password glyphs
const BULLET = "●";

export function AuthInput({
  type,
  label,
  placeholder,
  value,
  onChange,
  required = false,
  autoComplete,
  minLength,
  error,
}: AuthInputProps) {
  const [showPassword, setShowPassword] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  const inputId = label.toLowerCase().replace(/\s+/g, "-");
  const isPasswordField = type === "password";
  const masked = isPasswordField && !showPassword;

  const baseClass =
    "w-full bg-surface-sunken rounded-lg text-fg text-base px-4 py-3 outline-none transition-all placeholder:text-fg-subtle focus:bg-surface-raised focus-visible:ring-2 focus-visible:ring-offset-2 pr-10";
  const borderClass = error
    ? "border border-error focus:border-error focus-visible:ring-error"
    : "border border-border-subtle focus:border-primary focus-visible:ring-primary";

  // When masked, show bullets at display size — track-tight keeps them readable
  const maskedClass = masked ? "tracking-[0.2em]" : "";

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!masked) { onChange(e.target.value); return; }

    const raw = e.target.value;
    const prev = value;
    const prevDisplay = BULLET.repeat(prev.length);

    // Detect what changed by comparing display string to new value
    if (raw.length > prevDisplay.length) {
      // Characters added — extract the real chars inserted
      const added = raw.replace(/●/g, "");
      const cursorPos = inputRef.current?.selectionStart ?? raw.length;
      const insertAt = cursorPos - added.length;
      const next = prev.slice(0, insertAt) + added + prev.slice(insertAt);
      onChange(next);
    } else {
      // Characters removed
      const removed = prevDisplay.length - raw.length;
      const cursorPos = inputRef.current?.selectionStart ?? raw.length;
      const next = prev.slice(0, cursorPos) + prev.slice(cursorPos + removed);
      onChange(next);
    }
  };

  return (
    <div>
      <label htmlFor={inputId} className="block mb-1.5 text-sm font-medium text-fg-muted">
        {label}
      </label>
      <div className="relative">
        <input
          ref={inputRef}
          id={inputId}
          type="text"
          inputMode={isPasswordField ? "text" : undefined}
          autoComplete={autoComplete}
          required={required}
          minLength={minLength}
          value={masked ? BULLET.repeat(value.length) : value}
          onChange={handleChange}
          placeholder={placeholder}
          aria-invalid={!!error}
          aria-describedby={error ? `${inputId}-error` : undefined}
          // Prevent clipboard leaking real value when masked
          onCopy={masked ? (e) => e.preventDefault() : undefined}
          onCut={masked  ? (e) => e.preventDefault() : undefined}
          className={[baseClass, borderClass, maskedClass].join(" ")}
        />

        {error && (
          <AlertCircle className="absolute right-4 top-1/2 -translate-y-1/2 w-5 h-5 text-error shrink-0" />
        )}
        {isPasswordField && !error && (
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
      {error && (
        <p id={`${inputId}-error`} className="mt-2 text-sm text-error flex items-center gap-1">
          <AlertCircle className="w-4 h-4 shrink-0" />
          {error}
        </p>
      )}
    </div>
  );
}
