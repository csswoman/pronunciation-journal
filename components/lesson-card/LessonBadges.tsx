import Badge from "@/components/ui/Badge";
import type { LessonBadgesProps } from "./types";
import { toLabel } from "./utils";

export default function LessonBadges({ category, level, isSystem }: LessonBadgesProps) {
  return (
    <div className="flex flex-wrap gap-2">
      <Badge label={toLabel(category)} variant="neutral" />
      <Badge label={level ?? "No level"} variant="neutral" />
      <Badge label={isSystem ? "System" : "Mine"} variant={isSystem ? "info" : "warning"} />
    </div>
  );
}
