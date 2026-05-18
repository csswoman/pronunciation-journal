import { type ReactNode } from "react";

export interface CTAButton {
  label: string;
  icon?: ReactNode;
  onClick: () => void;
  variant?: "primary" | "secondary";
}

export interface PageHeaderProps {
  badge?: string;
  title: string;
  subtitle?: string;
  description?: string;
  primaryCta?: CTAButton;
  secondaryCta?: CTAButton;
  illustration?: ReactNode;
  variant?: "default" | "compact" | "hero-compact";
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
