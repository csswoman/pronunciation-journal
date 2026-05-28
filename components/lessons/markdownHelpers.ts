import { isValidElement, type ReactNode } from "react";

export type AdmonitionTone = "info" | "warning" | "highlight";

export type AdmonitionMeta = {
  title: string;
  icon: string;
  classes: string;
};

export const ADMONITION_MAP: Record<AdmonitionTone, AdmonitionMeta> = {
  info: {
    title: "Info",
    icon: "i",
    classes:
      "border-[color:color-mix(in_srgb,var(--admonitions-color-note)_35%,transparent)] bg-[color:color-mix(in_srgb,var(--admonitions-color-note)_12%,transparent)]",
  },
  warning: {
    title: "Warning",
    icon: "!",
    classes:
      "border-[color:color-mix(in_srgb,var(--admonitions-color-warning)_35%,transparent)] bg-[color:color-mix(in_srgb,var(--admonitions-color-warning)_14%,transparent)]",
  },
  highlight: {
    title: "Highlight",
    icon: "*",
    classes:
      "border-[color:color-mix(in_srgb,var(--admonitions-color-important)_35%,transparent)] bg-[color:color-mix(in_srgb,var(--admonitions-color-important)_13%,transparent)]",
  },
};

const ADMONITION_ALIASES: Record<string, AdmonitionTone> = {
  info: "info",
  note: "info",
  warning: "warning",
  caution: "warning",
  highlight: "highlight",
  tip: "highlight",
  important: "highlight",
};

export function preprocessAdmonitions(markdown: string): string {
  const lines = markdown.replace(/\r\n/g, "\n").split("\n");
  const output: string[] = [];

  for (let i = 0; i < lines.length; i += 1) {
    const startMatch = lines[i].match(/^:::\s*([a-zA-Z]+)\s*$/);
    const tone = startMatch ? ADMONITION_ALIASES[startMatch[1].toLowerCase()] : undefined;

    if (!tone) {
      output.push(lines[i]);
      continue;
    }

    const body: string[] = [];
    i += 1;

    while (i < lines.length && !/^:::\s*$/.test(lines[i])) {
      body.push(lines[i]);
      i += 1;
    }

    output.push(`> [!${tone.toUpperCase()}]`);
    if (body.length === 0) {
      output.push("> ");
      continue;
    }

    for (const bodyLine of body) {
      output.push(bodyLine.trim().length > 0 ? `> ${bodyLine}` : "> ");
    }
  }

  return output.join("\n");
}

export function flattenText(node: ReactNode): string {
  if (typeof node === "string" || typeof node === "number") return String(node);
  if (Array.isArray(node)) return node.map(flattenText).join("");
  if (isValidElement<{ children?: ReactNode }>(node)) return flattenText(node.props.children ?? null);
  return "";
}

export function getAdmonitionTone(children: ReactNode): AdmonitionTone | null {
  const text = flattenText(children).trim();
  const match = text.match(/^\[!(INFO|WARNING|HIGHLIGHT)\]/i);
  if (!match) return null;
  const n = match[1].toLowerCase();
  if (n === "info") return "info";
  if (n === "warning") return "warning";
  return "highlight";
}

export function isAdmonitionMarker(children: ReactNode): boolean {
  return /^\[!(INFO|WARNING|HIGHLIGHT)\]$/i.test(flattenText(children).trim());
}

function cleanString(s: string): string {
  return s
    .replace(/^[\p{Extended_Pictographic}\p{Emoji_Component}‍︎️\s]+/u, "")
    .trimStart();
}

export function stripDecorative(children: ReactNode): ReactNode {
  if (typeof children === "string") return cleanString(children);
  if (Array.isArray(children)) {
    const first = children[0];
    if (typeof first === "string") return [cleanString(first), ...children.slice(1)];
  }
  return children;
}

export function slugifyChildren(children: ReactNode): string {
  return flattenText(children)
    .replace(/[\p{Extended_Pictographic}\p{Emoji_Component}‍︎️]/gu, "")
    .toLowerCase()
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .replace(/[^a-z0-9\s-]/g, "")
    .trim()
    .replace(/\s+/g, "-");
}
