import Link from "next/link";
import {
  Star,
  MicVocal,
  Laptop,
  Briefcase,
  Circle,
  Minus,
} from "lucide-react";
import { cn } from "@/lib/cn";
import type { LessonPriority } from "@/lib/courses/types";
import type { CoursePathLegendIcon, ElectiveSpineIcon } from "@/lib/courses/types";

const iconClass = "shrink-0";

/** Priority stars (⭐ / ⭐⭐) */
export function CoursePathPriorityMarks({
  priority,
  className,
  size = 14,
}: {
  priority: LessonPriority;
  className?: string;
  size?: number;
}) {
  if (priority === 0) {
    return <span className={cn("course-path__marks-empty", className)} aria-hidden />;
  }

  const count = priority === 2 ? 2 : 1;
  return (
    <span
      className={cn("course-path__marks-stars", className)}
      aria-label={priority === 2 ? "Máxima prioridad" : "Ruta crítica"}
    >
      {Array.from({ length: count }, (_, i) => (
        <Star
          key={i}
          size={size}
          className={cn(iconClass, "course-path__star-icon")}
          fill="currentColor"
          strokeWidth={0}
          aria-hidden
        />
      ))}
    </span>
  );
}

export function CoursePathPriorityCount({
  count,
  className,
}: {
  count: number;
  className?: string;
}) {
  return (
    <span className={cn("course-path__inline-pri", className)}>
      <Star size={12} className={cn(iconClass, "course-path__star-icon")} fill="currentColor" strokeWidth={0} aria-hidden />
      <span>{count} prioritarios</span>
    </span>
  );
}

export function CoursePathSoundLabLink({ className }: { className?: string }) {
  return (
    <Link
      href="/practice/sounds"
      className={cn("course-path__snd", className)}
      title="Ir a Sound Lab"
      aria-label="Ir a Sound Lab"
    >
      <MicVocal size={16} strokeWidth={2} aria-hidden />
    </Link>
  );
}

export function CoursePathElectiveSpineIcon({
  icon,
  className,
}: {
  icon: ElectiveSpineIcon;
  className?: string;
}) {
  const props = { size: 22, strokeWidth: 1.75, className: cn(iconClass, className), "aria-hidden": true as const };
  if (icon === "laptop") return <Laptop {...props} />;
  return <Briefcase {...props} />;
}

export function CoursePathLegendIconDisplay({
  icon,
  size = 16,
}: {
  icon: CoursePathLegendIcon;
  size?: number;
}) {
  switch (icon) {
    case "priority-max":
      return <CoursePathPriorityMarks priority={2} size={size} />;
    case "priority":
      return <CoursePathPriorityMarks priority={1} size={size} />;
    case "sound-lab":
      return <MicVocal size={size} className={cn(iconClass, "text-primary")} strokeWidth={2} aria-hidden />;
    case "optional":
      return <Minus size={size} className={cn(iconClass, "text-fg-subtle")} strokeWidth={2} aria-hidden />;
  }
}

export function CoursePathLessonStateDot({
  available,
}: {
  available?: boolean;
}) {
  if (available) {
    return <Circle size={10} className={iconClass} strokeWidth={2} aria-hidden />;
  }
  return <Minus size={10} className={iconClass} strokeWidth={2} aria-hidden />;
}
