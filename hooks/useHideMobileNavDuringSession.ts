"use client";

import { useEffect } from "react";
import { useSessionChromeStore } from "@/lib/stores/sessionChromeStore";

/** Hide mobile bottom nav for the lifetime of the calling session shell. */
export function useHideMobileNavDuringSession(): void {
  const enterSession = useSessionChromeStore((s) => s.enterSession);
  const exitSession = useSessionChromeStore((s) => s.exitSession);

  useEffect(() => {
    enterSession();
    return () => exitSession();
  }, [enterSession, exitSession]);
}
