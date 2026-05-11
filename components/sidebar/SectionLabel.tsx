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
    <p className="px-3 pt-4 pb-1 uppercase mb-0"
       style={{ color: "var(--text-tertiary)", fontSize: "10px", fontWeight: 500, lineHeight: 1.2, letterSpacing: "0.08em", opacity: 0.7 }}>
      {label}
    </p>
  );
}
