interface Props {
  accuracy: number;
  size?: number;
}

export function AccuracyRing({ accuracy, size = 56 }: Props) {
  const r = (size - 8) / 2;
  const circ = 2 * Math.PI * r;
  const color = accuracy >= 80 ? "var(--score-excellent)" : accuracy >= 55 ? "var(--score-acceptable)" : "var(--score-poor)";

  return (
    <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} className="flex-shrink-0">
      <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke="var(--line-divider)" strokeWidth="5" />
      <circle
        cx={size / 2} cy={size / 2} r={r}
        fill="none" stroke={color} strokeWidth="5"
        strokeDasharray={`${(accuracy / 100) * circ} ${circ}`}
        strokeDashoffset={circ / 4}
        strokeLinecap="round"
        style={{ transition: "stroke-dasharray 0.8s ease" }}
      />
      <text x={size / 2} y={size / 2 + 4} textAnchor="middle" fontSize="11" fontWeight="700" fill={color}>
        {Math.round(accuracy)}%
      </text>
    </svg>
  );
}
