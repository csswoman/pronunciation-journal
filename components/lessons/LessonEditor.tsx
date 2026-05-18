"use client";
// Planned structure:
// <LessonEditor>
//   <EditorHeader />        (back, title, save)
//   <LessonAIPanel />       (AI draft generation)
//   <DetailsCard />         (title, page link, category, publish, cover)
//   <ContentCard />         (markdown editor)
//   <EditorActions />
// </LessonEditor>
import dynamic from "next/dynamic";
import Link from "next/link";
import Button from "@/components/ui/Button";
import { H1 } from "@/components/ui/Typography";
import LessonAIPanel from "@/components/lessons/editor/LessonAIPanel";
import LessonCoverField from "@/components/lessons/editor/LessonCoverField";
import { useLessonEditor } from "@/hooks/useLessonEditor";
import { LESSON_CATEGORIES } from "@/lib/types";
import type { TheoryLesson, LessonCategory } from "@/lib/types";

const MDEditor = dynamic(() => import("@uiw/react-md-editor"), { ssr: false });

const fieldClass =
  "w-full px-4 py-2.5 rounded-xl border border-[var(--line-divider)] bg-[var(--card-bg)] text-sm focus:outline-none focus:border-[var(--primary)] text-fg";
const labelClass =
  "block text-xs font-semibold mb-1.5 uppercase tracking-wider text-fg-muted";

interface LessonEditorProps {
  initialLesson?: TheoryLesson;
}

export default function LessonEditor({ initialLesson }: LessonEditorProps) {
  const ed = useLessonEditor(initialLesson);

  return (
    <div className="min-h-screen bg-surface-base">
      <div className="max-w-3xl mx-auto px-4 py-8 flex flex-col gap-6">
        {/* Header */}
        <div className="flex items-center gap-3">
          <Link
            href="/admin/lessons"
            className="p-2 rounded-xl hover:bg-[var(--btn-plain-bg-hover)] transition-colors text-fg-muted"
            aria-label="Back to Lesson Manager"
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
          </Link>
          <H1 className="text-xl font-bold flex-1">
            {ed.isEdit ? "Edit lesson" : "New lesson"}
          </H1>
          <Button
            onClick={ed.save}
            disabled={ed.saving || ed.uploadingCover}
            className="px-5 py-2 rounded-xl text-sm font-semibold bg-primary text-on-primary disabled:opacity-50"
          >
            {ed.saving ? "Saving…" : ed.isEdit ? "Save changes" : "Create lesson"}
          </Button>
        </div>

        <LessonAIPanel
          hasContent={ed.content.trim().length > 0}
          onGenerated={ed.applyAIDraft}
        />

        {/* Lesson details */}
        <div className="rounded-2xl border border-[var(--line-divider)] bg-[var(--card-bg)] p-5 flex flex-col gap-5">
          <p className="text-xs font-semibold uppercase tracking-widest text-fg-subtle">
            Lesson details
          </p>

          <div>
            <label className={labelClass}>Title</label>
            <input
              type="text"
              value={ed.title}
              onChange={(e) => ed.handleTitleChange(e.target.value)}
              placeholder="e.g. Introduction to Vowel Sounds"
              className={fieldClass}
            />
          </div>

          <div>
            <label className={labelClass}>Page link</label>
            <p className="text-xs mb-1.5 text-fg-subtle">
              Created automatically from the title — only change it if you need a custom web address.
            </p>
            <div className="flex items-center gap-2">
              <span className="text-xs px-2 text-fg-subtle">/courses/library/</span>
              <input
                type="text"
                value={ed.slug}
                onChange={(e) => ed.handleSlugChange(e.target.value)}
                placeholder="intro-vowel-sounds"
                className={`flex-1 ${fieldClass}`}
              />
            </div>
          </div>

          <div className="flex gap-4 flex-wrap">
            <div className="flex-1 min-w-[180px]">
              <label className={labelClass}>Category</label>
              <select
                value={ed.category}
                onChange={(e) => ed.setCategory(e.target.value as LessonCategory)}
                className={fieldClass}
              >
                {LESSON_CATEGORIES.map((c) => (
                  <option key={c.value} value={c.value}>{c.label}</option>
                ))}
              </select>
            </div>

            <div className="flex items-end pb-0.5">
              <label className="flex items-center gap-2.5 cursor-pointer select-none">
                <div
                  onClick={() => ed.setIsPublished(!ed.isPublished)}
                  className={`w-9 h-5 rounded-full transition-colors relative ${ed.isPublished ? "bg-[var(--primary)]" : "bg-[var(--btn-plain-bg-hover)]"}`}
                >
                  <div className={`absolute top-0.5 left-0.5 w-4 h-4 rounded-full bg-surface-raised shadow transition-transform ${ed.isPublished ? "translate-x-4" : ""}`} />
                </div>
                <span className="text-sm font-medium text-fg">
                  {ed.isPublished ? "Published" : "Draft"}
                </span>
              </label>
            </div>
          </div>

          <LessonCoverField
            coverUrl={ed.coverUrl}
            uploading={ed.uploadingCover}
            onUpload={ed.handleCoverUpload}
            onClear={() => ed.setCoverUrl("")}
          />
        </div>

        {/* Content */}
        <div className="rounded-2xl border border-[var(--line-divider)] bg-[var(--card-bg)] p-5">
          <label className={labelClass}>Lesson content</label>
          <p className="text-xs mb-2.5 text-fg-subtle">
            Use the toolbar to add headings, bold text, lists and images. The right panel shows a live preview.
          </p>
          <div data-color-mode="auto">
            <MDEditor
              value={ed.content}
              onChange={(val) => ed.setContent(val ?? "")}
              height={480}
              preview="live"
            />
          </div>
        </div>

        {ed.error && (
          <div className="rounded-xl p-3 bg-error-soft text-error text-sm">
            {ed.error}
          </div>
        )}

        {/* Actions */}
        <div className="flex items-center gap-3">
          <Button
            onClick={ed.save}
            disabled={ed.saving || ed.uploadingCover}
            className="px-6 py-2.5 rounded-xl text-sm font-semibold bg-primary text-on-primary disabled:opacity-50"
          >
            {ed.saving ? "Saving…" : ed.isEdit ? "Save changes" : "Create lesson"}
          </Button>
          <Link
            href="/admin/lessons"
            className="px-4 py-2.5 rounded-xl text-sm font-medium border border-[var(--line-divider)] hover:bg-[var(--btn-plain-bg-hover)] transition-colors text-fg"
          >
            Cancel
          </Link>
        </div>
      </div>
    </div>
  );
}
