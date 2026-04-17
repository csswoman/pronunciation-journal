import { ReactNode } from "react";

interface PageLayoutProps {
  hero: ReactNode;
  children: ReactNode;
  className?: string;
}

export default function PageLayout({ hero, children, className = "" }: PageLayoutProps) {
  return (
    <div className="space-y-0">
      {hero}
      <div className={`px-6 lg:px-10 py-8 pb-12 ${className}`}>
        {children}
      </div>
    </div>
  );
}
