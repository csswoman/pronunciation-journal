"use client";

interface Props {
  text: string;
  isActive: boolean;
}

export default function TeleprompterCard({ text, isActive }: Props) {
  if (!isActive) return null;

  return (
    <div className="rounded-2xl border-2 p-6" style={{ borderColor: "var(--accent)", background: "var(--accent)08" }}>
      <div className="flex items-center gap-2 mb-3">
        <span className="w-2 h-2 rounded-full animate-pulse" style={{ background: "var(--accent)" }} />
        <span className="text-xs font-medium uppercase tracking-wide" style={{ color: "var(--accent)" }}>
          Your turn — read aloud
        </span>
      </div>
      <p className="text-lg leading-relaxed font-medium" style={{ color: "var(--deep-text)", fontFamily: "var(--font-body)" }}>
        {text}
      </p>
    </div>
  );
}
