"use client";

import { useCallback, useEffect, useState } from "react";
import Button from "@/components/ui/Button";
import { isLessonComplete } from "@/lib/db";
import { recordLessonComplete } from "@/lib/practice/queries";
import { getCurrentUser } from "@/lib/auth/session";

const COURSE_SLUG = "mini-lessons";

interface Props {
  slug: string;
}

async function getOptionalUserId(): Promise<string | null> {
  try {
    const user = await getCurrentUser();
    return user?.id ?? null;
  } catch {
    return null;
  }
}

export default function MiniLessonComplete({ slug }: Props) {
  const [completed, setCompleted] = useState(false);
  const [marking, setMarking] = useState(false);

  useEffect(() => {
    let cancelled = false;
    void getOptionalUserId()
      .then((userId) => {
        return userId ? isLessonComplete(userId, COURSE_SLUG, slug) : false;
      })
      .then((value) => {
        if (!cancelled) setCompleted((current) => current || Boolean(value));
      });
    return () => {
      cancelled = true;
    };
  }, [slug]);

  const handleMarkRead = useCallback(async () => {
    if (completed || marking) return;
    setMarking(true);
    try {
      const userId = await getOptionalUserId();
      if (!userId) return;
      const already = await isLessonComplete(userId, COURSE_SLUG, slug);
      if (already) {
        setCompleted(true);
        return;
      }
      await recordLessonComplete(COURSE_SLUG, slug);
      setCompleted(true);
    } finally {
      setMarking(false);
    }
  }, [completed, marking, slug]);

  if (completed) {
    return (
      <p className="text-caption text-success font-medium" role="status">
        ✓ Lección completada
      </p>
    );
  }

  return (
    <Button
      variant="secondary"
      onClick={() => void handleMarkRead()}
      disabled={marking}
    >
      {marking ? "Guardando…" : "Marcar como leída"}
    </Button>
  );
}
