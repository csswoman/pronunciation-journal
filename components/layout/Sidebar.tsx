"use client";
import { useState, useEffect, useCallback } from "react";
import dynamic from "next/dynamic";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { PanelLeftClose, PanelLeftOpen, Flame, ArrowRight } from "@/components/icons";
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
            collapsed ? "justify-center px-2 py-4" : "justify-between px-4 py-4"
          }`}
        >
          {!collapsed && (
            <div className="flex items-center gap-2.5">
              <div className="size-7 rounded-lg flex items-center justify-center shrink-0 bg-primary">
                <span className="font-bold text-caption text-on-primary">EJ</span>
              </div>
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

        {/* Action of the Day widget */}
        {!collapsed && (
          <div className="shrink-0 px-3 pb-3">
            <div className="group relative flex flex-col gap-2 rounded-lg border border-border-subtle bg-surface-sunken/60 p-2.5 transition-colors hover:border-border-default hover:bg-surface-sunken">
              <div className="flex items-center justify-between">
                <span className="flex items-center gap-1.5 font-caption font-medium text-fg-subtle">
                  <Flame size={14} className="text-racha" aria-hidden />
                  Meta del día
                </span>
                <span className="font-caption text-tiny font-semibold text-primary bg-primary-soft px-1.5 py-0.5 rounded-full">
                  En racha
                </span>
              </div>
              <Link
                href="/daily"
                onClick={() => playUiCue("tap")}
                className="focus-ring press-feedback flex items-center justify-between rounded-md bg-primary px-3 py-1.5 text-caption font-semibold text-on-primary transition-all hover:brightness-105 active:scale-[0.98]"
              >
                <span>Continuar práctica</span>
                <ArrowRight size={14} aria-hidden />
              </Link>
            </div>
          </div>
        )}

        {/* Navigation scrolls; footer stays visible */}
        <nav
          className={`sidebar-scrollbar min-h-0 flex-1 overflow-y-auto ${
            collapsed ? "px-1.5" : "px-3"
          } pb-4 space-y-0.5`}
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
