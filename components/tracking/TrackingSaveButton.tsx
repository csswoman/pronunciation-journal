"use client";

import { useState } from "react";
import { useLiveQuery } from "dexie-react-hooks";
import { Bookmark, BookmarkCheck, Heart } from "@/components/icons";
import { useAuth } from "@/components/auth/AuthProvider";
import { db } from "@/lib/db";
import { removeTrackedItem, saveTrackedItem } from "@/lib/tracking/queries";
import Button from "@/components/ui/Button";
import type { PersistedTrackedKind } from "@/lib/tracking/types";
import { cn } from "@/lib/cn";

// Planned structure:
// <TrackingSaveButton>
//   <button onClick=toggle>
//     <HeartIcon | BookmarkIcon />
//     {label?}
//   </button>
// </TrackingSaveButton>

interface Props {
  kind: PersistedTrackedKind;
  reference: string;
  title: string;
  payload?: Record<string, unknown>;
  variant?: "bookmark" | "heart";
  className?: string;
}

export function TrackingSaveButton({
  kind,
  reference,
  title,
  payload,
  variant = "bookmark",
  className,
}: Props) {
  let user: { id: string } | null = null;
  try {
    user = useAuth()?.user ?? null;
  } catch {
    user = null;
  }
  const [busy, setBusy] = useState(false);

  const isTracked = useLiveQuery(
    async () => {
      if (!user) return false;
      const count = await db.trackedItems
        .where("[userId+kind+ref]")
        .equals([user.id, kind, reference])
        .count();
      return count > 0;
    },
    [user?.id, kind, reference],
    false,
  );

  async function toggle() {
    if (!user || busy) return;
    setBusy(true);
    try {
      if (isTracked) {
        await removeTrackedItem(user.id, kind, reference);
      } else {
        await saveTrackedItem({ userId: user.id, kind, ref: reference, title, payload });
      }
    } finally {
      setBusy(false);
    }
  }

  if (variant === "heart") {
    return (
      <button
        type="button"
        onClick={(e) => {
          e.preventDefault();
          e.stopPropagation();
          void toggle();
        }}
        disabled={!user || busy}
        title={isTracked ? "Quitar de guardados" : "Guardar lección"}
        aria-label={isTracked ? "Quitar de guardados" : "Guardar lección"}
        className={cn(
          "focus-ring inline-flex size-8 shrink-0 items-center justify-center rounded-full transition-colors",
          isTracked
            ? "text-error hover:text-error/80"
            : "text-fg-muted hover:text-fg hover:bg-surface-sunken",
          className,
        )}
      >
        <Heart
          size={16}
          className={cn(isTracked && "fill-current")}
          aria-hidden
        />
      </button>
    );
  }

  return (
    <Button
      variant="ghost"
      size="sm"
      icon={isTracked ? <BookmarkCheck size={14} aria-hidden /> : <Bookmark size={14} aria-hidden />}
      onClick={() => void toggle()}
      disabled={!user || busy}
      className={className}
    >
      {isTracked ? "Guardada" : busy ? "Guardando…" : "Guardar en Tracking"}
    </Button>
  );
}
