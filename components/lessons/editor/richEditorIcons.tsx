import type { SVGProps } from "react";

const base = {
  xmlns: "http://www.w3.org/2000/svg",
  fill: "none",
  viewBox: "0 0 24 24",
  stroke: "currentColor",
  strokeWidth: 1.8,
  strokeLinecap: "round" as const,
  strokeLinejoin: "round" as const,
};

const Icon = (props: SVGProps<SVGSVGElement>) => (
  <svg {...base} {...props} />
);

export const IconBold = (p: SVGProps<SVGSVGElement>) => (
  <Icon {...p}><path d="M7 5h6a3.5 3.5 0 010 7H7zM7 12h7a3.5 3.5 0 010 7H7z" /></Icon>
);
export const IconItalic = (p: SVGProps<SVGSVGElement>) => (
  <Icon {...p}><path d="M10 5h8M6 19h8M14 5l-4 14" /></Icon>
);
export const IconUnderline = (p: SVGProps<SVGSVGElement>) => (
  <Icon {...p}><path d="M7 4v8a5 5 0 0010 0V4M5 20h14" /></Icon>
);
export const IconStrike = (p: SVGProps<SVGSVGElement>) => (
  <Icon {...p}><path d="M4 12h16M8 7a4 4 0 014-2c2.5 0 4 1.5 4 3M16 17a4 4 0 01-4 2c-2.5 0-4-1.5-4-3" /></Icon>
);
export const IconUL = (p: SVGProps<SVGSVGElement>) => (
  <Icon {...p}><path d="M9 6h12M9 12h12M9 18h12M4 6h.01M4 12h.01M4 18h.01" /></Icon>
);
export const IconOL = (p: SVGProps<SVGSVGElement>) => (
  <Icon {...p}><path d="M10 6h11M10 12h11M10 18h11M4 6h1v4M4 10h2M4 18h2a1 1 0 100-2H4M4 14h2" /></Icon>
);
export const IconQuote = (p: SVGProps<SVGSVGElement>) => (
  <Icon {...p}><path d="M7 7h4v4H7zm0 4c0 3-2 5-4 5M17 7h4v4h-4zm0 4c0 3-2 5-4 5" /></Icon>
);
export const IconLink = (p: SVGProps<SVGSVGElement>) => (
  <Icon {...p}><path d="M10 13a5 5 0 007.54.54l3-3a5 5 0 00-7.07-7.07l-1.72 1.72M14 11a5 5 0 00-7.54-.54l-3 3a5 5 0 007.07 7.07l1.71-1.71" /></Icon>
);
export const IconImage = (p: SVGProps<SVGSVGElement>) => (
  <Icon {...p}><path d="M4 5h16v14H4zM4 16l4-4 4 4 6-6 2 2" /><circle cx="9" cy="9" r="1.5" fill="currentColor" stroke="none" /></Icon>
);
export const IconUndo = (p: SVGProps<SVGSVGElement>) => (
  <Icon {...p}><path d="M9 14l-4-4 4-4M5 10h9a5 5 0 015 5v0a5 5 0 01-5 5h-4" /></Icon>
);
export const IconRedo = (p: SVGProps<SVGSVGElement>) => (
  <Icon {...p}><path d="M15 14l4-4-4-4M19 10h-9a5 5 0 00-5 5v0a5 5 0 005 5h4" /></Icon>
);
export const IconAlignLeft = (p: SVGProps<SVGSVGElement>) => (
  <Icon {...p}><path d="M4 6h16M4 12h10M4 18h16M4 24" /></Icon>
);
export const IconAlignCenter = (p: SVGProps<SVGSVGElement>) => (
  <Icon {...p}><path d="M4 6h16M7 12h10M4 18h16" /></Icon>
);
export const IconAlignRight = (p: SVGProps<SVGSVGElement>) => (
  <Icon {...p}><path d="M4 6h16M10 12h10M4 18h16" /></Icon>
);
export const IconAlignJustify = (p: SVGProps<SVGSVGElement>) => (
  <Icon {...p}><path d="M4 6h16M4 12h16M4 18h16" /></Icon>
);
export const IconChevron = (p: SVGProps<SVGSVGElement>) => (
  <Icon {...p}><path d="M6 9l6 6 6-6" /></Icon>
);
export const IconDivider = (p: SVGProps<SVGSVGElement>) => (
  <Icon {...p}><path d="M4 12h16M4 6h.01M20 6h.01M4 18h.01M20 18h.01" /></Icon>
);
