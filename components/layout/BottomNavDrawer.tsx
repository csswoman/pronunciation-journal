"use client";

// Planned structure:
// <BottomNavDrawer>
//   <Scrim />                         — tap / Escape to dismiss
//   <aside role="dialog">
//     <DrawerHeader />                — brand + close button
//     <BottomNavBento />              — pastel tile grid + compact Consultar list
//     <DrawerFooter />                — identity row + QuickSettings + sign-out
//   </aside>
// </BottomNavDrawer>

import Image from "next/image";
import { useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { LogOut, X } from "@/components/icons";
import { GuestProgressCard } from "@/components/layout/GuestProgressCard";
import { Logo } from "@/components/illustrations/Logo";
import { useAuth } from "@/components/auth/AuthProvider";
import { useUserPreferences } from "@/hooks/useUserPreferences";
import { isAnonymousUser } from "@/lib/auth/is-anonymous";
import { QuickSettingsAccordion } from "@/components/layout/QuickSettingsControls";
import { BottomNavBento } from "@/components/layout/BottomNavBento";
import { playUiCue } from "@/lib/ui-sounds/cues";
import { cn } from "@/lib/cn";

interface BottomNavDrawerProps {
  open: boolean;
  onClose: () => void;
  isActive: (href: string) => boolean;
}

export default function BottomNavDrawer({ open, onClose, isActive }: BottomNavDrawerProps) {
  const router = useRouter();
  const { user, signOutUser } = useAuth();
  const { preferences } = useUserPreferences();
  const panelRef = useRef<HTMLElement>(null);

  const isGuest = isAnonymousUser(user);
  const displayName = isGuest
    ? preferences?.full_name || "Sesión temporal"
    : preferences?.full_name ||
      user?.user_metadata?.full_name ||
      user?.email?.split("@")[0] ||
      "Mi perfil";
  const avatarUrl =
    preferences?.avatar_url || (user?.user_metadata?.avatar_url as string | undefined);
  const initials = isGuest
    ? "·"
    : displayName
        .split(" ")
        .slice(0, 2)
        .map((word: string) => word[0])
        .join("")
        .toUpperCase();

  const dismiss = () => {
    playUiCue("nav-close");
    onClose();
  };

  useEffect(() => {
    if (!open) return;
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") dismiss();
    };
    window.addEventListener("keydown", onKeyDown);
    panelRef.current?.focus();
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [open]);

  const goToProfile = () => {
    playUiCue("tap");
    onClose();
    router.push("/profile");
  };

  const goToLogin = () => {
    playUiCue("tap");
    onClose();
    router.push("/login?intent=save");
  };

  const signOut = async () => {
    playUiCue("wrong");
    onClose();
    await signOutUser();
    router.replace("/login?intent=explore");
  };

  return (
    <>
      <div
        className={cn(
          "fixed inset-0 z-40 lg:hidden bg-(--bg)/40 backdrop-blur-sm transition-opacity duration-200",
          "motion-reduce:backdrop-blur-none motion-reduce:transition-none",
          open ? "opacity-100" : "pointer-events-none opacity-0",
        )}
        role="presentation"
        aria-hidden="true"
        onClick={dismiss}
      />

      <aside
        ref={panelRef}
        id="bottom-nav-menu"
        role="dialog"
        aria-modal="true"
        aria-label="Menú de navegación"
        tabIndex={-1}
        className={cn(
          "fixed inset-x-0 top-0 z-50 flex flex-col lg:hidden",
          "bottom-[calc(4.25rem+env(safe-area-inset-bottom))]",
          "bg-(--bg) outline-none",
          "transition-transform duration-300 cubic-bezier(0.22,1,0.36,1)",
          "motion-reduce:backdrop-blur-none motion-reduce:transition-none",
          open ? "visible translate-y-0" : "invisible translate-y-full",
        )}
      >
        {/* Header */}
        <div className="flex shrink-0 items-center justify-between px-4 pb-3 pt-[max(1rem,env(safe-area-inset-top))]">
          <div className="flex items-center gap-2.5">
            <Logo className="size-6 text-primary" />
            <span className="font-heading text-body-sm font-semibold text-fg">English Journal</span>
          </div>
          <button
            type="button"
            onClick={dismiss}
            aria-label="Cerrar menú"
            className="press-feedback grid size-9 place-items-center rounded-md text-fg-subtle transition-colors hover:bg-surface-sunken hover:text-fg focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary"
          >
            <X className="size-5" aria-hidden />
          </button>
        </div>

        {/* Scroll region — nav sections and the footer controls scroll together
            so nothing is clipped on short viewports. */}
        <div className="sidebar-scrollbar min-h-0 flex-1 overflow-y-auto overscroll-contain">
          <BottomNavBento isActive={isActive} onNavigate={onClose} />

          {/* Footer — identity + quick settings + session action */}
          <div className="border-t border-border-subtle p-3 pb-4 space-y-3">
          {isGuest ? (
            <GuestProgressCard onSave={goToLogin} />
          ) : (
            <button
              type="button"
              onClick={goToProfile}
              title={`Perfil de ${displayName}`}
              className="press-feedback flex min-h-9.5 w-full items-center gap-2.5 rounded-md px-2 py-1 text-left transition-colors hover:bg-surface-sunken focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary"
            >
              <span className="relative grid size-7 shrink-0 place-items-center overflow-hidden rounded-full bg-primary-soft text-caption font-bold text-primary">
                {avatarUrl ? (
                  <Image src={avatarUrl} alt="" fill sizes="28px" className="object-cover" />
                ) : (
                  initials
                )}
              </span>
              <span className="min-w-0 flex-1 truncate font-label text-caption font-medium text-fg">
                {displayName}
              </span>
            </button>
          )}

          <QuickSettingsAccordion />

          {!isGuest && (
            <div className="border-t border-border-subtle pt-3">
              <button
                type="button"
                onClick={signOut}
                className="press-feedback group flex min-h-9 w-full items-center gap-2 rounded-md px-2 text-left font-label text-error-value transition-all duration-150 ease-out hover:bg-error-soft focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary"
              >
                <LogOut
                  size={16}
                  aria-hidden
                  className="shrink-0 transition-transform duration-150 ease-out group-hover:-translate-x-0.5"
                />
                Cerrar sesión
              </button>
            </div>
          )}
          </div>
        </div>
      </aside>
    </>
  );
}
