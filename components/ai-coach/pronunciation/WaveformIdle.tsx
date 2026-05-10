"use client";

const BAR_COUNT = 20;

export default function WaveformIdle({ isRecording }: { isRecording: boolean }) {
  return (
    <div
      style={{
        width: "100%",
        height: 48,
        borderRadius: 12,
        backgroundColor: "var(--btn-regular-bg)",
        border: "1px solid var(--border)",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        gap: 3,
        padding: "0 16px",
        overflow: "hidden",
      }}
    >
      <style>{`
        @keyframes waveBarAnim {
          0%, 100% { transform: scaleY(0.3); }
          50%       { transform: scaleY(1); }
        }
      `}</style>
      {Array.from({ length: BAR_COUNT }).map((_, i) => (
        <span
          key={i}
          style={{
            display: "inline-block",
            width: 3,
            height: isRecording ? 36 : 6,
            borderRadius: 2,
            backgroundColor: isRecording ? "var(--primary)" : "var(--border)",
            opacity: isRecording ? 0.8 : 1,
            transformOrigin: "center",
            transition: "background-color 0.2s, opacity 0.2s",
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
