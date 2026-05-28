// Planned structure:
// <LibraryItemCard>
//   <ItemCover />     (cover with variant: gradient | diagonals | grid; initials; corner badge)
//   <ItemBody>
//     <Eyebrow />     (uppercase category)
//     <Title />       (serif h4-ish)
//     <Description /> (line-clamp-2)
//     <MetaRow />     (lessons · duration · level)
//     <Progress />    (only if inProgress)
//   </ItemBody>
// </LibraryItemCard>

"use client";

import { useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { BookOpen, Clock, Signal } from "lucide-react";

export type LibraryItemBadge = "Course" | "Notes" | "Mini";
export type LibraryItemCoverVariant = "gradient" | "diagonals" | "grid";

export type LibraryItemLayout = "grid" | "list";

export interface LibraryItemCardProps {
  href:        string;
  badge:       LibraryItemBadge;
  eyebrow:     string;
  title:       string;
  description?: string;
  initials:    string;
  coverImageUrl?: string | null;
  coverVariant?: LibraryItemCoverVariant;
  coverHue?:   number;        // 0–360
  lessons?:    number;
  durationLabel?: string;     // e.g. "3 h 20 m"
  levelLabel?: string;        // e.g. "B2 · Intermediate"
  progress?:   number;        // 0–100, undefined or 0 hides the bar
  inProgress?: boolean;
  priority?:   boolean;
  layout?:     LibraryItemLayout;
}

const BADGE_TOKEN: Record<LibraryItemBadge, { bg: string; text: string }> = {
  Course: { bg: "color-mix(in oklch, var(--success) 22%, transparent)",       text: "var(--success)"  },
  Notes:  { bg: "color-mix(in oklch, var(--accent-analog-1) 22%, transparent)", text: "var(--accent-analog-1)" },
  Mini:   { bg: "color-mix(in oklch, var(--primary) 22%, transparent)",       text: "var(--primary)"  },
};

export default function LibraryItemCard(props: LibraryItemCardProps) {
  const { href, progress = 0, inProgress = false, layout = "grid" } = props;
  const showProgress = inProgress && progress > 0;

  if (layout === "list") {
    return (
      <Link
        href={href}
        className="group grid grid-cols-[120px_1fr] gap-4 overflow-hidden bg-[var(--surface-raised)] border border-[var(--border-subtle)] transition-all duration-200 hover:border-[var(--border-default)]"
        style={{ borderRadius: "var(--radius-lg)" }}
      >
        <ItemCover {...props} layout="list" />
        <ItemBody {...props} showProgress={showProgress} layout="list" />
      </Link>
    );
  }

  return (
    <Link
      href={href}
      className="group flex flex-col overflow-hidden bg-[var(--surface-raised)] border border-[var(--border-subtle)] transition-all duration-200 hover:-translate-y-px hover:border-[var(--border-default)]"
      style={{ borderRadius: "var(--radius-lg)" }}
    >
      <ItemCover {...props} />
      <ItemBody {...props} showProgress={showProgress} />
    </Link>
  );
}

function ItemCover({
  badge,
  initials,
  coverImageUrl,
  coverVariant = "gradient",
  coverHue = 250,
  priority,
  layout = "grid",
}: LibraryItemCardProps) {
  const token = BADGE_TOKEN[badge];
  const isList = layout === "list";
  const [imgFailed, setImgFailed] = useState(false);
  const showImg = !!coverImageUrl && !imgFailed;
  return (
    <div
      className="relative flex items-center justify-center overflow-hidden shrink-0"
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
      {coverVariant === "grid"      && <GridPattern />}

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

function ItemBody({
  eyebrow,
  title,
  description,
  lessons,
  durationLabel,
  levelLabel,
  progress = 0,
  showProgress,
  layout = "grid",
}: LibraryItemCardProps & { showProgress: boolean }) {
  const safe = Math.max(0, Math.min(100, Math.round(progress)));
  const isList = layout === "list";
  return (
    <div
      className="flex flex-1 flex-col"
      style={{
        padding: isList ? "var(--space-3) var(--space-4) var(--space-3) 0" : "var(--space-4) var(--space-5) var(--space-4)",
        gap: "var(--space-2)",
      }}
    >
      <span
        style={{
          font: "var(--font-tiny)",
          color: "var(--text-tertiary)",
          textTransform: "uppercase",
          letterSpacing: "0.12em",
        }}
      >
        {eyebrow}
      </span>

      <h3
        style={{
          fontFamily: "var(--font-heading), serif",
          fontWeight: 500,
          fontSize: "1.0625rem",
          lineHeight: 1.3,
          color: "var(--text-primary)",
          margin: 0,
        }}
        className="line-clamp-2"
      >
        {title}
      </h3>

      {description && (
        <p
          className="line-clamp-2"
          style={{ font: "var(--font-body-sm)", color: "var(--text-secondary)", margin: 0, lineHeight: 1.45 }}
        >
          {description}
        </p>
      )}

      <div
        className="flex items-center flex-wrap mt-auto"
        style={{ gap: "var(--space-3)", paddingTop: "var(--space-3)", color: "var(--text-tertiary)" }}
      >
        {typeof lessons === "number" && (
          <MetaItem icon={<BookOpen size={12} />}>{lessons} lessons</MetaItem>
        )}
        {durationLabel && (
          <MetaItem icon={<Clock size={12} />}>{durationLabel}</MetaItem>
        )}
        {levelLabel && (
          <MetaItem icon={<Signal size={12} />}>{levelLabel}</MetaItem>
        )}
      </div>

      {showProgress && (
        <div className="flex flex-col" style={{ gap: "var(--space-1)", marginTop: "var(--space-3)" }}>
          <div
            style={{
              height: "3px",
              borderRadius: "var(--radius-full)",
              background: "var(--overlay-subtle)",
              overflow: "hidden",
            }}
          >
            <div
              className="h-full transition-all duration-500"
              style={{ width: `${safe}%`, background: "var(--primary)" }}
            />
          </div>
          <div className="flex items-center justify-between">
            <span style={{ font: "var(--font-tiny)", color: "var(--text-secondary)" }}>In progress</span>
            <span style={{ font: "var(--font-tiny)", color: "var(--text-secondary)", fontWeight: 600 }} className="tabular-nums">
              {safe}%
            </span>
          </div>
        </div>
      )}
    </div>
  );
}

function MetaItem({ icon, children }: { icon: React.ReactNode; children: React.ReactNode }) {
  return (
    <span className="inline-flex items-center" style={{ gap: "var(--space-1)", font: "var(--font-tiny)" }}>
      <span style={{ opacity: 0.7 }}>{icon}</span>
      {children}
    </span>
  );
}

function DiagonalsPattern() {
  return (
    <div
      aria-hidden
      className="absolute inset-0"
      style={{
        backgroundImage:
          "repeating-linear-gradient(135deg, var(--border-subtle) 0 1px, transparent 1px 14px)",
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
