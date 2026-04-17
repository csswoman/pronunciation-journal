"use client";

import { useState } from "react";
import { NotionBlock, NotionRichText, SubLesson } from "@/lib/notion/types";

type NotionBlockVariant = {
  rich_text?: NotionRichText[];
  children?: NotionBlock[];
  is_toggleable?: boolean;
  icon?: { emoji?: string };
  type?: "external" | "file";
  external?: { url?: string };
  file?: { url?: string };
  caption?: NotionRichText[];
};

function getBlockVariant(block: NotionBlock, key: string): NotionBlockVariant | undefined {
  return block[key] as NotionBlockVariant | undefined;
}

type NotionAnnotations = {
  bold?: boolean;
  italic?: boolean;
  strikethrough?: boolean;
  underline?: boolean;
  code?: boolean;
  color?: string;
};

const NOTION_COLOR_MAP: Record<string, string> = {
  gray: "text-gray-500",
  brown: "text-amber-800",
  orange: "text-orange-500",
  yellow: "text-yellow-500",
  green: "text-green-600",
  blue: "text-blue-500",
  purple: "text-purple-500",
  pink: "text-pink-500",
  red: "text-red-500",
  gray_background: "bg-gray-100 dark:bg-gray-800",
  brown_background: "bg-amber-100 dark:bg-amber-900/30",
  orange_background: "bg-orange-100 dark:bg-orange-900/30",
  yellow_background: "bg-yellow-100 dark:bg-yellow-900/30",
  green_background: "bg-green-100 dark:bg-green-900/30",
  blue_background: "bg-blue-100 dark:bg-blue-900/30",
  purple_background: "bg-purple-100 dark:bg-purple-900/30",
  pink_background: "bg-pink-100 dark:bg-pink-900/30",
  red_background: "bg-red-100 dark:bg-red-900/30",
};

function renderRichText(richText: NotionRichText[] | undefined): React.ReactNode {
  if (!richText || richText.length === 0) return null;
  const nodes = richText.map((t, i) => {
    const text = t.plain_text || t.text?.content || "";
    if (!text) return null;
    const ann = (t.annotations || {}) as NotionAnnotations;
    const hasStyle = ann.bold || ann.italic || ann.strikethrough || ann.underline || ann.code || (ann.color && ann.color !== "default");
    if (!hasStyle) return text;

    const colorClass = ann.color && ann.color !== "default" ? NOTION_COLOR_MAP[ann.color] || "" : "";
    const classes = [
      ann.bold ? "font-semibold" : "",
      ann.italic ? "italic" : "",
      ann.strikethrough ? "line-through" : "",
      ann.underline ? "underline" : "",
      ann.code ? "font-mono bg-neutral-100 dark:bg-neutral-800 px-1 py-0.5 rounded text-sm" : "",
      colorClass,
      colorClass.includes("bg-") ? "px-1 py-0.5 rounded" : "",
    ].filter(Boolean).join(" ");

    return <span key={i} className={classes}>{text}</span>;
  });
  return <>{nodes}</>;
}

