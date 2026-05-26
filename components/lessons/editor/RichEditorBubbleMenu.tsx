"use client";
import { BubbleMenu } from "@tiptap/react/menus";
import type { Editor } from "@tiptap/react";
import { IconBold, IconItalic, IconUnderline, IconStrike, IconLink } from "./richEditorIcons";

interface Props {
  editor: Editor;
  onInsertLink: () => void;
}

export default function RichEditorBubbleMenu({ editor, onInsertLink }: Props) {
  const btn = (active: boolean) =>
    `p-1.5 rounded-md transition-colors ${active ? "bg-white/15 text-white" : "text-white/80 hover:bg-white/10 hover:text-white"}`;

  return (
    <BubbleMenu
      editor={editor}
      shouldShow={({ editor: ed, from, to }) =>
        from !== to && !ed.isActive("image")
      }
    >
      <div className="flex items-center gap-0.5 px-1.5 py-1 rounded-xl bg-[var(--color-surface-raised)] border border-white/10 shadow-lg">
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
        <div className="w-px h-4 bg-white/15 mx-0.5" />
        <button type="button" onClick={onInsertLink} className={btn(editor.isActive("link"))} aria-label="Link">
          <IconLink className="h-4 w-4" />
        </button>
      </div>
    </BubbleMenu>
  );
}
