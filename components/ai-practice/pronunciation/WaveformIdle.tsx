"use client";

export default function WaveformIdle({ isRecording }: { isRecording: boolean }) {
  const bars = Array.from({ length: 28 });
  return (
    <div className="flex items-center gap-[3px] px-4">
      {bars.map((_, i) => (
        <div
          key={i}
          className="rounded-full transition-all"
          style={{
            width: 3,
            backgroundColor: isRecording ? "var(--primary)" : "var(--line-divider)",
            height: isRecording ? `${12 + Math.abs(Math.sin(i * 0.7)) * 24}px` : "8px",
            opacity: isRecording ? 0.6 + Math.abs(Math.sin(i * 0.5)) * 0.4 : 1,
            animationName: isRecording ? "pulse" : "none",
            animationDuration: `${0.8 + (i % 3) * 0.2}s`,
            animationTimingFunction: "ease-in-out",
            animationIterationCount: "infinite",
            animationDirection: "alternate",
            animationDelay: `${i * 0.05}s`,
          }}
        />
      ))}
    </div>
  );
}
