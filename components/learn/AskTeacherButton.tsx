import { useEffect, useRef, useState } from "react";
import { HelpCircle, Loader2, Send, X } from "lucide-react";
import { useAuth } from "@/context/AuthContext";
import { commentQueries } from "@/lib/db/comments";
import { notificationQueries } from "@/lib/db/notifications";

interface AskTeacherButtonProps {
  courseId: string;
  lessonId: string;
  lessonTitle: string;
  /** The course's teacher_id — where the notification lands. */
  teacherId: string;
}

/**
 * Floating "Ask your teacher" action for every lesson. Opens a small modal
 * for a quick question, posts it as a lesson-scoped comment (so it appears
 * in the Discussion tab immediately) and fires a notification to the
 * teacher so they don't have to poll the Discussion tab manually.
 *
 * The goal is to remove the two real barriers students hit:
 *   • "I don't know where to ask"   → always a visible button
 *   • "I'll ask later"              → a modal, not a page navigation, so
 *                                     the student doesn't lose the video
 */
export default function AskTeacherButton({
  courseId,
  lessonId,
  lessonTitle,
  teacherId,
}: AskTeacherButtonProps) {
  const { user, profile } = useAuth();
  const [open, setOpen] = useState(false);
  const [body, setBody] = useState("");
  const [posting, setPosting] = useState(false);
  const [sent, setSent] = useState(false);
  const [error, setError] = useState("");
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  // Autofocus the textarea when the modal opens — the student tapped the
  // button to type, not to look at a modal.
  useEffect(() => {
    if (open) setTimeout(() => textareaRef.current?.focus(), 50);
    if (!open) {
      setBody("");
      setError("");
      setSent(false);
    }
  }, [open]);

  // Close on Escape
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setOpen(false);
    };
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [open]);

  if (!user) return null;

  const submit = async () => {
    if (!body.trim()) return;
    setPosting(true);
    setError("");
    try {
      await commentQueries.post({
        courseId,
        lessonId,
        authorId: user.id,
        body: body.trim(),
      });

      // Notify the teacher. Best-effort — the comment is already saved,
      // so a notification failure shouldn't surface as a user error.
      if (teacherId && teacherId !== user.id) {
        const askerName = profile?.full_name || user.email || "A student";
        notificationQueries
          .create(
            teacherId,
            "new_review",
            "New question on a lesson",
            `${askerName} — ${lessonTitle}`,
            { course_id: courseId, lesson_id: lessonId }
          )
          .catch(() => {});
      }

      setSent(true);
      setTimeout(() => setOpen(false), 1400);
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : String(e);
      setError(msg || "Could not send. You need to be enrolled in this course.");
    } finally {
      setPosting(false);
    }
  };

  return (
    <>
      {/* Floating action button — right side, above the sticky action bar
          on mobile so the two never overlap. */}
      <button
        type="button"
        onClick={() => setOpen(true)}
        aria-label="Ask your teacher"
        className="fixed bottom-24 right-4 z-30 inline-flex items-center gap-2 rounded-pill bg-ink px-4 py-3 text-sm font-medium text-ink-foreground shadow-lg transition-all duration-base hover:bg-accent hover:text-accent-foreground active:scale-active md:bottom-6 md:right-6"
      >
        <HelpCircle size={18} aria-hidden="true" />
        <span className="hidden sm:inline">Ask teacher</span>
      </button>

      {open ? (
        <div className="fixed inset-0 z-[80] flex items-end justify-center bg-ink/50 p-3 backdrop-blur-sm sm:items-center sm:p-block">
          <button
            type="button"
            aria-label="Close"
            onClick={() => setOpen(false)}
            className="absolute inset-0 cursor-default"
          />
          <div className="relative w-full max-w-lg rounded-card border border-line bg-background shadow-xl">
            <div className="flex items-center justify-between border-b border-line px-4 py-3">
              <div className="min-w-0">
                <p className="font-heading text-sm text-ink">Ask your teacher</p>
                <p className="truncate text-xs text-slate">{lessonTitle}</p>
              </div>
              <button
                type="button"
                onClick={() => setOpen(false)}
                aria-label="Close"
                className="flex h-9 w-9 items-center justify-center rounded-control text-slate hover:bg-mist hover:text-ink"
              >
                <X size={18} />
              </button>
            </div>

            {sent ? (
              <div className="px-4 py-8 text-center">
                <p className="font-heading text-base text-ink">
                  Question sent ✓
                </p>
                <p className="mt-1 text-sm text-slate">
                  Your teacher has been notified. The question also appears
                  in the Discussion tab.
                </p>
              </div>
            ) : (
              <div className="p-4">
                <textarea
                  ref={textareaRef}
                  value={body}
                  onChange={e => setBody(e.target.value)}
                  rows={4}
                  maxLength={5000}
                  placeholder="What would you like to ask? Be as specific as you can."
                  className="w-full resize-none rounded-control border border-line bg-mist px-3 py-2 text-sm text-ink outline-none transition-colors duration-base focus:border-accent"
                  onKeyDown={e => {
                    if ((e.metaKey || e.ctrlKey) && e.key === "Enter") submit();
                  }}
                />
                <div className="mt-2 flex items-center justify-between gap-3">
                  <span className="text-xs text-slate">
                    {body.length}/5000 · Ctrl/⌘ + Enter to send
                  </span>
                  <button
                    type="button"
                    onClick={submit}
                    disabled={posting || !body.trim()}
                    className="gradient-brand inline-flex items-center gap-1.5 rounded-control px-4 py-2 text-sm font-medium text-primary-foreground transition-all duration-base hover:scale-hover active:scale-active disabled:opacity-50 disabled:hover:scale-100"
                  >
                    {posting ? (
                      <Loader2 size={14} className="animate-spin" />
                    ) : (
                      <Send size={14} />
                    )}
                    Send question
                  </button>
                </div>
                {error ? <p className="mt-2 text-xs text-danger">{error}</p> : null}
              </div>
            )}
          </div>
        </div>
      ) : null}
    </>
  );
}
