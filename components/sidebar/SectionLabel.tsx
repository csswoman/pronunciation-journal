import { useSidebar } from "./SidebarContext";

interface SectionLabelProps {
  label: string;
}

export function SectionLabel({ label }: SectionLabelProps) {
  const { collapsed } = useSidebar();

  if (collapsed) {
    return <div className="pt-3 pb-1 mx-3 border-t" style={{ borderColor: "var(--line-divider)" }} />;
  }

  return (
    <p className="px-3 pt-4 pb-1 text-tiny font-semibold uppercase tracking-widest mb-0"
       style={{ color: "var(--text-tertiary)", fontSize: "10px", lineHeight: 1.2, letterSpacing: "0.1em" }}>
      {label}
    </p>
  );
}
