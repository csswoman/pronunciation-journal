"use client";

import { BookOpen, Clock, Signal } from "lucide-react";
import type { LibraryItemLayout } from "./ItemCover";

interface ItemBodyProps {
  eyebrow: string;
  title: string;
  description?: string;
  lessons?: number;
  durationLabel?: string;
  levelLabel?: string;
  progress?: number;
  showProgress: boolean;
  layout?: LibraryItemLayout;
}

function MetaItem({ icon, children }: { icon: React.ReactNode; children: React.ReactNode }) {
  return (
    <span className="inline-flex items-center" style={{ gap: "var(--space-1)", font: "var(--font-tiny)" }}>
      <span style={{ opacity: 0.7 }}>{icon}</span>
      {children}
    </span>
  );
}

export function ItemBody({
  eyebrow,
  title,
  description,
  lessons,
  durationLabel,
  levelLabel,
  progress = 0,
  showProgress,
  layout = "grid",
}: ItemBodyProps) {
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
        {typeof lessons === "number" && <MetaItem icon={<BookOpen size={12} />}>{lessons} lessons</MetaItem>}
        {durationLabel && <MetaItem icon={<Clock size={12} />}>{durationLabel}</MetaItem>}
        {levelLabel && <MetaItem icon={<Signal size={12} />}>{levelLabel}</MetaItem>}
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
            <span
              style={{ font: "var(--font-tiny)", color: "var(--text-secondary)", fontWeight: 600 }}
              className="tabular-nums"
            >
              {safe}%
            </span>
          </div>
        </div>
      )}
    </div>
  );
}
