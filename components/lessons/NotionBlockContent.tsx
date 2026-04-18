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
  gray: "md-text-gray",
  brown: "md-text-brown",
  orange: "md-text-orange",
  yellow: "md-text-yellow",
  green: "md-text-green",
  blue: "md-text-blue",
  purple: "md-text-purple",
  pink: "md-text-pink",
  red: "md-text-red",
  gray_background: "md-bg-gray",
  brown_background: "md-bg-brown",
  orange_background: "md-bg-orange",
  yellow_background: "md-bg-yellow",
  green_background: "md-bg-green",
  blue_background: "md-bg-blue",
  purple_background: "md-bg-purple",
  pink_background: "md-bg-pink",
  red_background: "md-bg-red",
};

const CALLOUT_EMOJI_VARIANT: Record<string, string> = {
  "💡": "tip",
  "✅": "success",
  "✔️": "success",
  "⚠️": "warning",
  "🚨": "warning",
  "📌": "info",
  "📝": "info",
  "ℹ️": "info",
};

function renderRichText(richText: NotionRichText[] | undefined): React.ReactNode {
  if (!richText || richText.length === 0) return null;

  const isIpaText = (text: string) =>
    /^\/.*\/$/.test(text.trim()) && /[ɑɐɒæɜəɪʊʌθðŋʃʒʧʤˈˌːˑ]/.test(text);

  const nodes = richText.map((t, i) => {
    const text = t.plain_text || t.text?.content || "";
    if (!text) return null;
    const ann = (t.annotations || {}) as NotionAnnotations;
    const hasStyle = ann.bold || ann.italic || ann.strikethrough || ann.underline || ann.code || (ann.color && ann.color !== "default");
    const colorClass = ann.color && ann.color !== "default" ? NOTION_COLOR_MAP[ann.color] || "" : "";
    const classes = [
      ann.bold ? "font-semibold" : "",
      ann.italic ? "italic" : "",
      ann.strikethrough ? "line-through" : "",
      ann.underline ? "underline" : "",
      ann.code ? "md-inline-code" : "",
      isIpaText(text) ? "md-ipa" : "",
      colorClass,
      colorClass.startsWith("md-bg-") ? "md-color-bg" : "",
    ].filter(Boolean).join(" ");

    if (!hasStyle && !isIpaText(text)) return text;

    return <span key={i} className={classes}>{text}</span>;
  });
  return <>{nodes}</>;
}

function renderListChildren(children: NotionBlock[] | undefined) {
  if (!children || children.length === 0) return null;
  return <BlockList blocks={children} />;
}

