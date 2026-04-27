"use client";

export default function WaveformIdle({ isRecording }: { isRecording: boolean }) {
  const bars = Array.from({ length: 36 });
  return (
    <div className="flex items-center justify-center gap-[3px] px-6 w-full h-full">
      {bars.map((_, i) => {
        const baseH = 6 + Math.abs(Math.sin(i * 0.55)) * 22;
        return (
          <div
            key={i}
            className="rounded-full flex-shrink-0"
            style={{
              width: 3,
              height: isRecording ? `${baseH}px` : "6px",
              backgroundColor: isRecording ? "var(--primary)" : "var(--line-divider)",
              opacity: isRecording ? 0.5 + Math.abs(Math.sin(i * 0.4)) * 0.5 : 1,
              transition: "height 0.3s ease, opacity 0.3s ease",
              animation: isRecording ? `waveBar ${0.7 + (i % 4) * 0.15}s ease-in-out infinite alternate` : "none",
              animationDelay: `${i * 0.04}s`,
            }}
          />
        );
      })}
      <style>{`
        @keyframes waveBar {
          from { transform: scaleY(0.5); }
          to   { transform: scaleY(1.3); }
        }
      `}</style>
    </div>
  );
}
