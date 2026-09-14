import { useEffect, useMemo, useState } from "react";
import { X, Loader2, Search, ChevronDown, TriangleAlert, CircleCheck, CircleX } from "lucide-react";
import { useLanguage } from "@/context/LanguageContext";
import { enrollmentQueries } from "@/lib/db/courses";
import { studentQuizQueries, type StudentAttemptRow } from "@/lib/db/quizzes";
import type { Course, Enrollment } from "@/lib/db/types";

function formatDate(iso: string): string {
  return new Date(iso).toLocaleDateString(undefined, { dateStyle: "medium" });
}

function initials(name: string): string {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return "?";
  return (parts[0][0] + (parts[1]?.[0] ?? "")).toUpperCase();
}

// "At risk" is intentionally simple and explainable at a glance rather
// than a scored model: zero progress, two weeks after enrolling. A
// teacher scanning a long roster should be able to tell why a student is
// flagged without hovering for an explanation.
const AT_RISK_DAYS = 14;
function isAtRisk(enrollment: Enrollment): boolean {
  const progress = enrollment.progress ?? 0;
  if (progress > 0) return false;
  const enrolledMs = new Date(enrollment.enrolled_at).getTime();
  const daysSince = (Date.now() - enrolledMs) / (1000 * 60 * 60 * 24);
  return daysSince >= AT_RISK_DAYS;
}

type SortKey = "progress-asc" | "progress-desc" | "name" | "recent";

// A student's quiz attempts within this course, fetched on first expand
// only (not for the whole roster up front) — keeps the panel fast for
// courses with a lot of enrolled students.
function StudentQuizResults({ studentId, courseId }: { studentId: string; courseId: string }) {
  const { t } = useLanguage();
  const T = (key: string) => t(`components.teacher.StudentsPanel.${key}`);
  const [attempts, setAttempts] = useState<StudentAttemptRow[] | null>(null);

  useEffect(() => {
    let cancelled = false;
    studentQuizQueries
      .getByStudent(studentId)
      .then(rows => {
        if (!cancelled) setAttempts(rows.filter(r => r.course_id === courseId));
      })
      .catch(() => {
        if (!cancelled) setAttempts([]);
      });
    return () => {
      cancelled = true;
    };
  }, [studentId, courseId]);

  if (attempts === null) {
    return (
      <div className="flex items-center gap-1.5 py-2 text-xs text-slate">
        <Loader2 size={12} className="animate-spin" aria-hidden="true" />
        {T("loadingQuizzes")}
      </div>
    );
  }

  if (attempts.length === 0) {
    return <p className="py-2 text-xs text-slate">{T("noQuizAttempts")}</p>;
  }

  // Latest attempt per quiz only — a retake shouldn't show as two rows.
  const latestByQuiz = new Map<string, StudentAttemptRow>();
  for (const a of attempts) {
    const existing = latestByQuiz.get(a.quiz_id);
    if (!existing || new Date(a.submitted_at) > new Date(existing.submitted_at)) {
      latestByQuiz.set(a.quiz_id, a);
    }
  }

  return (
    <div className="flex flex-col gap-1 py-2">
      {[...latestByQuiz.values()].map(a => (
        <div key={a.id} className="flex items-center justify-between gap-2 rounded-control bg-mist/40 px-2.5 py-1.5 text-xs">
          <span className="min-w-0 truncate text-ink">{a.quiz_title ?? T("unknownStudent")}</span>
          <span className="flex shrink-0 items-center gap-1.5">
            {a.passed ? (
              <CircleCheck size={13} className="text-success" aria-hidden="true" />
            ) : (
              <CircleX size={13} className="text-danger" aria-hidden="true" />
            )}
            <span className="font-medium text-ink">{Math.round(a.score)}%</span>
          </span>
        </div>
      ))}
    </div>
  );
}