export function NotionBlockRenderer({ block }: { block: NotionBlock }) {
  const [open, setOpen] = useState(false);

  switch (block.type) {
    case "paragraph": {
      const text = renderRichText(getBlockVariant(block, "paragraph")?.rich_text);
      if (!text) return null;
      return <p className="md-paragraph">{text}</p>;
    }
    case "heading_1": {
      const text = renderRichText(getBlockVariant(block, "heading_1")?.rich_text);
      return <h1 className="md-heading md-heading-1">{text}</h1>;
    }
    case "heading_2": {
      const text = renderRichText(getBlockVariant(block, "heading_2")?.rich_text);
      return <h2 className="md-heading md-heading-2">{text}</h2>;
    }
    case "heading_3": {
      const heading = getBlockVariant(block, "heading_3");
      const text = renderRichText(heading?.rich_text);
      if (heading?.is_toggleable) {
        const children: NotionBlock[] = heading.children || [];
      return (
        <div>
          <button
            onClick={() => setOpen((o) => !o)}
            className="md-toggle-button md-heading md-heading-3"
            >
              <span className={`md-toggle-caret ${open ? "md-toggle-caret-open" : ""}`}>▶</span>
              {text}
            </button>
            {open && children.length > 0 && (
              <div className="md-toggle-children">
                {children.map((child) => <NotionBlockRenderer key={child.id} block={child} />)}
              </div>
            )}
          </div>
        );
      }
      return <h3 className="md-heading md-heading-3">{text}</h3>;
    }
    case "toggle": {
      const toggle = getBlockVariant(block, "toggle");
      const text = renderRichText(toggle?.rich_text);
      const children: NotionBlock[] = toggle?.children || [];
      return (
        <div>
          <button
            onClick={() => setOpen((o) => !o)}
            className="md-toggle-button md-toggle-button-compact"
          >
            <span className={`md-toggle-caret md-toggle-caret-small ${open ? "md-toggle-caret-open" : ""}`}>▶</span>
            {text}
          </button>
          {open && children.length > 0 && (
            <div className="md-toggle-children md-toggle-children-compact">
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
        <li className="md-li md-li-bullet">
          <div className="md-li-content">
            <div className="md-li-text">{text}</div>
            {renderListChildren(children)}
          </div>
        </li>
      );
    }
    case "numbered_list_item": {
      const item = getBlockVariant(block, "numbered_list_item");
      const text = renderRichText(item?.rich_text);
      const children: NotionBlock[] = item?.children || [];
      return (
        <li className="md-li md-li-numbered">
          <div className="md-li-content">
            <div className="md-li-text">{text}</div>
            {renderListChildren(children)}
          </div>
        </li>
      );
    }
    case "code": {
      const code = getBlockVariant(block, "code");
      const text = renderRichText(code?.rich_text);
      return (
        <pre className="md-code">
          <code>{text}</code>
        </pre>
      );
    }
    case "quote": {
      const quote = getBlockVariant(block, "quote");
      const text = renderRichText(quote?.rich_text);
      const children: NotionBlock[] = quote?.children || [];
      return (
        <blockquote className="md-blockquote">
          {text && <p>{text}</p>}
          {children.length > 0 && (
            <div className="md-quote-children">
              {children.map((child) => <NotionBlockRenderer key={child.id} block={child} />)}
            </div>
          )}
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
        <figure>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={url} alt={captionText || "lesson image"} className="md-image" />
          {caption && <figcaption className="md-figcaption">{caption}</figcaption>}
        </figure>
      );
    }
    case "table": {
      const table = block["table"] as { has_column_header?: boolean; has_row_header?: boolean; children?: NotionBlock[] } | undefined;
      const rows = table?.children || [];
      if (rows.length === 0) return null;
      const hasColHeader = table?.has_column_header ?? false;
      return (
        <div className="md-table-wrap">
          <table className="md-table">
            {hasColHeader && rows[0] && (
              <thead className="md-table-head">
                <tr>
                  {((rows[0]["table_row"] as { cells?: NotionRichText[][] } | undefined)?.cells || []).map((cell, ci) => (
                    <th key={ci} className="md-table-th">
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
                  <tr key={ri} className="md-table-row">
                    {cells.map((cell, ci) => (
                      <td key={ci} className="md-table-td">
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
        <div className="md-column-list" style={{ gridTemplateColumns: `repeat(${columns.length}, 1fr)` }}>
          {columns.map((col) => {
            const colBlocks = (col["column"] as { children?: NotionBlock[] } | undefined)?.children || [];
            return (
              <div key={col.id} className="md-column">
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
      return <hr className="md-divider" />;
    case "callout": {
      const callout = getBlockVariant(block, "callout");
      const text = renderRichText(callout?.rich_text);
      const children: NotionBlock[] = callout?.children || [];
      const emoji = callout?.icon?.emoji || "💡";
      const variant = CALLOUT_EMOJI_VARIANT[emoji] ?? "info";
      return (
        <div className={`callout ${variant} md-callout-legacy`}>
          <span className="callout-icon md-callout-icon">{emoji}</span>
          <div className="callout-content md-callout-content">
            {text && <p>{text}</p>}
            {children.length > 0 && (
              <div className="md-callout-children">
                {children.map((child) => <NotionBlockRenderer key={child.id} block={child} />)}
              </div>
            )}
          </div>
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
    <div className="md-list-group">
      {groups.map((group, idx) => {
        if (group.type === "list") {
          const isBulleted = group.blocks[0].type === "bulleted_list_item";
          const Tag = isBulleted ? "ul" : "ol";
          return (
            <Tag key={idx} className={`md-list ${isBulleted ? "md-list-ul" : "md-list-ol"}`}>
              {group.blocks.map((b) => <NotionBlockRenderer key={b.id} block={b} />)}
            </Tag>
          );
        }
        return (
          <NotionBlockRenderer key={group.blocks[0].id} block={group.blocks[0]} />
        );
      })}
    </div>
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
    <div>
      {subLessons.map((lesson, i) => (
        <NotionToggleItem key={lesson.id} lesson={lesson} defaultOpen={i === 0} />
      ))}
    </div>
  );
}
