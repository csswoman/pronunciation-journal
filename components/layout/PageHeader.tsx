"use client";

import { DefaultCompactHeader } from "./page-header/DefaultCompactHeader";
import { HeroCompactHeader } from "./page-header/HeroCompactHeader";
import type { PageHeaderProps } from "./page-header/types";

export default function PageHeader(props: PageHeaderProps) {
  const { variant = "default", progress, lessonTitle, onContinue } = props;
  const hasProgress = !!(progress !== undefined && lessonTitle && onContinue);
  const safeProgress = hasProgress ? Math.max(0, Math.min(100, Math.round(progress!))) : 0;
  const derived = { ...props, hasProgress, safeProgress };

  if (variant === "hero-compact") {
    return <HeroCompactHeader {...derived} />;
  }

  return <DefaultCompactHeader {...derived} />;
}
