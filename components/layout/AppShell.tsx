"use client";

import { useCallback, useEffect, useState } from "react";
import { usePathname } from "next/navigation";
import Sidebar from "./Sidebar";
import BottomNav from "./BottomNav";
import { QuickAddModal } from "@/components/vocabulary/words/QuickAddModal";
import { quickAddWord } from "@/lib/word-bank/queries";
import { useAuth } from "@/components/auth/AuthProvider";
import { useAICoachStore } from "@/lib/stores/aiCoachStore";
import AICoachPanel from "@/components/ai-coach/AICoachPanel";
import AICoachTrigger from "@/components/ai-coach/AICoachTrigger";

export default function AppShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const isAuthPage = pathname.startsWith("/login");
  const { user } = useAuth();
  const [open, setOpen] = useState(false);
  const openModal = useCallback(() => setOpen(true), []);
  const closeModal = useCallback(() => setOpen(false), []);
  const { isOpen: isPanelOpen, isFullscreen, panelWidth } = useAICoachStore();

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

  // When panel is open and not fullscreen, compress main content on desktop
  const mainMarginRight =
    isPanelOpen && !isFullscreen ? `${panelWidth}px` : "0px";

  return (
    <div className="flex h-screen bg-[var(--page-bg)] overflow-hidden">
      <Sidebar className="hidden lg:flex w-64 flex-col" />
      <main
        className="main-scrollbar flex-1 overflow-y-auto pb-20 lg:pb-0"
        style={{
          marginRight: mainMarginRight,
          transition: "margin-right 0.25s ease",
        }}
      >
        <div className="max-w-screen-xl mx-auto">
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
      {user && (
        <>
          <AICoachPanel />
          <AICoachTrigger />
        </>
      )}
    </div>
  );
}
