import { getSupabaseBrowserClient } from "@/lib/supabase/client";
import type { TheoryLesson, TheoryLessonDraft } from "@/lib/types";

const TABLE = "theory_lessons";
type TheoryLessonInsert = Omit<TheoryLessonDraft, "id" | "created_at" | "updated_at">;
type TheoryLessonUpdate = Partial<
  Omit<TheoryLesson, "id" | "user_id" | "is_system" | "created_at" | "updated_at">
>;

// ── Read ──────────────────────────────────────────────────────────────────────

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

/** Only the current user's own lessons */
export async function getMyTheoryLessons(): Promise<TheoryLesson[]> {
  const supabase = getSupabaseBrowserClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return [];

  const { data, error } = await supabase
    .from(TABLE)
    .select("*")
    .eq("user_id", user.id)
    .order("created_at", { ascending: false });

  if (error) throw error;
  return (data ?? []) as TheoryLesson[];
}

// ── Write ─────────────────────────────────────────────────────────────────────

export async function createTheoryLesson(
  draft: Omit<TheoryLessonDraft, "user_id" | "is_system">
): Promise<TheoryLesson> {
  const supabase = getSupabaseBrowserClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error("Not authenticated");

  const { data, error } = await supabase
    .from(TABLE)
    .insert({
      ...draft,
      user_id: user.id,
      is_system: false,
    } satisfies TheoryLessonInsert)
    .select()
    .single();

  if (error) throw error;
  return data as TheoryLesson;
}

export async function updateTheoryLesson(
  id: string,
  patch: TheoryLessonUpdate
): Promise<TheoryLesson> {
  const supabase = getSupabaseBrowserClient();
  const { data, error } = await supabase
    .from(TABLE)
    .update(patch)
    .eq("id", id)
    .select()
    .single();

  if (error) throw error;
  return data as TheoryLesson;
}

export async function deleteTheoryLesson(id: string): Promise<void> {
  const supabase = getSupabaseBrowserClient();
  const { error } = await supabase.from(TABLE).delete().eq("id", id);
  if (error) throw error;
}

// ── Cover image upload ────────────────────────────────────────────────────────

export async function uploadLessonCover(
  userId: string,
  file: File
): Promise<string> {
  const supabase = getSupabaseBrowserClient();
  const ext = file.name.split(".").pop();
  const path = `${userId}/${crypto.randomUUID()}.${ext}`;

  const { error } = await supabase.storage
    .from("lesson-covers")
    .upload(path, file, { upsert: false });

  if (error) throw error;

  const { data } = supabase.storage.from("lesson-covers").getPublicUrl(path);
  return data.publicUrl;
}

// ── Slug helper ───────────────────────────────────────────────────────────────

export function slugify(title: string): string {
  return title
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9\s-]/g, "")
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-");
}
