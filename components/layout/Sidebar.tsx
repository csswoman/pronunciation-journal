"use client";
import { useState, useEffect } from "react";
import { usePathname } from "next/navigation";
import { PanelLeftClose, PanelLeftOpen } from "lucide-react";
import { useUserRole } from "@/hooks/useUserRole";
import SidebarFooter from "./SidebarFooter";
import SidebarWordOfDay from "@/components/sidebar/SidebarWordOfDay";
import { NavSection, NavLink, coreNav, learningNav, trackingNav, adminNav } from "../sidebar/index";
import { SidebarContext } from "../sidebar/SidebarContext";

interface SidebarProps {
  className?: string;
}

export default function Sidebar({ className = "" }: SidebarProps) {
  const pathname = usePathname();
  const { isPremium } = useUserRole();
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

  const isActive = (href: string) =>
    href === "/" ? pathname === "/" : pathname.startsWith(href);

  return (
    <SidebarContext.Provider value={{ collapsed }}>
      <aside
        className={`sidebar-scrollbar flex flex-col h-full min-h-0 overflow-y-auto bg-[var(--card-bg)] border-r border-[var(--line-divider)] transition-all duration-200 ${collapsed ? "w-[60px]" : "w-64"} ${className}`}
      >
        {/* Brand + toggle */}
        <div className={`flex items-center ${collapsed ? "justify-center px-2" : "justify-between px-5"} py-5 flex-shrink-0`}>
          {!collapsed && (
            <div className="flex items-center gap-2.5">
              <div
                className="w-7 h-7 rounded-lg flex items-center justify-center flex-shrink-0"
                style={{ background: "var(--primary)" }}
              >
                <span className="font-bold text-xs" style={{ color: "var(--accent-text)" }}>EJ</span>
              </div>
              <span className="font-heading font-semibold text-sm" style={{ color: "var(--deep-text)" }}>
                English Journal
              </span>
            </div>
          )}
          <button
            onClick={toggle}
            className="p-1.5 rounded-lg transition-colors hover:bg-[var(--btn-plain-bg-hover)] text-[var(--text-tertiary)] hover:text-[var(--text-primary)] flex-shrink-0"
            title={collapsed ? "Expand sidebar" : "Collapse sidebar"}
          >
            {collapsed ? <PanelLeftOpen className="w-4 h-4" /> : <PanelLeftClose className="w-4 h-4" />}
          </button>
        </div>

        {/* Navigation */}
        <nav className={`flex-1 ${collapsed ? "px-1.5" : "px-3"} pb-4 space-y-0.5 overflow-y-auto`}>
          <div className="space-y-0.5">
            {coreNav.items.map((item) => (
              <NavLink key={item.href} item={item} active={isActive(item.href)} />
            ))}
          </div>

          <NavSection section={learningNav} isActive={isActive} />
          <NavSection section={trackingNav} isActive={isActive} />

          {isPremium && (
            <NavSection section={adminNav} isActive={isActive} />
          )}
        </nav>

        <SidebarWordOfDay />
        <SidebarFooter />
      </aside>
    </SidebarContext.Provider>
  );
}
