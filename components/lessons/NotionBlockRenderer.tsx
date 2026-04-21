"use client";
import { NotionBlock, NotionRichText } from "@/lib/notion/types";
import { renderRichText } from "./notion-rich-text";
import { BlockList } from "./BlockList";
import { ToggleBlock } from "./ToggleBlock";

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

function renderListChildren(children: NotionBlock[] | undefined) {
  if (!children || children.length === 0) return null;
  return <BlockList blocks={children} />;
}

export function NotionBlockRenderer({ block }: { block: NotionBlock }) {
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
        return <ToggleBlock text={text} children={heading.children || []} renderBlock={(b) => <NotionBlockRenderer key={b.id} block={b} />} />;
      }
      return <h3 className="md-heading md-heading-3">{text}</h3>;
    }
    case "toggle": {
      const toggle = getBlockVariant(block, "toggle");
      return <ToggleBlock text={renderRichText(toggle?.rich_text)} children={toggle?.children || []} compact renderBlock={(b) => <NotionBlockRenderer key={b.id} block={b} />} />;
    }
    case "bulleted_list_item": {
      const item = getBlockVariant(block, "bulleted_list_item");
      return (
        <li className="md-li md-li-bullet">
          <div className="md-li-content">
            {renderRichText(item?.rich_text)}
            {renderListChildren(item?.children)}
          </div>
        </li>
      );
    }
    case "numbered_list_item": {
      const item = getBlockVariant(block, "numbered_list_item");
      return (
        <li className="md-li md-li-numbered">
          <div className="md-li-content">
            {renderRichText(item?.rich_text)}
            {renderListChildren(item?.children)}
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
      if (!url) return null;
      const captionText = (image?.caption || []).map((t) => t.plain_text || "").join("");
      const caption = image?.caption?.length ? renderRichText(image.caption) : null;
      return (
        <figure>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={url} alt={captionText || "lesson image"} className="md-image" />
          {caption && <figcaption className="md-figcaption">{caption}</figcaption>}
        </figure>
      );
    }
    case "table": {
      const table = getBlockVariant(block, "table") as { has_column_header?: boolean; has_row_header?: boolean; children?: NotionBlock[] } | undefined;
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
      const columns = getBlockVariant(block, "column_list")?.children || [];
      if (columns.length === 0) return null;
      return (
        <div className="md-column-list" style={{ gridTemplateColumns: `repeat(${columns.length}, 1fr)` }}>
          {columns.map((col) => {
            const colBlocks = getBlockVariant(col, "column")?.children || [];
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
