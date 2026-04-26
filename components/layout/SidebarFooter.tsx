"use client";

import Image from "next/image";
import { useRouter } from "next/navigation";
import { useRef, useState, useEffect } from "react";
import { createPortal } from "react-dom";
import { useAuth } from "@/components/auth/AuthProvider";
import { useOKLCHTheme } from "@/hooks/useOKLCHTheme";
import { LogOut, User } from "lucide-react";
import { useSidebar } from "@/components/sidebar/SidebarContext";

export default function SidebarFooter() {
  const router = useRouter();
  const { user, signOutUser } = useAuth();
  const { collapsed } = useSidebar();
  const [open, setOpen] = useState(false);
  const [panelPos, setPanelPos] = useState({ top: 0, left: 0 });
  const footerRef = useRef<HTMLDivElement>(null);
  const leaveTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const displayName =
    user?.user_metadata?.full_name ||
    user?.user_metadata?.name ||
    user?.email?.split("@")[0] ||
    "User";

  const avatarUrl = user?.user_metadata?.avatar_url as string | undefined;

  const initials = displayName
    .split(" ")
    .slice(0, 2)
    .map((w: string) => w[0])
    .join("")
    .toUpperCase();

  const enter = () => {
    if (leaveTimer.current) clearTimeout(leaveTimer.current);
    if (footerRef.current) {
      const rect = footerRef.current.getBoundingClientRect();
      setPanelPos({ top: rect.bottom, left: rect.right + 8 });
    }
    setOpen(true);
  };

  const leave = () => {
    leaveTimer.current = setTimeout(() => setOpen(false), 200);
  };

  // Recalculate on scroll/resize
  useEffect(() => {
    if (!open) return;
    const update = () => {
      if (footerRef.current) {
        const rect = footerRef.current.getBoundingClientRect();
        setPanelPos({ top: rect.bottom, left: rect.right + 8 });
      }
    };
    window.addEventListener("resize", update);
    return () => window.removeEventListener("resize", update);
  }, [open]);

  const handleSignOut = async () => {
    setOpen(false);
    await signOutUser();
    router.push("/");
  };

  return (
    <div
      ref={footerRef}
      className="relative flex-shrink-0 border-t px-3 pt-2 pb-3"
      style={{ borderColor: "var(--line-divider)" }}
      onMouseEnter={enter}
      onMouseLeave={leave}
    >
      {/* User row */}
      <button
        className={`flex items-center ${collapsed ? "justify-center w-9 h-9 mx-auto" : "gap-2.5 px-3 w-full h-9"} rounded-lg text-sm font-medium transition-all duration-200 text-[var(--text-primary)] group relative`}
        style={{ background: open ? "var(--btn-regular-bg-hover)" : undefined }}
      >
        <div
          className="relative w-6 h-6 rounded-full flex items-center justify-center text-[10px] font-bold overflow-hidden flex-shrink-0"
          style={{
            background: "var(--primary-soft)",
            color: "var(--primary)",
            boxShadow: "0 0 0 1.5px var(--border)",
          }}
        >
          {avatarUrl ? (
            <Image src={avatarUrl} alt={displayName} fill sizes="24px" className="object-cover" />
          ) : (
            initials
          )}
        </div>
        {!collapsed && <span className="truncate text-sm font-medium">{displayName}</span>}
      </button>

      {/* Portal panel */}
      {open && typeof document !== "undefined" && createPortal(
        <div
          className="fixed z-[9999] w-56 rounded-xl p-2 shadow-xl border
            animate-in fade-in zoom-in-95 duration-150 origin-bottom-left"
          style={{
            top: panelPos.top - 8,
            left: panelPos.left,
            transform: "translateY(-100%)",
            background: "var(--bg-secondary)",
            borderColor: "var(--border)",
          }}
          onMouseEnter={enter}
          onMouseLeave={leave}
        >
          <button
            onClick={() => { setOpen(false); router.push("/profile"); }}
            className="flex items-center gap-2.5 px-3 h-9 w-full rounded-lg text-sm font-medium
              transition-all duration-150 group
              text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:bg-[var(--bg-tertiary)]"
          >
            <User className="h-4 w-4 flex-shrink-0 opacity-60 group-hover:opacity-100 transition-opacity" />
            <span>Profile</span>
          </button>

          <div className="h-px my-1.5" style={{ background: "var(--border)" }} />

          <div className="px-2 py-1">
            <p className="text-[11px] font-medium mb-2" style={{ color: "var(--text-tertiary)" }}>
              Theme
            </p>
            <ThemeInline />
          </div>

          <div className="h-px my-1.5" style={{ background: "var(--border)" }} />

          <button
            onClick={handleSignOut}
            className="flex items-center gap-2.5 px-3 h-9 w-full rounded-lg text-sm font-medium
              transition-all duration-150 group
              text-[var(--text-secondary)] hover:text-[var(--primary)] hover:bg-[var(--primary-soft)]"
          >
            <LogOut className="h-4 w-4 flex-shrink-0 opacity-60 group-hover:opacity-100 transition-opacity" />
            <span>Sign out</span>
          </button>
        </div>,
        document.body
      )}
    </div>
  );
}

function ThemeInline() {
  const { hue, setHue, resetHue, mode, toggleMode, mounted } = useOKLCHTheme();

  if (!mounted) return null;

  return (
    <div className="space-y-2">
      <input
        type="range"
        min="0"
        max="360"
        value={hue}
        onChange={(e) => setHue(parseInt(e.target.value, 10))}
        className="w-full appearance-none cursor-pointer color-selection-slider"
        title={`Hue: ${hue}°`}
      />
      <div className="flex items-center justify-between">
        <span
          className="text-xs font-mono px-2 py-0.5 rounded-md"
          style={{ background: "var(--bg-tertiary)", color: "var(--text-secondary)" }}
        >
          {hue}°
        </span>
        <div className="flex items-center gap-1">
          <button
            onClick={resetHue}
            title="Reset color"
            className="p-1.5 rounded-lg transition-colors hover:bg-[var(--bg-tertiary)] text-[var(--text-tertiary)] hover:text-[var(--text-primary)]"
          >
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-3.5 h-3.5">
              <path d="M3 12a9 9 0 1 0 9-9 9.75 9.75 0 0 0-6.74 2.74L3 8" />
              <path d="M3 3v5h5" />
            </svg>
          </button>
          <button
            onClick={toggleMode}
            title={`Switch to ${mode === "dark" ? "light" : "dark"} mode`}
            className="p-1.5 rounded-lg transition-colors hover:bg-[var(--bg-tertiary)] text-[var(--text-tertiary)] hover:text-[var(--text-primary)]"
          >
            {mode === "dark" ? (
              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8} className="w-3.5 h-3.5">
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 3v2.25m6.364.386-1.591 1.591M21 12h-2.25m-.386 6.364-1.591-1.591M12 18.75V21m-4.773-4.227-1.591 1.591M5.25 12H3m4.227-4.773L5.636 5.636M15.75 12a3.75 3.75 0 1 1-7.5 0 3.75 3.75 0 0 1 7.5 0Z" />
              </svg>
            ) : (
              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8} className="w-3.5 h-3.5">
                <path strokeLinecap="round" strokeLinejoin="round" d="M21.752 15.002A9.72 9.72 0 0 1 18 15.75c-5.385 0-9.75-4.365-9.75-9.75 0-1.33.266-2.597.748-3.752A9.753 9.753 0 0 0 3 11.25C3 16.635 7.365 21 12.75 21a9.753 9.753 0 0 0 9.002-5.998Z" />
              </svg>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
