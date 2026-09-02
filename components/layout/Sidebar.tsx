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
  const [collapsed, setCollapsed] = useState(false);
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const openSearch = useCallback(() => setIsSearchOpen(true), []);
  const toggleSearch = useCallback(() => setIsSearchOpen((current) => !current), []);
  const closeSearch = useCallback(() => setIsSearchOpen(false), []);
  useSearchShortcut(toggleSearch);

  useEffect(() => {
    const saved = localStorage.getItem("sidebar-collapsed");
    if (saved === "true") setCollapsed(true);
  }, []);

  const toggle = () => {
    setCollapsed((prev) => {
      const next = !prev;
      playUiCue(next ? "nav-close" : "nav-open");
      localStorage.setItem("sidebar-collapsed", String(next));
      return next;
    });
  };

  const isActive = (href: string) => isNavActive(pathname, href);

  return (
    <SidebarContext.Provider value={{ collapsed }}>
      <aside
        className={`flex h-full min-h-0 flex-col overflow-hidden bg-surface-raised border-r border-border-subtle transition-all duration-200 ${
          collapsed ? "w-[60px]" : "w-[268px]"
        } ${className}`}
      >
        {/* Brand + toggle — pinned */}
        <div
          className={`flex shrink-0 items-center ${
            collapsed ? "flex-col gap-2 px-2 py-4" : "justify-between px-4 py-4"
          }`}
        >
          {collapsed && <Logo className="size-6 text-primary" />}
          {!collapsed && (
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
            title={collapsed ? "Expandir barra" : "Contraer barra"}
          >
            {collapsed ? <PanelLeftOpen className="size-4" /> : <PanelLeftClose className="size-4" />}
          </button>
        </div>

        {!collapsed && (
          <div className="shrink-0 px-3 pb-2.5">
            <SearchTrigger onOpen={openSearch} />
          </div>
        )}

        {/* Navigation scrolls; footer stays visible */}
        <nav
          className={`sidebar-scrollbar min-h-0 flex-1 overflow-y-auto ${
            collapsed ? "px-1.5" : "px-3"
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
