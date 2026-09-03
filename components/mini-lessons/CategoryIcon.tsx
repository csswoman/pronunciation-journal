import {
  Mic,
  Notebook,
  LibraryBig,
  Pencil,
  Headphones,
  MicVocal,
  Sparkles,
  Layers,
  BookOpen,
} from "@/components/icons";
import { cn } from "@/lib/cn";
import type { LessonCategory } from "@/lib/content/schemas";

interface CategoryIconProps {
  category: LessonCategory | "all";
  className?: string;
  size?: "sm" | "md" | "lg";
}

const CATEGORY_ICONS = {
  all: BookOpen,
  pronunciation: Mic,
  grammar: Notebook,
  vocabulary: LibraryBig,
  writing: Pencil,
  listening: Headphones,
  speaking: MicVocal,
  idioms: Sparkles,
  collocations: Layers,
} as const;

export function CategoryIcon({ category, className, size = "md" }: CategoryIconProps) {
  const IconComponent = CATEGORY_ICONS[category] || BookOpen;

  const sizeClasses = {
    sm: "w-4 h-4",
    md: "w-5 h-5",
    lg: "w-6 h-6",
  }[size];

  return <IconComponent className={cn(sizeClasses, className)} aria-hidden />;
}
