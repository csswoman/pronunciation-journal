"use client";
import { useCallback, useEffect, useState } from "react";
import {
  getAllTheoryLessons,
  deleteTheoryLesson,
  updateTheoryLesson,
} from "@/lib/theory-lessons/queries";
import { getSupabaseBrowserClient } from "@/lib/supabase/client";
import type { TheoryLesson } from "@/lib/types";

async function getAccessToken(): Promise<string> {
  const supabase = getSupabaseBrowserClient();
  const { data: { session } } = await supabase.auth.getSession();
  if (!session) throw new Error("Not authenticated");
  return session.access_token;
}

export function useLessonManager() {
  const [lessons, setLessons] = useState<TheoryLesson[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [togglingId, setTogglingId] = useState<string | null>(null);

  const load = useCallback(() => {
    setLoading(true);
    getAllTheoryLessons()
      .then(setLessons)
      .catch((e) => setError(e instanceof Error ? e.message : "Could not load lessons"))
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => { load(); }, [load]);

  const deleteLesson = useCallback(async (lesson: TheoryLesson) => {
    setDeletingId(lesson.id);
    setError(null);
    try {
      if (lesson.is_system) {
        const token = await getAccessToken();
        const res = await fetch(`/api/lessons/${lesson.id}`, {
          method: "DELETE",
          headers: { Authorization: `Bearer ${token}` },
        });
        if (!res.ok) {
          const body = await res.json();
          throw new Error(body.error ?? "Delete failed");
        }
      } else {
        await deleteTheoryLesson(lesson.id);
      }
      setLessons((prev) => prev.filter((l) => l.id !== lesson.id));
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : "Delete failed");
    } finally {
      setDeletingId(null);
    }
  }, []);

  const togglePublish = useCallback(async (lesson: TheoryLesson) => {
    setTogglingId(lesson.id);
    setError(null);
    try {
      const updated = await updateTheoryLesson(lesson.id, {
        is_published: !lesson.is_published,
      });
      setLessons((prev) => prev.map((l) => (l.id === lesson.id ? updated : l)));
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : "Update failed");
    } finally {
      setTogglingId(null);
    }
  }, []);

  return {
    lessons,
    loading,
    error,
    deletingId,
    togglingId,
    deleteLesson,
    togglePublish,
  };
}
