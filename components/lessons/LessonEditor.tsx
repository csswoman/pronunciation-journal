"use client";

import { useState, useCallback, useRef } from "react";
import { useRouter } from "next/navigation";
import dynamic from "next/dynamic";
import Link from "next/link";
import {
  createTheoryLesson,
  updateTheoryLesson,
  uploadLessonCover,
  slugify,
} from "@/lib/theory-lessons/queries";
import { LESSON_CATEGORIES } from "@/lib/types";
import type { TheoryLesson, LessonCategory } from "@/lib/types";
import { getSupabaseBrowserClient } from "@/lib/supabase/client";

const MDEditor = dynamic(() => import("@uiw/react-md-editor"), { ssr: false });

interface LessonEditorProps {
  initialLesson?: TheoryLesson;
}

export default function LessonEditor({ initialLesson }: LessonEditorProps) {
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

  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleTitleChange = (val: string) => {
    setTitle(val);
    if (!slugEdited) setSlug(slugify(val));
  };

  const handleSlugChange = (val: string) => {
    setSlug(slugify(val));
    setSlugEdited(true);
  };

  const handleCoverUpload = useCallback(async (file: File) => {
    setUploadingCover(true);
    setError(null);
    try {
      const supabase = getSupabaseBrowserClient();
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Not authenticated");
      const url = await uploadLessonCover(user.id, file);
      setCoverUrl(url);
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : "Upload failed");
    } finally {
      setUploadingCover(false);
    }
  }, []);

  const handleSave = async () => {
    if (!title.trim()) { setError("Title is required"); return; }
    if (!slug.trim())  { setError("Slug is required"); return; }
    if (!content.trim()) { setError("Content cannot be empty"); return; }

    setSaving(true);
    setError(null);
    try {
      if (isEdit && initialLesson) {
        await updateTheoryLesson(initialLesson.id, {
          title,
          slug,
          category,
          content,
          cover_image_url: coverUrl || null,
          is_published: isPublished,
        });
        router.push(`/lessons/${slug}`);
      } else {
        const created = await createTheoryLesson({
          title,
          slug,
          category,
          content,
          cover_image_url: coverUrl || null,
          is_published: isPublished,
        });
        router.push(`/lessons/${created.slug}`);
      }
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : "Could not save lesson");
      setSaving(false);
    }
  };

  return (
    <div className="min-h-screen" style={{ backgroundColor: "var(--page-bg)" }}>
      <div className="max-w-4xl mx-auto px-4 py-8">
        {/* Header */}
        <div className="flex items-center gap-3 mb-8">
          <Link
            href={isEdit ? `/lessons/${initialLesson?.slug}` : "/lessons"}
            className="p-2 rounded-xl hover:bg-[var(--btn-plain-bg-hover)] transition-colors"
            style={{ color: "var(--text-secondary)" }}
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
          </Link>
          <h1 className="text-xl font-bold" style={{ color: "var(--deep-text)" }}>
            {isEdit ? "Edit lesson" : "New lesson"}
          </h1>
        </div>

        <div className="flex flex-col gap-6">
          {/* Title */}
          <div>
            <label className="block text-xs font-semibold mb-1.5 uppercase tracking-wider" style={{ color: "var(--text-secondary)" }}>
              Title
            </label>
            <input
              type="text"
              value={title}
              onChange={(e) => handleTitleChange(e.target.value)}
              placeholder="e.g. Introduction to Vowel Sounds"
              className="w-full px-4 py-2.5 rounded-xl border border-[var(--line-divider)] bg-[var(--card-bg)] text-sm focus:outline-none focus:border-[var(--primary)]"
              style={{ color: "var(--deep-text)" }}
            />
          </div>

          {/* Slug */}
          <div>
            <label className="block text-xs font-semibold mb-1.5 uppercase tracking-wider" style={{ color: "var(--text-secondary)" }}>
              Slug (URL)
            </label>
            <div className="flex items-center gap-2">
              <span className="text-xs px-2" style={{ color: "var(--text-tertiary)" }}>/lessons/</span>
              <input
                type="text"
                value={slug}
                onChange={(e) => handleSlugChange(e.target.value)}
                placeholder="intro-vowel-sounds"
                className="flex-1 px-4 py-2.5 rounded-xl border border-[var(--line-divider)] bg-[var(--card-bg)] text-sm focus:outline-none focus:border-[var(--primary)]"
                style={{ color: "var(--deep-text)" }}
              />
            </div>
          </div>

          {/* Category + Published row */}
          <div className="flex gap-4 flex-wrap">
            <div className="flex-1 min-w-[180px]">
              <label className="block text-xs font-semibold mb-1.5 uppercase tracking-wider" style={{ color: "var(--text-secondary)" }}>
                Category
              </label>
              <select
                value={category}
                onChange={(e) => setCategory(e.target.value as LessonCategory)}
                className="w-full px-4 py-2.5 rounded-xl border border-[var(--line-divider)] bg-[var(--card-bg)] text-sm focus:outline-none focus:border-[var(--primary)]"
                style={{ color: "var(--deep-text)" }}
              >
                {LESSON_CATEGORIES.map((c) => (
                  <option key={c.value} value={c.value}>{c.label}</option>
                ))}
              </select>
            </div>

            <div className="flex items-end pb-0.5">
              <label className="flex items-center gap-2.5 cursor-pointer select-none">
                <div
                  onClick={() => setIsPublished((v) => !v)}
                  className={`w-9 h-5 rounded-full transition-colors relative ${isPublished ? "bg-[var(--primary)]" : "bg-[var(--btn-plain-bg-hover)]"}`}
                >
                  <div className={`absolute top-0.5 left-0.5 w-4 h-4 rounded-full bg-white shadow transition-transform ${isPublished ? "translate-x-4" : ""}`} />
                </div>
                <span className="text-sm font-medium" style={{ color: "var(--deep-text)" }}>
                  {isPublished ? "Published" : "Draft"}
                </span>
              </label>
            </div>
          </div>

          {/* Cover image */}
          <div>
            <label className="block text-xs font-semibold mb-1.5 uppercase tracking-wider" style={{ color: "var(--text-secondary)" }}>
              Cover image
            </label>
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              className="hidden"
              onChange={(e) => {
                const file = e.target.files?.[0];
                if (file) handleCoverUpload(file);
              }}
            />
            {coverUrl ? (
              <div className="relative rounded-xl overflow-hidden h-40">
                <img src={coverUrl} alt="cover" className="w-full h-full object-cover" />
                <button
                  onClick={() => setCoverUrl("")}
                  className="absolute top-2 right-2 p-1.5 rounded-lg bg-black/50 text-white hover:bg-black/70 transition-colors"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
            ) : (
              <button
                onClick={() => fileInputRef.current?.click()}
                disabled={uploadingCover}
                className="w-full h-28 rounded-xl border-2 border-dashed border-[var(--line-divider)] flex flex-col items-center justify-center gap-2 text-sm hover:border-[var(--primary)] transition-colors disabled:opacity-50"
                style={{ color: "var(--text-tertiary)" }}
              >
                {uploadingCover ? (
                  <div className="w-5 h-5 border-2 border-[var(--primary)] border-t-transparent rounded-full animate-spin" />
                ) : (
                  <>
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                    </svg>
                    <span>Click to upload cover</span>
                  </>
                )}
              </button>
            )}
          </div>

          {/* Markdown editor */}
          <div>
            <label className="block text-xs font-semibold mb-1.5 uppercase tracking-wider" style={{ color: "var(--text-secondary)" }}>
              Content (Markdown)
            </label>
            <div data-color-mode="auto">
              <MDEditor
                value={content}
                onChange={(val) => setContent(val ?? "")}
                height={480}
                preview="live"
              />
            </div>
          </div>

          {/* Error */}
          {error && (
            <div className="rounded-xl p-3 bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400 text-sm">
              {error}
            </div>
          )}

          {/* Actions */}
          <div className="flex items-center gap-3 pt-2">
            <button
              onClick={handleSave}
              disabled={saving || uploadingCover}
              className="px-6 py-2.5 rounded-xl text-sm font-semibold transition-colors disabled:opacity-50"
              style={{ background: "var(--primary)", color: "var(--accent-text)" }}
            >
              {saving ? "Saving…" : isEdit ? "Save changes" : "Create lesson"}
            </button>
            <Link
              href={isEdit ? `/lessons/${initialLesson?.slug}` : "/lessons"}
              className="px-4 py-2.5 rounded-xl text-sm font-medium border border-[var(--line-divider)] hover:bg-[var(--btn-plain-bg-hover)] transition-colors"
              style={{ color: "var(--deep-text)" }}
            >
              Cancel
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
