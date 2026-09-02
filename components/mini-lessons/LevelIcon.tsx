import { BookOpen, GraduationCap, TrendingUp, Trophy } from "@/components/icons";
import { cn } from "@/lib/cn";
import type { LessonLevel } from "@/lib/content/schemas";

interface LevelIconProps {
  level: LessonLevel | "all";
  className?: string;
  size?: "sm" | "md";
}

const LEVEL_ICONS = {
  all: BookOpen,
  basic: GraduationCap,
  intermediate: TrendingUp,
  advanced: Trophy,
} as const;

export function LevelIcon({ level, className, size = "sm" }: LevelIconProps) {
  const IconComponent = LEVEL_ICONS[level] || BookOpen;

  const sizeClasses = {
    sm: "w-4 h-4",
    md: "w-5 h-5",
  }[size];

  return <IconComponent className={cn(sizeClasses, className)} aria-hidden />;
}
