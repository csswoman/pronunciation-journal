"use client";

// Planned structure: OfflineEntry → AuthProvider → DailyChecklist | OfflineHubClient.
import { useEffect, useState } from "react";
import AuthProvider from "@/components/auth/AuthProvider";
import DailyChecklist from "@/components/daily/DailyChecklist";
import { OfflineHubClient } from "./OfflineHubClient";

/** Public, user-free HTML. Account data is restored only in the browser. */
export function OfflineEntry() {
  const [isDaily, setIsDaily] = useState<boolean | null>(null);
  useEffect(() => {
    setIsDaily(window.location.pathname.replace(/\/$/, "") === "/daily");
  }, []);

  if (isDaily === null) return <p role="status">Preparando contenido sin conexión…</p>;
  if (!isDaily) return <OfflineHubClient />;
  return (
    <AuthProvider>
      <DailyChecklist conceptLesson={null} />
    </AuthProvider>
  );
}