// A course-level roster: every enrolled student with how far through the
// lessons they've gotten. `enrollments.progress` is already kept up to
// date by lessonQueries.completeLesson, so this is a read-only view — no
// separate progress-tracking logic needed here. Rows expand on click to
// show that student's quiz results for this course.
export default function StudentsPanel({ course, onClose }: { course: Course; onClose: () => void }) {
  const { t } = useLanguage();
  const T = (key: string) => t(`components.teacher.StudentsPanel.${key}`);

  const [loading, setLoading] = useState(true);
  const [enrollments, setEnrollments] = useState<Enrollment[]>([]);
  const [query, setQuery] = useState("");
  const [sort, setSort] = useState<SortKey>("progress-asc");
  const [expandedId, setExpandedId] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    enrollmentQueries
      .getByCourse(course.id)
      .then(rows => {
        if (!cancelled) setEnrollments(rows);
      })
      .catch(() => {
        if (!cancelled) setEnrollments([]);
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [course.id]);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    let rows = enrollments;
    if (q) {
      rows = rows.filter(e => {
        const profile = (e as any).profiles as { full_name?: string | null; email?: string | null } | null;
        return (profile?.full_name ?? "").toLowerCase().includes(q) || (profile?.email ?? "").toLowerCase().includes(q);
      });
    }
    const sorted = [...rows];
    switch (sort) {
      case "progress-asc":
        sorted.sort((a, b) => (a.progress ?? 0) - (b.progress ?? 0));
        break;
      case "progress-desc":
        sorted.sort((a, b) => (b.progress ?? 0) - (a.progress ?? 0));
        break;
      case "recent":
        sorted.sort((a, b) => new Date(b.enrolled_at).getTime() - new Date(a.enrolled_at).getTime());
        break;
      case "name":
        sorted.sort((a, b) => {
          const nameA = ((a as any).profiles?.full_name ?? "").toLowerCase();
          const nameB = ((b as any).profiles?.full_name ?? "").toLowerCase();
          return nameA.localeCompare(nameB);
        });
        break;
    }
    return sorted;
  }, [enrollments, query, sort]);

  const avgProgress = useMemo(() => {
    if (enrollments.length === 0) return 0;
    return Math.round(enrollments.reduce((sum, e) => sum + (e.progress ?? 0), 0) / enrollments.length);
  }, [enrollments]);

  const atRiskCount = useMemo(() => enrollments.filter(isAtRisk).length, [enrollments]);

  return (
    <div className="flex flex-col">
      <div className="card-lift flex w-full flex-col overflow-hidden rounded-card border border-line bg-background">
        <div className="flex shrink-0 items-center justify-between border-b border-line px-stack py-tight">
          <div className="min-w-0">
            <p className="truncate text-sm font-medium text-ink">{T("heading")}</p>
            <p className="truncate text-xs text-slate">{course.title}</p>
          </div>
          <button type="button" onClick={onClose} aria-label={T("close")} className="shrink-0 rounded-control p-1.5 text-slate hover:bg-mist hover:text-ink">
            <X size={16} />
          </button>
        </div>

        {loading ? (
          <div className="flex flex-1 items-center justify-center py-block">
            <Loader2 size={22} className="animate-spin text-accent" aria-hidden="true" />
          </div>
        ) : (
          <div className="flex-1 overflow-y-auto px-stack py-stack">
            <div className="mb-stack flex flex-wrap items-center justify-between gap-tight">
              <div className="relative min-w-0 flex-1">
                <Search size={14} className="pointer-events-none absolute left-2.5 top-1/2 -translate-y-1/2 text-slate" aria-hidden="true" />
                <input
                  value={query}
                  onChange={e => setQuery(e.target.value)}
                  placeholder={T("searchPlaceholder")}
                  className="w-full rounded-control border border-line bg-mist/40 py-1.5 pl-8 pr-3 text-sm text-ink placeholder:text-slate focus:border-accent focus:outline-none"
                />
              </div>
              <select
                value={sort}
                onChange={e => setSort(e.target.value as SortKey)}
                className="shrink-0 rounded-control border border-line bg-mist/40 px-2 py-1.5 text-xs text-ink focus:border-accent focus:outline-none"
              >
                <option value="progress-asc">{T("sortAtRiskFirst")}</option>
                <option value="progress-desc">{T("sortProgressDesc")}</option>
                <option value="recent">{T("sortRecent")}</option>
                <option value="name">{T("sortName")}</option>
              </select>
              <span className="shrink-0 text-xs text-slate">
                {T("avgProgress")} <span className="font-medium text-ink">{avgProgress}%</span>
              </span>
            </div>

            {atRiskCount > 0 ? (
              <div className="mb-stack flex items-center gap-1.5 rounded-control border border-ember/30 bg-ember/10 px-stack py-1.5 text-xs text-ember">
                <TriangleAlert size={13} aria-hidden="true" />
                {T("atRiskWarning").replace("{count}", String(atRiskCount))}
              </div>
            ) : null}

            {enrollments.length === 0 ? (
              <p className="rounded-control border border-dashed border-line px-stack py-block text-center text-sm text-slate">{T("empty")}</p>
            ) : filtered.length === 0 ? (
              <p className="rounded-control border border-dashed border-line px-stack py-block text-center text-sm text-slate">{T("noMatches")}</p>
            ) : (
              <div className="flex flex-col gap-1.5">
                {filtered.map(enrollment => {
                  const profile = (enrollment as any).profiles as
                    | { full_name?: string | null; email?: string | null; avatar_url?: string | null }
                    | null;
                  const name = profile?.full_name || profile?.email || T("unknownStudent");
                  const progress = Math.round(enrollment.progress ?? 0);
                  const atRisk = isAtRisk(enrollment);
                  const expanded = expandedId === enrollment.id;
                  return (
                    <div key={enrollment.id} className="rounded-control border border-line">
                      <button
                        type="button"
                        onClick={() => setExpandedId(expanded ? null : enrollment.id)}
                        className="flex w-full items-center gap-tight px-stack py-tight text-left"
                      >
                        <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-pill bg-accent/15 text-xs font-medium text-accent">
                          {initials(name)}
                        </span>
                        <div className="min-w-0 flex-1">
                          <p className="flex items-center gap-1.5 truncate text-sm font-medium text-ink">
                            {name}
                            {atRisk ? <TriangleAlert size={12} className="shrink-0 text-ember" aria-hidden="true" /> : null}
                          </p>
                          <p className="truncate text-xs text-slate">{T("enrolledOn")} {formatDate(enrollment.enrolled_at)}</p>
                        </div>
                        <div className="flex w-28 shrink-0 flex-col items-end gap-1">
                          <span className="text-xs font-medium text-ink">{progress}%</span>
                          <div className="h-1.5 w-full overflow-hidden rounded-pill bg-line">
                            <div className="gradient-brand h-full rounded-pill" style={{ width: `${Math.min(progress, 100)}%` }} />
                          </div>
                        </div>
                        <ChevronDown
                          size={14}
                          className={`shrink-0 text-slate transition-transform duration-base ${expanded ? "rotate-180" : ""}`}
                          aria-hidden="true"
                        />
                      </button>
                      {expanded ? (
                        <div className="border-t border-line px-stack">
                          <p className="pt-2 text-[10px] font-semibold uppercase tracking-widest text-slate">
                            {T("quizResultsHeading")}
                          </p>
                          <StudentQuizResults studentId={enrollment.student_id} courseId={course.id} />
                        </div>
                      ) : null}
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
