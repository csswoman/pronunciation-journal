import { Check } from "lucide-react";

export function QuickAddSuccessState() {
  return (
    <div className="flex flex-col items-center gap-3 px-6 py-12">
      <div className="flex h-12 w-12 items-center justify-center rounded-full bg-[--success-soft] text-[--success]">
        <Check size={22} strokeWidth={2.5} />
      </div>
      <div className="text-center">
        <p className="text-sm font-semibold text-[--fg]">Word saved</p>
        <p className="mt-0.5 text-xs text-[--text-tertiary]">Meaning, IPA &amp; example on their way…</p>
      </div>
    </div>
  );
}
