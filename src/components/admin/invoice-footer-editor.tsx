"use client";

import { useEffect } from "react";
import { useEditor, EditorContent } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import { Bold, Italic, List, ListOrdered } from "lucide-react";
import { Button } from "@/components/ui/button";
import type { InvoiceFooterDocument } from "@/lib/invoice-layout";

export function InvoiceFooterEditor({
  content,
  onChange,
}: {
  content: InvoiceFooterDocument;
  onChange: (content: InvoiceFooterDocument) => void;
}) {
  const editor = useEditor({
    immediatelyRender: false,
    extensions: [StarterKit.configure({ blockquote: false, code: false, codeBlock: false, heading: false, horizontalRule: false, link: false, strike: false, underline: false })],
    content,
    onUpdate: ({ editor: current }) => onChange(current.getJSON() as InvoiceFooterDocument),
    editorProps: { attributes: { class: "min-h-28 px-3 py-2 text-sm outline-none [&_p]:my-1 [&_ul]:list-disc [&_ul]:pl-5 [&_ol]:list-decimal [&_ol]:pl-5" } },
  });

  useEffect(() => {
    if (editor && JSON.stringify(editor.getJSON()) !== JSON.stringify(content)) {
      editor.commands.setContent(content, { emitUpdate: false });
    }
  }, [editor, content]);

  if (!editor) return <div className="min-h-36 animate-pulse rounded-md border bg-muted/30" aria-label="Loading footer editor" />;

  const actions = [
    { label: "Bold", icon: Bold, active: editor.isActive("bold"), run: () => editor.chain().focus().toggleBold().run() },
    { label: "Italic", icon: Italic, active: editor.isActive("italic"), run: () => editor.chain().focus().toggleItalic().run() },
    { label: "Bulleted list", icon: List, active: editor.isActive("bulletList"), run: () => editor.chain().focus().toggleBulletList().run() },
    { label: "Numbered list", icon: ListOrdered, active: editor.isActive("orderedList"), run: () => editor.chain().focus().toggleOrderedList().run() },
  ];

  return (
    <div className="overflow-hidden rounded-md border border-input bg-background focus-within:ring-2 focus-within:ring-ring focus-within:ring-offset-2">
      <div className="flex gap-1 border-b p-1" aria-label="Footer formatting">
        {actions.map(({ label, icon: Icon, active, run }) => (
          <Button key={label} type="button" variant={active ? "secondary" : "ghost"} size="icon" className="h-8 w-8" aria-label={label} aria-pressed={active} onClick={run}>
            <Icon className="h-4 w-4" aria-hidden="true" />
          </Button>
        ))}
      </div>
      <EditorContent editor={editor} />
    </div>
  );
}