export function NotionBlockRenderer({ block }: { block: NotionBlock }) {
  const [open, setOpen] = useState(false);

  switch (block.type) {
    case "paragraph": {
      const text = renderRichText(getBlockVariant(block, "paragraph")?.rich_text);
      if (!text) return null;
      return <p className="text-base leading-relaxed text-gray-700 dark:text-[var(--text-secondary)] mb-3">{text}</p>;
    }
    case "heading_1": {
      const text = renderRichText(getBlockVariant(block, "heading_1")?.rich_text);
      return <h1 className="text-2xl font-bold text-neutral-900 dark:text-[var(--deep-text)] mt-6 mb-3">{text}</h1>;
    }
    case "heading_2": {
      const text = renderRichText(getBlockVariant(block, "heading_2")?.rich_text);
      return <h2 className="text-xl font-bold text-neutral-900 dark:text-[var(--deep-text)] mt-5 mb-2">{text}</h2>;
    }
    case "heading_3": {
      const heading = getBlockVariant(block, "heading_3");
      const text = renderRichText(heading?.rich_text);
      if (heading?.is_toggleable) {
        const children: NotionBlock[] = heading.children || [];
        return (
          <div className="mb-2">
            <button
              onClick={() => setOpen((o) => !o)}
              className="flex items-center gap-2 w-full text-left text-lg font-semibold text-neutral-900 dark:text-[var(--deep-text)] hover:text-[var(--primary)] transition-colors"
            >
              <span className={`transition-transform duration-200 ${open ? "rotate-90" : ""}`}>▶</span>
              {text}
            </button>
            {open && children.length > 0 && (
              <div className="mt-2 ml-5 space-y-1">
                {children.map((child) => <NotionBlockRenderer key={child.id} block={child} />)}
              </div>
            )}
          </div>
        );
      }
      return <h3 className="text-lg font-semibold text-neutral-900 dark:text-[var(--deep-text)] mt-4 mb-2">{text}</h3>;
    }
    case "toggle": {
      const toggle = getBlockVariant(block, "toggle");
      const text = renderRichText(toggle?.rich_text);
      const children: NotionBlock[] = toggle?.children || [];
      return (
        <div className="mb-2">
          <button
            onClick={() => setOpen((o) => !o)}
            className="flex items-center gap-2 w-full text-left font-medium text-neutral-900 dark:text-[var(--deep-text)] hover:text-[var(--primary)] transition-colors"
          >
            <span className={`transition-transform duration-200 text-sm ${open ? "rotate-90" : ""}`}>▶</span>
            {text}
          </button>
          {open && children.length > 0 && (
            <div className="mt-2 ml-5 space-y-1">
              {children.map((child) => <NotionBlockRenderer key={child.id} block={child} />)}
            </div>
          )}
        </div>
      );
    }
    case "bulleted_list_item": {
      const item = getBlockVariant(block, "bulleted_list_item");
      const text = renderRichText(item?.rich_text);
      const children: NotionBlock[] = item?.children || [];
      return (
        <li className="flex gap-2.5 text-base leading-relaxed text-gray-700 dark:text-[var(--text-secondary)] list-none">
          <span className="mt-[0.45em] h-1.5 w-1.5 shrink-0 rounded-full bg-[var(--primary)] opacity-80" aria-hidden />
          <span>
            {text}
            {children.length > 0 && (
              <ul className="mt-1.5 space-y-1.5 pl-0">
                {children.map((c) => <NotionBlockRenderer key={c.id} block={c} />)}
              </ul>
            )}
          </span>
        </li>
      );
    }
    case "numbered_list_item": {
      const text = renderRichText(getBlockVariant(block, "numbered_list_item")?.rich_text);
      return <li className="text-base leading-relaxed text-gray-700 dark:text-[var(--text-secondary)]">{text}</li>;
    }
    case "code": {
      const code = getBlockVariant(block, "code");
      const text = renderRichText(code?.rich_text);
      return (
        <pre className="my-4 overflow-x-auto rounded-xl bg-zinc-900 p-4 text-sm text-white dark:bg-zinc-950">
          <code>{text}</code>
        </pre>
      );
    }
    case "quote": {
      const text = renderRichText(getBlockVariant(block, "quote")?.rich_text);
      return (
        <blockquote className="my-4 rounded-xl border-l-4 border-[var(--primary)] bg-neutral-100 px-5 py-4 text-gray-700 dark:bg-[var(--btn-regular-bg)] dark:text-[var(--text-secondary)]">
          {text}
        </blockquote>
      );
    }
    case "image": {
      const image = getBlockVariant(block, "image");
      const url = image?.type === "external" ? image.external?.url : image?.file?.url;
      const caption = renderRichText(image?.caption);
      const captionText = (image?.caption || []).map((t) => t.plain_text || "").join("");
      if (!url) return null;
      return (
        <figure className="my-6">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={url} alt={captionText || "lesson image"} className="rounded-xl w-full object-contain" />
          {caption && <figcaption className="mt-2 text-center text-sm text-[var(--text-secondary)]">{caption}</figcaption>}
        </figure>
      );
    }
    case "table": {
      const table = block["table"] as { has_column_header?: boolean; has_row_header?: boolean; children?: NotionBlock[] } | undefined;
      const rows = table?.children || [];
if (rows.length === 0) return null;
      const hasColHeader = table?.has_column_header ?? false;
      return (
        <div className="my-4 overflow-x-auto rounded-xl border border-[var(--line-divider)]">
          <table className="w-full text-sm">
            {hasColHeader && rows[0] && (
              <thead className="bg-neutral-100 dark:bg-[var(--btn-plain-bg)]">
                <tr>
                  {((rows[0]["table_row"] as { cells?: NotionRichText[][] } | undefined)?.cells || []).map((cell, ci) => (
                    <th key={ci} className="px-4 py-2 text-left font-semibold text-neutral-900 dark:text-[var(--deep-text)] border-b border-[var(--line-divider)]">
                      {renderRichText(cell)}
                    </th>
                  ))}
                </tr>
              </thead>
            )}
            <tbody>
              {(hasColHeader ? rows.slice(1) : rows).map((row, ri) => {
                const cells = (row["table_row"] as { cells?: NotionRichText[][] } | undefined)?.cells || [];
                return (
                  <tr key={ri} className="border-b border-[var(--line-divider)] last:border-0 odd:bg-white even:bg-neutral-50 dark:odd:bg-transparent dark:even:bg-[var(--btn-plain-bg)]">
                    {cells.map((cell, ci) => (
                      <td key={ci} className="px-4 py-2 text-gray-700 dark:text-[var(--text-secondary)]">
                        {renderRichText(cell)}
                      </td>
                    ))}
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      );
    }
    case "column_list": {
      const columns = (block["column_list"] as { children?: NotionBlock[] } | undefined)?.children || [];
      if (columns.length === 0) return null;
      return (
        <div className="my-4 grid gap-4" style={{ gridTemplateColumns: `repeat(${columns.length}, 1fr)` }}>
          {columns.map((col) => {
            const colBlocks = (col["column"] as { children?: NotionBlock[] } | undefined)?.children || [];
            return (
              <div key={col.id} className="min-w-0">
                {colBlocks.map((b) => <NotionBlockRenderer key={b.id} block={b} />)}
              </div>
            );
          })}
        </div>
      );
    }
    case "column":
      return null;
    case "table_row":
      return null;
    case "divider":
      return <hr className="my-6 border-[var(--line-divider)]" />;
    case "callout": {
      const callout = getBlockVariant(block, "callout");
      const text = renderRichText(callout?.rich_text);
      const emoji = callout?.icon?.emoji || "💡";
      return (
        <div className="my-4 flex gap-3 rounded-xl border border-[var(--line-divider)] bg-[var(--btn-plain-bg)] px-4 py-3">
          <span>{emoji}</span>
          <p className="text-sm text-[var(--text-secondary)]">{text}</p>
        </div>
      );
    }
    default:
      return null;
  }
}

function groupListItems(blocks: NotionBlock[]) {
  const result: { type: "list" | "block"; blocks: NotionBlock[] }[] = [];
  let i = 0;
  while (i < blocks.length) {
    const b = blocks[i];
    if (b.type === "bulleted_list_item" || b.type === "numbered_list_item") {
      const listType = b.type;
      const group: NotionBlock[] = [];
      while (i < blocks.length && blocks[i].type === listType) {
        group.push(blocks[i]);
        i++;
      }
      result.push({ type: "list", blocks: group });
    } else {
      result.push({ type: "block", blocks: [b] });
      i++;
    }
  }
  return result;
}

function BlockList({ blocks }: { blocks: NotionBlock[] }) {
  const groups = groupListItems(blocks);
  return (
    <>
      {groups.map((group, idx) => {
        if (group.type === "list") {
          const isBulleted = group.blocks[0].type === "bulleted_list_item";
          const Tag = isBulleted ? "ul" : "ol";
          return (
            <Tag key={idx} className={`my-4 ${isBulleted ? "pl-0 space-y-1.5 list-none" : "pl-6 space-y-1.5 list-decimal marker:text-[var(--primary)] marker:font-semibold"}`}>
              {group.blocks.map((b) => <NotionBlockRenderer key={b.id} block={b} />)}
            </Tag>
          );
        }
        return <NotionBlockRenderer key={group.blocks[0].id} block={group.blocks[0]} />;
      })}
    </>
  );
}

interface NotionToggleItemProps {
  lesson: SubLesson;
  defaultOpen?: boolean;
}

function NotionToggleItem({ lesson, defaultOpen = false }: NotionToggleItemProps) {
  const [open, setOpen] = useState(defaultOpen);

  return (
    <div className="rounded-xl border border-[var(--line-divider)] bg-white dark:bg-[var(--card-bg)] overflow-hidden">
      <button
        onClick={() => setOpen((o) => !o)}
        className="flex w-full items-center justify-between gap-4 px-6 py-4 text-left transition-colors hover:bg-neutral-50 dark:hover:bg-[var(--btn-plain-bg-hover)]"
      >
        <span className="text-base font-semibold text-neutral-900 dark:text-[var(--deep-text)]">
          {lesson.title}
        </span>
        <svg
          xmlns="http://www.w3.org/2000/svg"
          className={`h-4 w-4 shrink-0 text-[var(--text-secondary)] transition-transform duration-200 ${open ? "rotate-180" : ""}`}
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
        >
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
        </svg>
      </button>

      {open && (
        <div className="border-t border-[var(--line-divider)] px-6 py-5">
          {lesson.content.length === 0 ? (
            <p className="text-sm text-[var(--text-secondary)]">No content</p>
          ) : (
            <BlockList blocks={lesson.content} />
          )}
        </div>
      )}
    </div>
  );
}

interface NotionBlockContentProps {
  subLessons: SubLesson[];
}

export default function NotionBlockContent({ subLessons }: NotionBlockContentProps) {
  if (subLessons.length === 0) {
    return (
      <p className="text-sm text-[var(--text-secondary)]">No sections found in this Notion page.</p>
    );
  }

  return (
    <div className="space-y-3">
      {subLessons.map((lesson, i) => (
        <NotionToggleItem key={lesson.id} lesson={lesson} defaultOpen={i === 0} />
      ))}
    </div>
  );
}
