import { useMemo, useState } from "react";
import { NotebookPen, Plus, Trash2 } from "lucide-react";
import { useAuth } from "@/context/AuthContext";
import { useLanguage } from "@/context/LanguageContext";
import { useToolProgress } from "@/lib/hooks/useToolProgress";
import { generateId } from "@/lib/uuid";

interface LessonNote {
  id: string;
  text: string;
  createdAt: number;
}

interface LessonNotesTabProps {
  lessonId: string;
  lessonTitle: string;
}

/**
 * Private per-lesson notes. Backed by `tool_progress` (one row per
 * (user, tool)), keyed by lesson id — so a note written on a phone shows
 * up on a laptop the next time the student opens the same lesson.
 *
 * Multi-line notes are preserved via `whitespace-pre-wrap`; Ctrl/Cmd+Enter
 * saves without leaving the keyboard, which is what students writing
 * along to a video actually want.
 */
export default function LessonNotesTab({ lessonId, lessonTitle }: LessonNotesTabProps) {
  const { language } = useLanguage();
  const { user } = useAuth();

  const [notes, setNotes] = useToolProgress<LessonNote[]>(
    `lesson-notes:${lessonId}`,
    `darasaone.lessonNotes.${lessonId}`,
    []
  );
  const [draft, setDraft] = useState("");

  const sorted = useMemo(
    () => [...notes].sort((a, b) => b.createdAt - a.createdAt),
    [notes]
  );

  const addNote = () => {
    const text = draft.trim();
    if (!text) return;
    const note: LessonNote = { id: generateId(), text, createdAt: Date.now() };
    setNotes([note, ...notes]);
    setDraft("");
  };

  const removeNote = (id: string) => setNotes(notes.filter(n => n.id !== id));

  const locale = language === "sw" ? "sw-TZ" : undefined;

  return (
    <div className="flex flex-col gap-block">
      <div className="flex flex-col gap-1">
        <h2 className="font-heading text-lg text-ink">Your notes</h2>
        <p className="text-sm text-slate">
          Private to you. Sync across every device you sign in on.
        </p>
      </div>

      {/* Composer */}
      <div className="flex flex-col gap-2 rounded-card border border-line bg-mist p-stack">
        <textarea
          value={draft}
          onChange={e => setDraft(e.target.value)}
          rows={3}
          placeholder={`Note about "${lessonTitle}"…`}
          className="w-full resize-none rounded-control border border-line bg-background px-stack py-tight text-sm text-ink outline-none transition-colors duration-base focus:border-accent"
          onKeyDown={e => {
            if ((e.metaKey || e.ctrlKey) && e.key === "Enter") addNote();
          }}
        />
        <div className="flex items-center justify-between gap-tight">
          <span className="text-xs text-slate">
            {user ? "Ctrl/⌘ + Enter to save" : "Sign in to save notes"}
          </span>
          <button
            type="button"
            onClick={addNote}
            disabled={!draft.trim() || !user}
            className="gradient-brand inline-flex items-center gap-1.5 rounded-control px-4 py-1.5 text-sm font-medium text-primary-foreground transition-all duration-base hover:scale-hover active:scale-active disabled:opacity-50 disabled:hover:scale-100"
          >
            <Plus size={14} aria-hidden="true" />
            Save note
          </button>
        </div>
      </div>

      {/* Notes list */}
      {sorted.length === 0 ? (
        <div className="flex flex-col items-center gap-2 rounded-card border border-dashed border-line py-block text-center">
          <NotebookPen size={28} className="text-slate" aria-hidden="true" />
          <p className="text-sm text-slate">
            No notes yet. Write your first one above.
          </p>
        </div>
      ) : (
        <ul className="flex flex-col gap-2">
          {sorted.map(note => (
            <li
              key={note.id}
              className="group flex items-start gap-3 rounded-card border border-line bg-background p-stack"
            >
              <div className="min-w-0 flex-1">
                <p className="whitespace-pre-wrap text-sm leading-relaxed text-ink">
                  {note.text}
                </p>
                <p className="mt-1 text-xs text-slate">
                  {new Date(note.createdAt).toLocaleString(locale, {
                    dateStyle: "medium",
                    timeStyle: "short",
                  })}
                </p>
              </div>
              <button
                type="button"
                onClick={() => removeNote(note.id)}
                aria-label="Delete note"
                className="shrink-0 rounded-control p-1.5 text-slate opacity-0 transition-opacity duration-base hover:text-danger group-hover:opacity-100 focus-visible:opacity-100"
              >
                <Trash2 size={14} />
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
