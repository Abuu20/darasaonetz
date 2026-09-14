import { useEffect, useState } from "react";
import { CornerDownRight, Loader2, MessageSquare, Send } from "lucide-react";
import { useAuth } from "@/context/AuthContext";
import {
  commentQueries,
  type CommentThread,
  type CourseComment,
} from "@/lib/db/comments";
import Avatar from "@/components/ui/Avatar";

interface LessonDiscussionTabProps {
  courseId: string;
  lessonId: string;
}

/**
 * Threaded per-lesson Q&A. Uses the existing `course_comments` table
 * (course_id + lesson_id + parent_id). Only comments posted against *this*
 * lesson are shown here — course-wide discussion lives on the course page.
 *
 * The teacher's replies come back with `profiles.role === "teacher"` and
 * are badged, which is what makes a course feel taught rather than
 * self-serve: the answer is visibly the teacher's.
 */
export default function LessonDiscussionTab({
  courseId,
  lessonId,
}: LessonDiscussionTabProps) {
  const { user } = useAuth();

  const [threads, setThreads] = useState<CommentThread[]>([]);
  const [loading, setLoading] = useState(true);
  const [body, setBody] = useState("");
  const [posting, setPosting] = useState(false);
  const [error, setError] = useState("");
  const [replyTo, setReplyTo] = useState<string | null>(null);
  const [replyBody, setReplyBody] = useState("");
  const [replyPosting, setReplyPosting] = useState(false);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    commentQueries
      .getThreadsForCourse(courseId)
      .then(all => {
        if (cancelled) return;
        setThreads(all.filter(thr => thr.lesson_id === lessonId));
      })
      .catch(() => !cancelled && setThreads([]))
      .finally(() => !cancelled && setLoading(false));
    return () => {
      cancelled = true;
    };
  }, [courseId, lessonId]);

  const submitTop = async () => {
    if (!user || !body.trim()) return;
    setPosting(true);
    setError("");
    try {
      const saved = await commentQueries.post({
        courseId,
        lessonId,
        authorId: user.id,
        body,
      });
      setThreads(prev => [
        ...prev,
        { ...saved, replies: [], answered: false } as CommentThread,
      ]);
      setBody("");
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : String(e);
      setError(msg || "Could not post. You need to be enrolled in this course.");
    } finally {
      setPosting(false);
    }
  };

  const submitReply = async (parentId: string) => {
    if (!user || !replyBody.trim()) return;
    setReplyPosting(true);
    try {
      const saved = await commentQueries.post({
        courseId,
        lessonId,
        authorId: user.id,
        parentId,
        body: replyBody,
      });
      setThreads(prev =>
        prev.map(thr =>
          thr.id === parentId
            ? {
                ...thr,
                replies: [...thr.replies, saved],
                answered:
                  saved.profiles?.role === "teacher" || thr.answered,
              }
            : thr
        )
      );
      setReplyBody("");
      setReplyTo(null);
    } catch (e) {
      console.error("[discussion] reply failed:", e);
    } finally {
      setReplyPosting(false);
    }
  };

  return (
    <div className="flex flex-col gap-block">
      <div className="flex flex-col gap-1">
        <h2 className="font-heading text-lg text-ink">Discussion</h2>
        <p className="text-sm text-slate">
          Ask a question or share what you learned. Your teacher and
          classmates will see it.
        </p>
      </div>

      {/* Composer */}
      {user ? (
        <div className="flex flex-col gap-2 rounded-card border border-line bg-mist p-stack">
          <textarea
            value={body}
            onChange={e => setBody(e.target.value)}
            rows={3}
            maxLength={5000}
            placeholder="Ask a question about this lesson…"
            className="w-full resize-none rounded-control border border-line bg-background px-stack py-tight text-sm text-ink outline-none transition-colors duration-base focus:border-accent"
          />
          <div className="flex items-center justify-between gap-tight">
            <span className="text-xs text-slate">{body.length}/5000</span>
            <button
              type="button"
              onClick={submitTop}
              disabled={posting || !body.trim()}
              className="gradient-brand inline-flex items-center gap-1.5 rounded-control px-4 py-1.5 text-sm font-medium text-primary-foreground transition-all duration-base hover:scale-hover active:scale-active disabled:opacity-50 disabled:hover:scale-100"
            >
              {posting ? (
                <Loader2 size={14} className="animate-spin" />
              ) : (
                <Send size={14} />
              )}
              Post question
            </button>
          </div>
          {error ? <p className="text-xs text-danger">{error}</p> : null}
        </div>
      ) : (
        <div className="rounded-card border border-dashed border-line p-stack text-center text-sm text-slate">
          Sign in to join the discussion.
        </div>
      )}

      {/* Threads */}
      {loading ? (
        <div className="flex justify-center py-block">
          <Loader2 size={22} className="animate-spin text-accent" aria-hidden="true" />
        </div>
      ) : threads.length === 0 ? (
        <div className="flex flex-col items-center gap-2 rounded-card border border-dashed border-line py-block text-center">
          <MessageSquare size={28} className="text-slate" aria-hidden="true" />
          <p className="text-sm text-slate">
            No questions yet for this lesson. Be the first to ask.
          </p>
        </div>
      ) : (
        <ul className="flex flex-col gap-block">
          {threads.map(thread => (
            <li key={thread.id} className="flex flex-col gap-3">
              <CommentBubble comment={thread} isReply={false} />

              {thread.replies.length > 0 ? (
                <ul className="ml-6 flex flex-col gap-2 border-l-2 border-line pl-4">
                  {thread.replies.map(reply => (
                    <li key={reply.id}>
                      <CommentBubble comment={reply} isReply />
                    </li>
                  ))}
                </ul>
              ) : null}

              {user ? (
                replyTo === thread.id ? (
                  <div className="ml-6 flex flex-col gap-2">
                    <textarea
                      value={replyBody}
                      onChange={e => setReplyBody(e.target.value)}
                      rows={2}
                      maxLength={5000}
                      placeholder="Write a reply…"
                      className="w-full resize-none rounded-control border border-line bg-mist px-stack py-tight text-sm text-ink outline-none transition-colors duration-base focus:border-accent"
                    />
                    <div className="flex gap-2">
                      <button
                        type="button"
                        onClick={() => submitReply(thread.id)}
                        disabled={replyPosting || !replyBody.trim()}
                        className="gradient-brand inline-flex items-center gap-1.5 rounded-control px-3 py-1.5 text-xs font-medium text-primary-foreground transition-all duration-base hover:scale-hover active:scale-active disabled:opacity-50 disabled:hover:scale-100"
                      >
                        {replyPosting ? (
                          <Loader2 size={12} className="animate-spin" />
                        ) : (
                          <Send size={12} />
                        )}
                        Reply
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          setReplyTo(null);
                          setReplyBody("");
                        }}
                        className="rounded-control border border-line px-3 py-1.5 text-xs text-slate transition-colors duration-base hover:border-accent hover:text-ink"
                      >
                        Cancel
                      </button>
                    </div>
                  </div>
                ) : (
                  <button
                    type="button"
                    onClick={() => {
                      setReplyTo(thread.id);
                      setReplyBody("");
                    }}
                    className="ml-6 flex w-fit items-center gap-1.5 rounded-control px-2 py-1 text-xs text-slate transition-colors duration-base hover:text-accent"
                  >
                    <CornerDownRight size={12} aria-hidden="true" />
                    Reply
                  </button>
                )
              ) : null}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

function CommentBubble({
  comment,
  isReply,
}: {
  comment: CourseComment;
  isReply: boolean;
}) {
  const name = comment.profiles?.full_name ?? "Student";
  const isTeacher = comment.profiles?.role === "teacher";

  return (
    <div
      className={`flex items-start gap-3 ${
        isReply ? "" : "rounded-card border border-line bg-background p-stack"
      }`}
    >
      <Avatar name={name} src={comment.profiles?.avatar_url} size="sm" />
      <div className="min-w-0 flex-1">
        <div className="mb-0.5 flex flex-wrap items-center gap-2">
          <span className="truncate text-sm font-medium text-ink">{name}</span>
          {isTeacher ? (
            <span className="rounded-pill bg-accent/15 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-widest text-accent">
              Teacher
            </span>
          ) : null}
          <span className="text-xs text-slate">
            {new Date(comment.created_at).toLocaleDateString(undefined, {
              dateStyle: "medium",
            })}
          </span>
        </div>
        <p className="whitespace-pre-wrap text-sm leading-relaxed text-ink">
          {comment.body}
        </p>
      </div>
    </div>
  );
}
