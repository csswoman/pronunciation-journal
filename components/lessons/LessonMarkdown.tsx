'use client';

// Planned structure:
// <LessonMarkdown>
//   <MarkdownComponents /> (custom renderers passed to ReactMarkdown)
// </LessonMarkdown>
// Helpers: markdownHelpers.ts, markdownVsTable.tsx

import type { ReactNode } from "react";
import Image from "next/image";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { isHtmlContent } from "@/lib/theory-lessons/contentFormat";
import {
  preprocessAdmonitions,
  getAdmonitionTone,
  isAdmonitionMarker,
  stripDecorative,
  slugifyChildren,
  ADMONITION_MAP,
} from "./markdownHelpers";
import { tryRenderVsTable } from "./markdownVsTable";

function MarkdownHeading2({ children }: { children: ReactNode }) {
  const id = slugifyChildren(children);
  const clean = stripDecorative(children);
  return (
    <h2 id={id} className="md-h2">
      {clean}
      <a href={`#${id}`} className="md-anchor" aria-label="Link to section">#</a>
    </h2>
  );
}

function MarkdownHeading3({ children }: { children: ReactNode }) {
  const id = slugifyChildren(children);
  const clean = stripDecorative(children);
  return (
    <h3 id={id} className="md-h3">
      {clean}
      <a href={`#${id}`} className="md-anchor" aria-label="Link to section">#</a>
    </h3>
  );
}

function MarkdownCallout({ children }: { children: ReactNode }) {
  const tone = getAdmonitionTone(children);
  if (!tone) return <blockquote className="md-blockquote">{children}</blockquote>;
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
}

function MarkdownImage({ src, alt }: { src?: string; alt?: string }) {
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
}

const components = {
  h1: ({ children }: { children?: ReactNode }) => <h1 className="md-h1">{children}</h1>,
  h2: ({ children }: { children?: ReactNode }) => <MarkdownHeading2>{children}</MarkdownHeading2>,
  h3: ({ children }: { children?: ReactNode }) => <MarkdownHeading3>{children}</MarkdownHeading3>,
  h4: ({ children }: { children?: ReactNode }) => <h4 className="md-h4">{children}</h4>,
  p: ({ children }: { children?: ReactNode }) => {
    if (isAdmonitionMarker(children)) return null;
    return <p className="md-p">{children}</p>;
  },
  ul: ({ children }: { children?: ReactNode }) => <ul className="md-list md-list-ul">{children}</ul>,
  ol: ({ children }: { children?: ReactNode }) => <ol className="md-list md-list-ol">{children}</ol>,
  li: ({ children }: { children?: ReactNode }) => <li className="md-li">{children}</li>,
  blockquote: ({ children }: { children?: ReactNode }) => <MarkdownCallout>{children}</MarkdownCallout>,
  table: ({ children }: { children?: ReactNode }) => {
    const vs = tryRenderVsTable(children);
    if (vs) return vs;
    return (
      <div className="md-table-wrap">
        <table className="md-table">{children}</table>
      </div>
    );
  },
  thead: ({ children }: { children?: ReactNode }) => <thead className="md-table-head">{children}</thead>,
  tr:    ({ children }: { children?: ReactNode }) => <tr className="md-table-row">{children}</tr>,
  th:    ({ children }: { children?: ReactNode }) => <th className="md-table-th">{children}</th>,
  td:    ({ children }: { children?: ReactNode }) => <td className="md-table-td">{children}</td>,
  pre:   ({ children }: { children?: ReactNode }) => <pre className="md-code">{children}</pre>,
  code:  ({ children, className }: { children?: ReactNode; className?: string }) => {
    if (className?.includes("language-")) return <code className={className}>{children}</code>;
    return <code className="md-inline-code">{children}</code>;
  },
  a: ({ href, children }: { href?: string; children?: ReactNode }) => {
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
  img: ({ src, alt }: { src?: string; alt?: string }) => <MarkdownImage src={src} alt={alt} />,
  hr: () => <hr className="md-divider" />,
} as Parameters<typeof ReactMarkdown>[0]["components"];

export default function LessonMarkdown({ content }: { content: string }) {
  const safeContent = content || "This lesson has no content yet.";

  if (isHtmlContent(safeContent)) {
    return <div className="markdown" dangerouslySetInnerHTML={{ __html: safeContent }} />;
  }

  return (
    <div className="markdown">
      <ReactMarkdown remarkPlugins={[remarkGfm]} components={components}>
        {preprocessAdmonitions(safeContent)}
      </ReactMarkdown>
    </div>
  );
}
