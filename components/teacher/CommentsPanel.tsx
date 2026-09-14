/* [comments-panel-fix] */
import { useEffect, useMemo, useState } from "react";
import { Loader2, MessageSquare, Search, CheckCircle2, Circle } from "lucide-react";
import { useAuth } from "@/context/AuthContext";
import { commentQueries, type CommentThread } from "@/lib/db/comments";
import { lessonQueries } from "@/lib/db/courses";
import type { Lesson, Course } from "@/lib/db/types";
import Avatar from "@/components/ui/Avatar";

interface CommentsPanelProps {
  courses: Course[];
  /** Optional preselected course (e.g. jumping from a notification). */
  initialCourseId?: string | null;
  /** Called whenever the unanswered-thread count changes, so a parent can
   *  render a badge on its nav item. Optional. */
  onUnansweredCount?: (n: number) => void;
}

type Filter = "all" | "unanswered" | "mine";

/**
 * Teacher-side comment inbox. Every student comment / question on the
 * teacher's courses lands here, grouped by course, filterable to
 * "unanswered" so the teacher can work a queue instead of scrolling.
 * Replies are posted inline as the teacher themselves.
 */
export default function CommentsPanel({
  courses,
  initialCourseId,
  onUnansweredCount,
}: CommentsPanelProps) {
  const { user } = useAuth();

  const [courseId, setCourseId] = useState<string | null>(
    initialCourseId ?? courses[0]?.id ?? null
  );
  const [threads, setThreads] = useState<CommentThread[]>([]);
  const [loading, setLoading] = useState(true);
  const [query, setQuery] = useState("");
  const [filter, setFilter] = useState<Filter>("all");
  const [lessonTitles, setLessonTitles] = useState<Record<string, string>>({});

  // Auto-select the first course once courses have loaded. Without this,
  // the panel sits empty until the teacher manually picks a course —
  // `courses` is typically [] at first render because the dashboard is
  // still fetching them, so the initial useState above can't see them.
  useEffect(() => {
    if (!courseId && courses.length > 0) {
      setCourseId(initialCourseId ?? courses[0].id);
    }
  }, [courses, courseId, initialCourseId]);

  // A notification deep-link may change initialCourseId while the panel
  // is already mounted. Pick up the new value.
  useEffect(() => {
    if (initialCourseId) setCourseId(initialCourseId);
  }, [initialCourseId]);

  const load = (id: string) => {
    setLoading(true);
    commentQueries
      .getThreadsForCourse(id)
      .then(setThreads)
      .catch(() => setThreads([]))
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    if (courseId) load(courseId);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [courseId]);

  // Fetch lesson titles for the current course so each thread can show
  // which lesson it belongs to. One bulk read — never per-thread.
  useEffect(() => {
    if (!courseId) return;
    lessonQueries
      .getByCourse(courseId)
      .then((ls: Lesson[]) => {
        const map: Record<string, string> = {};
        for (const l of ls) map[l.id] = l.title;
        setLessonTitles(map);
      })
      .catch(() => setLessonTitles({}));
  }, [courseId]);

  const visible = useMemo(() => {
    const q = query.trim().toLowerCase();
    const filtered = threads.filter((thr) => {
      if (filter === "unanswered" && thr.answered) return false;
      if (filter === "mine" && thr.author_id !== user?.id) return false;
      if (!q) return true;
      const haystack = [
        thr.body,
        thr.profiles?.full_name ?? "",
        ...thr.replies.map((r) => r.body),
      ]
        .join(" ")
        .toLowerCase();
      return haystack.includes(q);
    });
    // Unanswered threads first (oldest of those first, so the longest-
    // waiting question surfaces at the very top), answered threads after,
    // newest first — a teacher opening this tab should see what needs a
    // reply before anything already handled.
    return [...filtered].sort((a, b) => {
      if (a.answered !== b.answered) return a.answered ? 1 : -1;
      const t1 = new Date(a.created_at).getTime();
      const t2 = new Date(b.created_at).getTime();
      return a.answered ? t2 - t1 : t1 - t2;
    });
  }, [threads, query, filter, user?.id]);

  const unansweredCount = threads.filter((thr) => !thr.answered).length;

  // Bubble the count up so the dashboard nav can show a badge.
  useEffect(() => {
    onUnansweredCount?.(unansweredCount);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [unansweredCount]);

  const postReply = async (parentId: string, body: string) => {
    if (!user || !courseId || !body.trim()) return;
    try {
      const saved = await commentQueries.post({
        courseId,
        authorId: user.id,
        parentId,
        body,
      });
      setThreads((prev) =>
        prev.map((thr) =>
          thr.id === parentId
            ? { ...thr, replies: [...thr.replies, saved], answered: true }
            : thr
        )
      );
    } catch (err) {
      console.error("[CommentsPanel] reply error:", err);
    }
  };

  return (
    <div className="flex flex-col gap-block">
      {/* Toolbar */}
      <div className="card-lift flex flex-wrap items-center gap-stack rounded-card border border-line bg-background px-block py-3">
        <label className="flex min-w-[160px] items-center gap-2 rounded-control border border-line bg-mist/60 px-3 py-1.5 text-sm">
          <span className="text-xs text-slate">Course</span>
          <select
            value={courseId ?? ""}
            onChange={(e) => setCourseId(e.target.value || null)}
            className="flex-1 bg-transparent text-ink outline-none"
          >
            {courses.map((c) => (
              <option key={c.id} value={c.id}>
                {c.title}
              </option>
            ))}
          </select>
        </label>

        <div className="flex flex-1 items-center gap-2 rounded-control border border-line bg-mist/60 px-3 py-1.5">
          <Search size={14} className="text-slate" aria-hidden="true" />
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search comments…"
            className="w-full bg-transparent text-sm text-ink outline-none placeholder:text-slate"
          />
        </div>

        <div className="flex items-center gap-1">
          {(
            [
              { id: "all", label: "All", count: threads.length },
              { id: "unanswered", label: "Unanswered", count: unansweredCount },
              {
                id: "mine",
                label: "Mine",
                count: threads.filter((thr) => thr.author_id === user?.id).length,
              },
            ] as const
          ).map((f) => (
            <button
              key={f.id}
              type="button"
              onClick={() => setFilter(f.id)}
              className={`rounded-pill px-3 py-1.5 text-xs transition-colors duration-base ${
                filter === f.id
                  ? "bg-accent/15 text-accent"
                  : "border border-line text-slate hover:border-accent hover:text-ink"
              }`}
            >
              {f.label} <span className="opacity-70">{f.count}</span>
            </button>
          ))}
        </div>
      </div>

      {/* Threads */}
      {loading ? (
        <div className="flex justify-center py-block">
          <Loader2 size={22} className="animate-spin text-accent" aria-hidden="true" />
        </div>
      ) : visible.length === 0 ? (
        <div className="card-lift flex flex-col items-center gap-2 rounded-card border border-line bg-background p-block text-center">
          <MessageSquare size={28} className="text-slate" aria-hidden="true" />
          <p className="text-sm text-slate">
            {threads.length === 0
              ? "No comments on this course yet. Students will show up here as soon as they post."
              : "No threads match your filter."}
          </p>
        </div>
      ) : (
        <div className="flex flex-col gap-stack">
          {visible.map((thread) => (
            <ThreadCard
              key={thread.id}
              thread={thread}
              currentUserId={user?.id ?? null}
              onReply={postReply}
              lessonTitles={lessonTitles}
              courseId={courseId}
            />
          ))}
        </div>
      )}
    </div>
  );
}

/* -------------------------------------------------------------------------- */

function ThreadCard({
  thread,
  currentUserId,
  onReply,
  lessonTitles,
  courseId,
}: {
  thread: CommentThread;
  currentUserId: string | null;
  onReply: (parentId: string, body: string) => Promise<void>;
  lessonTitles: Record<string, string>;
  courseId: string | null;
}) {
  const [replyOpen, setReplyOpen] = useState(false);
  const [replyBody, setReplyBody] = useState("");
  const [posting, setPosting] = useState(false);

  const submitReply = async () => {
    if (!replyBody.trim()) return;
    setPosting(true);
    try {
      await onReply(thread.id, replyBody);
      setReplyBody("");
      setReplyOpen(false);
    } finally {
      setPosting(false);
    }
  };

  return (
    <div className="card-lift flex flex-col gap-3 rounded-card border border-line bg-background p-block">
      {/* Root comment */}
      <div className="flex items-start gap-3">
        <Avatar name={thread.profiles?.full_name} src={thread.profiles?.avatar_url} size="sm" />
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2">
            <span className="truncate text-sm font-medium text-ink">
              {thread.profiles?.full_name ?? "Student"}
            </span>
            <span className="shrink-0 text-xs text-slate">
              {new Date(thread.created_at).toLocaleString(undefined, {
                dateStyle: "medium",
                timeStyle: "short",
              })}
            </span>
            <span className="ml-auto flex shrink-0 items-center gap-1 text-[10px] uppercase tracking-widest">
              {thread.answered ? (
                <span className="flex items-center gap-1 text-success">
                  <CheckCircle2 size={11} /> Answered
                </span>
              ) : (
                <span className="flex items-center gap-1 text-ember">
                  <Circle size={11} /> Needs reply
                </span>
              )}
            </span>
          </div>
          <p className="mt-1 whitespace-pre-wrap text-sm text-ink">{thread.body}</p>
          {thread.lesson_id && lessonTitles[thread.lesson_id] ? (
            <p className="mt-1 text-xs text-slate">
              on lesson:{" "}
              {courseId ? (
                <a
                  href={`/learn/${courseId}?lesson=${thread.lesson_id}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="underline hover:text-accent"
                >
                  {lessonTitles[thread.lesson_id]}
                </a>
              ) : (
                lessonTitles[thread.lesson_id]
              )}
            </p>
          ) : null}
        </div>
      </div>

      {/* Replies */}
      {thread.replies.length > 0 ? (
        <div className="ml-11 flex flex-col gap-2 border-l-2 border-line pl-4">
          {thread.replies.map((reply) => {
            const isMine = reply.author_id === currentUserId;
            return (
              <div
                key={reply.id}
                className={`comment-bubble ${isMine ? "mine" : ""} p-3`}
              >
                <div className="mb-1 flex items-center gap-2">
                  <Avatar name={reply.profiles?.full_name} src={reply.profiles?.avatar_url} size="sm" />
                  <span className="text-xs font-medium text-ink">
                    {reply.profiles?.full_name ?? "User"}
                  </span>
                  {reply.profiles?.role === "teacher" ? (
                    <span className="rounded-pill bg-accent/15 px-2 py-0.5 text-[9px] font-semibold uppercase tracking-widest text-accent">
                      Teacher
                    </span>
                  ) : null}
                  <span className="ml-auto text-[10px] text-slate">
                    {new Date(reply.created_at).toLocaleString(undefined, {
                      dateStyle: "medium",
                      timeStyle: "short",
                    })}
                  </span>
                </div>
                <p className="whitespace-pre-wrap text-sm text-ink">{reply.body}</p>
              </div>
            );
          })}
        </div>
      ) : null}

      {/* Reply composer */}
      {replyOpen ? (
        <div className="ml-11 flex flex-col gap-2">
          <textarea
            value={replyBody}
            onChange={(e) => setReplyBody(e.target.value)}
            rows={3}
            placeholder="Write a reply to the student…"
            className="w-full resize-none rounded-control border border-line bg-mist px-stack py-tight text-sm text-ink outline-none focus:border-accent"
          />
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={submitReply}
              disabled={posting || !replyBody.trim()}
              className="gradient-brand inline-flex items-center gap-1.5 rounded-control px-4 py-1.5 text-xs text-primary-foreground transition-all duration-base hover:scale-hover disabled:opacity-50"
            >
              {posting ? <Loader2 size={12} className="animate-spin" /> : null}
              Post reply
            </button>
            <button
              type="button"
              onClick={() => {
                setReplyOpen(false);
                setReplyBody("");
              }}
              className="rounded-control border border-line px-4 py-1.5 text-xs text-slate hover:text-ink"
            >
              Cancel
            </button>
          </div>
        </div>
      ) : (
        <button
          type="button"
          onClick={() => setReplyOpen(true)}
          className="ml-11 w-fit rounded-control border border-line px-4 py-1.5 text-xs text-slate transition-colors duration-base hover:border-accent hover:text-accent"
        >
          Reply as teacher
        </button>
      )}
    </div>
  );
}
