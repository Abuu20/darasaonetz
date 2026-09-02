import { useCallback, useEffect, useRef, useState } from "react";
import { Bold, Italic, Underline, List, ListOrdered, Quote, Link2, Heading2, Heading3, Undo2, Redo2 } from "lucide-react";
import { sanitizeLessonContent } from "@/lib/sanitizeLessonContent";

interface RichTextEditorProps {
  value: string;
  onChange: (html: string) => void;
  placeholder?: string;
  className?: string;
}

type FormatKey = "bold" | "italic" | "underline" | "insertUnorderedList" | "insertOrderedList" | "h2" | "h3" | "blockquote";

// A teacher-facing "paste in your lesson text and format it" editor. No
// external dependency — contentEditable + document.execCommand covers the
// small set of formatting real lesson content needs (bold/italic/underline,
// headings, lists, quotes, links) without pulling in a full editor library.
// Every paste is stripped down to the same allow-list sanitizeLessonContent
// enforces on the student side, so a teacher pasting from Word or Google
// Docs never leaks tracked-change spans, inline styles, or embedded scripts
// into a lesson — what's typed here is exactly what ends up rendered.
export default function RichTextEditor({ value, onChange, placeholder, className }: RichTextEditorProps) {
  const ref = useRef<HTMLDivElement>(null);
  const isFocused = useRef(false);
  const [activeFormats, setActiveFormats] = useState<Set<FormatKey>>(new Set());

  // Keep the DOM in sync with external value changes (e.g. switching which
  // lesson is being edited) without fighting the cursor while the teacher
  // is actively typing.
  useEffect(() => {
    if (!ref.current) return;
    if (isFocused.current) return;
    if (ref.current.innerHTML !== (value || "")) {
      ref.current.innerHTML = value || "";
    }
  }, [value]);

  const emit = () => {
    if (!ref.current) return;
    onChange(sanitizeLessonContent(ref.current.innerHTML));
  };

  // Reflects what's currently under the cursor onto the toolbar — bold text
  // shows the Bold button as pressed, inside a heading shows H2/H3 pressed,
  // and so on. Without this the toolbar gives no feedback at all about
  // formatting state, which is what makes a rich-text editor feel like a
  // row of dead buttons instead of a real writing tool.
  const updateActiveFormats = useCallback(() => {
    if (!ref.current) return;
    const selection = window.getSelection();
    const anchor = selection?.anchorNode;
    if (!anchor || !ref.current.contains(anchor)) return;
    const next = new Set<FormatKey>();
    (["bold", "italic", "underline", "insertUnorderedList", "insertOrderedList"] as const).forEach(cmd => {
      try {
        if (document.queryCommandState(cmd)) next.add(cmd);
      } catch {
        /* queryCommandState can throw in some browsers for unsupported commands — ignore */
      }
    });
    try {
      const block = document.queryCommandValue("formatBlock").toLowerCase();
      if (block === "h2" || block === "h3" || block === "blockquote") next.add(block as FormatKey);
    } catch {
      /* ignore */
    }
    setActiveFormats(next);
  }, []);

  useEffect(() => {
    document.addEventListener("selectionchange", updateActiveFormats);
    return () => document.removeEventListener("selectionchange", updateActiveFormats);
  }, [updateActiveFormats]);

  const run = (command: string, arg?: string) => {
    ref.current?.focus();
    document.execCommand(command, false, arg);
    emit();
    updateActiveFormats();
  };

  // Plain Enter in a contentEditable defaults to inserting a <div> in
  // Chrome (Safari/Firefox differ too) — but <div> isn't in the sanitizer's
  // allow-list, so DOMPurify quietly drops the tag and keeps the text,
  // which merges every "new line" back into one run of text the moment the
  // teacher blurs the field or reopens the lesson. Forcing the browser's
  // paragraph tag to <p> (which IS allowed) makes plain Enter survive
  // sanitizing. Shift+Enter inserts a <br> for a soft line break inside
  // the same paragraph, which is what most people expect from "just add a
  // new line" without starting a new block.
  const handleKeyDown = (event: React.KeyboardEvent<HTMLDivElement>) => {
    if (event.key !== "Enter") return;
    document.execCommand("defaultParagraphSeparator", false, "p");
    if (event.shiftKey) {
      event.preventDefault();
      document.execCommand("insertLineBreak");
      emit();
    }
    // Non-shift Enter: let the browser handle it natively, now that the
    // paragraph separator is set to <p>.
  };

  const handlePaste = (event: React.ClipboardEvent<HTMLDivElement>) => {
    event.preventDefault();
    const html = event.clipboardData.getData("text/html");
    const text = event.clipboardData.getData("text/plain");
    const clean = html ? sanitizeLessonContent(html) : text.replace(/&/g, "&amp;").replace(/</g, "&lt;");
    document.execCommand("insertHTML", false, clean || text);
    emit();
  };

  const handleLink = () => {
    const url = window.prompt("Link URL");
    if (!url) return;
    run("createLink", url);
  };

  const toolbarBtn = (active: boolean) =>
    `flex h-8 w-8 items-center justify-center rounded-control transition-colors duration-base ${
      active ? "bg-accent/15 text-accent" : "text-slate hover:bg-line hover:text-ink"
    }`;

  const Divider = () => <span className="mx-1 h-5 w-px shrink-0 bg-line" aria-hidden="true" />;

  return (
    <div className={`flex h-full min-h-0 flex-col overflow-hidden rounded-control border border-line bg-mist focus-within:border-accent focus-within:ring-1 focus-within:ring-accent/30 ${className || ""}`}>
      <div className="flex flex-wrap items-center gap-0.5 border-b border-line bg-panel/60 px-2 py-1.5">
        <button type="button" title="Bold (Ctrl+B)" aria-label="Bold" aria-pressed={activeFormats.has("bold")} className={toolbarBtn(activeFormats.has("bold"))} onMouseDown={e => e.preventDefault()} onClick={() => run("bold")}>
          <Bold size={16} />
        </button>
        <button type="button" title="Italic (Ctrl+I)" aria-label="Italic" aria-pressed={activeFormats.has("italic")} className={toolbarBtn(activeFormats.has("italic"))} onMouseDown={e => e.preventDefault()} onClick={() => run("italic")}>
          <Italic size={16} />
        </button>
        <button type="button" title="Underline (Ctrl+U)" aria-label="Underline" aria-pressed={activeFormats.has("underline")} className={toolbarBtn(activeFormats.has("underline"))} onMouseDown={e => e.preventDefault()} onClick={() => run("underline")}>
          <Underline size={16} />
        </button>
        <Divider />
        <button type="button" title="Heading 2" aria-label="Heading 2" aria-pressed={activeFormats.has("h2")} className={toolbarBtn(activeFormats.has("h2"))} onMouseDown={e => e.preventDefault()} onClick={() => run("formatBlock", "h2")}>
          <Heading2 size={16} />
        </button>
        <button type="button" title="Heading 3" aria-label="Heading 3" aria-pressed={activeFormats.has("h3")} className={toolbarBtn(activeFormats.has("h3"))} onMouseDown={e => e.preventDefault()} onClick={() => run("formatBlock", "h3")}>
          <Heading3 size={16} />
        </button>
        <Divider />
        <button type="button" title="Bullet list" aria-label="Bullet list" aria-pressed={activeFormats.has("insertUnorderedList")} className={toolbarBtn(activeFormats.has("insertUnorderedList"))} onMouseDown={e => e.preventDefault()} onClick={() => run("insertUnorderedList")}>
          <List size={16} />
        </button>
        <button type="button" title="Numbered list" aria-label="Numbered list" aria-pressed={activeFormats.has("insertOrderedList")} className={toolbarBtn(activeFormats.has("insertOrderedList"))} onMouseDown={e => e.preventDefault()} onClick={() => run("insertOrderedList")}>
          <ListOrdered size={16} />
        </button>
        <button type="button" title="Quote" aria-label="Quote" aria-pressed={activeFormats.has("blockquote")} className={toolbarBtn(activeFormats.has("blockquote"))} onMouseDown={e => e.preventDefault()} onClick={() => run("formatBlock", "blockquote")}>
          <Quote size={16} />
        </button>
        <button type="button" title="Insert link" aria-label="Link" className={toolbarBtn(false)} onMouseDown={e => e.preventDefault()} onClick={handleLink}>
          <Link2 size={16} />
        </button>
        <Divider />
        <button type="button" title="Undo (Ctrl+Z)" aria-label="Undo" className={toolbarBtn(false)} onMouseDown={e => e.preventDefault()} onClick={() => run("undo")}>
          <Undo2 size={16} />
        </button>
        <button type="button" title="Redo (Ctrl+Shift+Z)" aria-label="Redo" className={toolbarBtn(false)} onMouseDown={e => e.preventDefault()} onClick={() => run("redo")}>
          <Redo2 size={16} />
        </button>
      </div>
      <div
        ref={ref}
        contentEditable
        suppressContentEditableWarning
        onFocus={() => {
          isFocused.current = true;
          document.execCommand("defaultParagraphSeparator", false, "p");
        }}
        onBlur={() => {
          isFocused.current = false;
          emit();
        }}
        onInput={emit}
        onKeyDown={handleKeyDown}
        onKeyUp={updateActiveFormats}
        onMouseUp={updateActiveFormats}
        onPaste={handlePaste}
        data-placeholder={placeholder}
        className="editor-content min-h-[16rem] flex-1 overflow-y-auto bg-transparent px-stack py-tight text-[15px] leading-relaxed outline-none [&:empty]:before:text-slate [&:empty]:before:content-[attr(data-placeholder)]"
      />
    </div>
  );
}
