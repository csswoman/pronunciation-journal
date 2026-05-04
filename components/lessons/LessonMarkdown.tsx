'use client';

import { isValidElement, type ReactNode } from "react";
import Image from "next/image";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import 'react-notion-x/src/styles.css'
import 'prismjs'
import 'prismjs/themes/prism-tomorrow.css'

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

export default function LessonMarkdown({ content }: { content: string }) {
  const markdown = preprocessAdmonitions(content || "This lesson has no content yet.");

  return (
    <div className="markdown">
      <ReactMarkdown
        remarkPlugins={[remarkGfm]}
        components={{
          h1: ({ children }) => (
            <h1 className="md-h1">{children}</h1>
          ),
          h2: ({ children }) => (
            <h2 className="md-h2">{children}</h2>
          ),
          h3: ({ children }) => (
            <h3 className="md-h3">{children}</h3>
          ),
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
          table: ({ children }) => (
            <div className="my-6 overflow-x-auto rounded-xl border border-[var(--line-divider)]">
              <table className="w-full text-sm">
                {children}
              </table>
            </div>
          ),
          thead: ({ children }) => (
            <thead className="bg-[var(--btn-plain-bg)] dark:bg-[var(--btn-regular-bg)]">
              {children}
            </thead>
          ),
          th: ({ children }) => (
            <th className="border-b border-[var(--line-divider)] px-4 py-3 text-left font-semibold text-[var(--deep-text)]">
              {children}
            </th>
          ),
          td: ({ children }) => (
            <td className="border-b border-[var(--line-divider)] px-4 py-3 text-[var(--text-secondary)]">
              {children}
            </td>
          ),
          pre: ({ children }) => (
            <pre className="my-6 overflow-x-auto rounded-xl bg-zinc-900 p-4 text-on-primary dark:bg-zinc-950">
              {children}
            </pre>
          ),
          code: ({ children, className }) => {
            const isBlock = Boolean(className && className.includes("language-"));
            if (isBlock) {
              return (
                <code className="text-sm font-mono text-zinc-100">
                  {children}
                </code>
              );
            }
            return (
              <code className="rounded bg-zinc-100 px-1.5 py-0.5 text-sm text-zinc-800 dark:bg-zinc-800/80 dark:text-zinc-100">
                {children}
              </code>
            );
          },
          a: ({ href, children }) => (
            <a
              href={href}
              className="font-medium text-[var(--primary)] underline decoration-[color:color-mix(in_srgb,var(--primary)_40%,transparent)] underline-offset-4 transition-colors hover:text-[var(--btn-content)]"
              target="_blank"
              rel="noopener noreferrer"
            >
              {children}
            </a>
          ),
          img: ({ src, alt }) => {
            if (typeof src !== "string" || src.length === 0) return null;

            return (
              <Image
                src={src}
                alt={typeof alt === "string" ? alt : ""}
                className="my-6 max-w-full rounded-xl shadow-md dark:shadow-xl"
                width={400}
                height={200}
              />
            );
          },
          hr: () => <hr className="my-8 border-[var(--line-divider)]" />,
        }}
      >
        {markdown}
      </ReactMarkdown>
    </div>
  );
}
