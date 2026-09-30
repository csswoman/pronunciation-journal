"use client";

// Planned structure:
// <OfflineEntry>
//   <OfflineLoadingState />
//   <OfflineDailyClient /> | <OfflineHubClient />
// </OfflineEntry>

import { useEffect, useState } from "react";
import dynamic from "next/dynamic";
import { OfflineLoadingState } from "./OfflineLoadingState";

const OfflineDailyClient = dynamic(
  () => import("./OfflineDailyClient").then((module) => module.OfflineDailyClient),
  {
    loading: ({ error, retry }) => (
      <OfflineLoadingState
        message="Preparando tu plan diario sin conexión…"
        error={error}
        retry={retry}
      />
    ),
  },
);

const OfflineHubClient = dynamic(
  () => import("./OfflineHubClient").then((module) => module.OfflineHubClient),
  {
    loading: ({ error, retry }) => (
      <OfflineLoadingState error={error} retry={retry} />
    ),
  },
);

/** Public, user-free HTML. Account data is restored only in the browser. */
export function OfflineEntry() {
  const [isDaily, setIsDaily] = useState<boolean | null>(null);

  useEffect(() => {
    setIsDaily(window.location.pathname.replace(/\/$/, "") === "/daily");
  }, []);

  if (isDaily === null) return <OfflineLoadingState />;
  return isDaily ? <OfflineDailyClient /> : <OfflineHubClient />;
}
