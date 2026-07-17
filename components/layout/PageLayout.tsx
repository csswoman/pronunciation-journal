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
    <div
      className={cn(
        "w-full px-4 py-6 pb-12 sm:px-6 sm:py-8 sm:pb-16 lg:px-10",
        className,
      )}
    >
      {hero}
      {children}
    </div>
  );
}
