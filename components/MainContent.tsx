"use client";

import { ReactNode } from "react";

interface MainContentProps {
  children: ReactNode;
}

export default function MainContent({ children }: MainContentProps) {
  return (
    <main className="flex-1 flex flex-col items-center py-12 px-4 sm:px-6 lg:px-8 bg-[#F4F5F9] dark:bg-gray-900">
      <div className="w-full max-w-4xl">{children}</div>
    </main>
  );
}

