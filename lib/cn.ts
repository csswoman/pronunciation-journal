import { clsx, type ClassValue } from "clsx";
import { extendTailwindMerge } from "tailwind-merge";

/**
 * Custom type-scale tokens from `app/styles/theme.css` (`--text-*`).
 * Without this, tailwind-merge treats `text-caption` / `text-body-sm` as
 * colors and drops them when mixed with `text-on-primary` / `text-fg`, or
 * the reverse — which breaks button contrast across the app.
 */
const TYPE_SCALE = [
  "h1",
  "h2",
  "h3",
  "h4",
  "body-lg",
  "body-md",
  "body-sm",
  "label",
  "caption",
  "kicker",
  "tiny",
  "xxs",
  "display-word",
  "display-ipa",
  "ipa-hero",
] as const;

const twMerge = extendTailwindMerge({
  extend: {
    theme: {
      text: [...TYPE_SCALE],
    },
  },
});

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}
