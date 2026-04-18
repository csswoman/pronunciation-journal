import { ReactNode } from "react";

interface PageLayoutProps {
  hero?: ReactNode;
  children: ReactNode;
  className?: string;
  variant?: "default" | "lesson";
}

export default function PageLayout({ hero, children, className = "", variant = "default" }: PageLayoutProps) {
  if (variant === "lesson") {
    return (
      <div className="flex flex-col">
        {hero}
        <div className={`${className}`}>
          {children}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-0">
      {hero}
      <div className={`px-6 lg:px-10 py-8 pb-14 ${className}`}>
        {children}
      </div>
    </div>
  );
}
