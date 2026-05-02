"use client";

import { RefObject } from "react";
import { ImagePlus } from "lucide-react";

interface StudyCardImageProps {
  imageUrl: string | null;
  imageLoading: boolean;
  word: string | undefined;
  fileInputRef: RefObject<HTMLInputElement | null>;
  onUpload: (file: File) => void;
  onRemove: () => void;
}

export function StudyCardImage({ imageUrl, imageLoading, word, fileInputRef, onUpload, onRemove }: StudyCardImageProps) {
  return (
    <div
      className="md:w-2/5 bg-[var(--btn-regular-bg)] flex items-center justify-center min-h-[180px] relative overflow-hidden group"
      onClick={(e) => e.stopPropagation()}
    >
      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        className="hidden"
        onChange={(e) => { const f = e.target.files?.[0]; if (f) onUpload(f); e.target.value = ""; }}
      />
      {imageUrl ? (
        <>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={imageUrl} alt={word} className="w-full h-full object-cover" />
          <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
            <button
              onClick={() => fileInputRef.current?.click()}
              className="px-3 py-1.5 rounded-lg bg-white/90 text-xs font-semibold text-gray-800 hover:bg-white transition-colors"
            >
              Change
            </button>
            <button
              onClick={onRemove}
              className="px-3 py-1.5 rounded-lg bg-white/90 text-xs font-semibold text-red-600 hover:bg-white transition-colors"
            >
              Remove
            </button>
          </div>
        </>
      ) : imageLoading ? (
        <div className="flex flex-col items-center gap-3 text-[var(--text-tertiary)]">
          <div className="w-8 h-8 rounded-full border-2 border-[var(--primary)] border-t-transparent animate-spin" />
          <p className="text-xs">Uploading…</p>
        </div>
      ) : (
        <button
          onClick={() => fileInputRef.current?.click()}
          className="flex flex-col items-center gap-2 p-6 text-center text-[var(--text-tertiary)] hover:text-[var(--deep-text)] transition-colors"
        >
          <ImagePlus size={28} className="opacity-40" />
          <p className="text-xs">Add image</p>
        </button>
      )}
    </div>
  );
}
