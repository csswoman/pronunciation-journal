import Button from "@/components/ui/Button";
import { ReactNode } from "react";

interface QuickActionCardProps {
  icon: ReactNode;
  name: string;
  description: string;
  onClick: () => void;
}

export default function QuickActionCard({
  icon,
  name,
  description,
  onClick,
}: QuickActionCardProps) {
  return (
    <Button
      onClick={onClick}
      className="group relative bg-[var(--card-bg)]
        border border-[var(--line-divider)] rounded-xl p-5
        cursor-pointer transition-all duration-200 text-left w-full
        hover:bg-[var(--btn-card-bg-hover)]
        hover:border-[var(--line-color)] hover:-translate-y-0.5"
      style={{ boxShadow: "0 1px 3px var(--line-divider), 0 4px 12px var(--line-divider)" }}
    >
      {/* Arrow badge */}
      <span
        className="absolute top-4 right-4 w-6 h-6 rounded-lg
          bg-[var(--page-bg)] text-[var(--text-tertiary)] text-xs
          flex items-center justify-center
          group-hover:bg-[var(--primary)] group-hover:text-white transition-all"
        aria-hidden="true"
      >
        →
      </span>

      {/* Icon */}
      <div className="w-10 h-10 rounded-xl bg-[var(--btn-regular-bg)] text-[var(--primary)] flex items-center justify-center mb-2.5">
        {icon}
      </div>

      {/* Text */}
      <p className="font-heading text-sm font-bold text-[var(--deep-text)] mb-1">{name}</p>
      <p className="text-xs text-[var(--text-tertiary)] leading-relaxed">{description}</p>
    </Button>
  );
}

interface QuickActionGridProps {
  children: ReactNode;
}

export function QuickActionGrid({ children }: QuickActionGridProps) {
  return (
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">{children}</div>
  );
}

