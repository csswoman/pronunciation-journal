"use client";

// Planned structure:
// <HomeFirstSessionHint>
//   short tip + dismiss
// </HomeFirstSessionHint>

import { useEffect, useState } from "react";
import { X } from "@/components/icons";
import {
  dismissFirstSessionHint,
  readFirstSessionHintDismissed,
} from "@/lib/home/onboarding";

interface HomeFirstSessionHintProps {
  /** Only for learners without meaningful practice yet. */
  enabled: boolean;
}

/** Point-of-use tip when the plan already offers Empieza aquí. */
export default function HomeFirstSessionHint({ enabled }: HomeFirstSessionHintProps) {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    if (!enabled) {
      setVisible(false);
      return;
    }
    setVisible(!readFirstSessionHintDismissed());
  }, [enabled]);

  if (!visible) return null;

  return (
    <div
      className="mb-3 flex items-start gap-2 rounded-md border border-border-subtle bg-surface-sunken/60 px-3 py-2"
      role="status"
    >
      <p className="min-w-0 flex-1 pt-0.5 font-body-sm text-pretty text-fg-muted">
        Tu primera sesión: pulsa{" "}
        <span className="font-medium text-fg">Empieza aquí</span>. Unos minutos bastan.
      </p>
      <button
        type="button"
        className="focus-ring grid h-9 w-9 shrink-0 place-items-center rounded-md text-fg-muted transition-colors hover:bg-surface-raised hover:text-fg"
        aria-label="Ocultar consejo"
        onClick={() => {
          dismissFirstSessionHint();
          setVisible(false);
        }}
      >
        <X size={16} aria-hidden />
      </button>
    </div>
  );
}
