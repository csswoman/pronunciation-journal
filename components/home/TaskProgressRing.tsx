const RADIUS = 34;
const CIRCUMFERENCE = 2 * Math.PI * RADIUS;

interface TaskProgressRingProps {
  completed: number;
  total: number;
}

export default function TaskProgressRing({ completed, total }: TaskProgressRingProps) {
  const progress = completed / total;
  const dash = CIRCUMFERENCE * progress;
  const gap = CIRCUMFERENCE - dash;

  return (
    <div
      className="relative w-24 h-24"
      style={{ filter: "drop-shadow(0 0 10px color-mix(in oklch, var(--primary) 40%, transparent))" }}
    >
      <svg className="w-full h-full -rotate-90" viewBox="0 0 80 80">
        <circle
          cx="40" cy="40" r={RADIUS}
          fill="none"
          stroke="color-mix(in oklch, var(--primary) 15%, transparent)"
          strokeWidth="5"
        />
        <circle
          cx="40" cy="40" r={RADIUS}
          fill="none"
          stroke="var(--primary)"
          strokeWidth="5"
          strokeLinecap="round"
          strokeDasharray={`${dash} ${gap}`}
        />
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <span className="text-lg font-bold text-[var(--text-primary)] leading-none">{completed}/{total}</span>
        <span className="text-[10px] text-[var(--text-tertiary)] mt-0.5 text-center leading-tight">tasks<br />done</span>
      </div>
    </div>
  );
}
