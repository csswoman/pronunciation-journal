"use client";

const BAR_COUNT = 20;

export default function WaveformDisplay({ isRecording }: { isRecording: boolean }) {
  return (
    <div className="w-full h-12 flex items-center justify-center gap-px px-4 overflow-hidden">
      <style>{`
        @keyframes waveBarAnim {
          0%, 100% { transform: scaleY(0.3); }
          50%       { transform: scaleY(1); }
        }
      `}</style>
      {Array.from({ length: BAR_COUNT }).map((_, i) => (
        <span
          key={i}
          className="inline-block w-px rounded-sm transition-colors duration-200"
          style={{
            height: isRecording ? 36 : 6,
            backgroundColor: isRecording ? "var(--primary)" : "var(--border)",
            opacity: isRecording ? 0.8 : 1,
            transformOrigin: "center",
            animation: isRecording
              ? `waveBarAnim ${0.6 + (i % 5) * 0.12}s ease-in-out infinite`
              : "none",
            animationDelay: `${i * 0.05}s`,
          }}
        />
      ))}
    </div>
  );
}
