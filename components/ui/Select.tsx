import { AlertCircle } from "lucide-react";

interface SelectOption {
  value: string;
  label: string;
}

interface SelectProps {
  label: string;
  value: string;
  onChange: (value: string) => void;
  options: SelectOption[];
  required?: boolean;
  error?: string;
}

export default function Select({
  label,
  value,
  onChange,
  options,
  required,
  error,
}: SelectProps) {
  const selectId = label.toLowerCase().replace(/\s+/g, "-");
  const borderClass = error
    ? "border-error focus:border-error focus:ring-error"
    : "border-border-default focus:ring-primary";

  return (
    <div className="flex flex-col gap-1">
      <label htmlFor={selectId} className="text-xs font-medium text-fg-muted">
        {label}
        {required && <span className="text-error ml-0.5">*</span>}
      </label>
      <div className="relative">
        <select
          id={selectId}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          aria-invalid={!!error}
          aria-describedby={error ? `${selectId}-error` : undefined}
          className={`w-full px-3 py-2 rounded-lg text-sm border bg-surface-sunken text-fg focus:outline-none focus:ring-2 transition-all ${borderClass} ${error ? "pr-10" : ""}`}
        >
          {options.map((o) => (
            <option key={o.value} value={o.value}>
              {o.label}
            </option>
          ))}
        </select>
        {error && (
          <AlertCircle className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-error shrink-0 pointer-events-none" />
        )}
      </div>
      {error && (
        <p id={`${selectId}-error`} className="mt-1 text-sm text-error flex items-center gap-1">
          <AlertCircle className="w-3 h-3 shrink-0" />
          {error}
        </p>
      )}
    </div>
  );
}

