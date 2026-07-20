import { Check, Sparkles } from "@/components/icons";

export function QuickAddSuccessState({ word }: { word: string }) {
  return (
    <div className="flex flex-col items-center gap-4 px-6 py-12">
      <div className="flex h-12 w-12 items-center justify-center rounded-full bg-success-light text-success">
        <Check size={22} strokeWidth={2.5} />
      </div>
      <div className="text-center">
        <p className="text-base font-semibold text-fg">{word || "La palabra"} ya está en Tracking</p>
        <p className="mt-1 flex items-center justify-center gap-1.5 text-sm text-fg-muted"><Sparkles size={13} aria-hidden />Preparando significado, IPA y ejemplo.</p>
      </div>
    </div>
  );
}
