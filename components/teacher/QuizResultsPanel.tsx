import { useEffect, useMemo, useState } from "react";
import {
  Loader2, Users, Target, CheckCircle2, ChevronDown, RotateCcw, Star, ArrowLeft,
} from "lucide-react";
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell, LineChart, Line,
} from "recharts";
import { useLanguage } from "@/context/LanguageContext";
import { quizAttemptQueries, type QuizAttemptWithStudent } from "@/lib/db/quizzes";
import { supabase } from "@/lib/db/client";
import type { Quiz } from "@/lib/db/types";
import Avatar from "@/components/ui/Avatar";

interface QuizResultsPanelProps {
  quiz: Quiz;
  lessonTitle: string;
  enrolledCount?: number;
  onClose: () => void;
  /** Called after a successful regrade so parents can refresh rosters. */
  onRegraded?: () => void;
}

interface StudentGroup {
  studentId: string;
  name: string;
  email: string | null;
  attempts: QuizAttemptWithStudent[];
  bestScore: number;
  latest: QuizAttemptWithStudent;
}

const PASS_FILL = "#2A9D8F";
const FAIL_FILL = "#F4A261";
const ACCENT = "#624BFF";

function formatDate(iso: string): string {
  return new Date(iso).toLocaleString(undefined, { dateStyle: "medium", timeStyle: "short" });
}

/**
 * Quiz results + analytics. Three charts — score distribution (bar),
 * pass/fail split (donut), attempts over time (line) — plus a roster with
 * per-attempt history and a lightweight regrade action that calls the
 * `regrade_quiz_attempt` RPC.
 */
