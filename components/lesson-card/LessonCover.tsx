import Image from "next/image";
import type { LessonCoverProps } from "./types";

export default function LessonCover({ imageUrl, title }: LessonCoverProps) {
  if (imageUrl) {
    return (
      <div className="relative h-36 w-full overflow-hidden bg-[var(--btn-regular-bg)]">
        <Image
          src={imageUrl}
          alt={title}
          fill
          className="object-cover transition duration-300 group-hover:scale-105"
          sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 25vw"
        />
      </div>
    );
  }

  return (
    <div className="flex h-36 items-center justify-center bg-[var(--btn-regular-bg)] text-[var(--text-tertiary)]">
      <span className="text-xs font-medium">No cover</span>
    </div>
  );
}
