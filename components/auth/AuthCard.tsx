"use client";

import { ReactNode } from "react";

interface AuthCardProps {
  children: ReactNode;
}

export function AuthCard({ children }: AuthCardProps) {
  return (
    <div className="w-full max-w-[420px] mx-auto relative z-10">
      {children}
    </div>
  );
}
