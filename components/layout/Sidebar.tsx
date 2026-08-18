"use client";
import { useState, useEffect, useCallback } from "react";
import dynamic from "next/dynamic";
import { usePathname } from "next/navigation";
import { PanelLeftClose, PanelLeftOpen } from "@/components/icons";
import { NavSection, todayNav, practiceNav, exploreNav, progressNav } from "../theme/sidebar/index";

import { SidebarContext } from "../theme/sidebar/SidebarContext";
import { isNavActive } from "@/lib/navigation/is-nav-active";
import { SearchTrigger } from "@/components/search/SearchTrigger";
import { useSearchShortcut } from "@/lib/search/useSearchShortcut";

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
      localStorage.setItem("sidebar-collapsed", String(!prev));
      return !prev;
    });
  };

  const isActive = (href: string) => isNavActive(pathname, href);

  return (
    <SidebarContext.Provider value={{ collapsed }}>
      <aside
        className={`flex h-full min-h-0 flex-col overflow-hidden bg-surface-raised border-r border-border-subtle transition-all duration-200 ${collapsed ? "w-[60px]" : "w-64"} ${className}`}
      >
        {/* Brand + toggle — pinned */}
        <div className={`flex shrink-0 items-center ${collapsed ? "justify-center px-2" : "justify-between px-5"} py-5`}>
          {!collapsed && (
            <div className="flex items-center gap-2.5">
              <div className="w-7 h-7 rounded-lg flex items-center justify-center flex-shrink-0 bg-primary">
                <span className="font-bold text-caption text-on-primary">EJ</span>
              </div>
              <span className="font-heading font-semibold text-body-sm text-fg">
                English Journal
              </span>
            </div>
          )}
          <button
            onClick={toggle}
            className="p-1.5 rounded-lg transition-colors hover:bg-[var(--btn-plain-bg-hover)] text-fg-subtle hover:text-fg flex-shrink-0"
            title={collapsed ? "Expandir barra" : "Contraer barra"}
          >
            {collapsed ? <PanelLeftOpen className="w-4 h-4" /> : <PanelLeftClose className="w-4 h-4" />}
          </button>
        </div>

        {!collapsed ? <div className="shrink-0 px-3 pb-3"><SearchTrigger onOpen={openSearch} /></div> : null}

        {/* Navigation scrolls; footer stays visible */}
        <nav className={`sidebar-scrollbar min-h-0 flex-1 overflow-y-auto ${collapsed ? "px-1.5" : "px-3"} pb-4 space-y-0.5`}>
          <NavSection section={todayNav} isActive={isActive} isFirst />
          <NavSection section={practiceNav} isActive={isActive} />
          <NavSection section={exploreNav} isActive={isActive} />
          <NavSection section={progressNav} isActive={isActive} />
        </nav>

        <SidebarFooter />
        <SearchModal open={isSearchOpen} onClose={closeSearch} />
      </aside>
    </SidebarContext.Provider>
  );
}
