"use client";
import { useState, useEffect } from "react";
import { usePathname } from "next/navigation";
import { PanelLeftClose, PanelLeftOpen } from "@/components/icons";
import SidebarFooter from "./SidebarFooter";
import { NavSection, NavLink, coreNav, practiceNav, exploreNav } from "../theme/sidebar/index";

import { SidebarContext } from "../theme/sidebar/SidebarContext";
import { isNavActive } from "@/lib/navigation/is-nav-active";

interface SidebarProps {
  className?: string;
}

export default function Sidebar({ className = "" }: SidebarProps) {
  const pathname = usePathname();
  const [collapsed, setCollapsed] = useState(false);

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

        {/* Navigation scrolls; footer stays visible */}
        <nav className={`sidebar-scrollbar min-h-0 flex-1 overflow-y-auto ${collapsed ? "px-1.5" : "px-3"} pb-4 space-y-0.5`}>
          <div className="space-y-0.5">
            {coreNav.items.map((item) => (
              <NavLink key={item.href} item={item} active={isActive(item.href)} />
            ))}
          </div>

          <NavSection section={practiceNav} isActive={isActive} />
          <NavSection section={exploreNav} isActive={isActive} />
        </nav>

        <SidebarFooter />
      </aside>
    </SidebarContext.Provider>
  );
}
