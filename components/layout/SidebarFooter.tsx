"use client";

// Planned structure:
// <SidebarFooter>
//   <ProfileTrigger />
//   <QuickSettingsPanel>   — portaled dialog
//     <PanelHeader />
//     <ThemeControls />
//     <SoundControls />
//     <StudyLevelControls />
//     <AccountAction />
//   </QuickSettingsPanel>
// </SidebarFooter>

import Image from "next/image";
import { useRouter } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { cn } from "@/lib/cn";
import { useAuth } from "@/components/auth/AuthProvider";
import { useUserPreferences } from "@/hooks/useUserPreferences";
import { type CefrLevel } from "@/lib/essential-words/types";
import { readGuestStudyLevel, saveGuestStudyLevel } from "@/lib/preferences/guest-study-level";
import { LogIn, LogOut, Settings2 } from "@/components/icons";
import { useSidebar } from "@/components/theme/sidebar/SidebarContext";
import {
  SoundControls,
  StudyLevelControls,
  ThemeControls,
} from "@/components/layout/QuickSettingsControls";

export default function SidebarFooter() {
  const router = useRouter();
  const { user, signOutUser } = useAuth();
  const { preferences, updateCefrLevel } = useUserPreferences();
  const { collapsed } = useSidebar();
  const [open, setOpen] = useState(false);
  const [guestLevel, setGuestLevel] = useState<CefrLevel>("A1");
  const footerRef = useRef<HTMLDivElement>(null);
  const panelRef = useRef<HTMLDivElement>(null);
  const isGuest = !user || (user as { is_anonymous?: boolean }).is_anonymous;
  const level = isGuest ? guestLevel : preferences?.cefr_level ?? "A1";
  const displayName = isGuest
    ? "Ajustes rápidos"
    : preferences?.full_name || user?.user_metadata?.full_name || user?.email?.split("@")[0] || "Mi perfil";
  const avatarUrl = user?.user_metadata?.avatar_url as string | undefined;
  const initials = isGuest
    ? "·"
    : displayName
        .split(" ")
        .slice(0, 2)
        .map((word: string) => word[0])
        .join("")
        .toUpperCase();

  useEffect(() => {
    setGuestLevel(readGuestStudyLevel());
  }, []);

  useEffect(() => {
    if (!open) return;

    function onKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") setOpen(false);
    }

    function onPointerDown(event: PointerEvent) {
      const target = event.target as Node;
      if (panelRef.current?.contains(target) || footerRef.current?.contains(target)) return;
      setOpen(false);
    }

    document.addEventListener("keydown", onKeyDown);
    document.addEventListener("pointerdown", onPointerDown);
    return () => {
      document.removeEventListener("keydown", onKeyDown);
      document.removeEventListener("pointerdown", onPointerDown);
    };
  }, [open]);

  const setLevel = async (next: CefrLevel) => {
    if (isGuest) {
      saveGuestStudyLevel(next);
      setGuestLevel(next);
      return;
    }
    await updateCefrLevel(next);
  };

  const signOut = async () => {
    setOpen(false);
    await signOutUser();
    router.push("/");
  };

  return (
    <div ref={footerRef} className="relative flex-shrink-0 border-t border-border-subtle px-3 pb-3 pt-2">
      <button
        type="button"
        onClick={() => setOpen((value) => !value)}
        aria-expanded={open}
        aria-haspopup="dialog"
        aria-label={isGuest ? "Abrir ajustes rápidos" : `Ajustes de ${displayName}`}
        className={cn(
          "focus-ring flex h-10 items-center rounded-md text-left transition-colors",
          collapsed ? "mx-auto w-10 justify-center" : "w-full gap-2.5 px-2.5",
          open ? "bg-surface-sunken" : "hover:bg-surface-raised",
        )}
      >
        <span className="relative grid size-6 shrink-0 place-items-center overflow-hidden rounded-full bg-primary-soft text-tiny font-bold text-primary">
          {avatarUrl ? <Image src={avatarUrl} alt="" fill sizes="24px" className="object-cover" /> : initials}
        </span>
        {!collapsed && <span className="min-w-0 flex-1 truncate font-label text-fg">{displayName}</span>}
        {!collapsed && <Settings2 size={16} aria-hidden className="shrink-0 text-fg-subtle" />}
      </button>

      {open &&
        typeof document !== "undefined" &&
        createPortal(
          <div
            ref={panelRef}
            role="dialog"
            aria-label="Ajustes rápidos"
            className="fixed bottom-3 left-[calc(var(--sidebar-width)+0.75rem)] z-50 w-[min(22rem,calc(100vw-1.5rem))] rounded-xl border border-border-subtle bg-surface-raised p-3 shadow-xl animate-in fade-in zoom-in-95 duration-150"
          >
            <div className="mb-1 flex items-start justify-between gap-3 px-1 pb-2">
              <div>
                <p className="font-label text-fg">Ajustes rápidos</p>
                <p className="font-caption text-fg-muted">
                  {isGuest ? "Se guardan en este dispositivo" : "Se guardan en tu perfil"}
                </p>
              </div>
              {!isGuest && (
                <button
                  type="button"
                  onClick={() => {
                    setOpen(false);
                    router.push("/profile");
                  }}
                  className="focus-ring shrink-0 rounded-sm px-2 py-1 font-caption text-primary hover:bg-primary-soft"
                >
                  Ver perfil
                </button>
              )}
            </div>

            <ThemeControls />
            <SoundControls />
            <StudyLevelControls level={level} onChange={(next) => void setLevel(next)} />

            <div className="border-t border-border-subtle pt-2">
              <button
                type="button"
                onClick={isGuest ? () => router.push("/login") : signOut}
                className="focus-ring flex min-h-10 w-full items-center gap-2 rounded-sm px-2 text-left font-label text-fg-muted hover:bg-surface-sunken hover:text-fg"
              >
                {isGuest ? <LogIn size={16} aria-hidden /> : <LogOut size={16} aria-hidden />}
                {isGuest ? "Iniciar sesión" : "Cerrar sesión"}
              </button>
            </div>
          </div>,
          document.body,
        )}
    </div>
  );
}