export default function QuizResultsPanel({
  quiz,
  lessonTitle,
  enrolledCount,
  onClose,
  onRegraded,
}: QuizResultsPanelProps) {
  const { t } = useLanguage();
  const T = (key: string) => t(`components.teacher.QuizResultsPanel.${key}`);

  const [loading, setLoading] = useState(true);
  const [attempts, setAttempts] = useState<QuizAttemptWithStudent[]>([]);
  const [expanded, setExpanded] = useState<Set<string>>(new Set());
  const [regradeTarget, setRegradeTarget] = useState<QuizAttemptWithStudent | null>(null);

  const load = () => {
    setLoading(true);
    quizAttemptQueries
      .getByQuiz(quiz.id)
      .then(rows => setAttempts(rows))
      .catch(() => setAttempts([]))
      .finally(() => setLoading(false));
  };

  useEffect(() => { load(); /* eslint-disable-next-line */ }, [quiz.id]);

  const groups = useMemo<StudentGroup[]>(() => {
    const byStudent = new Map<string, QuizAttemptWithStudent[]>();
    for (const a of attempts) {
      const list = byStudent.get(a.student_id) ?? [];
      list.push(a);
      byStudent.set(a.student_id, list);
    }
    return [...byStudent.entries()]
      .map(([studentId, list]) => {
        const sorted = [...list].sort(
          (a, b) => new Date(b.submitted_at).getTime() - new Date(a.submitted_at).getTime()
        );
        const best = Math.max(...sorted.map(a => a.score));
        const student = sorted[0].student;
        return {
          studentId,
          name: student?.full_name || student?.email || T("unknownStudent"),
          email: student?.email ?? null,
          attempts: sorted,
          bestScore: best,
          latest: sorted[0],
        };
      })
      .sort((a, b) => new Date(b.latest.submitted_at).getTime() - new Date(a.latest.submitted_at).getTime());
  }, [attempts, T]);

  const stats = useMemo(() => {
    const attempted = groups.length;
    const passed = groups.filter(g => g.attempts.some(a => a.passed)).length;
    const avg = attempts.length > 0 ? Math.round(attempts.reduce((s, a) => s + a.score, 0) / attempts.length) : 0;
    return { attempted, passed, avg, totalAttempts: attempts.length };
  }, [groups, attempts]);

  /** Bucketed score distribution for the bar chart. */
  const scoreBuckets = useMemo(() => {
    const buckets = [
      { range: "0–19", count: 0 },
      { range: "20–39", count: 0 },
      { range: "40–59", count: 0 },
      { range: "60–79", count: 0 },
      { range: "80–100", count: 0 },
    ];
    for (const a of attempts) {
      const i = Math.min(4, Math.floor(a.score / 20));
      buckets[i].count += 1;
    }
    return buckets;
  }, [attempts]);

  /** Pass/fail donut. */
  const passFailData = useMemo(() => {
    const passed = attempts.filter(a => a.passed).length;
    const failed = attempts.length - passed;
    return [
      { name: "Passed", value: passed, fill: PASS_FILL },
      { name: "Not passed", value: failed, fill: FAIL_FILL },
    ].filter(d => d.value > 0);
  }, [attempts]);

  /** Attempts over time — one point per day, most recent 14 days. */
  const timelineData = useMemo(() => {
    const days = 14;
    const buckets = Array.from({ length: days }, (_, i) => {
      const d = new Date();
      d.setDate(d.getDate() - (days - 1 - i));
      d.setHours(0, 0, 0, 0);
      const end = new Date(d);
      end.setHours(23, 59, 59, 999);
      return {
        label: `${d.getMonth() + 1}/${d.getDate()}`,
        startMs: d.getTime(),
        endMs: end.getTime(),
        attempts: 0,
      };
    });
    for (const a of attempts) {
      const t = new Date(a.submitted_at).getTime();
      for (const b of buckets) {
        if (t >= b.startMs && t <= b.endMs) { b.attempts += 1; break; }
      }
    }
    return buckets.map(({ label, attempts: n }) => ({ label, attempts: n }));
  }, [attempts]);

  const toggle = (studentId: string) => {
    setExpanded(prev => {
      const next = new Set(prev);
      next.has(studentId) ? next.delete(studentId) : next.add(studentId);
      return next;
    });
  };

  /** Regrade via RPC. Returns silently on error and logs it — the RPC
   *  enforces teacher ownership, so a failure here means the teacher
   *  isn't the course owner (or the RPC hasn't been run in Supabase). */
  const submitRegrade = async (attemptId: string, newScore: number, feedback: string) => {
    const { error } = await supabase.rpc("regrade_quiz_attempt", {
      p_attempt_id: attemptId,
      p_new_score: newScore,
      p_feedback: feedback || null,
    });
    if (error) {
      console.error("[QuizResultsPanel] regrade error:", error);
      return false;
    }
    // Optimistic update: patch the row in place.
    setAttempts(prev => prev.map(a => (a.id === attemptId ? { ...a, score: newScore } : a)));
    setRegradeTarget(null);
    onRegraded?.();
    return true;
  };

  return (
    <div className="flex flex-col gap-block">
      {/* Header card */}
      <div className="card-lift flex flex-wrap items-center justify-between gap-stack rounded-card border border-line bg-background px-block py-3">
        <div className="flex items-center gap-stack">
          <button
            type="button"
            onClick={onClose}
            className="inline-flex items-center gap-1.5 rounded-control border border-line px-3 py-1.5 text-xs text-slate transition-colors duration-base hover:border-accent hover:text-ink"
          >
            <ArrowLeft size={14} aria-hidden="true" />
            Back to quizzes
          </button>
          <div className="min-w-0">
            <p className="truncate text-sm font-medium text-ink">{quiz.title}</p>
            <p className="truncate text-xs text-slate">{lessonTitle}</p>
          </div>
        </div>
        <div className="flex items-center gap-3 text-xs text-slate">
          <span>{quiz.quiz_questions?.length ?? 0} questions</span>
          <span>Pass at {quiz.passing_score}%</span>
        </div>
      </div>

      {loading ? (
        <div className="flex justify-center py-block">
          <Loader2 size={22} className="animate-spin text-accent" aria-hidden="true" />
        </div>
      ) : attempts.length === 0 ? (
        <div className="card-lift flex flex-col items-center gap-2 rounded-card border border-line bg-background p-block text-center">
          <Users size={28} className="text-slate" aria-hidden="true" />
          <p className="text-sm text-slate">{T("empty")}</p>
        </div>
      ) : (
        <>
          {/* KPI row */}
          <div className="grid grid-cols-3 gap-stack">
            <div className="card-lift flex flex-col gap-1 rounded-card border border-line bg-background p-block">
              <Users size={14} className="text-accent" aria-hidden="true" />
              <span className="font-heading text-2xl text-ink">
                {stats.attempted}
                {typeof enrolledCount === "number" ? (
                  <span className="text-sm text-slate">/{enrolledCount}</span>
                ) : null}
              </span>
              <span className="text-[10px] uppercase tracking-widest text-slate">
                {T("studentsAttempted")}
              </span>
            </div>
            <div className="card-lift flex flex-col gap-1 rounded-card border border-line bg-background p-block">
              <Target size={14} className="text-accent" aria-hidden="true" />
              <span className="font-heading text-2xl text-ink">{stats.avg}%</span>
              <span className="text-[10px] uppercase tracking-widest text-slate">
                {T("averageScore")}
              </span>
            </div>
            <div className="card-lift flex flex-col gap-1 rounded-card border border-line bg-background p-block">
              <CheckCircle2 size={14} className="text-accent" aria-hidden="true" />
              <span className="font-heading text-2xl text-ink">{stats.passed}</span>
              <span className="text-[10px] uppercase tracking-widest text-slate">
                {T("studentsPassed")}
              </span>
            </div>
          </div>

          {/* Charts */}
          <div className="grid grid-cols-1 gap-stack lg:grid-cols-2">
            {/* Score distribution */}
            <div className="card-lift rounded-card border border-line bg-background p-block">
              <h3 className="mb-3 font-heading text-sm text-ink">Score distribution</h3>
              <ResponsiveContainer width="100%" height={220}>
                <BarChart data={scoreBuckets} margin={{ top: 8, right: 8, left: -18, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="4 4" vertical={false} />
                  <XAxis dataKey="range" tickLine={false} axisLine={false} />
                  <YAxis allowDecimals={false} tickLine={false} axisLine={false} width={28} />
                  <Tooltip
                    cursor={{ fill: "rgba(98,75,255,0.06)" }}
                    contentStyle={{ borderRadius: 10, fontSize: 12 }}
                  />
                  <Bar dataKey="count" name="Students" fill={ACCENT} radius={[6, 6, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>

            {/* Pass / fail donut */}
            <div className="card-lift rounded-card border border-line bg-background p-block">
              <h3 className="mb-3 font-heading text-sm text-ink">Pass / fail</h3>
              <ResponsiveContainer width="100%" height={220}>
                <PieChart>
                  <Pie
                    data={passFailData}
                    dataKey="value"
                    nameKey="name"
                    innerRadius="55%"
                    outerRadius="80%"
                    paddingAngle={3}
                  >
                    {passFailData.map(entry => (
                      <Cell key={entry.name} fill={entry.fill} />
                    ))}
                  </Pie>
                  <Tooltip contentStyle={{ borderRadius: 10, fontSize: 12 }} />
                </PieChart>
              </ResponsiveContainer>
              <ul className="mt-3 flex justify-center gap-4 text-xs">
                {passFailData.map(d => (
                  <li key={d.name} className="flex items-center gap-1.5 text-slate">
                    <span className="h-2.5 w-2.5 rounded-full" style={{ backgroundColor: d.fill }} />
                    {d.name} <span className="font-medium text-ink">{d.value}</span>
                  </li>
                ))}
              </ul>
            </div>
          </div>

          {/* Timeline */}
          <div className="card-lift rounded-card border border-line bg-background p-block">
            <h3 className="mb-3 font-heading text-sm text-ink">Attempts · last 14 days</h3>
            <ResponsiveContainer width="100%" height={180}>
              <LineChart data={timelineData} margin={{ top: 8, right: 8, left: -18, bottom: 0 }}>
                <CartesianGrid strokeDasharray="4 4" vertical={false} />
                <XAxis dataKey="label" tickLine={false} axisLine={false} />
                <YAxis allowDecimals={false} tickLine={false} axisLine={false} width={28} />
                <Tooltip contentStyle={{ borderRadius: 10, fontSize: 12 }} />
                <Line
                  type="monotone"
                  dataKey="attempts"
                  name="Attempts"
                  stroke={ACCENT}
                  strokeWidth={2}
                  dot={{ r: 3, fill: ACCENT }}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>

          {/* Roster */}
          <div className="card-lift overflow-hidden rounded-card border border-line bg-background">
            <div className="border-b border-line px-block py-3">
              <h3 className="font-heading text-sm text-ink">Roster</h3>
            </div>
            {groups.map(group => {
              const isOpen = expanded.has(group.studentId);
              return (
                <div key={group.studentId} className="border-b border-line last:border-b-0">
                  <button
                    type="button"
                    onClick={() => toggle(group.studentId)}
                    aria-expanded={isOpen}
                    className="flex w-full items-center gap-stack px-block py-stack text-left transition-colors duration-base hover:bg-mist/60"
                  >
                    <Avatar name={group.name} size="sm" />
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm font-medium text-ink">{group.name}</p>
                      <p className="truncate text-xs text-slate">
                        {group.attempts.length > 1
                          ? `${group.attempts.length} ${T("attempts")}`
                          : formatDate(group.latest.submitted_at)}
                      </p>
                    </div>
                    <span
                      className={`shrink-0 rounded-pill px-2.5 py-0.5 text-xs font-medium ${
                        group.latest.passed ? "bg-success/15 text-success" : "bg-danger/15 text-danger"
                      }`}
                    >
                      {group.bestScore}%
                    </span>
                    <ChevronDown
                      size={16}
                      className={`shrink-0 text-slate transition-transform duration-base ${isOpen ? "rotate-180" : ""}`}
                      aria-hidden="true"
                    />
                  </button>

                  {isOpen ? (
                    <div className="border-t border-line bg-mist/30 px-block py-stack">
                      <div className="flex flex-col gap-1.5">
                        {group.attempts.map(a => (
                          <div
                            key={a.id}
                            className="flex flex-wrap items-center justify-between gap-2 rounded-control border border-line bg-background px-3 py-2 text-xs"
                          >
                            <span className="flex items-center gap-1 text-slate">
                              {group.attempts.length > 1 ? <RotateCcw size={11} /> : null}
                              {formatDate(a.submitted_at)}
                            </span>
                            <span className="flex items-center gap-tight">
                              <span className="text-slate">
                                {a.points_earned}/{a.points_possible} {T("points")}
                              </span>
                              <span className={`font-medium ${a.passed ? "text-success" : "text-danger"}`}>
                                {a.score}%
                              </span>
                              <button
                                type="button"
                                onClick={() => setRegradeTarget(a)}
                                className="ml-2 inline-flex items-center gap-1 rounded-control border border-line px-2 py-0.5 text-[10px] uppercase tracking-widest text-slate transition-colors duration-base hover:border-accent hover:text-accent"
                              >
                                <Star size={10} /> Regrade
                              </button>
                            </span>
                          </div>
                        ))}
                      </div>
                    </div>
                  ) : null}
                </div>
              );
            })}
          </div>
        </>
      )}

      {regradeTarget ? (
        <RegradeDialog
          attempt={regradeTarget}
          onCancel={() => setRegradeTarget(null)}
          onSubmit={(score, feedback) => submitRegrade(regradeTarget.id, score, feedback)}
        />
      ) : null}
    </div>
  );
}

/* -------------------------------------------------------------------------- */

function RegradeDialog({
  attempt,
  onCancel,
  onSubmit,
}: {
  attempt: QuizAttemptWithStudent;
  onCancel: () => void;
  onSubmit: (score: number, feedback: string) => Promise<boolean>;
}) {
  const [score, setScore] = useState(attempt.score);
  const [feedback, setFeedback] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async () => {
    setSubmitting(true);
    try {
      await onSubmit(Math.max(0, Math.min(100, Math.round(score))), feedback.trim());
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center bg-ink/50 px-gutter backdrop-blur-sm">
      <div className="card-lift w-full max-w-md rounded-card border border-line bg-background p-block">
        <h3 className="font-heading text-base text-ink">Regrade attempt</h3>
        <p className="mb-4 mt-1 text-xs text-slate">
          Auto-graded score was <span className="font-medium text-ink">{attempt.score}%</span>. Override
          it here for partial credit or leniency.
        </p>

        <label className="mb-3 block">
          <span className="mb-1 block text-xs uppercase tracking-widest text-slate">New score (%)</span>
          <input
            type="number"
            min={0}
            max={100}
            value={score}
            onChange={e => setScore(Number(e.target.value))}
            className="w-full rounded-control border border-line bg-mist px-3 py-2 text-sm text-ink outline-none focus:border-accent"
          />
        </label>

        <label className="mb-5 block">
          <span className="mb-1 block text-xs uppercase tracking-widest text-slate">
            Note to student (optional)
          </span>
          <textarea
            value={feedback}
            onChange={e => setFeedback(e.target.value)}
            rows={3}
            placeholder="e.g. +5 for your explanation on Q3"
            className="w-full resize-none rounded-control border border-line bg-mist px-3 py-2 text-sm text-ink outline-none focus:border-accent"
          />
        </label>

        <div className="flex justify-end gap-2">
          <button
            type="button"
            onClick={onCancel}
            disabled={submitting}
            className="rounded-control border border-line px-4 py-2 text-xs text-slate hover:text-ink"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={handleSubmit}
            disabled={submitting}
            className="gradient-brand inline-flex items-center gap-2 rounded-control px-4 py-2 text-xs text-primary-foreground hover:scale-hover disabled:opacity-50"
          >
            {submitting ? <Loader2 size={12} className="animate-spin" /> : null}
            Save regrade
          </button>
        </div>
      </div>
    </div>
  );
}
