import { useEffect, useMemo, useState } from "react";
import { X, Loader2, Search, ClipboardList, BarChart3, Plus, ChevronRight } from "lucide-react";
import { useLanguage } from "@/context/LanguageContext";
import { lessonQueries } from "@/lib/db/courses";
import { quizQueries } from "@/lib/db/quizzes";
import QuizBuilder from "@/components/quiz/QuizBuilder";
import QuizResultsPanel from "@/components/teacher/QuizResultsPanel";
import type { Course, Lesson, Quiz } from "@/lib/db/types";

type QuizStatusMap = Record<string, { title: string; status: string; questionCount: number }>;

interface CourseRow {
  course: Course;
  lessons: Lesson[];
  statusByLesson: QuizStatusMap;
}

// The single entry point for "where do I manage quizzes?" — everything a
// teacher needs (add a quiz, edit one, see who's taken it) lives here in
// one flat list instead of requiring them to open a course, then expand a
// specific lesson, before any quiz controls appear (see LessonManagerPanel,
// which still offers that inline path for teachers already mid-edit on a
// lesson — this panel is the fast, dashboard-level way in).
export default function QuizzesPanel({
  courses,
  studentCounts,
  onClose,
}: {
  courses: Course[];
  studentCounts: Record<string, number>;
  onClose: () => void;
}) {
  const { t } = useLanguage();
  const T = (key: string) => t(`components.teacher.QuizzesPanel.${key}`);

  const [loading, setLoading] = useState(true);
  const [rows, setRows] = useState<CourseRow[]>([]);
  const [query, setQuery] = useState("");
  const [filter, setFilter] = useState<"all" | "noQuiz" | "draft" | "published">("all");

  const [builderLesson, setBuilderLesson] = useState<{ lesson: Lesson; courseId: string } | null>(null);
  const [resultsFor, setResultsFor] = useState<{ lesson: Lesson; courseId: string } | null>(null);
  const [resultsQuiz, setResultsQuiz] = useState<Quiz | null>(null);
  const [resultsLoading, setResultsLoading] = useState(false);

  const loadAll = () => {
    setLoading(true);
    Promise.all(
      courses.map(async course => {
        const [lessons, statusByLesson] = await Promise.all([
          lessonQueries.getByCourse(course.id).catch(() => []),
          quizQueries.getStatusByCourse(course.id).catch(() => ({} as QuizStatusMap)),
        ]);
        return { course, lessons, statusByLesson };
      })
    )
      .then(setRows)
      .catch(() => setRows([]))
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    loadAll();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [courses]);

  useEffect(() => {
    if (!resultsFor) return;
    setResultsLoading(true);
    quizQueries
      .getByLessonId(resultsFor.lesson.id)
      .then(setResultsQuiz)
      .catch(() => setResultsQuiz(null))
      .finally(() => setResultsLoading(false));
  }, [resultsFor]);

  const summary = useMemo(() => {
    let published = 0;
    let draft = 0;
    let none = 0;
    for (const row of rows) {
      for (const lesson of row.lessons) {
        const status = row.statusByLesson[lesson.id];
        if (!status) none += 1;
        else if (status.status === "published") published += 1;
        else draft += 1;
      }
    }
    return { published, draft, none };
  }, [rows]);

  const visibleRows = useMemo(() => {
    const q = query.trim().toLowerCase();
    return rows
      .map(row => {
        const lessons = row.lessons.filter(lesson => {
          const status = row.statusByLesson[lesson.id];
          if (filter === "noQuiz" && status) return false;
          if (filter === "draft" && status?.status !== "draft") return false;
          if (filter === "published" && status?.status !== "published") return false;
          if (!q) return true;
          return lesson.title.toLowerCase().includes(q) || row.course.title.toLowerCase().includes(q);
        });
        return { ...row, lessons };
      })
      .filter(row => row.lessons.length > 0);
  }, [rows, query, filter]);

  const refreshCourseStatus = (courseId: string) => {
    quizQueries
      .getStatusByCourse(courseId)
      .then(statusByLesson => {
        setRows(prev => prev.map(row => (row.course.id === courseId ? { ...row, statusByLesson } : row)));
      })
      .catch(() => {});
  };

  return (
    <div className="flex flex-col">
      <div className="card-lift flex w-full flex-col overflow-hidden rounded-card border border-line bg-background">
        <div className="flex shrink-0 items-center justify-between border-b border-line px-stack py-tight">
          <div className="min-w-0">
            <p className="flex items-center gap-1.5 truncate text-sm font-medium text-ink">
              <ClipboardList size={15} className="text-accent" aria-hidden="true" />
              {T("heading")}
            </p>
            <p className="truncate text-xs text-slate">{T("subheading")}</p>
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
          <>
            <div className="flex shrink-0 flex-col gap-stack border-b border-line px-stack py-stack">
              <div className="flex flex-wrap items-center gap-1.5 text-xs">
                {[
                  { key: "all" as const, label: T("filterAll"), count: summary.published + summary.draft + summary.none },
                  { key: "published" as const, label: T("filterPublished"), count: summary.published },
                  { key: "draft" as const, label: T("filterDraft"), count: summary.draft },
                  { key: "noQuiz" as const, label: T("filterNoQuiz"), count: summary.none },
                ].map(f => (
                  <button
                    key={f.key}
                    type="button"
                    onClick={() => setFilter(f.key)}
                    className={`rounded-pill px-stack py-1 transition-colors duration-base ${
                      filter === f.key ? "bg-accent/15 text-accent" : "border border-line text-slate hover:border-accent hover:text-ink"
                    }`}
                  >
                    {f.label} <span className="opacity-70">{f.count}</span>
                  </button>
                ))}
              </div>
              <div className="relative">
                <Search size={14} className="pointer-events-none absolute left-2.5 top-1/2 -translate-y-1/2 text-slate" aria-hidden="true" />
                <input
                  value={query}
                  onChange={e => setQuery(e.target.value)}
                  placeholder={T("searchPlaceholder")}
                  className="w-full rounded-control border border-line bg-mist/40 py-1.5 pl-8 pr-3 text-sm text-ink placeholder:text-slate focus:border-accent focus:outline-none"
                />
              </div>
            </div>

            <div className="flex-1 overflow-y-auto px-stack py-stack">
              {visibleRows.length === 0 ? (
                <p className="rounded-control border border-dashed border-line px-stack py-block text-center text-sm text-slate">{T("empty")}</p>
              ) : (
                <div className="flex flex-col gap-block">
                  {visibleRows.map(row => (
                    <div key={row.course.id}>
                      <p className="mb-1.5 truncate text-xs font-medium uppercase tracking-widest text-slate">{row.course.title}</p>
                      <div className="flex flex-col gap-1.5">
                        {row.lessons.map(lesson => {
                          const status = row.statusByLesson[lesson.id];
                          return (
                            <div
                              key={lesson.id}
                              className="flex flex-wrap items-center gap-tight rounded-control border border-line bg-mist/30 px-stack py-tight"
                            >
                              <div className="min-w-0 flex-1">
                                <p className="truncate text-sm text-ink">{lesson.title}</p>
                                {status ? (
                                  <span
                                    className={`mt-0.5 inline-flex items-center gap-1 rounded-pill px-tight py-0.5 text-[10px] uppercase tracking-widest ${
                                      status.status === "published" ? "bg-success/15 text-success" : "bg-accent/15 text-accent"
                                    }`}
                                  >
                                    {status.questionCount} {T("questions")}
                                    {status.status === "published" ? "" : ` · ${T("draftBadge")}`}
                                  </span>
                                ) : (
                                  <span className="mt-0.5 inline-block text-[10px] uppercase tracking-widest text-slate">{T("noQuizBadge")}</span>
                                )}
                              </div>

                              <button
                                type="button"
                                onClick={() => setBuilderLesson({ lesson, courseId: row.course.id })}
                                className="flex shrink-0 items-center gap-1 rounded-control border border-line px-stack py-1.5 text-xs text-ink transition-colors duration-base hover:border-accent hover:text-accent"
                              >
                                {status ? (
                                  T("editQuiz")
                                ) : (
                                  <>
                                    <Plus size={13} aria-hidden="true" />
                                    {T("addQuiz")}
                                  </>
                                )}
                              </button>

                              {status ? (
                                <button
                                  type="button"
                                  onClick={() => setResultsFor({ lesson, courseId: row.course.id })}
                                  className="flex shrink-0 items-center gap-1 rounded-control bg-accent/10 px-stack py-1.5 text-xs text-accent transition-colors duration-base hover:bg-accent/20"
                                >
                                  <BarChart3 size={13} aria-hidden="true" />
                                  {T("results")}
                                  <ChevronRight size={12} aria-hidden="true" />
                                </button>
                              ) : null}
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </>
        )}
      </div>

      {builderLesson ? (
        <QuizBuilder
          lesson={builderLesson.lesson}
          onClose={() => setBuilderLesson(null)}
          onSaved={() => {
            refreshCourseStatus(builderLesson.courseId);
            setBuilderLesson(null);
          }}
          onDeleted={() => {
            refreshCourseStatus(builderLesson.courseId);
            setBuilderLesson(null);
          }}
        />
      ) : null}

      {resultsFor ? (
        resultsLoading ? (
          <div className="fixed inset-0 z-[60] flex items-center justify-center bg-night/80">
            <Loader2 size={22} className="animate-spin text-accent" aria-hidden="true" />
          </div>
        ) : resultsQuiz ? (
          <QuizResultsPanel
            quiz={resultsQuiz}
            lessonTitle={resultsFor.lesson.title}
            enrolledCount={studentCounts[resultsFor.courseId]}
            onClose={() => {
              setResultsFor(null);
              setResultsQuiz(null);
            }}
          />
        ) : null
      ) : null}
    </div>
  );
}
