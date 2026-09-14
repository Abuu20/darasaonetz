/* [reviews-panel] */
import { useEffect, useMemo, useState } from "react";
import { Loader2, MessageSquare, Send, Star } from "lucide-react";
import { useAuth } from "@/context/AuthContext";
import { supabase } from "@/lib/db/client";
import Avatar from "@/components/ui/Avatar";
import { StarRatingDisplay } from "@/components/ui/StarRating";

interface ReviewRow {
  id: string;
  course_id: string;
  student_id: string;
  rating: number;
  comment: string | null;
  teacher_response: string | null;
  teacher_response_at: string | null;
  created_at: string;
  course_title: string;
  student_name: string | null;
  student_avatar: string | null;
}

type Filter = "all" | "unanswered" | "responded" | "low";

interface ReviewsPanelProps {
  courses: { id: string; title: string }[];
  /** Fires every time the answer/unanswered count changes — used for the
   *  sidebar badge on the Reviews item. */
  onUnansweredCount?: (n: number) => void;
}

export default function ReviewsPanel({ courses, onUnansweredCount }: ReviewsPanelProps) {
  const { user } = useAuth();
  const [reviews, setReviews] = useState<ReviewRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [courseFilter, setCourseFilter] = useState<string>("all");
  const [filter, setFilter] = useState<Filter>("all");
  const [replyTo, setReplyTo] = useState<string | null>(null);
  const [replyBody, setReplyBody] = useState("");
  const [posting, setPosting] = useState(false);
  const [error, setError] = useState("");

  const load = async () => {
    if (!user) return;
    setLoading(true);
    setError("");
    try {
      const { data, error: err } = await supabase
        .from("course_reviews")
        .select(`
          id, course_id, student_id, rating, comment,
          teacher_response, teacher_response_at, created_at,
          courses!inner (id, title, teacher_id),
          profiles!course_reviews_student_id_fkey (id, full_name, avatar_url)
        `)
        .eq("courses.teacher_id", user.id)
        .order("created_at", { ascending: false });

      if (err) {
        setError(err.message);
        setReviews([]);
      } else {
        const mapped: ReviewRow[] = (data ?? []).map((r: any) => ({
          id: r.id,
          course_id: r.course_id,
          student_id: r.student_id,
          rating: r.rating,
          comment: r.comment,
          teacher_response: r.teacher_response,
          teacher_response_at: r.teacher_response_at,
          created_at: r.created_at,
          course_title: r.courses?.title ?? "Course",
          student_name: r.profiles?.full_name ?? null,
          student_avatar: r.profiles?.avatar_url ?? null,
        }));
        setReviews(mapped);
      }
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user]);

  const visible = useMemo(() => {
    const filtered = reviews.filter((r) => {
      if (courseFilter !== "all" && r.course_id !== courseFilter) return false;
      if (filter === "unanswered" && r.teacher_response) return false;
      if (filter === "responded" && !r.teacher_response) return false;
      if (filter === "low" && r.rating > 3) return false;
      return true;
    });
    // Priority order: unanswered first (a public review sitting without a
    // reply is the most visible unresolved thing on this whole dashboard),
    // then lowest rating first within that (a 1-star with no response is
    // more urgent than a 5-star with no response), then newest first.
    return [...filtered].sort((a, b) => {
      const aOpen = !a.teacher_response;
      const bOpen = !b.teacher_response;
      if (aOpen !== bOpen) return aOpen ? -1 : 1;
      if (aOpen && a.rating !== b.rating) return a.rating - b.rating;
      return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
    });
  }, [reviews, courseFilter, filter]);

  const summary = useMemo(() => {
    const total = reviews.length;
    const answered = reviews.filter((r) => r.teacher_response).length;
    const avg = total > 0 ? reviews.reduce((s, r) => s + r.rating, 0) / total : 0;
    return { total, answered, unanswered: total - answered, avg };
  }, [reviews]);

  useEffect(() => {
    onUnansweredCount?.(summary.unanswered);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [summary.unanswered]);

  const openReply = (r: ReviewRow) => {
    setReplyTo(r.id);
    setReplyBody(r.teacher_response ?? "");
    setError("");
  };

  const submitReply = async (reviewId: string) => {
    if (!replyBody.trim()) return;
    setPosting(true);
    setError("");
    try {
      const now = new Date().toISOString();
      const { data, error: err } = await supabase
        .from("course_reviews")
        .update({
          teacher_response: replyBody.trim(),
          teacher_response_at: now,
        })
        .eq("id", reviewId)
        .select()
        .single();
      if (err) throw err;
      setReviews((prev) =>
        prev.map((r) =>
          r.id === reviewId
            ? { ...r, teacher_response: data.teacher_response, teacher_response_at: data.teacher_response_at }
            : r
        )
      );
      setReplyTo(null);
      setReplyBody("");
    } catch (e: any) {
      setError(e?.message ?? "Could not save reply.");
    } finally {
      setPosting(false);
    }
  };

  return (
    <div className="flex flex-col gap-block">
      {/* Toolbar */}
      <div className="card-lift flex flex-wrap items-center gap-stack rounded-card border border-line bg-background px-block py-3">
        <label className="flex min-w-[160px] items-center gap-2 rounded-control border border-line bg-mist/60 px-3 py-1.5 text-sm">
          <span className="text-xs text-slate">Course</span>
          <select
            value={courseFilter}
            onChange={(e) => setCourseFilter(e.target.value)}
            className="flex-1 bg-transparent text-ink outline-none"
          >
            <option value="all">All courses</option>
            {courses.map((c) => (
              <option key={c.id} value={c.id}>
                {c.title}
              </option>
            ))}
          </select>
        </label>

        <div className="flex flex-wrap items-center gap-1">
          {(
            [
              { id: "all", label: "All", count: summary.total },
              { id: "unanswered", label: "Unanswered", count: summary.unanswered },
              { id: "responded", label: "Responded", count: summary.answered },
              { id: "low", label: "≤ 3★", count: reviews.filter((r) => r.rating <= 3).length },
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

        {summary.total > 0 ? (
          <span className="ml-auto flex items-center gap-1.5 text-xs text-slate">
            <Star size={12} className="text-ember" />
            <span className="font-medium text-ink">{summary.avg.toFixed(1)}</span>
            <span>across {summary.total} reviews</span>
          </span>
        ) : null}
      </div>

      {error ? (
        <div className="rounded-control border border-danger/50 bg-danger/10 px-stack py-tight text-sm text-ink">
          {error}
        </div>
      ) : null}

      {/* List */}
      {loading ? (
        <div className="flex justify-center py-block">
          <Loader2 size={22} className="animate-spin text-accent" aria-hidden="true" />
        </div>
      ) : visible.length === 0 ? (
        <div className="card-lift flex flex-col items-center gap-2 rounded-card border border-line bg-background p-block text-center">
          <MessageSquare size={28} className="text-slate" aria-hidden="true" />
          <p className="text-sm text-slate">
            {reviews.length === 0
              ? "No reviews yet on any of your courses."
              : "No reviews match that filter."}
          </p>
        </div>
      ) : (
        <div className="flex flex-col gap-stack">
          {visible.map((r) => (
            <div
              key={r.id}
              className="card-lift flex flex-col gap-3 rounded-card border border-line bg-background p-block"
            >
              <div className="flex items-start gap-3">
                <Avatar name={r.student_name} src={r.student_avatar} size="sm" />
                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="text-sm font-medium text-ink">
                      {r.student_name ?? "Student"}
                    </span>
                    <span className="text-xs text-slate">
                      on{" "}
                      <span className="text-ink">{r.course_title}</span>
                    </span>
                    <span className="text-xs text-slate">·</span>
                    <span className="text-xs text-slate">
                      {new Date(r.created_at).toLocaleDateString(undefined, {
                        dateStyle: "medium",
                      })}
                    </span>
                    <span className="ml-auto flex items-center gap-1">
                      <StarRatingDisplay value={r.rating} size="sm" />
                    </span>
                  </div>
                  {r.comment ? (
                    <p className="mt-1 whitespace-pre-wrap text-sm text-ink">{r.comment}</p>
                  ) : (
                    <p className="mt-1 text-sm italic text-slate">No written comment.</p>
                  )}
                </div>
              </div>

              {/* Existing reply */}
              {r.teacher_response && replyTo !== r.id ? (
                <div className="ml-11 rounded-control border-l-2 border-accent/40 bg-accent/5 p-3">
                  <div className="mb-1 flex items-center gap-2">
                    <span className="rounded-pill bg-accent/15 px-2 py-0.5 text-[9px] font-semibold uppercase tracking-widest text-accent">
                      Your reply
                    </span>
                    {r.teacher_response_at ? (
                      <span className="text-[10px] text-slate">
                        {new Date(r.teacher_response_at).toLocaleDateString(undefined, {
                          dateStyle: "medium",
                        })}
                      </span>
                    ) : null}
                  </div>
                  <p className="whitespace-pre-wrap text-sm text-ink">{r.teacher_response}</p>
                  <button
                    type="button"
                    onClick={() => openReply(r)}
                    className="mt-2 text-xs text-accent hover:underline"
                  >
                    Edit reply
                  </button>
                </div>
              ) : null}

              {/* Reply composer */}
              {replyTo === r.id ? (
                <div className="ml-11 flex flex-col gap-2">
                  <textarea
                    value={replyBody}
                    onChange={(e) => setReplyBody(e.target.value)}
                    rows={3}
                    placeholder="Reply publicly to this review…"
                    className="w-full resize-none rounded-control border border-line bg-mist px-stack py-tight text-sm text-ink outline-none focus:border-accent"
                  />
                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() => submitReply(r.id)}
                      disabled={posting || !replyBody.trim()}
                      className="gradient-brand inline-flex items-center gap-1.5 rounded-control px-4 py-1.5 text-xs text-primary-foreground transition-all duration-base hover:scale-hover disabled:opacity-50"
                    >
                      {posting ? <Loader2 size={12} className="animate-spin" /> : <Send size={12} />}
                      Post reply
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        setReplyTo(null);
                        setReplyBody("");
                      }}
                      className="rounded-control border border-line px-4 py-1.5 text-xs text-slate hover:text-ink"
                    >
                      Cancel
                    </button>
                  </div>
                </div>
              ) : !r.teacher_response ? (
                <button
                  type="button"
                  onClick={() => openReply(r)}
                  className="ml-11 w-fit rounded-control border border-line px-4 py-1.5 text-xs text-slate transition-colors duration-base hover:border-accent hover:text-accent"
                >
                  Reply as teacher
                </button>
              ) : null}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
