import { type ReactNode } from "react";

export interface CTAButton {
  label: string;
  icon?: ReactNode;
  onClick: () => void;
  variant?: "primary" | "secondary";
}

export interface PageHeaderProps {
  /** Prefer over legacy `badge` for new call sites */
  kicker?: string;
  /** @deprecated Use `kicker` — kept as legacy alias */
  badge?: string;
  title: string;
  subtitle?: string;
  /** @deprecated Prefer `subtitle` for chrome */
  description?: string;
  primaryCta?: CTAButton;
  secondaryCta?: CTAButton;
  /** Trailing controls in the title row (e.g. vault, settings). */
  actions?: ReactNode;
  illustration?: ReactNode;
  variant?: "default" | "compact";
  progress?: number;
  lessonTitle?: string;
  phonemeLabel?: string;
  decorativeText?: string;
  onContinue?: () => void;
  className?: string;
}

export interface PageHeaderDerived extends PageHeaderProps {
  hasProgress: boolean;
  safeProgress: number;
}
