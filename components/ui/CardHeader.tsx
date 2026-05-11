import type { ReactNode } from "react";

interface CardHeaderProps {
  icon: ReactNode;
  title: string;
  right?: ReactNode;
}

export default function CardHeader({ icon, title, right }: CardHeaderProps) {
  return (
    <div className="flex items-center justify-between">
      <div className="flex items-center gap-2">
        {icon}
        <span className="text-xl font-semibold tracking-tight text-[var(--text-primary)]">{title}</span>
      </div>
      {right}
    </div>
  );
}
