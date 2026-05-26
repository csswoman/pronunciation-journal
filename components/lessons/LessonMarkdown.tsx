'use client';

import { isValidElement, type ReactNode } from "react";
import Image from "next/image";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import 'react-notion-x/src/styles.css'
import 'prismjs'
import 'prismjs/themes/prism-tomorrow.css'
import { isHtmlContent } from "@/lib/theory-lessons/contentFormat";

type AdmonitionTone = "info" | "warning" | "highlight";

type AdmonitionMeta = {
  title: string;
  icon: string;
  classes: string;
};

const ADMONITION_MAP: Record<AdmonitionTone, AdmonitionMeta> = {
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

function preprocessAdmonitions(markdown: string): string {
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

function flattenText(node: ReactNode): string {
  if (typeof node === "string" || typeof node === "number") {
    return String(node);
  }

  if (Array.isArray(node)) {
    return node.map(flattenText).join("");
  }

  if (isValidElement<{ children?: ReactNode }>(node)) {
    return flattenText(node.props.children ?? null);
  }

  return "";
}

function getAdmonitionToneFromChildren(children: ReactNode): AdmonitionTone | null {
  const text = flattenText(children).trim();
  const match = text.match(/^\[!(INFO|WARNING|HIGHLIGHT)\]/i);
  if (!match) return null;

  const normalized = match[1].toLowerCase();
  if (normalized === "info") return "info";
  if (normalized === "warning") return "warning";
  return "highlight";
}

function isAdmonitionMarker(children: ReactNode): boolean {
  return /^\[!(INFO|WARNING|HIGHLIGHT)\]$/i.test(flattenText(children).trim());
}

/** Strip leading emoji + decorative pictographs from heading text. */
function stripDecorative(children: ReactNode): ReactNode {
  if (typeof children === "string") return cleanString(children);
  if (Array.isArray(children)) {
    const first = children[0];
    if (typeof first === "string") {
      return [cleanString(first), ...children.slice(1)];
    }
  }
  return children;
}

function cleanString(s: string): string {
  return s
    // Strip leading emojis / pictographs / dingbats / variation selectors
    .replace(/^[\p{Extended_Pictographic}\p{Emoji_Component}‍︎️\s]+/u, "")
    .trimStart();
}

function slugifyChildren(children: ReactNode): string {
  return flattenText(children)
    .replace(/[\p{Extended_Pictographic}\p{Emoji_Component}‍︎️]/gu, "")
    .toLowerCase()
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .replace(/[^a-z0-9\s-]/g, "")
    .trim()
    .replace(/\s+/g, "-");
}

/** Detect a 2-column "vs" table: headers contain Weak/Strong, Wrong/Right,
 *  Don't/Do, ❌/✅, or similar. Returns label tokens or null. */
const VS_HEADERS: { match: RegExp; left: string; right: string }[] = [
  { match: /weak.*strong|strong.*weak/i,                 left: "Weak",  right: "Strong" },
  { match: /wrong.*right|right.*wrong|don.?t.*do|do.*don.?t/i, left: "Wrong", right: "Right"  },
  { match: /before.*after|after.*before/i,               left: "Before", right: "After"  },
  { match: /❌.*✅|✅.*❌/,                              left: "Don't", right: "Do"     },
];

function detectVsHeaders(thead: ReactNode): { left: string; right: string } | null {
  const text = flattenText(thead);
  for (const h of VS_HEADERS) {
    if (h.match.test(text)) return { left: h.left, right: h.right };
  }
  return null;
}

/** Extract the two <td> cells from a GFM single-row tbody. */
function getVsRowCells(tbody: ReactNode): [ReactNode, ReactNode] | null {
  let cells: ReactNode[] = [];
  const visit = (n: ReactNode) => {
    if (Array.isArray(n)) { n.forEach(visit); return; }
    if (!isValidElement<{ children?: ReactNode }>(n)) return;
    const type = (n.type as { name?: string; displayName?: string } | string);
    const name = typeof type === "string" ? type : (type.displayName ?? type.name ?? "");
    if (name === "td") { cells.push(n.props.children); return; }
    visit(n.props.children ?? null);
  };
  visit(tbody);
  if (cells.length < 2) return null;
  return [cells[0], cells[1]];
}

function tryRenderVsTable(tableChildren: ReactNode): ReactNode | null {
  // Walk children to find <thead> and <tbody>
  let thead: ReactNode = null;
  let tbody: ReactNode = null;
  const visit = (n: ReactNode) => {
    if (Array.isArray(n)) { n.forEach(visit); return; }
    if (!isValidElement<{ children?: ReactNode }>(n)) return;
    const type = (n.type as { name?: string; displayName?: string } | string);
    const name = typeof type === "string" ? type : (type.displayName ?? type.name ?? "");
    if (name === "thead") thead = n.props.children;
    else if (name === "tbody") tbody = n.props.children;
    else visit(n.props.children ?? null);
  };
  visit(tableChildren);

  const labels = detectVsHeaders(thead);
  if (!labels) return null;
  const cells = getVsRowCells(tbody);
  if (!cells) return null;

  return (
    <aside className="md-vs" role="group" aria-label={`${labels.left} vs ${labels.right}`}>
      <div className="md-vs-col is-weak">
        <div className="md-vs-label">{labels.left}</div>
        <div className="md-vs-body">{cells[0]}</div>
      </div>
      <div className="md-vs-divider" aria-hidden />
      <div className="md-vs-col is-strong">
        <div className="md-vs-label">{labels.right}</div>
        <div className="md-vs-body">{cells[1]}</div>
      </div>
    </aside>
  );
}

export default function LessonMarkdown({ content }: { content: string }) {
  const safeContent = content || "This lesson has no content yet.";

  if (isHtmlContent(safeContent)) {
    return (
      <div className="markdown" dangerouslySetInnerHTML={{ __html: safeContent }} />
    );
  }

  const markdown = preprocessAdmonitions(safeContent);

  return (
    <div className="markdown">
      <ReactMarkdown
        remarkPlugins={[remarkGfm]}
        components={{
          h1: ({ children }) => (
            <h1 className="md-h1">{children}</h1>
          ),
          h2: ({ children }) => {
            const id = slugifyChildren(children);
            const clean = stripDecorative(children);
            return (
              <h2 id={id} className="md-h2">
                {clean}
                <a href={`#${id}`} className="md-anchor" aria-label="Link to section">#</a>
              </h2>
            );
          },
          h3: ({ children }) => {
            const id = slugifyChildren(children);
            const clean = stripDecorative(children);
            return (
              <h3 id={id} className="md-h3">
                {clean}
                <a href={`#${id}`} className="md-anchor" aria-label="Link to section">#</a>
              </h3>
            );
          },
          h4: ({ children }) => (
            <h4 className="md-h4">{children}</h4>
          ),
          p: ({ children }) => {
            if (isAdmonitionMarker(children)) return null;
            return <p className="md-p">{children}</p>;
          },
          ul: ({ children }) => (
            <ul className="md-list md-list-ul">{children}</ul>
          ),
          ol: ({ children }) => <ol className="md-list md-list-ol">{children}</ol>,
          li: ({ children }) => (
            <li className="md-li">{children}</li>
          ),
          blockquote: ({ children }) => {
            const tone = getAdmonitionToneFromChildren(children);
            if (!tone) {
              return <blockquote className="md-blockquote">{children}</blockquote>;
            }

            const meta = ADMONITION_MAP[tone];
            return (
              <aside className={`md-callout ${tone} ${meta.classes}`}>
                <div className="md-callout-label">
                  <span className="md-callout-badge">{meta.icon}</span>
                  <span>{meta.title}</span>
                </div>
                <div className="md-callout-body">{children}</div>
              </aside>
            );
          },
          table: ({ children }) => {
            const vs = tryRenderVsTable(children);
            if (vs) return vs;
            return (
              <div className="md-table-wrap">
                <table className="md-table">{children}</table>
              </div>
            );
          },
          thead: ({ children }) => <thead className="md-table-head">{children}</thead>,
          tr:    ({ children }) => <tr className="md-table-row">{children}</tr>,
          th:    ({ children }) => <th className="md-table-th">{children}</th>,
          td:    ({ children }) => <td className="md-table-td">{children}</td>,
          pre: ({ children }) => <pre className="md-code">{children}</pre>,
          code: ({ children, className }) => {
            const isBlock = Boolean(className && className.includes("language-"));
            if (isBlock) {
              return <code className={className}>{children}</code>;
            }
            return <code className="md-inline-code">{children}</code>;
          },
          a: ({ href, children }) => {
            const isExternal = typeof href === "string" && /^https?:\/\//i.test(href);
            return (
              <a
                href={href}
                target={isExternal ? "_blank" : undefined}
                rel={isExternal ? "noopener noreferrer" : undefined}
              >
                {children}
              </a>
            );
          },
          img: ({ src, alt }) => {
            if (typeof src !== "string" || src.length === 0) return null;
            const caption = typeof alt === "string" ? alt : "";
            return (
              <figure>
                <Image
                  src={src}
                  alt={caption}
                  className="md-image"
                  width={1200}
                  height={675}
                  unoptimized
                />
                {caption && <figcaption className="md-figcaption">{caption}</figcaption>}
              </figure>
            );
          },
          hr: () => <hr className="md-divider" />,
        }}
      >
        {markdown}
      </ReactMarkdown>
    </div>
  );
}
