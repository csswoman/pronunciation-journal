"use client";

import dynamic from "next/dynamic";
import { useCallback, useEffect, useState } from "react";
import { usePathname } from "next/navigation";
import { quickAddWord } from "@/lib/word-bank/queries";
import { useAuth } from "@/components/auth/AuthProvider";
import { useAICoachStore } from "@/lib/stores/aiCoachStore";
import { isPublicAuthPath } from "@/lib/auth/public-paths";

const Sidebar = dynamic(() => import("./Sidebar"), {
  loading: () => <div className="hidden lg:block w-64 flex-shrink-0" aria-hidden />,
});

const BottomNav = dynamic(() => import("./BottomNav"), {
  loading: () => <div className="lg:hidden" aria-hidden />,
});

const AICoachTrigger = dynamic(() => import("@/components/ai-coach/AICoachTrigger"));

const QuickAddModal = dynamic(() =>
  import("@/components/vocabulary/words/QuickAddModal").then((mod) => ({
    default: mod.QuickAddModal,
  })),
);

const AICoachPanel = dynamic(() => import("@/components/ai-coach/AICoachPanel"));

export default function AppShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const isAuthPage = isPublicAuthPath(pathname);
  // Page layout pattern: chrome (sidebar + bottom nav) always stays visible;
  // immersion only narrows the content max-width — never hides AppShell.
  const isImmersivePractice =
    pathname.startsWith("/practice/sounds/sound/") ||
    pathname === "/daily" ||
    pathname === "/practice/review";
  const { user } = useAuth();
  const [open, setOpen] = useState(false);
  const openModal = useCallback(() => setOpen(true), []);
  const closeModal = useCallback(() => setOpen(false), []);
  const { isOpen: isPanelOpen, launch, isFullscreen, panelWidth } = useAICoachStore();
  const [hasMountedCoach, setHasMountedCoach] = useState(false);

  useEffect(() => {
    if (isPanelOpen || launch) {
      setHasMountedCoach(true);
    }
  }, [isPanelOpen, launch]);

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

  // Compress main content on desktop only when panel is open; mobile panel is full-screen overlay
  const mainMarginRight =
    isPanelOpen && !isFullscreen ? `${panelWidth}px` : "0px";

  return (
    <div className="flex h-screen bg-[var(--page-bg)] overflow-hidden">
      <a href="#main-content" className="sr-only focus:not-sr-only focus:fixed focus:top-2 focus:left-2 focus:z-50 focus:px-4 focus:py-2 focus:bg-primary focus:text-white focus:rounded-md">
        Skip to main content
      </a>
      <Sidebar className="hidden lg:flex w-64 flex-col" />
      <main
        id="main-content"
        className="main-scrollbar flex flex-1 flex-col overflow-y-auto overflow-x-hidden pb-20 lg:pb-0"
        style={{ marginRight: mainMarginRight }}
      >
        <div className={isImmersivePractice ? "mx-auto flex w-full max-w-screen-md flex-1 flex-col" : "w-full max-w-screen-xl mx-auto"}>
          {children}
        </div>
      </main>
      <BottomNav className="lg:hidden" />
      {user && open && (
        <QuickAddModal
          open={open}
          onClose={closeModal}
          onSubmit={handleSubmit}
        />
      )}
      {user && (
        <>
          {hasMountedCoach && <AICoachPanel />}
          <AICoachTrigger className="hidden lg:flex" />
        </>
      )}
    </div>
  );
}
