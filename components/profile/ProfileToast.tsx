"use client";

// Planned structure:
// <ProfileToast>
//   <ToastIcon />
//   <ToastMessage />
// </ProfileToast>

import { cn } from "@/lib/cn";

interface Props {
  message: string;
  type: "success" | "error";
}

export default function ProfileToast({ message, type }: Props) {
  return (
    <div
      role="status"
      aria-live="polite"
      className={cn(
        "fixed top-6 right-6 z-50 flex items-center gap-3 rounded-xl border px-4 py-3 font-caption text-body-sm font-medium shadow-lg backdrop-blur-md transition-all animate-in fade-in slide-in-from-top-3 duration-200",
        type === "success"
          ? "border-success/30 bg-success-soft/90 text-success"
          : "border-error/30 bg-error-soft/90 text-error",
      )}
    >
      {type === "success" ? (
        <svg className="size-4 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" />
        </svg>
      ) : (
        <svg className="size-4 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
      )}
      <span>{message}</span>
    </div>
  );
}
