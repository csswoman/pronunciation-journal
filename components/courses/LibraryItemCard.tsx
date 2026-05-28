"use client";

import Link from "next/link";
import { ItemCover, type LibraryItemBadge, type LibraryItemCoverVariant, type LibraryItemLayout } from "./ItemCover";
import { ItemBody } from "./ItemBody";

export type { LibraryItemBadge, LibraryItemCoverVariant, LibraryItemLayout };

export interface LibraryItemCardProps {
  href: string;
  badge: LibraryItemBadge;
  eyebrow: string;
  title: string;
  description?: string;
  initials: string;
  coverImageUrl?: string | null;
  coverVariant?: LibraryItemCoverVariant;
  coverHue?: number;
  lessons?: number;
  durationLabel?: string;
  levelLabel?: string;
  progress?: number;
  inProgress?: boolean;
  priority?: boolean;
  layout?: LibraryItemLayout;
}

export default function LibraryItemCard(props: LibraryItemCardProps) {
  const { href, progress = 0, inProgress = false, layout = "grid" } = props;
  const showProgress = inProgress && progress > 0;

  if (layout === "list") {
    return (
      <Link
        href={href}
        className="group grid grid-cols-[120px_1fr] gap-4 overflow-hidden bg-surface-raised border border-border-subtle transition-all duration-200 hover:border-border-default"
        style={{ borderRadius: "var(--radius-lg)" }}
      >
        <ItemCover {...(props as any)} layout="list" />
        <ItemBody
          eyebrow={props.eyebrow}
          title={props.title}
          description={props.description}
          lessons={props.lessons}
          durationLabel={props.durationLabel}
          levelLabel={props.levelLabel}
          progress={progress}
          showProgress={showProgress}
          layout="list"
        />
      </Link>
    );
  }

  return (
    <Link
      href={href}
      className="group flex flex-col overflow-hidden bg-surface-raised border border-border-subtle transition-all duration-200 hover:-translate-y-px hover:border-border-default"
      style={{ borderRadius: "var(--radius-lg)" }}
    >
      <ItemCover {...(props as any)} />
      <ItemBody
        eyebrow={props.eyebrow}
        title={props.title}
        description={props.description}
        lessons={props.lessons}
        durationLabel={props.durationLabel}
        levelLabel={props.levelLabel}
        progress={progress}
        showProgress={showProgress}
      />
    </Link>
  );
}
