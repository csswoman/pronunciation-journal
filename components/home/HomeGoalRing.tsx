const RADIUS = 46;
const CIRCUMFERENCE = 2 * Math.PI * RADIUS;

interface HomeGoalRingProps {
  percent: number;
  label?: string;
  size?: number;
}

export default function HomeGoalRing({
  percent,
  label = "Today's goal",
  size = 104,
}: HomeGoalRingProps) {
  const pct = Math.min(100, Math.max(0, Math.round(percent)));
  const offset = CIRCUMFERENCE - (pct / 100) * CIRCUMFERENCE;
  const center = size / 2;

  return (
    <div
      className="relative shrink-0"
      style={{ width: size, height: size }}
      aria-label={`Daily goal: ${pct}% complete`}
      role="img"
    >
      <svg
        className="w-full h-full -rotate-90"
        width={size}
        height={size}
        viewBox={`0 0 ${size} ${size}`}
        aria-hidden
      >
        <circle
          className="stroke-[var(--surface-sunken)]"
          cx={center}
          cy={center}
          r={RADIUS}
          fill="none"
          strokeWidth={8}
        />
        <circle
          className="stroke-[var(--primary)] transition-ring"
          cx={center}
          cy={center}
          r={RADIUS}
          fill="none"
          strokeWidth={8}
          strokeLinecap="round"
          strokeDasharray={CIRCUMFERENCE}
          strokeDashoffset={offset}
        />
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <b className="type-stat text-xl">
          {pct}%
        </b>
        <span className="type-overline mt-0.5 px-1 text-center">
          {label}
        </span>
      </div>
    </div>
  );
}
