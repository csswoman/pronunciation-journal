"use client";
import { useState } from "react";
import Button from "@/components/ui/Button";
import { NotionBlock } from "@/lib/notion/types";

interface ToggleBlockProps {
  text: React.ReactNode;
  children: NotionBlock[];
  compact?: boolean;
  renderBlock: (block: NotionBlock) => React.ReactNode;
}

export function ToggleBlock({ text, children, compact = false, renderBlock }: ToggleBlockProps) {
  const [open, setOpen] = useState(false);
  return (
    <>
      <Button
        onClick={() => setOpen((o) => !o)}
        className={`md-toggle-button${compact ? " md-toggle-button-compact" : ""} md-heading md-heading-3`}
      >
        <span className={`md-toggle-caret${compact ? " md-toggle-caret-small" : ""}${open ? " md-toggle-caret-open" : ""}`}>▶</span>
        {text}
      </Button>
      {open && children.length > 0 && (
        <div className={`md-toggle-children${compact ? " md-toggle-children-compact" : ""}`}>
          {children.map((child) => renderBlock(child))}
        </div>
      )}
    </>
  );
}
