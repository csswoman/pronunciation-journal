import Link from "next/link";
import {
  Star,
  MicVocal,
  Laptop,
  Briefcase,
  Circle,
  Minus,
  Utensils,
  User,
  Sun,
  ShoppingBag,
  CalendarDays,
  Map,
  Stethoscope,
  BookOpen,
  Mail,
  MessageCircle,
  Smile,
  Handshake,
  CloudFog,
  Theater,
  Target,
} from "@/components/icons";
import { cn } from "@/lib/cn";
import type {
  CoursePathLegendIcon,
  ElectiveSpineIcon,
  RealLifeScenarioIcon,
} from "@/lib/courses/types";

const iconClass = "shrink-0";

const REAL_LIFE_ICONS = {
  utensils: Utensils,
  user: User,
  sun: Sun,
  shopping: ShoppingBag,
  calendar: CalendarDays,
  map: Map,
  stethoscope: Stethoscope,
  book: BookOpen,
  mail: Mail,
  message: MessageCircle,
  smile: Smile,
  handshake: Handshake,
  fog: CloudFog,
  theater: Theater,
  target: Target,
} as const satisfies Record<RealLifeScenarioIcon, typeof Utensils>;

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

export function CoursePathRealLifeIcon({
  icon,
  size = 20,
  className,
}: {
  icon: RealLifeScenarioIcon;
  size?: number;
  className?: string;
}) {
  const Icon = REAL_LIFE_ICONS[icon];
  return (
    <Icon
      size={size}
      strokeWidth={1.75}
      className={cn(iconClass, className)}
      aria-hidden
    />
  );
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
