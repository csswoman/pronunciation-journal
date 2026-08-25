import type React from "react";
import EmptyVocabulario from "@/components/illustrations/empty-vocabulario.svg";
import EmptyTracking from "@/components/illustrations/empty-tracking.svg";

export type IllustrationKey = "emptyVocabulario" | "emptyTracking";

export const ILLUSTRATIONS: Record<IllustrationKey, React.FC<React.SVGProps<SVGSVGElement>>> = {
  emptyVocabulario: EmptyVocabulario,
  emptyTracking: EmptyTracking,
};
