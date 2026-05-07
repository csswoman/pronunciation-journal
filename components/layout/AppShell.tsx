"use client";

import { useCallback, useEffect, useState } from "react";
import { usePathname } from "next/navigation";
import Sidebar from "./Sidebar";
import BottomNav from "./BottomNav";
import { QuickAddModal } from "@/app/words/components/QuickAddModal";
import { quickAddWord } from "@/lib/word-bank/queries";
import { useAuth } from "@/components/auth/AuthProvider";

export default function AppShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const isAuthPage = pathname.startsWith("/login");
  const { user } = useAuth();
  const [open, setOpen] = useState(false);
  const openModal = useCallback(() => setOpen(true), []);
  const closeModal = useCallback(() => setOpen(false), []);

  useEffect(() => {
    if (!user) return;
    const onKey = (e: KeyboardEvent) => {
      if (open) return;
      const tag = (e.target as HTMLElement)?.tagName;
      if (tag === "INPUT" || tag === "TEXTAREA" || (e.target as HTMLElement)?.isContentEditable) return;
      if (e.key === "n" || e.key === "N") {
        e.preventDefault();
        openModal();
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, openModal, user]);

  const handleSubmit = async (input: { text: string; context?: string | null }) => {
    await quickAddWord(input);
  };

  if (isAuthPage) return <>{children}</>;

  return (
    <div className="flex h-screen bg-[var(--page-bg)] overflow-hidden">
      <Sidebar className="hidden lg:flex w-64 flex-col" />
      <main className="main-scrollbar flex-1 overflow-y-auto pb-20 lg:pb-0">
        <div className="max-w-screen-xl mx-auto px-6 lg:px-10 py-8 lg:py-9 bg-[var(--card-bg)] rounded-2xl my-10 !p-0">
          {children}
        </div>
      </main>
      <BottomNav className="lg:hidden" />
      {user && (
        <QuickAddModal
          open={open}
          onClose={closeModal}
          onSubmit={handleSubmit}
        />
      )}
    </div>
  );
}
