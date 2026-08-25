import type React from "react";
import EmptyVocabulario from "@/components/illustrations/empty-vocabulario.svg";

export type IllustrationKey = "emptyVocabulario";

export const ILLUSTRATIONS: Record<IllustrationKey, React.FC<React.SVGProps<SVGSVGElement>>> = {
  emptyVocabulario: EmptyVocabulario,
};
