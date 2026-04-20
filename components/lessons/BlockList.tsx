"use client";
import { NotionBlock } from "@/lib/notion/types";
import { NotionBlockRenderer } from "./NotionBlockRenderer";

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

export function BlockList({ blocks }: { blocks: NotionBlock[] }) {
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
