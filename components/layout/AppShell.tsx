"use client";

import dynamic from "next/dynamic";
import { useEffect, useState } from "react";
import { usePathname } from "next/navigation";
import { useAuth } from "@/components/auth/AuthProvider";
import { useAICoachStore } from "@/lib/stores/aiCoachStore";
import {
  selectHideMobileNav,
  useSessionChromeStore,
} from "@/lib/stores/sessionChromeStore";
import { isPublicAuthPath } from "@/lib/auth/public-paths";
import { cn } from "@/lib/cn";
import { useSidebarStore } from "@/lib/stores/sidebarStore";

const Sidebar = dynamic(() => import("./Sidebar"), {
  loading: () => <div className="hidden lg:block w-[268px] shrink-0" aria-hidden />,
});

const BottomNav = dynamic(() => import("./BottomNav"), {
  loading: () => <div className="lg:hidden" aria-hidden />,
});

const AICoachTrigger = dynamic(() => import("@/components/ai-coach/AICoachTrigger"));

const ChromeMicTip = dynamic(() => import("@/components/speech/ChromeMicTip"), {
  ssr: false,
});

const AICoachPanel = dynamic(() => import("@/components/ai-coach/AICoachPanel"), {
  // Panel-shaped placeholder so a slow first load never flashes the route-level
  // loading screen; it matches the sliding panel chrome instead.
  loading: () => (
    <div
      className="fixed z-50 flex flex-col bg-surface-raised shadow-lg max-md:inset-0 md:top-0 md:right-0 md:bottom-0 md:w-95 md:border-l md:border-border-subtle"
      aria-hidden
    />
  ),
});

export default function AppShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const isAuthPage = isPublicAuthPath(pathname);
  // Session column for in-flow practice (hubs use PageLayout archetypes instead).
  // Active sessions also hide mobile BottomNav via sessionChromeStore.
  const isImmersivePractice =
    pathname.startsWith("/practice/sounds/sound/") ||
    pathname === "/daily" ||
    pathname === "/assessment" ||
    pathname === "/assessment/pronunciation";
  const hideMobileNav = useSessionChromeStore(selectHideMobileNav);
  const { user } = useAuth();
  const { isOpen: isPanelOpen, launch, isFullscreen, panelWidth } = useAICoachStore();
  const [hasMountedCoach, setHasMountedCoach] = useState(false);

  useEffect(() => {
    if (isPanelOpen || launch) {
      setHasMountedCoach(true);
    }
    if (isPanelOpen) {
      useSidebarStore.getState().collapse();
    }
  }, [isPanelOpen, launch]);

  if (isAuthPage) return <>{children}</>;

  // Compress main content on desktop only when panel is open; mobile panel is full-screen overlay
  const mainMarginRight =
    isPanelOpen && !isFullscreen ? `${panelWidth}px` : "0px";

  return (
    <div className="flex h-screen bg-page-bg overflow-hidden">
      <a href="#main-content" className="sr-only focus:not-sr-only focus:fixed focus:top-2 focus:left-2 focus:z-50 focus:px-4 focus:py-2 focus:bg-primary focus:text-white focus:rounded-md">
        Skip to main content
      </a>
      <Sidebar className="hidden lg:flex h-screen shrink-0 flex-col" />
      <main
        id="main-content"
        className={cn( "main-scrollbar flex min-h-0 flex-1 flex-col overflow-y-auto overflow-x-hidden lg:pb-0", hideMobileNav ? "pb-0" : "pb-20", )}
        style={{ marginRight: mainMarginRight }}
      >
        <div
          className={
            isImmersivePractice
              ? "page-shell--session mx-auto flex min-h-0 w-full flex-1 flex-col"
              : "w-full"
          }
        >
          {/* Soft tip only outside active sessions — session chrome stays sacred. */}
          {!isImmersivePractice && !hideMobileNav ? (
            <ChromeMicTip variant="app" />
          ) : null}
          {children}
        </div>
      </main>
      {!hideMobileNav && <BottomNav className="lg:hidden" />}
      {user && (
        <>
          {hasMountedCoach && <AICoachPanel />}
          {!hideMobileNav && (
            <AICoachTrigger variant="labeled" className="hidden lg:flex" />
          )}
        </>
      )}
    </div>
  );
}
