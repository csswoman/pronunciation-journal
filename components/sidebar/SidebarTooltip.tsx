"use client";
import { useState, useRef, useCallback } from "react";
import { createPortal } from "react-dom";

interface TooltipState {
  visible: boolean;
  top: number;
  left: number;
}

export function useSidebarTooltip() {
  const [tip, setTip] = useState<TooltipState>({ visible: false, top: 0, left: 0 });
  const ref = useRef<HTMLElement | null>(null);

  const show = useCallback(() => {
    if (!ref.current) return;
    const rect = ref.current.getBoundingClientRect();
    setTip({
      visible: true,
      top: rect.top + rect.height / 2,
      left: rect.right + 8,
    });
  }, []);

  const hide = useCallback(() => setTip((t) => ({ ...t, visible: false })), []);

  return { ref, tip, show, hide };
}

interface SidebarTooltipPortalProps {
  label: string;
  top: number;
  left: number;
  visible: boolean;
}

export function SidebarTooltipPortal({ label, top, left, visible }: SidebarTooltipPortalProps) {
  if (!visible || typeof document === "undefined") return null;

  return createPortal(
    <span
      className="fixed z-[9999] px-2 py-1 rounded-md text-xs font-medium whitespace-nowrap shadow-md pointer-events-none -translate-y-1/2"
      style={{
        top,
        left,
        background: "var(--card-bg)",
        color: "var(--text-primary)",
        border: "1px solid var(--line-divider)",
      }}
    >
      {label}
    </span>,
    document.body
  );
}
