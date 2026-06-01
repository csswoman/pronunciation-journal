import { getSupabaseBrowserClient } from "@/lib/supabase/client";
import type { TheoryLesson } from "@/lib/types";

const TABLE = "theory_lessons";

/** All lessons visible to the current user (own + published system lessons) */
export async function getAllTheoryLessons(): Promise<TheoryLesson[]> {
  const supabase = getSupabaseBrowserClient();
  const { data, error } = await supabase
    .from(TABLE)
    .select("*")
    .order("created_at", { ascending: false });

  if (error) throw error;
  return (data ?? []) as TheoryLesson[];
}

/** All lessons visible to the current user filtered by category */
export async function getTheoryLessonsByCategory(
  category: string
): Promise<TheoryLesson[]> {
  const supabase = getSupabaseBrowserClient();
  const { data, error } = await supabase
    .from(TABLE)
    .select("*")
    .eq("category", category)
    .order("created_at", { ascending: false });

  if (error) throw error;
  return (data ?? []) as TheoryLesson[];
}

/** Single lesson by slug — RLS ensures user can only see allowed lessons */
export async function getTheoryLessonBySlug(
  slug: string
): Promise<TheoryLesson | null> {
  const supabase = getSupabaseBrowserClient();
  const { data, error } = await supabase
    .from(TABLE)
    .select("*")
    .eq("slug", slug)
    .maybeSingle();

  if (error) throw error;
  return data as TheoryLesson | null;
}
