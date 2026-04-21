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
}

export default function Select({
  label,
  value,
  onChange,
  options,
  required,
}: SelectProps) {
  return (
    <div className="flex flex-col gap-1">
      <label className="text-xs font-medium" style={{ color: "var(--text-secondary)" }}>
        {label}
        {required && <span className="text-red-400 ml-0.5">*</span>}
      </label>
      <select
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="px-3 py-2 rounded-lg text-sm border focus:outline-none focus:ring-2"
        style={{ backgroundColor: "var(--surface)", borderColor: "var(--border)", color: "var(--text-primary)" }}
      >
        {options.map((o) => (
          <option key={o.value} value={o.value}>
            {o.label}
          </option>
        ))}
      </select>
    </div>
  );
}
