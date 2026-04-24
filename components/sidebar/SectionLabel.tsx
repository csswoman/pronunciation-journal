interface SectionLabelProps {
  label: string;
}

export function SectionLabel({ label }: SectionLabelProps) {
  return (
    <p className="px-3 pt-4 pb-1 text-[10px] font-semibold uppercase tracking-widest mb-0"
       style={{ color: "var(--text-tertiary)", fontSize: "10px", lineHeight: 1.2, letterSpacing: "0.1em" }}>
      {label}
    </p>
  );
}
