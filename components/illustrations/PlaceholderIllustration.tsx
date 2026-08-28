import type React from "react";

/**
 * Generic placeholder used by empty states that have no bespoke art yet.
 * Inline SVG (no file import → no SVGR dependency). Colors inherit from the
 * container via `currentColor`, so it follows the theme automatically.
 */
export default function PlaceholderIllustration(
  props: React.SVGProps<SVGSVGElement>,
) {
  return (
    <svg
      viewBox="0 0 96 96"
      role="img"
      aria-hidden="true"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      {...props}
    >
      <rect
        x="10"
        y="18"
        width="76"
        height="60"
        rx="8"
        stroke="currentColor"
        strokeWidth="3"
        opacity="0.35"
      />
      <path
        d="M22 62l14-16 10 11 9-12 19 25"
        stroke="currentColor"
        strokeWidth="3"
        strokeLinecap="round"
        strokeLinejoin="round"
        opacity="0.6"
      />
      <circle cx="34" cy="36" r="6" stroke="currentColor" strokeWidth="3" opacity="0.6" />
    </svg>
  );
}
