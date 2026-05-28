"use client";

import { useId } from "react";

interface InputProps {
  label: string;
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  type?: string;
  required?: boolean;
  error?: string;
}

export default function Input({
  label,
  value,
  onChange,
  placeholder,
  type = "text",
  required,
  error,
}: InputProps) {
  const id = useId();
  const errorId = error ? `${id}-error` : undefined;

  return (
    <div className="flex flex-col gap-1">
      <label htmlFor={id} className="text-xs font-medium text-fg-muted">
        {label}
        {required && <span className="text-error ml-0.5">*</span>}
      </label>
      <input
        id={id}
        type={type}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        aria-describedby={errorId}
        aria-invalid={error ? true : undefined}
        className="px-3 py-2 rounded-lg text-sm border border-border-default bg-surface-sunken text-fg focus:outline-none focus:ring-2"
      />
      {error && (
        <span id={errorId} className="text-xs text-error">
          {error}
        </span>
      )}
    </div>
  );
}
