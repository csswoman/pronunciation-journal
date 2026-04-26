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

  const baseClasses = `relative flex items-center ${collapsed ? "justify-center w-9 h-9 mx-auto" : "gap-2.5 px-3 w-full h-9"} rounded-lg text-sm font-medium transition-all duration-200 group`;
  const baseStyle = active
    ? { background: "var(--btn-regular-bg)", color: "var(--primary)" }
    : { color: "var(--text-secondary)" };

  const inner = (
    <>
      {active && !collapsed && (
        <span
          className="absolute left-0 top-1/2 -translate-y-1/2 w-0.5 h-5 rounded-r-full"
          style={{ background: "var(--primary)" }}
        />
      )}
      {!active && (
        <span className="absolute inset-0 rounded-lg opacity-0 group-hover:opacity-100 transition-opacity duration-150 -z-10"
              style={{ background: "var(--btn-plain-bg-hover)" }} />
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
