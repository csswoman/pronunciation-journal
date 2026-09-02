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
import { AlertCircle, Check, HelpCircle, Pencil } from "@/components/icons";
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
  const [isEditing, setIsEditing] = useState(false);

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
      setIsEditing(false);
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

  const selectedOptionItem = options.find((o) => o.id === selectedOption);
  const isCollapsed = Boolean(selectedOption) && !isEditing;

  if (isCollapsed && selectedOptionItem) {
    const Icon = selectedOptionItem.icon;
    return (
      <div
        className={cn(
          "flex items-center justify-between gap-3 rounded-xl border border-border-default bg-surface-raised px-4 py-2.5 transition-all duration-300 ease-in-out shadow-xs",
          className,
        )}
      >
        <div className="flex flex-wrap items-center gap-2">
          <span className="font-caption text-body-sm font-medium text-fg-muted">
            ¿Cómo sientes este tema?
          </span>
          <span
            className={cn(
              "inline-flex items-center gap-1.5 rounded-full border px-2.5 py-0.5 text-caption font-semibold transition-all",
              selectedOptionItem.selectedClass,
            )}
          >
            <Icon size={13} className="shrink-0" aria-hidden />
            <span>{selectedOptionItem.label}</span>
          </span>
        </div>
        <button
          type="button"
          onClick={() => setIsEditing(true)}
          className="focus-ring inline-flex items-center gap-1 rounded-md px-2 py-1 text-caption font-medium text-primary hover:bg-primary-soft/50 hover:underline transition-colors"
        >
          <Pencil size={12} className="shrink-0" aria-hidden />
          <span>Cambiar</span>
        </button>
      </div>
    );
  }

  return (
    <div
      className={cn(
        "flex flex-col gap-2.5 rounded-xl border border-border-default bg-surface-raised p-3.5 transition-all duration-300 ease-in-out",
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
          // Full-width stack on phones so labels never truncate ("Necesito
          // ayuda" + icon needs ~150px); 3-up row only at tablet width.
          "grid grid-cols-1 gap-2 sm:grid-cols-3",
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
                // Stacked (1-col) rows read left-aligned like a list; the 3-up
                // row re-centers. min-h-11 keeps a comfortable touch target.
                "focus-ring flex min-h-11 items-center justify-start gap-1.5 rounded-lg border px-3 py-2 transition-all duration-200 sm:min-h-10 sm:justify-center sm:px-2.5 sm:py-1.5 sm:text-center",
                isSelected
                  ? selectedClass
                  : "border-border-default bg-surface hover:bg-surface-sunken text-fg-muted hover:text-fg",
              )}
            >
              <Icon size={14} className="shrink-0" aria-hidden />
              <span className="whitespace-nowrap">{label}</span>
            </button>
          );
        })}
      </div>
    </div>
  );
}

