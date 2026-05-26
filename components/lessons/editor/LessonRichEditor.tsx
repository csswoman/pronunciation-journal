"use client";
// Planned structure:
// <LessonRichEditor>
//   <RichEditorToolbar />
//   <EditorContent />        (tiptap)
//   <RichEditorBubbleMenu />
// </LessonRichEditor>
import { useEffect, useRef } from "react";
import { useEditor, EditorContent } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import Underline from "@tiptap/extension-underline";
import Link from "@tiptap/extension-link";
import Image from "@tiptap/extension-image";
import TextAlign from "@tiptap/extension-text-align";
import Placeholder from "@tiptap/extension-placeholder";
import RichEditorToolbar from "./RichEditorToolbar";
import RichEditorBubbleMenu from "./RichEditorBubbleMenu";
import { uploadLessonInlineImage } from "@/lib/theory-lessons/queries";

interface LessonRichEditorProps {
  value: string;
  onChange: (html: string) => void;
  placeholder?: string;
}

export default function LessonRichEditor({ value, onChange, placeholder }: LessonRichEditorProps) {
  const fileInputRef = useRef<HTMLInputElement>(null);

  const editor = useEditor({
    immediatelyRender: false,
    extensions: [
      StarterKit.configure({
        heading: { levels: [1, 2, 3] },
        link: false,
        underline: false,
      }),
      Underline,
      Link.configure({ openOnClick: false, autolink: true, HTMLAttributes: { rel: "noopener noreferrer" } }),
      Image.configure({ inline: false, HTMLAttributes: { class: "rounded-lg my-3 max-w-full h-auto" } }),
      TextAlign.configure({ types: ["heading", "paragraph"] }),
      Placeholder.configure({ placeholder: placeholder ?? "Start writing the lesson…" }),
    ],
    content: value,
    editorProps: {
      attributes: {
        class: "prose-lesson focus:outline-none min-h-[420px] px-4 py-4 text-fg",
      },
    },
    onUpdate: ({ editor: ed }) => {
      onChange(ed.getHTML());
    },
  });

  // Sync external value changes (e.g. AI panel) without breaking caret
  useEffect(() => {
    if (!editor) return;
    if (value !== editor.getHTML()) {
      editor.commands.setContent(value || "", { emitUpdate: false });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [value, editor]);

  if (!editor) return null;

  const handleInsertLink = () => {
    const prev = editor.getAttributes("link").href as string | undefined;
    const url = window.prompt("URL", prev ?? "https://");
    if (url === null) return;
    if (url === "") {
      editor.chain().focus().extendMarkRange("link").unsetLink().run();
      return;
    }
    editor.chain().focus().extendMarkRange("link").setLink({ href: url }).run();
  };

  const handleInsertImage = () => {
    fileInputRef.current?.click();
  };

  const onFileChosen = async (file: File) => {
    try {
      const url = await uploadLessonInlineImage(file);
      editor.chain().focus().setImage({ src: url, alt: file.name }).run();
    } catch (e) {
      window.alert(e instanceof Error ? e.message : "Image upload failed");
    }
  };

  return (
    <div className="rounded-xl border border-[var(--line-divider)] bg-[var(--card-bg)] overflow-hidden">
      <RichEditorToolbar
        editor={editor}
        onInsertImage={handleInsertImage}
        onInsertLink={handleInsertLink}
      />
      <RichEditorBubbleMenu editor={editor} onInsertLink={handleInsertLink} />
      <EditorContent editor={editor} />
      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        className="hidden"
        onChange={(e) => {
          const f = e.target.files?.[0];
          if (f) onFileChosen(f);
          e.target.value = "";
        }}
      />
    </div>
  );
}
