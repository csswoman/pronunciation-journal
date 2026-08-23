import { Flame } from "@/components/icons";

interface StreakChipProps {
  days: number;
}

/** Amber streak chip — flame icon + day count, shown beside the home title. */
export default function StreakChip({ days }: StreakChipProps) {
  return (
    <span className="inline-flex shrink-0 items-center gap-1.5 rounded-full bg-racha-soft px-2.5 py-1 text-tiny text-racha">
      <Flame size={14} aria-hidden />
      <span className="font-medium tabular-nums">
        {days} {days === 1 ? "día" : "días"}
      </span>
    </span>
  );
}
