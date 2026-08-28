"use client";

// Planned structure:
// <ConceptFeedbackSelector>
//   <PromptLabel />
//   <OptionButtonGroup>
//     <FeedbackOptionButton option="mastered" label="Lo tengo" icon=Check />
//     <FeedbackOptionButton option="so_so" label="Más o menos" icon=HelpCircle />
//     <FeedbackOptionButton option="need_help" label="Necesito ayuda" icon=AlertCircle />
//   </OptionButtonGroup>
// </ConceptFeedbackSelector>

import { useState } from "react";
import { useLiveQuery } from "dexie-react-hooks";
import { AlertCircle, Check, HelpCircle } from "@/components/icons";
import { useAuth } from "@/components/auth/AuthProvider";
import { db } from "@/lib/db";
import { saveManualConceptSignal } from "@/lib/learning-focus/queries";
import type { ManualSignalOption } from "@/lib/learning-focus/claims";
import type { CefrLevelId } from "@/lib/courses/types";
import { cn } from "@/lib/cn";

interface ConceptFeedbackSelectorProps {
  lessonSlug: string;
  level?: CefrLevelId;
  title?: string;
  className?: string;
  compact?: boolean;
}

export default function ConceptFeedbackSelector({
  lessonSlug,
  level = "a1",
  title,
  className,
  compact = false,
}: ConceptFeedbackSelectorProps) {
  let user: { id: string } | null = null;
  try {
    user = useAuth()?.user ?? null;
  } catch {
    user = null;
  }
  const [saving, setSaving] = useState(false);

  const currentSignal = useLiveQuery(
    async () => {
      if (!user) return null;
      const rec = await db.learningState.get(user.id);
      const concepts = rec?.state.theory?.concepts ?? [];
      return concepts.find((c) => c.lessonSlug === lessonSlug) ?? null;
    },
    [user?.id, lessonSlug],
    null,
  );

  const selectedOption: ManualSignalOption | null = (() => {
    if (!currentSignal) return null;
    if (currentSignal.status === "mastered") return "mastered";
    if (currentSignal.status === "review") {
      if (currentSignal.selfRating === "unknown") return "need_help";
      return "so_so";
    }
    return null;
  })();

  async function handleSelect(option: ManualSignalOption) {
    if (!user || saving) return;
    setSaving(true);
    try {
      await saveManualConceptSignal(
        user.id,
        {
          lessonSlug,
          level,
          title: title ?? lessonSlug,
        },
        option,
      );
    } finally {
      setSaving(false);
    }
  }

  const options: Array<{
    id: ManualSignalOption;
    label: string;
    icon: typeof Check;
    selectedClass: string;
  }> = [
    {
      id: "mastered",
      label: "Lo tengo",
      icon: Check,
      selectedClass: "border-success bg-success-soft text-success font-semibold",
    },
    {
      id: "so_so",
      label: "Más o menos",
      icon: HelpCircle,
      selectedClass: "border-primary bg-primary-soft text-primary font-semibold",
    },
    {
      id: "need_help",
      label: "Necesito ayuda",
      icon: AlertCircle,
      selectedClass: "border-warning bg-warning-soft text-warning font-semibold",
    },
  ];

  return (
    <div
      className={cn(
        "flex flex-col gap-2 rounded-xl border border-border-default bg-surface-raised p-3.5",
        className,
      )}
    >
      <div className="flex items-center justify-between gap-2">
        <span className="font-caption font-medium text-fg-muted">
          ¿Cómo sientes este tema?
        </span>
        {saving && (
          <span className="font-caption text-fg-subtle">Guardando…</span>
        )}
      </div>
      <div
        className={cn(
          "grid grid-cols-3 gap-2",
          compact ? "text-xs" : "text-sm",
        )}
        role="group"
        aria-label="Estado de dominio del tema"
      >
        {options.map(({ id, label, icon: Icon, selectedClass }) => {
          const isSelected = selectedOption === id;
          return (
            <button
              key={id}
              type="button"
              onClick={() => void handleSelect(id)}
              disabled={!user || saving}
              aria-pressed={isSelected}
              className={cn(
                "focus-ring flex min-h-10 items-center justify-center gap-1.5 rounded-lg border px-2.5 py-1.5 text-center transition-colors",
                isSelected
                  ? selectedClass
                  : "border-border-default bg-surface hover:bg-surface-sunken text-fg-muted hover:text-fg",
              )}
            >
              <Icon size={14} className="shrink-0" aria-hidden />
              <span className="truncate">{label}</span>
            </button>
          );
        })}
      </div>
    </div>
  );
}
