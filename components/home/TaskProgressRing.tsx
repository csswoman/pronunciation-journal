const RADIUS = 34;
const CIRCUMFERENCE = 2 * Math.PI * RADIUS;

export default function TaskProgressRing() {
  return (
    <div className="relative w-24 h-24">
      <svg className="w-full h-full -rotate-90" viewBox="0 0 80 80">
        <circle
          cx="40" cy="40" r={RADIUS}
          fill="none"
          stroke="color-mix(in oklch, var(--primary) 15%, transparent)"
          strokeWidth="5"
          strokeDasharray={`0 ${CIRCUMFERENCE}`}
        />
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <span className="text-lg font-bold text-[var(--text-tertiary)] leading-none">—</span>
        <span className="text-[10px] text-[var(--text-tertiary)] mt-0.5 text-center leading-tight">no plan<br />yet</span>
      </div>
    </div>
  );
}
