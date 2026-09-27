import { Suspense } from "react";
import { OfflineEntry } from "@/components/offline/OfflineEntry";

export default function OfflinePage() {
  return (
    <Suspense fallback={<div className="min-h-[60vh] flex items-center justify-center text-fg-muted">Cargando...</div>}>
      <OfflineEntry />
    </Suspense>
  );
}
