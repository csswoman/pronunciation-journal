"use client";
import Link from "next/link";
import { useSidebar } from "./SidebarContext";
import { useSidebarTooltip, SidebarTooltipPortal } from "./SidebarTooltip";

export interface NavButtonProps {
  active: boolean;
  onClick?: () => void | Promise<void>;
  children: React.ReactNode;
  as?: "link" | "button";
  href?: string;
  tooltip?: string;
}

export function NavButton({ active, onClick, children, as = "button", href, tooltip }: NavButtonProps) {
  const { collapsed } = useSidebar();
  const { ref, tip, show, hide } = useSidebarTooltip();

  const baseClasses = `relative flex items-center ${collapsed ? "justify-center w-11 h-11 mx-auto" : "gap-2.5 w-full"} rounded-[var(--radius-md)] text-sm transition-all duration-[var(--transition-fast)] group`
    + (collapsed ? "" : " px-[var(--space-3)] py-[var(--space-2)]");
  const baseStyle = active
    ? { background: "var(--primary-soft)", color: "var(--primary)", fontWeight: 600 }
    : { color: "var(--text-secondary)" };

  const inner = (
    <>
      {!active && (
        <span className="absolute inset-0 rounded-[var(--radius-md)] opacity-0 group-hover:opacity-100 transition-opacity duration-[var(--transition-fast)] -z-10"
              style={{ background: "var(--surface-sunken)" }} />
      )}
      {children}
      {collapsed && tooltip && (
        <SidebarTooltipPortal label={tooltip} top={tip.top} left={tip.left} visible={tip.visible} />
      )}
    </>
  );

  const tooltipProps = collapsed && tooltip
    ? { onMouseEnter: show, onMouseLeave: hide }
    : {};

  if (as === "link" && href) {
    return (
      <Link
        href={href}
        ref={(el) => { ref.current = el; }}
        className={baseClasses}
        style={baseStyle}
        {...tooltipProps}
      >
        {inner}
      </Link>
    );
  }

  return (
    <button
      onClick={onClick}
      ref={(el) => { ref.current = el; }}
      className={baseClasses}
      style={baseStyle}
      {...tooltipProps}
    >
      {inner}
    </button>
  );
}
