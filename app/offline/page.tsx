import { Suspense } from "react";
import { OfflineHubClient } from "@/components/offline/OfflineHubClient";

export default function OfflinePage() {
  return (
    <Suspense fallback={<div className="min-h-[60vh] flex items-center justify-center text-fg-muted">Cargando...</div>}>
      <OfflineHubClient />
    </Suspense>
  );
}
