"use client";
import Link from "next/link";
import { useSidebar } from "./SidebarContext";
import { useSidebarTooltip, SidebarTooltipPortal } from "./SidebarTooltip";
import { playUiCue } from "@/lib/ui-sounds/cues";

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

  const handleClick = () => {
    if (!active && as === "link") {
      playUiCue("nav-switch");
    }
    if (onClick) {
      void onClick();
    }
  };

  const baseClasses = `press-feedback relative flex items-center ${collapsed ? "justify-center w-9 h-9 mx-auto" : "gap-2.5 w-full min-h-[38px] px-2.5 py-1.5"} rounded-md text-body-sm transition-all duration-[var(--transition-fast)] group focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--primary)]`;
  const baseStyle = active
    ? { background: "var(--primary-soft)", color: "var(--primary)", fontWeight: 600 }
    : { color: "var(--text-secondary)" };

  const inner = (
    <>
      {!active && (
        <span className="absolute inset-0 rounded-[var(--radius-md)] opacity-0 group-hover:opacity-100 transition-opacity duration-[var(--transition-fast)] -z-10 bg-surface-sunken" />
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
        onClick={handleClick}
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
      onClick={handleClick}
      ref={(el) => { ref.current = el; }}
      className={baseClasses}
      style={baseStyle}
      {...tooltipProps}
    >
      {inner}
    </button>
  );
}
