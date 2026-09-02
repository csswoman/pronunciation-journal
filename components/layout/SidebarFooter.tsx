"use client";

import Image from "next/image";
import { useRouter } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { cn } from "@/lib/cn";
import { useAuth } from "@/components/auth/AuthProvider";
import { useUserPreferences } from "@/hooks/useUserPreferences";
import { isAnonymousUser } from "@/lib/auth/is-anonymous";
import { LogIn, LogOut, Settings2, User } from "@/components/icons";
import { useSidebar } from "@/components/theme/sidebar/SidebarContext";
import { playUiCue } from "@/lib/ui-sounds/cues";
import { QuickSettingsAccordion } from "@/components/layout/QuickSettingsControls";

export default function SidebarFooter() {
  const router = useRouter();
  const { user, signOutUser } = useAuth();
  const { preferences } = useUserPreferences();
  const { collapsed } = useSidebar();
  const [open, setOpen] = useState(false);
  const footerRef = useRef<HTMLDivElement>(null);
  const panelRef = useRef<HTMLDivElement>(null);
  const isGuest = isAnonymousUser(user);
  const displayName = isGuest
    ? "Sesión temporal"
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

  const handleClose = () => {
    playUiCue("nav-close");
    setOpen(false);
  };

  useEffect(() => {
    if (!open) return;

    function onKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") handleClose();
    }

    function onPointerDown(event: PointerEvent) {
      const target = event.target as Node;
      if (panelRef.current?.contains(target) || footerRef.current?.contains(target)) return;
      handleClose();
    }

    document.addEventListener("keydown", onKeyDown);
    document.addEventListener("pointerdown", onPointerDown);
    return () => {
      document.removeEventListener("keydown", onKeyDown);
      document.removeEventListener("pointerdown", onPointerDown);
    };
  }, [open]);

  const signOut = async () => {
    playUiCue("wrong");
    setOpen(false);
    await signOutUser();
    router.replace("/login?intent=explore");
  };

  const settingsButton = (
    <button
      type="button"
      onClick={() => {
        playUiCue(open ? "nav-close" : "nav-open");
        setOpen((value) => !value);
      }}
      aria-expanded={open}
      aria-haspopup="dialog"
      aria-label="Ajustes rápidos"
      title="Ajustes rápidos"
      className={cn(
        "focus-ring press-feedback grid size-9 shrink-0 place-items-center rounded-md transition-colors text-fg-subtle hover:text-fg hover:bg-surface-sunken",
        open && "bg-surface-sunken text-primary",
      )}
    >
      <Settings2 size={18} aria-hidden />
    </button>
  );

  return (
    <div ref={footerRef} className="relative shrink-0 border-t border-border-subtle p-3 space-y-2">
      {/* Guests: single unified block — status, save-progress CTA and settings gear together */}
      {isGuest && !collapsed && (
        <div className="rounded-lg border border-border-subtle bg-surface-sunken p-2.5 space-y-2">
          <div className="flex items-center justify-between gap-2">
            <div className="flex items-center gap-2">
              <span className="grid size-5 shrink-0 place-items-center rounded-full bg-surface-raised text-fg-subtle">
                <User size={12} aria-hidden />
              </span>
              <span className="font-caption text-tiny font-semibold text-fg-subtle uppercase tracking-wider">
                Modo invitado
              </span>
            </div>
            {settingsButton}
          </div>
          <button
            type="button"
            onClick={() => {
              playUiCue("tap");
              router.push("/login?intent=save&mode=register");
            }}
            className="focus-ring press-feedback flex w-full items-center justify-center gap-2 rounded-md border border-border-default bg-surface hover:bg-surface-sunken py-1.5 px-3 text-caption font-semibold text-fg transition-all"
          >
            <LogIn size={14} aria-hidden />
            Guardar progreso
          </button>
        </div>
      )}

      {/* Collapsed guest: just the gear */}
      {isGuest && collapsed && (
        <div className="flex justify-center">{settingsButton}</div>
      )}

      {/* Signed-in users: normal profile row + settings gear */}
      {!isGuest && (
        <div className="flex items-center justify-between gap-1.5">
          <button
            type="button"
            onClick={() => {
              playUiCue("tap");
              router.push("/profile");
            }}
            title={`Perfil de ${displayName}`}
            className={cn(
              "focus-ring press-feedback flex min-h-[38px] flex-1 items-center gap-2.5 rounded-md text-left transition-colors hover:bg-surface-sunken px-2 py-1",
              collapsed && "justify-center px-0",
            )}
          >
            <span className="relative grid size-7 shrink-0 place-items-center overflow-hidden rounded-full bg-primary-soft text-caption font-bold text-primary">
              {avatarUrl ? <Image src={avatarUrl} alt="" fill sizes="28px" className="object-cover" /> : initials}
            </span>
            {!collapsed && (
              <div className="min-w-0 flex-1 truncate">
                <p className="truncate font-label text-fg text-caption font-medium">{displayName}</p>
              </div>
            )}
          </button>

          {settingsButton}
        </div>
      )}

      {open &&
        typeof document !== "undefined" &&
        createPortal(
          <div
            ref={panelRef}
            role="dialog"
            aria-label="Ajustes rápidos"
            className="panel-reveal fixed bottom-3 left-[calc(var(--sidebar-width)+0.75rem)] z-50 w-[min(23rem,calc(100vw-1.5rem))] rounded-xl border border-border-subtle bg-surface-raised p-4 shadow-xl before:absolute before:-left-2 before:bottom-5 before:size-4 before:rotate-45 before:border-l before:border-b before:border-border-subtle before:bg-surface-raised"
          >
            <div className="flex items-center justify-between gap-3 px-1 pb-3">
              <p className="font-label font-semibold text-fg">Ajustes rápidos</p>
              {!isGuest && (
                <button
                  type="button"
                  onClick={() => {
                    playUiCue("tap");
                    setOpen(false);
                    router.push("/profile");
                  }}
                  className="focus-ring press-feedback shrink-0 rounded-sm px-2 py-1 font-caption font-medium text-primary transition-colors hover:bg-primary-soft"
                >
                  Ver perfil
                </button>
              )}
            </div>

            <QuickSettingsAccordion />

            <div className="border-t border-border-subtle pt-3 mt-3">
              {isGuest ? (
                <div className="flex flex-col gap-2">
                  <button
                    type="button"
                    onClick={() => {
                      playUiCue("tap");
                      setOpen(false);
                      router.push("/login?intent=save&mode=register");
                    }}
                    className="focus-ring press-feedback flex min-h-9 w-full items-center justify-center gap-2 rounded-md bg-primary px-3 text-caption font-semibold text-on-primary transition-colors hover:brightness-105"
                  >
                    <LogIn size={15} aria-hidden />
                    Guardar progreso
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      playUiCue("tap");
                      setOpen(false);
                      router.push("/login?intent=save");
                    }}
                    className="focus-ring press-feedback flex min-h-8 w-full items-center justify-center gap-1.5 rounded-md px-3 text-caption font-medium text-fg-subtle transition-colors hover:bg-surface-sunken hover:text-fg"
                  >
                    ¿Ya tienes cuenta? Iniciar sesión
                  </button>
                </div>
              ) : (
                <button
                  type="button"
                  onClick={signOut}
                  className="focus-ring press-feedback group flex min-h-9 w-full items-center gap-2 rounded-md px-2 text-left font-label text-error-value transition-all duration-150 ease-out hover:bg-error-soft"
                >
                  <LogOut
                    size={16}
                    aria-hidden
                    className="shrink-0 transition-transform duration-150 ease-out group-hover:-translate-x-0.5"
                  />
                  Cerrar sesión
                </button>
              )}
            </div>
          </div>,
          document.body,
        )}
    </div>
  );
}
