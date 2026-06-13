import { useSidebar } from "./SidebarContext";

interface SectionLabelProps {
  label: string;
}

export function SectionLabel({ label }: SectionLabelProps) {
  const { collapsed } = useSidebar();

  if (collapsed) {
    return <div className="pt-3 pb-1 mx-3 border-t border-border-subtle" />;
  }

  return (
    <p className="px-3 pt-4 pb-1 uppercase mb-0 text-[10px] font-medium leading-tight tracking-[0.08em] opacity-70 text-fg-subtle">
      {label}
    </p>
  );
}
