import { useEffect, useRef } from "react";
import { Bold, Italic, Underline, List, ListOrdered, Quote, Link2, Heading2, Heading3, Undo2, Redo2 } from "lucide-react";
import { sanitizeLessonContent } from "@/lib/sanitizeLessonContent";

interface RichTextEditorProps {
  value: string;
  onChange: (html: string) => void;
  placeholder?: string;
}

// A teacher-facing "paste in your lesson text and format it" editor. No
// external dependency — contentEditable + document.execCommand covers the
// small set of formatting real lesson content needs (bold/italic/underline,
// headings, lists, quotes, links) without pulling in a full editor library.
// Every paste is stripped down to the same allow-list sanitizeLessonContent
// enforces on the student side, so a teacher pasting from Word or Google
// Docs never leaks tracked-change spans, inline styles, or embedded scripts
// into a lesson — what's typed here is exactly what ends up rendered.
export default function RichTextEditor({ value, onChange, placeholder }: RichTextEditorProps) {
  const ref = useRef<HTMLDivElement>(null);
  const isFocused = useRef(false);

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

  const run = (command: string, arg?: string) => {
    ref.current?.focus();
    document.execCommand(command, false, arg);
    emit();
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

  const toolbarBtn =
    "flex h-7 w-7 items-center justify-center rounded-control text-slate transition-colors duration-base hover:bg-line hover:text-ink";

  return (
    <div className="flex flex-col overflow-hidden rounded-control border border-line bg-mist focus-within:border-accent">
      <div className="flex flex-wrap items-center gap-0.5 border-b border-line px-1.5 py-1">
        <button type="button" className={toolbarBtn} onMouseDown={e => e.preventDefault()} onClick={() => run("bold")} aria-label="Bold">
          <Bold size={14} />
        </button>
        <button type="button" className={toolbarBtn} onMouseDown={e => e.preventDefault()} onClick={() => run("italic")} aria-label="Italic">
          <Italic size={14} />
        </button>
        <button type="button" className={toolbarBtn} onMouseDown={e => e.preventDefault()} onClick={() => run("underline")} aria-label="Underline">
          <Underline size={14} />
        </button>
        <span className="mx-0.5 h-4 w-px bg-line" aria-hidden="true" />
        <button type="button" className={toolbarBtn} onMouseDown={e => e.preventDefault()} onClick={() => run("formatBlock", "h2")} aria-label="Heading 2">
          <Heading2 size={14} />
        </button>
        <button type="button" className={toolbarBtn} onMouseDown={e => e.preventDefault()} onClick={() => run("formatBlock", "h3")} aria-label="Heading 3">
          <Heading3 size={14} />
        </button>
        <span className="mx-0.5 h-4 w-px bg-line" aria-hidden="true" />
        <button type="button" className={toolbarBtn} onMouseDown={e => e.preventDefault()} onClick={() => run("insertUnorderedList")} aria-label="Bullet list">
          <List size={14} />
        </button>
        <button type="button" className={toolbarBtn} onMouseDown={e => e.preventDefault()} onClick={() => run("insertOrderedList")} aria-label="Numbered list">
          <ListOrdered size={14} />
        </button>
        <button type="button" className={toolbarBtn} onMouseDown={e => e.preventDefault()} onClick={() => run("formatBlock", "blockquote")} aria-label="Quote">
          <Quote size={14} />
        </button>
        <button type="button" className={toolbarBtn} onMouseDown={e => e.preventDefault()} onClick={handleLink} aria-label="Link">
          <Link2 size={14} />
        </button>
        <span className="mx-0.5 h-4 w-px bg-line" aria-hidden="true" />
        <button type="button" className={toolbarBtn} onMouseDown={e => e.preventDefault()} onClick={() => run("undo")} aria-label="Undo">
          <Undo2 size={14} />
        </button>
        <button type="button" className={toolbarBtn} onMouseDown={e => e.preventDefault()} onClick={() => run("redo")} aria-label="Redo">
          <Redo2 size={14} />
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
        onPaste={handlePaste}
        data-placeholder={placeholder}
        className="editor-content min-h-[8rem] overflow-y-auto bg-transparent px-stack py-tight outline-none [&:empty]:before:text-slate [&:empty]:before:content-[attr(data-placeholder)]"
      />
    </div>
  );
}
