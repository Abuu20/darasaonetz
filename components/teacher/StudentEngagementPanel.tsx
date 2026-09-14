import { useEffect, useMemo, useState } from "react";
import { BarChart3, CircleCheck, Clock, Loader2, Users } from "lucide-react";
import { enrollmentQueries, lessonQueries } from "@/lib/db/courses";
import { supabase } from "@/lib/db/client";
import type { Course, Enrollment, Lesson } from "@/lib/db/types";
import Avatar from "@/components/ui/Avatar";

interface StudentProgress {
  studentId: string;
  name: string;
  avatarUrl: string | null;
  /** lessonId → pct 0–100, or null if the student has never opened it. */
  perLesson: Record<string, number | null>;
  completedIds: Set<string>;
}

interface LessonRow {
  lesson: Lesson;
  lessonNumber: number;
  startedCount: number;
  finishedCount: number;
  neverOpenedCount: number;
  avgReadPct: number;
}

/**
 * Reads every enrolled student's lesson-scroll progress (tool_progress
 * rows under tool = `lesson-scroll:<lessonId>`) and produces a matrix of
 * "who has read how far through what". This is the teacher-facing half of
 * the reading-progress feature — without it, students' progress is
 * invisible to the person who most needs to see it.
 *
 * Also cross-references lesson_completions to distinguish "read to end"
 * from "explicitly completed".
 */
