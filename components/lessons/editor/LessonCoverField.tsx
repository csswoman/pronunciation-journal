"use client";
import { useRef } from "react";
import Image from "next/image";
import Button from "@/components/ui/Button";

interface LessonCoverFieldProps {
  coverUrl: string;
  uploading: boolean;
  onUpload: (file: File) => void;
  onClear: () => void;
}

export default function LessonCoverField({ coverUrl, uploading, onUpload, onClear }: LessonCoverFieldProps) {
  const inputRef = useRef<HTMLInputElement>(null);

  return (
    <div>
      <label className="block text-xs font-semibold mb-1.5 uppercase tracking-wider text-fg-muted">
        Cover image
      </label>
      <input
        ref={inputRef}
        type="file"
        accept="image/*"
        className="hidden"
        onChange={(e) => {
          const file = e.target.files?.[0];
          if (file) onUpload(file);
        }}
      />
      {coverUrl ? (
        <div className="relative rounded-xl overflow-hidden h-40">
          <Image src={coverUrl} alt="cover" fill className="object-cover" />
          <Button
            onClick={onClear}
            className="absolute top-2 right-2 p-1.5 rounded-lg bg-black/50 text-on-primary hover:bg-black/70 transition-colors"
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </Button>
        </div>
      ) : (
        <Button
          onClick={() => inputRef.current?.click()}
          disabled={uploading}
          className="w-full h-28 rounded-xl border-2 border-dashed border-[var(--line-divider)] flex flex-col items-center justify-center gap-2 text-sm hover:border-[var(--primary)] transition-colors disabled:opacity-50 text-fg-subtle"
        >
          {uploading ? (
            <div className="w-5 h-5 border-2 border-[var(--primary)] border-t-transparent rounded-full animate-spin" />
          ) : (
            <>
              <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
              </svg>
              <span>Click to upload cover</span>
            </>
          )}
        </Button>
      )}
    </div>
  );
}
