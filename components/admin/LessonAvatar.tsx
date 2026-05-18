import Image from "next/image";

interface LessonAvatarProps {
  title: string;
  coverUrl?: string | null;
}

/** Two-letter initials from the first two words of a title. */
function initials(title: string): string {
  const words = title.trim().split(/\s+/).filter(Boolean);
  if (words.length === 0) return "?";
  if (words.length === 1) return words[0].slice(0, 2);
  return (words[0][0] + words[1][0]);
}

/** Deterministic hue (0–360) derived from the title string. */
function hueFromTitle(title: string): number {
  let hash = 0;
  for (let i = 0; i < title.length; i++) {
    hash = (hash << 5) - hash + title.charCodeAt(i);
    hash |= 0;
  }
  return Math.abs(hash) % 360;
}

export default function LessonAvatar({ title, coverUrl }: LessonAvatarProps) {
  if (coverUrl) {
    return (
      <div className="w-10 h-10 rounded-lg overflow-hidden flex-shrink-0 relative border border-border-subtle">
        <Image src={coverUrl} alt={`Cover for ${title}`} fill sizes="40px" className="object-cover" />
      </div>
    );
  }

  const hue = hueFromTitle(title);
  return (
    <div
      className="w-10 h-10 rounded-lg flex-shrink-0 flex items-center justify-center text-body-sm font-semibold text-white capitalize select-none"
      // Runtime-computed gradient — hue is derived from the lesson title.
      style={{
        backgroundImage: `linear-gradient(135deg, oklch(0.68 0.14 ${hue}), oklch(0.58 0.15 ${(hue + 45) % 360}))`,
      }}
    >
      {initials(title)}
    </div>
  );
}
