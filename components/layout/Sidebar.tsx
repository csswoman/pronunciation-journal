"use client";
import { useState, useEffect, useCallback } from "react";
import dynamic from "next/dynamic";
import { usePathname } from "next/navigation";
import { PanelLeftClose, PanelLeftOpen } from "@/components/icons";
import { Logo } from "@/components/illustrations/Logo";
import {
  NavSection,
  todayNav,
  learnNav,
  consultNav,
  footerNav,
} from "../theme/sidebar/index";

import { SidebarContext } from "../theme/sidebar/SidebarContext";
import { isNavActive } from "@/lib/navigation/is-nav-active";
import { SearchTrigger } from "@/components/search/SearchTrigger";
import { useSearchShortcut } from "@/lib/search/useSearchShortcut";
import { playUiCue } from "@/lib/ui-sounds/cues";
import { useSidebarStore } from "@/lib/stores/sidebarStore";
import { cn } from "@/lib/cn";

const SidebarFooter = dynamic(() => import("./SidebarFooter"), {
  loading: () => <div className="h-14 shrink-0 border-t border-border-subtle" aria-hidden />,
});

const SearchModal = dynamic(
  () => import("@/components/search/SearchModal").then((module) => module.SearchModal),
  { ssr: false },
);

interface SidebarProps {
  className?: string;
}

export default function Sidebar({ className = "" }: SidebarProps) {
  const pathname = usePathname();
  const { isCollapsed, setCollapsed, toggleCollapsed } = useSidebarStore();
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const openSearch = useCallback(() => setIsSearchOpen(true), []);
  const toggleSearch = useCallback(() => setIsSearchOpen((current) => !current), []);
  const closeSearch = useCallback(() => setIsSearchOpen(false), []);
  useSearchShortcut(toggleSearch);

  useEffect(() => {
    const saved = localStorage.getItem("sidebar-collapsed");
    if (saved === "true") setCollapsed(true);
  }, [setCollapsed]);

  const toggle = () => {
    const next = !isCollapsed;
    playUiCue(next ? "nav-close" : "nav-open");
    toggleCollapsed();
  };

  const isActive = (href: string) => isNavActive(pathname, href);

  return (
    <SidebarContext.Provider value={{ collapsed: isCollapsed }}>
      <aside
        className={cn(
          "flex h-full min-h-0 flex-col overflow-hidden bg-surface-raised border-r border-border-subtle transition-[width] duration-300 cubic-bezier(0.22,1,0.36,1) motion-reduce:transition-none",
          isCollapsed ? "w-[60px]" : "w-[268px]",
          className
        )}
      >
        {/* Brand + toggle — pinned */}
        <div
          className={`flex shrink-0 items-center ${
            isCollapsed ? "flex-col gap-2 px-2 py-4" : "justify-between px-4 py-4"
          }`}
        >
          {isCollapsed && <Logo className="size-6 text-primary" />}
          {!isCollapsed && (
            <div className="flex items-center gap-2.5">
              <Logo className="size-7 text-primary" />
              <span className="font-heading font-semibold text-body-sm text-fg">
                English Journal
              </span>
            </div>
          )}
          <button
            type="button"
            onClick={toggle}
            className="press-feedback p-1.5 rounded-lg transition-colors hover:bg-surface-sunken text-fg-subtle hover:text-fg shrink-0"
            title={isCollapsed ? "Expandir barra" : "Contraer barra"}
          >
            {isCollapsed ? <PanelLeftOpen className="size-4" /> : <PanelLeftClose className="size-4" />}
          </button>
        </div>

        {!isCollapsed && (
          <div className="shrink-0 px-3 pb-2.5">
            <SearchTrigger onOpen={openSearch} />
          </div>
        )}

        {/* Navigation scrolls; footer stays visible */}
        <nav
          className={`sidebar-scrollbar min-h-0 flex-1 overflow-y-auto ${
            isCollapsed ? "px-1.5" : "px-3"
          } pb-2 space-y-px`}
        >
          <NavSection section={todayNav} isActive={isActive} isFirst />
          <NavSection section={learnNav} isActive={isActive} />
          <NavSection section={consultNav} isActive={isActive} />
          <NavSection section={footerNav} isActive={isActive} />
        </nav>

        <SidebarFooter />
        {isSearchOpen && <SearchModal open={isSearchOpen} onClose={closeSearch} />}
      </aside>
    </SidebarContext.Provider>
  );
}
