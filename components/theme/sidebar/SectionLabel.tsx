import { cn } from "@/lib/cn";
import { useSidebar } from "./SidebarContext";

interface SectionLabelProps {
  label: string;
  isFirst?: boolean;
}

export function SectionLabel({ label, isFirst = false }: SectionLabelProps) {
  const { collapsed } = useSidebar();

  if (collapsed) {
    if (isFirst) return null;
    return <div className="pt-2 pb-1 mx-3 border-t border-border-subtle" />;
  }

  return (
    <p
      className={cn(
        "px-3 pb-1 mb-0 font-kicker text-fg-subtle font-medium",
        isFirst ? "pt-1" : "pt-4",
      )}
    >
      {label}
    </p>
  );
}
