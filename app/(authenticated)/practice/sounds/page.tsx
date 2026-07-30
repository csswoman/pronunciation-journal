import { Suspense } from "react";
import SoundLabPage from "@/components/phoneme-practice/SoundLabPage";
import { isSupabaseConfigured } from "@/lib/supabase/env";
import { getSupabaseServerUser } from "@/lib/supabase/session";

export default async function SoundsPage() {
  const user = isSupabaseConfigured() ? await getSupabaseServerUser() : null;

  return (
    <Suspense
      fallback={
        <div className="page-shell page-shell--catalog sound-lab sound-lab__loading-shell">
          <div className="sound-lab__loading" role="status" aria-live="polite">
            <span className="font-kicker text-fg-subtle">Práctica</span>
            <p className="text-body-sm text-fg-muted">Cargando el laboratorio de sonidos…</p>
          </div>
        </div>
      }
    >
      <SoundLabPage userId={user?.id} />
    </Suspense>
  );
}
