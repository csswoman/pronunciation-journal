"use client";

import Image from "next/image";
import { useRouter } from "next/navigation";
import { type CSSProperties, useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { cn } from "@/lib/cn";
import { useAuth } from "@/components/auth/AuthProvider";
import { useOKLCHTheme } from "@/hooks/useOKLCHTheme";
import { useUserPreferences } from "@/hooks/useUserPreferences";
import { useUISoundsStore } from "@/lib/stores/uiSoundsStore";
import { CEFR_LEVELS, type CefrLevel } from "@/lib/core-1000/types";
import { readGuestStudyLevel, saveGuestStudyLevel } from "@/lib/preferences/guest-study-level";
import { LogIn, LogOut, Moon, RotateCcw, Settings2, Sun, Target, Volume2 } from "@/components/icons";
import { useSidebar } from "@/components/theme/sidebar/SidebarContext";

export default function SidebarFooter() {
  const router = useRouter();
  const { user, signOutUser } = useAuth();
  const { preferences, updateCefrLevel } = useUserPreferences();
  const { collapsed } = useSidebar();
  const [open, setOpen] = useState(false);
  const [guestLevel, setGuestLevel] = useState<CefrLevel>("A1");
  const footerRef = useRef<HTMLDivElement>(null);
  const isGuest = !user || (user as { is_anonymous?: boolean }).is_anonymous;
  const level = isGuest ? guestLevel : preferences?.cefr_level ?? "A1";
  const displayName = isGuest ? "Ajustes rápidos" : preferences?.full_name || user?.user_metadata?.full_name || user?.email?.split("@")[0] || "Mi perfil";
  const avatarUrl = user?.user_metadata?.avatar_url as string | undefined;
  const initials = isGuest ? "·" : displayName.split(" ").slice(0, 2).map((word: string) => word[0]).join("").toUpperCase();

  useEffect(() => { setGuestLevel(readGuestStudyLevel()); }, []);
  useEffect(() => {
    if (!open) return;
    const onKeyDown = (event: KeyboardEvent) => event.key === "Escape" && setOpen(false);
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [open]);

  const setLevel = async (next: CefrLevel) => {
    if (isGuest) { saveGuestStudyLevel(next); setGuestLevel(next); return; }
    await updateCefrLevel(next);
  };
  const signOut = async () => { setOpen(false); await signOutUser(); router.push("/"); };

  return (
    <div ref={footerRef} className="relative flex-shrink-0 border-t border-border-subtle px-3 pb-3 pt-2">
      <button type="button" onClick={() => setOpen((value) => !value)} aria-expanded={open} aria-haspopup="dialog"
        className={cn("focus-ring flex h-10 items-center rounded-md text-left transition-colors", collapsed ? "mx-auto w-10 justify-center" : "w-full gap-2.5 px-2.5", open ? "bg-surface-sunken" : "hover:bg-surface-raised")}>
        <span className="relative grid size-6 shrink-0 place-items-center overflow-hidden rounded-full bg-primary-soft text-tiny font-bold text-primary">
          {avatarUrl ? <Image src={avatarUrl} alt="" fill sizes="24px" className="object-cover" /> : initials}
        </span>
        {!collapsed && <span className="min-w-0 flex-1 truncate font-label text-fg">{displayName}</span>}
        {!collapsed && <Settings2 size={16} aria-hidden className="shrink-0 text-fg-subtle" />}
      </button>

      {open && typeof document !== "undefined" && createPortal(
        <div role="dialog" aria-label="Ajustes rápidos" className="fixed bottom-3 left-[calc(var(--sidebar-width)+0.75rem)] z-[9999] w-[min(22rem,calc(100vw-1.5rem))] rounded-xl border border-border-subtle bg-surface-raised p-3 shadow-xl animate-in fade-in zoom-in-95 duration-150">
          <div className="mb-3 flex items-start justify-between gap-3 px-1">
            <div><p className="font-label text-fg">Ajustes rápidos</p><p className="font-caption text-fg-muted">{isGuest ? "Guardados en este dispositivo" : "Sincronizados con tu perfil"}</p></div>
            {!isGuest && <button type="button" onClick={() => { setOpen(false); router.push("/profile"); }} className="focus-ring rounded-sm px-2 py-1 font-caption text-primary hover:bg-primary-soft">Perfil</button>}
          </div>
          <section className="border-t border-border-subtle py-3"><div className="mb-2 flex items-center gap-2"><Target size={15} className="text-fg-subtle" /><p className="font-kicker text-fg-muted">Nivel de estudio</p></div>
            <div className="grid grid-cols-5 gap-1" aria-label="Nivel de estudio">{CEFR_LEVELS.map((item) => <button key={item} type="button" onClick={() => void setLevel(item)} className={cn("focus-ring min-h-9 rounded-sm font-label transition-colors", level === item ? "bg-primary text-on-primary" : "bg-surface-sunken text-fg-muted hover:text-fg")}>{item}</button>)}</div>
          </section>
          <SoundControls />
          <ThemeControls />
          <div className="mt-2 border-t border-border-subtle pt-2"><button type="button" onClick={isGuest ? () => router.push("/login") : signOut} className="focus-ring flex min-h-10 w-full items-center gap-2 rounded-sm px-2 text-left font-label text-fg-muted hover:bg-surface-sunken hover:text-fg">{isGuest ? <LogIn size={16} /> : <LogOut size={16} />} {isGuest ? "Iniciar sesión" : "Cerrar sesión"}</button></div>
        </div>, document.body)}
    </div>
  );
}

function SoundControls() {
  const enabled = useUISoundsStore((state) => state.soundEnabled); const volume = useUISoundsStore((state) => state.volume); const setEnabled = useUISoundsStore((state) => state.setSoundEnabled); const setVolume = useUISoundsStore((state) => state.setVolume);
  const percent = Math.round(volume * 100);
  return <section className="border-t border-border-subtle py-3"><div className="mb-2 flex items-center justify-between"><span className="flex items-center gap-2 font-kicker text-fg-muted"><Volume2 size={15} /> Sonidos</span><button type="button" role="switch" aria-checked={enabled} onClick={() => setEnabled(!enabled)} className={cn("focus-ring h-6 w-10 rounded-full p-0.5 transition-colors", enabled ? "bg-primary" : "bg-surface-sunken")}><span className={cn("block size-5 rounded-full bg-surface-raised transition-transform", enabled && "translate-x-4")} /></button></div><div className={cn("flex items-center gap-3", !enabled && "opacity-50")}><input aria-label="Volumen de la aplicación" type="range" min="0" max="100" step="5" disabled={!enabled} value={percent} onChange={(event) => setVolume(Number(event.target.value) / 100)} className="sound-volume-slider min-w-0 flex-1" style={{ "--sound-volume": `${percent}%` } as CSSProperties} /><span className="w-9 text-right text-tiny tabular-nums text-fg-muted">{percent}%</span></div></section>;
}

function ThemeControls() {
  const { hue, setHue, resetHue, mode, toggleMode, mounted } = useOKLCHTheme(); if (!mounted) return null;
  return <section className="border-t border-border-subtle py-3"><div className="mb-2 flex items-center justify-between"><span className="font-kicker text-fg-muted">Apariencia</span><span className="text-tiny tabular-nums text-fg-subtle">{hue}°</span></div><div className="flex items-center gap-2"><input aria-label="Color del tema" type="range" min="0" max="360" value={hue} onChange={(event) => setHue(Number(event.target.value))} className="color-selection-slider min-w-0 flex-1" /><button type="button" onClick={resetHue} aria-label="Restablecer color" className="focus-ring grid size-8 place-items-center rounded-sm text-fg-muted hover:bg-surface-sunken"><RotateCcw size={15} /></button><button type="button" onClick={toggleMode} aria-label={mode === "dark" ? "Cambiar a modo claro" : "Cambiar a modo oscuro"} className="focus-ring grid size-8 place-items-center rounded-sm text-fg-muted hover:bg-surface-sunken">{mode === "dark" ? <Sun size={16} /> : <Moon size={16} />}</button></div></section>;
}
