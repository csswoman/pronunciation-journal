import { CSSProperties, ReactNode } from "react";

interface PageLayoutProps {
  hero?: ReactNode;
  children: ReactNode;
  className?: string;
  contentStyle?: CSSProperties;
  variant?: "default" | "lesson";
  cardWrapper?: boolean;
}

export default function PageLayout({
  hero,
  children,
  className = "",
  contentStyle,
  variant = "default",
  cardWrapper,
}: PageLayoutProps) {
  const useCard = cardWrapper ?? !!hero;

  if (variant === "lesson") {
    return (
      <div className="flex flex-col">
        {hero}
        <div className={className}>{children}</div>
      </div>
    );
  }

  if (useCard) {
    return (
      <div className="bg-[var(--card-bg)] rounded-2xl my-10 mx-6 lg:mx-10 overflow-hidden">
        {hero}
        <div className={`px-6 lg:px-10 py-8 pb-14 ${className}`} style={contentStyle}>
          {children}
        </div>
      </div>
    );
  }

  // Home-style layout: no card wrapper, each section has its own card
  return (
    <div className={`px-6 lg:px-10 py-8 pb-16 ${className}`}>
      {children}
    </div>
  );
}
