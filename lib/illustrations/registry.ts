import type { ComponentType, SVGProps } from "react";
import EmptyVocabulario from "@/components/illustrations/empty-vocabulario.svg";

export type IllustrationKey = "emptyVocabulario";

export const ILLUSTRATIONS: Record<IllustrationKey, ComponentType<SVGProps<SVGSVGElement>>> = {
  emptyVocabulario: EmptyVocabulario,
};
