"use client";

import dynamic from "next/dynamic";
import { useCallback, useEffect, useState } from "react";
import { usePathname } from "next/navigation";
import { quickAddWord } from "@/lib/word-bank/queries";
import { useAuth } from "@/components/auth/AuthProvider";
import { useAICoachStore } from "@/lib/stores/aiCoachStore";
import {
  selectHideMobileNav,
  useSessionChromeStore,
} from "@/lib/stores/sessionChromeStore";
import { isPublicAuthPath } from "@/lib/auth/public-paths";
import { cn } from "@/lib/cn";

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

const importAICoachPanel = () => import("@/components/ai-coach/AICoachPanel");

const AICoachPanel = dynamic(importAICoachPanel, {
  // Panel-shaped placeholder so a slow first load never flashes the route-level
  // loading screen; it matches the sliding panel chrome instead.
  loading: () => (
    <div
      className="fixed z-50 flex flex-col bg-surface-raised shadow-lg max-md:inset-0 md:top-0 md:right-0 md:bottom-0 md:w-[380px] md:border-l md:border-border-subtle"
      aria-hidden
    />
  ),
});

export default function AppShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const isAuthPage = isPublicAuthPath(pathname);
  // Immersion narrows content max-width; active sessions also hide mobile BottomNav.
  const isImmersivePractice =
    pathname.startsWith("/practice/sounds/sound/") ||
    pathname === "/daily" ||
    pathname === "/practice/review" ||
    pathname === "/assessment" ||
    pathname === "/assessment/pronunciation";
  const hideMobileNav = useSessionChromeStore(selectHideMobileNav);
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

  // Warm the AI Coach chunk during idle time so the first open feels instant
  // (otherwise the panel lazy-loads on tap, causing a visible loading delay).
  useEffect(() => {
    if (!user || hasMountedCoach) return;
    const w = window as Window & {
      requestIdleCallback?: (cb: () => void) => number;
      cancelIdleCallback?: (id: number) => void;
    };
    if (w.requestIdleCallback) {
      const id = w.requestIdleCallback(() => void importAICoachPanel());
      return () => w.cancelIdleCallback?.(id);
    }
    const timer = setTimeout(() => void importAICoachPanel(), 1500);
    return () => clearTimeout(timer);
  }, [user, hasMountedCoach]);

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
        className={cn( "main-scrollbar flex min-h-0 flex-1 flex-col overflow-y-auto overflow-x-hidden lg:pb-0", hideMobileNav ? "pb-0" : "pb-20", )}
        style={{ marginRight: mainMarginRight }}
      >
        <div
          className={
            isImmersivePractice
              ? "mx-auto flex min-h-0 w-full max-w-3xl flex-1 flex-col"
              : "mx-auto w-full max-w-3xl"
          }
        >
          {children}
        </div>
      </main>
      {!hideMobileNav && <BottomNav className="lg:hidden" />}
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
