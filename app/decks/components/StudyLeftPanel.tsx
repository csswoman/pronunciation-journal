"use client";

import { useRef } from "react";
import { ChevronDown, ImagePlus } from "lucide-react";
import { LEVEL_NAMES, STUDY_TIPS } from "./study-utils";

interface StudyLeftPanelProps {
  imageUrl: string | null;
  imageLoading: boolean;
  word?: string;
  levelLabel: string | null;
  partOfSpeech?: string;
  tags?: string[] | null;
  showTip: boolean;
  tipIndex: number;
  onToggleTip: () => void;
  onUpload: (file: File) => void;
  onRemoveImage: () => void;
}

export function StudyLeftPanel({
  imageUrl, imageLoading, word, levelLabel, partOfSpeech, tags,
  showTip, tipIndex, onToggleTip, onUpload, onRemoveImage,
}: StudyLeftPanelProps) {
  const fileInputRef = useRef<HTMLInputElement>(null);

  return (
    <div className="hidden lg:flex flex-col gap-5 w-56 xl:w-64 shrink-0">

      {/* Reference image */}
      <div>
        <p className="text-tiny font-semibold tracking-widest uppercase mb-2"
          style={{ color: "var(--text-tertiary)" }}>Reference</p>
        <input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          className="hidden"
          onChange={(e) => { const f = e.target.files?.[0]; if (f) onUpload(f); e.target.value = ""; }}
        />
        <div className="rounded-xl border border-dashed aspect-[4/3] flex items-center justify-center overflow-hidden relative group"
          style={{ borderColor: "var(--line-divider)", backgroundColor: "var(--btn-regular-bg)" }}>
          {imageUrl ? (
            <>
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={imageUrl} alt={word} className="w-full h-full object-cover" />
              <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
                <button onClick={() => fileInputRef.current?.click()}
                  className="px-2 py-1 rounded-lg bg-overlay-darker text-tiny font-semibold text-fg hover:bg-surface-raised">
                  Change
                </button>
                <button onClick={onRemoveImage}
                  className="px-2 py-1 rounded-lg bg-overlay-darker text-tiny font-semibold text-error hover:bg-surface-raised">
                  Remove
                </button>
              </div>
            </>
          ) : imageLoading ? (
            <div className="flex flex-col items-center gap-2" style={{ color: "var(--text-tertiary)" }}>
              <div className="w-6 h-6 rounded-full border-2 border-t-transparent animate-spin"
                style={{ borderColor: "var(--primary)", borderTopColor: "transparent" }} />
              <p className="text-tiny">Uploading…</p>
            </div>
          ) : (
            <button onClick={() => fileInputRef.current?.click()}
              className="flex flex-col items-center gap-2 p-4 w-full h-full justify-center transition-colors"
              style={{ color: "var(--text-tertiary)" }}
              onMouseEnter={e => (e.currentTarget.style.color = "var(--deep-text)")}
              onMouseLeave={e => (e.currentTarget.style.color = "var(--text-tertiary)")}>
              <ImagePlus size={22} className="opacity-40" />
              <p className="text-tiny text-center">Add reference<br />image</p>
            </button>
          )}
        </div>
      </div>

      {/* Details */}
      <div>
        <p className="text-tiny font-semibold tracking-widest uppercase mb-3"
          style={{ color: "var(--text-tertiary)" }}>Details</p>
        <div className="space-y-3">
          {levelLabel && (
            <div>
              <p className="text-tiny mb-1" style={{ color: "var(--text-tertiary)" }}>Level</p>
              <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full border text-xs font-semibold"
                style={{ borderColor: "var(--warning)", backgroundColor: "var(--warning-soft)", color: "var(--warning)" }}>
                {levelLabel} · {LEVEL_NAMES[levelLabel] ?? ""}
              </span>
            </div>
          )}
          {tags && tags.length > 0 && (
            <div>
              <p className="text-tiny mb-1" style={{ color: "var(--text-tertiary)" }}>Category</p>
              <p className="text-sm font-semibold" style={{ color: "var(--deep-text)" }}>{tags[0]}</p>
            </div>
          )}
          {partOfSpeech && (
            <div>
              <p className="text-tiny mb-1" style={{ color: "var(--text-tertiary)" }}>Part of speech</p>
              <p className="text-sm font-semibold capitalize" style={{ color: "var(--deep-text)" }}>{partOfSpeech}</p>
            </div>
          )}
        </div>
      </div>

      {/* Tip */}
      {showTip && (
        <div className="rounded-xl border overflow-hidden" style={{ borderColor: "var(--line-divider)" }}>
          <button
            onClick={onToggleTip}
            className="w-full flex items-center justify-between px-3 py-2.5 text-left transition-colors"
            onMouseEnter={e => (e.currentTarget.style.backgroundColor = "var(--btn-regular-bg)")}
            onMouseLeave={e => (e.currentTarget.style.backgroundColor = "transparent")}
          >
            <span className="text-xs font-semibold" style={{ color: "var(--deep-text)" }}>Tip</span>
            <ChevronDown size={14} style={{ color: "var(--text-tertiary)" }} />
          </button>
          <div className="px-3 pb-3">
            <p className="text-xs leading-relaxed" style={{ color: "var(--text-secondary)" }}>{STUDY_TIPS[tipIndex]}</p>
          </div>
        </div>
      )}
    </div>
  );
}

