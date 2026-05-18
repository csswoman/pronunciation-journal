"use client";
import { useCallback, useState } from "react";
import { useRouter } from "next/navigation";
import {
  createTheoryLesson,
  updateTheoryLesson,
  uploadLessonCover,
  slugify,
} from "@/lib/theory-lessons/queries";
import { getSupabaseBrowserClient } from "@/lib/supabase/client";
import type { TheoryLesson, LessonCategory } from "@/lib/types";

export function useLessonEditor(initialLesson?: TheoryLesson) {
  const router = useRouter();
  const isEdit = !!initialLesson;

  const [title, setTitle] = useState(initialLesson?.title ?? "");
  const [slug, setSlug] = useState(initialLesson?.slug ?? "");
  const [slugEdited, setSlugEdited] = useState(isEdit);
  const [category, setCategory] = useState<LessonCategory>(
    (initialLesson?.category as LessonCategory) ?? "general"
  );
  const [content, setContent] = useState(initialLesson?.content ?? "");
  const [coverUrl, setCoverUrl] = useState(initialLesson?.cover_image_url ?? "");
  const [isPublished, setIsPublished] = useState(initialLesson?.is_published ?? false);

  const [saving, setSaving] = useState(false);
  const [uploadingCover, setUploadingCover] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleTitleChange = useCallback((val: string) => {
    setTitle(val);
    setSlug((prev) => (slugEdited ? prev : slugify(val)));
  }, [slugEdited]);

  const handleSlugChange = useCallback((val: string) => {
    setSlug(slugify(val));
    setSlugEdited(true);
  }, []);

  const applyAIDraft = useCallback((aiTitle: string, aiContent: string) => {
    setTitle(aiTitle);
    setContent(aiContent);
    setSlug((prev) => (slugEdited ? prev : slugify(aiTitle)));
  }, [slugEdited]);

  const handleCoverUpload = useCallback(async (file: File) => {
    setUploadingCover(true);
    setError(null);
    try {
      const supabase = getSupabaseBrowserClient();
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Not authenticated");
      setCoverUrl(await uploadLessonCover(user.id, file));
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : "Upload failed");
    } finally {
      setUploadingCover(false);
    }
  }, []);

  const save = useCallback(async () => {
    if (!title.trim()) { setError("Title is required"); return; }
    if (!slug.trim()) { setError("Page link is required"); return; }
    if (!content.trim()) { setError("Content cannot be empty"); return; }

    setSaving(true);
    setError(null);
    try {
      if (isEdit && initialLesson) {
        await updateTheoryLesson(initialLesson.id, {
          title, slug, category, content,
          cover_image_url: coverUrl || null,
          is_published: isPublished,
        });
      } else {
        await createTheoryLesson({
          title, slug, category, content,
          cover_image_url: coverUrl || null,
          is_published: isPublished,
          source: "manual",
          notion_page_id: null,
          notion_last_edited: null,
          notion_synced_at: null,
        });
      }
      router.push("/admin/lessons");
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : "Could not save lesson");
      setSaving(false);
    }
  }, [isEdit, initialLesson, title, slug, category, content, coverUrl, isPublished, router]);

  return {
    isEdit,
    title, slug, category, content, coverUrl, isPublished,
    saving, uploadingCover, error,
    setCategory, setContent, setIsPublished, setCoverUrl, setError,
    handleTitleChange, handleSlugChange, handleCoverUpload, applyAIDraft, save,
  };
}
