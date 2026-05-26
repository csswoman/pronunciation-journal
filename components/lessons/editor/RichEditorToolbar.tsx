"use client";
import type { Editor } from "@tiptap/react";
import {
  IconBold, IconItalic, IconUnderline, IconStrike,
  IconUL, IconOL, IconQuote, IconLink, IconImage,
  IconUndo, IconRedo,
  IconAlignLeft, IconAlignCenter, IconAlignRight, IconAlignJustify,
  IconChevron,
} from "./richEditorIcons";

interface Props {
  editor: Editor;
  onInsertImage: () => void;
  onInsertLink: () => void;
}

const BLOCKS = [
  { label: "Paragraph", value: "p" },
  { label: "Heading 1", value: "h1" },
  { label: "Heading 2", value: "h2" },
  { label: "Heading 3", value: "h3" },
] as const;

type BlockValue = (typeof BLOCKS)[number]["value"];

function currentBlock(editor: Editor): BlockValue {
  if (editor.isActive("heading", { level: 1 })) return "h1";
  if (editor.isActive("heading", { level: 2 })) return "h2";
  if (editor.isActive("heading", { level: 3 })) return "h3";
  return "p";
}

function setBlock(editor: Editor, value: BlockValue) {
  const chain = editor.chain().focus();
  if (value === "p") chain.setParagraph().run();
  else chain.toggleHeading({ level: Number(value[1]) as 1 | 2 | 3 }).run();
}

export default function RichEditorToolbar({ editor, onInsertImage, onInsertLink }: Props) {
  const block = currentBlock(editor);
  const btn = (active: boolean) =>
    `p-1.5 rounded-md transition-colors ${active ? "bg-[var(--btn-plain-bg-hover)] text-fg" : "text-fg-muted hover:bg-[var(--btn-plain-bg-hover)] hover:text-fg"}`;

  return (
    <div className="flex items-center flex-wrap gap-0.5 px-2 py-1.5 border-b border-[var(--line-divider)] bg-[var(--card-bg)] rounded-t-xl">
      <button
        type="button"
        onClick={() => editor.chain().focus().undo().run()}
        disabled={!editor.can().undo()}
        className={`${btn(false)} disabled:opacity-30`}
        aria-label="Undo"
      >
        <IconUndo className="h-4 w-4" />
      </button>
      <button
        type="button"
        onClick={() => editor.chain().focus().redo().run()}
        disabled={!editor.can().redo()}
        className={`${btn(false)} disabled:opacity-30`}
        aria-label="Redo"
      >
        <IconRedo className="h-4 w-4" />
      </button>

      <div className="w-px h-5 bg-[var(--line-divider)] mx-1" />

      <div className="relative">
        <select
          value={block}
          onChange={(e) => setBlock(editor, e.target.value as BlockValue)}
          className="appearance-none pl-2.5 pr-7 py-1 text-sm rounded-md border border-[var(--line-divider)] bg-[var(--card-bg)] text-fg focus:outline-none focus:border-[var(--primary)]"
        >
          {BLOCKS.map((b) => (
            <option key={b.value} value={b.value}>{b.label}</option>
          ))}
        </select>
        <IconChevron className="h-3 w-3 text-fg-muted absolute right-1.5 top-1/2 -translate-y-1/2 pointer-events-none" />
      </div>

      <div className="w-px h-5 bg-[var(--line-divider)] mx-1" />

      <button type="button" onClick={() => editor.chain().focus().toggleBold().run()} className={btn(editor.isActive("bold"))} aria-label="Bold">
        <IconBold className="h-4 w-4" />
      </button>
      <button type="button" onClick={() => editor.chain().focus().toggleItalic().run()} className={btn(editor.isActive("italic"))} aria-label="Italic">
        <IconItalic className="h-4 w-4" />
      </button>
      <button type="button" onClick={() => editor.chain().focus().toggleUnderline().run()} className={btn(editor.isActive("underline"))} aria-label="Underline">
        <IconUnderline className="h-4 w-4" />
      </button>
      <button type="button" onClick={() => editor.chain().focus().toggleStrike().run()} className={btn(editor.isActive("strike"))} aria-label="Strikethrough">
        <IconStrike className="h-4 w-4" />
      </button>

      <div className="w-px h-5 bg-[var(--line-divider)] mx-1" />

      <button type="button" onClick={() => editor.chain().focus().setTextAlign("left").run()} className={btn(editor.isActive({ textAlign: "left" }))} aria-label="Align left">
        <IconAlignLeft className="h-4 w-4" />
      </button>
      <button type="button" onClick={() => editor.chain().focus().setTextAlign("center").run()} className={btn(editor.isActive({ textAlign: "center" }))} aria-label="Align center">
        <IconAlignCenter className="h-4 w-4" />
      </button>
      <button type="button" onClick={() => editor.chain().focus().setTextAlign("right").run()} className={btn(editor.isActive({ textAlign: "right" }))} aria-label="Align right">
        <IconAlignRight className="h-4 w-4" />
      </button>
      <button type="button" onClick={() => editor.chain().focus().setTextAlign("justify").run()} className={btn(editor.isActive({ textAlign: "justify" }))} aria-label="Justify">
        <IconAlignJustify className="h-4 w-4" />
      </button>

      <div className="w-px h-5 bg-[var(--line-divider)] mx-1" />

      <button type="button" onClick={() => editor.chain().focus().toggleBulletList().run()} className={btn(editor.isActive("bulletList"))} aria-label="Bullet list">
        <IconUL className="h-4 w-4" />
      </button>
      <button type="button" onClick={() => editor.chain().focus().toggleOrderedList().run()} className={btn(editor.isActive("orderedList"))} aria-label="Ordered list">
        <IconOL className="h-4 w-4" />
      </button>
      <button type="button" onClick={() => editor.chain().focus().toggleBlockquote().run()} className={btn(editor.isActive("blockquote"))} aria-label="Blockquote">
        <IconQuote className="h-4 w-4" />
      </button>

      <div className="w-px h-5 bg-[var(--line-divider)] mx-1" />

      <button type="button" onClick={onInsertLink} className={btn(editor.isActive("link"))} aria-label="Insert link">
        <IconLink className="h-4 w-4" />
      </button>
      <button type="button" onClick={onInsertImage} className={btn(false)} aria-label="Insert image">
        <IconImage className="h-4 w-4" />
      </button>
    </div>
  );
}
