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
    <p className="px-3 pt-4 pb-1 mb-0 font-kicker text-fg-muted">
      {label}
    </p>
  );
}
