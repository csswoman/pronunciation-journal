"use client";

import { useRef } from "react";
import Image from "next/image";
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
        <p className="text-tiny font-semibold tracking-widest uppercase mb-2 text-fg-subtle">Reference</p>
        <input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          className="hidden"
          onChange={(e) => { const f = e.target.files?.[0]; if (f) onUpload(f); e.target.value = ""; }}
        />
        <div className="rounded-xl border border-dashed border-border-subtle aspect-[4/3] flex items-center justify-center overflow-hidden relative group bg-surface-sunken">
          {imageUrl ? (
            <>
              <Image src={imageUrl} alt={word ?? ""} fill className="object-cover" />
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
            <div className="flex flex-col items-center gap-2 text-fg-subtle">
              <div className="w-6 h-6 rounded-full border-2 border-t-transparent animate-spin" />
              <p className="text-tiny">Uploading…</p>
            </div>
          ) : (
            <button onClick={() => fileInputRef.current?.click()}
              className="flex flex-col items-center gap-2 p-4 w-full h-full justify-center transition-colors text-fg-subtle hover:text-fg">
              <ImagePlus size={22} className="opacity-40" />
              <p className="text-tiny text-center">Add reference<br />image</p>
            </button>
          )}
        </div>
      </div>

      {/* Details */}
      <div>
        <p className="text-tiny font-semibold tracking-widest uppercase mb-3 text-fg-subtle">Details</p>
        <div className="space-y-3">
          {levelLabel && (
            <div>
              <p className="text-tiny mb-1 text-fg-subtle">Level</p>
              <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full border border-warning bg-warning-soft text-warning text-xs font-semibold">
                {levelLabel} · {LEVEL_NAMES[levelLabel] ?? ""}
              </span>
            </div>
          )}
          {tags && tags.length > 0 && (
            <div>
              <p className="text-tiny mb-1 text-fg-subtle">Category</p>
              <p className="text-sm font-semibold text-fg">{tags[0]}</p>
            </div>
          )}
          {partOfSpeech && (
            <div>
              <p className="text-tiny mb-1 text-fg-subtle">Part of speech</p>
              <p className="text-sm font-semibold capitalize text-fg">{partOfSpeech}</p>
            </div>
          )}
        </div>
      </div>

      {/* Tip */}
      {showTip && (
        <div className="rounded-xl border border-border-subtle overflow-hidden">
          <button
            onClick={onToggleTip}
            className="w-full flex items-center justify-between px-3 py-2.5 text-left transition-colors hover:bg-surface-sunken"
          >
            <span className="text-xs font-semibold text-fg">Tip</span>
            <ChevronDown size={14} className="text-fg-subtle" />
          </button>
          <div className="px-3 pb-3">
            <p className="text-xs leading-relaxed text-fg-muted">{STUDY_TIPS[tipIndex]}</p>
          </div>
        </div>
      )}
    </div>
  );
}

