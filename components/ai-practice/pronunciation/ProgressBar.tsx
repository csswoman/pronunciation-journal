interface Props {
  current: number;
  total: number;
  mastered: number;
  pct: number;
}

export default function ProgressBar({ current, total, mastered, pct }: Props) {
  return (
    <div className="w-full shrink-0">
      <p className="text-right text-caption text-fg-muted px-5 pt-1.5">
        Phrase {current} of {total} · {mastered} mastered
      </p>
    </div>
  );
}
