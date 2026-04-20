import OwnershipBadge from "./OwnershipBadge";
import type { LessonBadgesProps } from "./types";
import { toLabel } from "./utils";

export default function LessonBadges({
  category,
  level,
  isSystem,
}: LessonBadgesProps) {
  return (
    <div className="flex flex-wrap gap-2">
      <span className="rounded-full bg-[var(--btn-regular-bg)] px-2.5 py-1 text-[11px] font-medium text-[var(--text-secondary)]">
        {toLabel(category)}
      </span>
      <span className="rounded-full bg-[var(--btn-regular-bg)] px-2.5 py-1 text-[11px] font-medium text-[var(--text-secondary)]">
        {level ?? "No level"}
      </span>
      <OwnershipBadge isSystem={isSystem} />
    </div>
  );
}
