"use client";

import { usePathname } from "next/navigation";
import Sidebar from "./Sidebar";
import BottomNav from "./BottomNav";
import { WordBankFAB } from "@/components/word-bank/WordBankFAB";

export default function AppShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const isAuthPage = pathname.startsWith("/login");

  if (isAuthPage) return <>{children}</>;

  return (
    <div className="flex h-screen bg-[var(--page-bg)] overflow-hidden">
      <Sidebar className="hidden lg:flex w-64 flex-col" />
      <main className="main-scrollbar flex-1 overflow-y-auto pb-20 lg:pb-0">
        <div className="max-w-screen-xl mx-auto px-6 lg:px-10 py-8 lg:py-9 bg-[var(--card-bg)] rounded-[15px] my-10 !p-0">
          {children}
        </div>
      </main>
      <BottomNav className="lg:hidden" />
      <WordBankFAB />
    </div>
  );
}
