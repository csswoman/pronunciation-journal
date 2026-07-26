import { ReactNode } from "react";
import { cn } from "@/lib/cn";

interface PageLayoutProps {
  hero?: ReactNode;
  children: ReactNode;
  className?: string;
  variant?: "default" | "lesson";
  /** @deprecated Ignored for default variant — open canvas is mandatory */
  cardWrapper?: boolean;
}

export default function PageLayout({
  hero,
  children,
  className = "",
  variant = "default",
}: PageLayoutProps) {
  if (variant === "lesson") {
    return (
      <div className="flex flex-col">
        {hero}
        <div className={className}>{children}</div>
      </div>
    );
  }

  return (
    <div className={cn("page-shell", className)}>
      {hero}
      {children}
    </div>
  );
}
