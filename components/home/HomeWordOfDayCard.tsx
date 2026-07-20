"use client";

// Planned structure:
// <HomeWordOfDayCard>
//   label + word + IPA + full definition
//   single link → /words
// </HomeWordOfDayCard>

import { useEffect, useState } from "react";
import Link from "next/link";
import { ArrowRight, Loader2 } from "@/components/icons";
import Button from "@/components/ui/Button";
import { SyllableWord } from "@/components/ui/SyllableWord";
import { useAuth } from "@/components/auth/AuthProvider";
import { useWordOfDay } from "@/hooks/useWordOfDay";
import { readStoredCefrLevel } from "@/lib/core-1000/target-level";
import { readGuestStudyLevel } from "@/lib/preferences/guest-study-level";
import { formatIpaDisplay } from "@/lib/lexicon/format-ipa";

/** Preview-only — no listen/save/shuffle micro-session on home. */
export default function HomeWordOfDayCard() {
  const { user } = useAuth();
  const [level, setLevel] = useState<string | undefined>(undefined);

  useEffect(() => {
    let cancelled = false;
    const isGuest = !user || (user as { is_anonymous?: boolean }).is_anonymous;
    const storedLevel = isGuest ? Promise.resolve(readGuestStudyLevel()) : readStoredCefrLevel(user.id);
    void storedLevel.then((l) => {
      if (!cancelled && l) setLevel(l.toLowerCase());
    });
    return () => {
      cancelled = true;
    };
  }, [user]);

  const { word, loading, error, refresh } = useWordOfDay(level);

  return (
    <div className="home-sidebar-card flex flex-col gap-2">
      <span className="font-label text-fg">Palabra del día</span>

      {loading && (
        <div className="font-caption flex items-center gap-2 py-2 text-fg-muted">
          <Loader2 size={15} className="animate-spin" />
          Cargando…
        </div>
      )}

      {error && !word && !loading && (
        <div className="animate-state-in flex flex-col items-start gap-2 py-1">
          <p className="font-body-sm text-error">No se pudo cargar la palabra.</p>
          <Button type="button" variant="ghost" size="md" onClick={() => refresh()}>
            Reintentar
          </Button>
        </div>
      )}

      {word && !loading && (
        <div className="animate-state-in flex flex-col gap-2" key={word.word}>
          <p className="font-mono text-display-word font-semibold leading-tight text-fg">
            <SyllableWord word={word.word} />
          </p>
          {word.ipa ? (
            <p className="font-ipa text-body-lg leading-snug text-fg-muted">
              {formatIpaDisplay(word.ipa)}
            </p>
          ) : null}
          {word.definition ? (
            <p className="font-body-sm text-pretty text-fg-muted">
              {word.definition}
            </p>
          ) : null}
          <Link
            href="/dictionary"
            className="focus-ring mt-1 inline-flex min-h-10 items-center gap-1.5 font-body-sm text-fg-muted transition-colors hover:text-fg hover:underline"
          >
            Explorar palabras <ArrowRight size={16} aria-hidden />
          </Link>
        </div>
      )}
    </div>
  );
}
