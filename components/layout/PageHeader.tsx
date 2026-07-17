"use client";

import { CanonicalHeader } from "./page-header/CanonicalHeader";
import { HeroCompactHeader } from "./page-header/HeroCompactHeader";
import type { PageHeaderProps } from "./page-header/types";

export default function PageHeader(props: PageHeaderProps) {
  const { variant = "default", progress } = props;
  const hasProgress = progress !== undefined;
  const safeProgress =
    progress !== undefined ? Math.max(0, Math.min(100, Math.round(progress))) : 0;
  const derived = { ...props, hasProgress, safeProgress };

  if (variant === "hero-compact") {
    return <HeroCompactHeader {...derived} />;
  }

  return <CanonicalHeader {...derived} />;
}
