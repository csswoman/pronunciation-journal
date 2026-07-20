import Link from "next/link";
import {
  Star,
  MicVocal,
  Laptop,
  Briefcase,
  Circle,
  Minus,
} from "@/components/icons";
import { cn } from "@/lib/cn";
import type { CoursePathLegendIcon, ElectiveSpineIcon } from "@/lib/courses/types";

const iconClass = "shrink-0";

export function CoursePathPriorityCount({
  count,
  className,
}: {
  count: number;
  className?: string;
}) {
  return (
    <span className={cn("course-path__inline-pri", className)} title="Las lecciones con estrella forman la ruta esencial">
      <Star size={12} className={cn(iconClass, "course-path__star-icon")} fill="currentColor" strokeWidth={0} aria-hidden />
      <span>{count} prioritarias</span>
    </span>
  );
}

export function CoursePathSoundLabLink({ className }: { className?: string }) {
  return (
    <Link
      href="/practice/sounds"
      className={cn("course-path__snd", className)}
      aria-label="Ir a Sound Lab"
    >
      <MicVocal size={13} strokeWidth={2} aria-hidden />
      <span className="course-path__snd-label">Sound Lab</span>
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
  if (icon === "mic") return <MicVocal {...props} />;
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
    case "sound-lab":
      return <MicVocal size={size} className={cn(iconClass, "text-primary")} strokeWidth={2} aria-hidden />;
    case "optional":
      return <Minus size={size} className={cn(iconClass, "text-fg-subtle")} strokeWidth={2} aria-hidden />;
  }
}

export function CoursePathLessonStateDot({
  available,
  done,
}: {
  available?: boolean;
  done?: boolean;
}) {
  if (done) {
    return <Circle size={10} className={iconClass} strokeWidth={2} fill="currentColor" aria-hidden />;
  }
  if (available) {
    return <Circle size={10} className={iconClass} strokeWidth={2} aria-hidden />;
  }
  return <Minus size={10} className={iconClass} strokeWidth={2} aria-hidden />;
}
