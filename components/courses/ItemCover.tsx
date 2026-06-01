"use client";

import { useState } from "react";
import Image from "next/image";
import { isAllowedRemoteImageUrl } from "@/lib/images/remote-image";

export type LibraryItemBadge = "Course" | "Notes" | "Mini";
export type LibraryItemCoverVariant = "gradient" | "diagonals" | "grid";
export type LibraryItemLayout = "grid" | "list";

interface ItemCoverProps {
  badge: LibraryItemBadge;
  initials: string;
  coverImageUrl?: string | null;
  coverVariant?: LibraryItemCoverVariant;
  coverHue?: number;
  priority?: boolean;
  layout?: LibraryItemLayout;
}

const BADGE_TOKEN: Record<LibraryItemBadge, { bg: string; text: string }> = {
  Course: { bg: "color-mix(in oklch, var(--success) 22%, transparent)", text: "var(--success)" },
  Notes: { bg: "color-mix(in oklch, var(--accent-analog-1) 22%, transparent)", text: "var(--accent-analog-1)" },
  Mini: { bg: "color-mix(in oklch, var(--primary) 22%, transparent)", text: "var(--primary)" },
};

function DiagonalsPattern() {
  return (
    <div
      aria-hidden
      className="absolute inset-0"
      style={{
        backgroundImage: "repeating-linear-gradient(135deg, var(--border-subtle) 0 1px, transparent 1px 14px)",
        opacity: 0.6,
      }}
    />
  );
}

function GridPattern() {
  return (
    <div
      aria-hidden
      className="absolute inset-0"
      style={{
        backgroundImage:
          "linear-gradient(var(--border-subtle) 1px, transparent 1px), linear-gradient(90deg, var(--border-subtle) 1px, transparent 1px)",
        backgroundSize: "22px 22px",
        opacity: 0.6,
      }}
    />
  );
}

export function ItemCover({
  badge,
  initials,
  coverImageUrl,
  coverVariant = "gradient",
  coverHue = 250,
  priority,
  layout = "grid",
}: ItemCoverProps) {
  const token = BADGE_TOKEN[badge];
  const isList = layout === "list";
  const [imgFailed, setImgFailed] = useState(false);
  const showImg =
    !!coverImageUrl && isAllowedRemoteImageUrl(coverImageUrl) && !imgFailed;

  return (
    <div
      className="relative flex items-center justify-center overflow-hidden shrink-0 group"
      style={{
        height: isList ? "100%" : "200px",
        minHeight: isList ? "112px" : undefined,
        background:
          coverVariant === "gradient"
            ? `linear-gradient(135deg, oklch(.52 .18 ${coverHue}) 0%, oklch(.45 .16 ${(coverHue + 60) % 360}) 100%)`
            : "var(--surface-sunken)",
      }}
    >
      {coverVariant === "diagonals" && <DiagonalsPattern />}
      {coverVariant === "grid" && <GridPattern />}

      {showImg ? (
        <Image
          src={coverImageUrl!}
          alt=""
          fill
          priority={priority}
          unoptimized
          onError={() => setImgFailed(true)}
          sizes="(max-width: 768px) 100vw, 33vw"
          className="object-cover transition-transform duration-500 group-hover:scale-[1.02]"
        />
      ) : (
        <span
          style={{
            fontFamily: "var(--font-heading), serif",
            fontStyle: "italic",
            fontWeight: 500,
            fontSize: isList ? "clamp(1.5rem, 3vw, 2rem)" : "clamp(2.75rem, 5vw, 3.75rem)",
            color: coverVariant === "gradient" ? "var(--overlay-darker)" : "var(--overlay-weak)",
            lineHeight: 1,
            letterSpacing: "-0.02em",
            textShadow: coverVariant === "gradient" ? "0 1px 2px oklch(0 0 0 / 0.18)" : "none",
          }}
        >
          {initials}
        </span>
      )}

      <span
        className="absolute inline-flex items-center"
        style={{
          top: "var(--space-3)",
          left: "var(--space-3)",
          gap: "var(--space-1)",
          padding: "3px 10px",
          borderRadius: "var(--radius-full)",
          background: token.bg,
          color: token.text,
          font: "var(--font-tiny)",
          textTransform: "uppercase",
          letterSpacing: "0.1em",
          backdropFilter: "blur(8px)",
        }}
      >
        {badge}
      </span>
    </div>
  );
}
