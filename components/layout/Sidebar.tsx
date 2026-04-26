"use client";
import { usePathname } from "next/navigation";
import { useUserRole } from "@/hooks/useUserRole";
import SidebarFooter from "./SidebarFooter";
import { NavSection, NavLink, coreNav, learningNav, trackingNav, adminNav } from "../sidebar/index";

interface SidebarProps {
  className?: string;
}

export default function Sidebar({ className = "" }: SidebarProps) {
  const pathname = usePathname();
  const { isPremium } = useUserRole();

  const isActive = (href: string) =>
    href === "/" ? pathname === "/" : pathname.startsWith(href);

  return (
    <aside
      className={`sidebar-scrollbar w-64 flex flex-col h-full min-h-0 overflow-y-auto bg-[var(--card-bg)] border-r border-[var(--line-divider)] ${className}`}
    >
      {/* Brand */}
      <div className="flex items-center gap-2.5 px-5 py-5 flex-shrink-0">
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

      {/* Navigation */}
      <nav className="flex-1 px-3 pb-4 space-y-0.5 overflow-y-auto">
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

      <SidebarFooter />
    </aside>
  );
}
