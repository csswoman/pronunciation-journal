interface ProgressBarProps {
  value: number; // 0–100
  color?: string;
  height?: "xs" | "sm" | "md";
  className?: string;
  showLabel?: boolean;
}

const heightMap = { xs: "h-1", sm: "h-1.5", md: "h-2" };

export default function ProgressBar({
  value,
  color = "var(--primary)",
  height = "sm",
  className = "",
  showLabel = false,
}: ProgressBarProps) {
  const pct = Math.min(100, Math.max(0, Math.round(value)));
  return (
    <div className={`flex items-center gap-2 ${className}`}>
      <div className={`flex-1 ${heightMap[height]} rounded-full bg-[var(--btn-regular-bg)] overflow-hidden`}>
        <div
          className="h-full rounded-full transition-all duration-700 ease-out"
          style={{ width: `${pct}%`, background: color }}
        />
      </div>
      {showLabel && (
        <span className="text-tiny tabular-nums font-medium shrink-0" style={{ color }}>
          {pct}%
        </span>
      )}
    </div>
  );
}