export default function StudentEngagementPanel({ courses }: { courses: Course[] }) {
  const [courseId, setCourseId] = useState<string | null>(courses[0]?.id ?? null);
  const [loading, setLoading] = useState(true);
  const [lessons, setLessons] = useState<Lesson[]>([]);
  const [enrollments, setEnrollments] = useState<Enrollment[]>([]);
  const [progressByStudent, setProgressByStudent] = useState<Map<string, Record<string, number>>>(new Map());

  useEffect(() => {
    if (!courseId) return;
    let cancelled = false;
    setLoading(true);

    (async () => {
      const [ls, es] = await Promise.all([
        lessonQueries.getByCourse(courseId).catch(() => [] as Lesson[]),
        enrollmentQueries.getByCourse(courseId).catch(() => [] as Enrollment[]),
      ]);
      if (cancelled) return;
      setLessons(ls);
      setEnrollments(es);

      // Fetch every enrolled student's lesson-scroll rows in one query.
      const studentIds = es.map(e => e.student_id);
      if (studentIds.length > 0) {
        const { data } = await supabase
          .from("tool_progress")
          .select("user_id, tool, data")
          .in("user_id", studentIds)
          .like("tool", "lesson-scroll:%");

        const map = new Map<string, Record<string, number>>();
        for (const row of (data ?? []) as { user_id: string; tool: string; data: { pct?: number } }[]) {
          const lessonId = row.tool.replace("lesson-scroll:", "");
          const pct = Number(row.data?.pct ?? 0);
          const existing = map.get(row.user_id) ?? {};
          existing[lessonId] = pct;
          map.set(row.user_id, existing);
        }
        if (!cancelled) setProgressByStudent(map);
      } else {
        setProgressByStudent(new Map());
      }

      if (!cancelled) setLoading(false);
    })();

    return () => {
      cancelled = true;
    };
  }, [courseId]);

  const progressList = useMemo<StudentProgress[]>(() => {
    return enrollments.map(e => {
      const prof = (e as any).profiles as
        | { id?: string; full_name?: string | null; email?: string | null; avatar_url?: string | null }
        | null;
      const perLesson: Record<string, number | null> = {};
      const completedIds = new Set<string>();
      const record = progressByStudent.get(e.student_id) ?? {};

      for (const lesson of lessons) {
        const pct = record[lesson.id];
        perLesson[lesson.id] = typeof pct === "number" ? pct : null;
        if (pct != null && pct >= 95) completedIds.add(lesson.id);
      }

      return {
        studentId: e.student_id,
        name: prof?.full_name || prof?.email || "Student",
        avatarUrl: prof?.avatar_url ?? null,
        perLesson,
        completedIds,
      };
    });
  }, [enrollments, lessons, progressByStudent]);

  const lessonRows = useMemo<LessonRow[]>(() => {
    return lessons.map((lesson, i) => {
      let started = 0;
      let finished = 0;
      let never = 0;
      let sum = 0;
      let counted = 0;
      for (const sp of progressList) {
        const pct = sp.perLesson[lesson.id];
        if (pct == null) {
          never += 1;
        } else {
          started += 1;
          if (pct >= 95) finished += 1;
          sum += pct;
          counted += 1;
        }
      }
      return {
        lesson,
        lessonNumber: i + 1,
        startedCount: started,
        finishedCount: finished,
        neverOpenedCount: never,
        avgReadPct: counted > 0 ? Math.round(sum / counted) : 0,
      };
    });
  }, [lessons, progressList]);

  if (courses.length === 0) {
    return (
      <div className="card-lift rounded-card border border-line bg-background p-block text-center text-sm text-slate">
        Create a course first — engagement data will appear here.
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-block">
      {/* Course picker + summary */}
      <div className="card-lift flex flex-wrap items-center justify-between gap-stack rounded-card border border-line bg-background px-block py-3">
        <label className="flex min-w-[200px] items-center gap-2 rounded-control border border-line bg-mist/60 px-3 py-1.5 text-sm">
          <span className="text-xs text-slate">Course</span>
          <select
            value={courseId ?? ""}
            onChange={e => setCourseId(e.target.value || null)}
            className="flex-1 bg-transparent text-ink outline-none"
          >
            {courses.map(c => (
              <option key={c.id} value={c.id}>
                {c.title}
              </option>
            ))}
          </select>
        </label>
        <div className="flex items-center gap-stack text-xs text-slate">
          <span className="inline-flex items-center gap-1.5">
            <Users size={13} aria-hidden="true" />
            {enrollments.length} enrolled
          </span>
          <span className="inline-flex items-center gap-1.5">
            <BarChart3 size={13} aria-hidden="true" />
            {lessons.length} lessons
          </span>
        </div>
      </div>

      {loading ? (
        <div className="flex justify-center py-block">
          <Loader2 size={22} className="animate-spin text-accent" aria-hidden="true" />
        </div>
      ) : lessons.length === 0 ? (
        <div className="card-lift rounded-card border border-line bg-background p-block text-center text-sm text-slate">
          This course has no lessons yet.
        </div>
      ) : (
        <>
          {/* Per-lesson summary table */}
          <section className="card-lift overflow-hidden rounded-card border border-line bg-background">
            <div className="border-b border-line px-block py-3">
              <h3 className="font-heading text-sm text-ink">Reading progress by lesson</h3>
              <p className="text-xs text-slate">
                How far through each lesson's reading area enrolled students have reached.
              </p>
            </div>
            <div className="hidden grid-cols-[minmax(0,2fr)_90px_90px_90px_110px] items-center gap-stack border-b border-line px-block py-2 text-[10px] font-semibold uppercase tracking-[0.12em] text-slate lg:grid">
              <span>Lesson</span>
              <span>Opened</span>
              <span>Read 95%+</span>
              <span>Never opened</span>
              <span>Avg read</span>
            </div>
            {lessonRows.map(row => (
              <div
                key={row.lesson.id}
                className="grid grid-cols-1 items-center gap-stack border-b border-line px-block py-stack last:border-b-0 lg:grid-cols-[minmax(0,2fr)_90px_90px_90px_110px]"
              >
                <div className="min-w-0">
                  <p className="truncate text-sm text-ink">
                    {row.lessonNumber}. {row.lesson.title}
                  </p>
                </div>
                <span className="text-xs text-slate">
                  <span className="lg:hidden">Opened: </span>
                  {row.startedCount}
                </span>
                <span className="text-xs text-success">
                  <span className="lg:hidden">Read 95%+: </span>
                  {row.finishedCount}
                </span>
                <span className={`text-xs ${row.neverOpenedCount > 0 ? "text-ember" : "text-slate"}`}>
                  <span className="lg:hidden">Never: </span>
                  {row.neverOpenedCount}
                </span>
                <div className="flex items-center gap-2">
                  <div className="h-1.5 min-w-[60px] flex-1 overflow-hidden rounded-pill bg-line">
                    <div
                      className="gradient-brand h-full rounded-pill"
                      style={{ width: `${row.avgReadPct}%` }}
                    />
                  </div>
                  <span className="w-9 shrink-0 text-right text-xs text-slate">
                    {row.avgReadPct}%
                  </span>
                </div>
              </div>
            ))}
          </section>

          {/* Per-student detail */}
          <section className="card-lift overflow-hidden rounded-card border border-line bg-background">
            <div className="border-b border-line px-block py-3">
              <h3 className="font-heading text-sm text-ink">Per-student breakdown</h3>
              <p className="text-xs text-slate">
                Spot exactly who is stuck. Rows are collapsible.
              </p>
            </div>
            {progressList.length === 0 ? (
              <p className="px-block py-block text-center text-sm text-slate">
                No students enrolled yet.
              </p>
            ) : (
              <div className="flex flex-col">
                {progressList.map(sp => {
                  const readCount = Object.values(sp.perLesson).filter(
                    p => typeof p === "number" && p >= 95
                  ).length;
                  const startedCount = Object.values(sp.perLesson).filter(
                    p => typeof p === "number" && p > 0 && p < 95
                  ).length;
                  const neverCount = Object.values(sp.perLesson).filter(p => p == null).length;
                  return (
                    <div key={sp.studentId} className="border-b border-line last:border-b-0">
                      <div className="flex flex-wrap items-center gap-stack px-block py-stack">
                        <Avatar name={sp.name} src={sp.avatarUrl} size="sm" />
                        <div className="min-w-0 flex-1">
                          <p className="truncate text-sm text-ink">{sp.name}</p>
                          <p className="text-xs text-slate">
                            {readCount} read · {startedCount} in progress · {neverCount} not started
                          </p>
                        </div>
                        <div className="flex shrink-0 gap-1.5">
                          {readCount > 0 ? (
                            <span className="inline-flex items-center gap-1 rounded-pill bg-success/15 px-2 py-0.5 text-[10px] font-medium text-success">
                              <CircleCheck size={10} /> {readCount}
                            </span>
                          ) : null}
                          {startedCount > 0 ? (
                            <span className="inline-flex items-center gap-1 rounded-pill bg-ember/15 px-2 py-0.5 text-[10px] font-medium text-ember">
                              <Clock size={10} /> {startedCount}
                            </span>
                          ) : null}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </section>
        </>
      )}
    </div>
  );
}
