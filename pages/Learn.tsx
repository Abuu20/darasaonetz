import { useEffect, useMemo, useState } from "react";
import { Link, Navigate, useParams, useSearchParams } from "react-router-dom";
import LessonContentCard from "@/components/lesson/LessonContentCard";
import LessonVideo from "@/components/lesson/LessonVideo";
import QuizArena from "@/components/quiz/QuizArena";
import {
  ChevronLeft,
  ChevronRight,
  CircleCheck,
  List,
  Lock,
  PlayCircle,
  X,
  Zap,
  ArrowRight,
} from "lucide-react";
import SEOHead from "@/components/seo/SEOHead";
import { courseQueries, enrollmentQueries, lessonQueries } from "@/lib/db/courses";
import { quizQueries } from "@/lib/db/quizzes";
import { useStreak } from "@/lib/hooks/useStreak";
import type { Course, Lesson, Quiz } from "@/lib/db/types";
import { useAuth } from "@/context/AuthContext";
import { useLanguage } from "@/context/LanguageContext";

// The distraction-free "player" experience: sidebar curriculum + one lesson
// at a time in the main pane, mirroring how Udemy/Coursera separate
// "browsing a course" (CourseDetail) from "studying a course" (this page).
export default function Learn() {
  const { id } = useParams<{ id: string }>();
  const [searchParams] = useSearchParams();
  const { t } = useLanguage();
  const { user, isLoading: authLoading } = useAuth();
  const { logActivity } = useStreak();

  const [course, setCourse] = useState<Course | null>(null);
  const [lessons, setLessons] = useState<Lesson[]>([]);
  const [completedIds, setCompletedIds] = useState<string[]>([]);
  const [enrolled, setEnrolled] = useState<boolean | null>(null); // null = still checking
  const [loading, setLoading] = useState(true);
  const [activeId, setActiveId] = useState<string | null>(null);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [completing, setCompleting] = useState(false);
  const [activeQuiz, setActiveQuiz] = useState<Quiz | null>(null);
  const [arenaOpen, setArenaOpen] = useState(false);

  useEffect(() => {
    if (!id) return;
    setLoading(true);
    courseQueries
      .getById(id)
      .then(record => {
        setCourse(record);
        const rawLessons = (record && Array.isArray(record.lessons) ? record.lessons : []) as Lesson[];
        setLessons([...rawLessons].sort((a, b) => a.order_index - b.order_index));
      })
      .catch(() => setCourse(null))
      .finally(() => setLoading(false));
  }, [id]);

  useEffect(() => {
    if (!user || !id) {
      setEnrolled(user ? false : null);
      return;
    }
    enrollmentQueries
      .isEnrolled(user.id, id)
      .then(setEnrolled)
      .catch(() => setEnrolled(false));
  }, [user, id]);

  useEffect(() => {
    if (!user) {
      setCompletedIds([]);
      return;
    }
    setCompletedIds(
      lessons.filter(l => l.lesson_completions?.some(c => c.student_id === user.id)).map(l => l.id)
    );
  }, [lessons, user]);

  // Pick a starting lesson once data is in: a deep-linked ?lesson= id first,
  // otherwise the first lesson the student hasn't finished yet — a "resume
  // where you left off" default without needing a separate progress cursor.
  useEffect(() => {
    if (activeId || lessons.length === 0) return;
    const requested = searchParams.get("lesson");
    if (requested && lessons.some(l => l.id === requested)) {
      setActiveId(requested);
      return;
    }
    const firstIncomplete = lessons.find(l => !completedIds.includes(l.id));
    setActiveId((firstIncomplete ?? lessons[0]).id);
  }, [lessons, completedIds, activeId, searchParams]);

  // A lesson quiz is optional and lightweight enough to just fetch on the
  // fly whenever the active lesson changes, rather than eagerly loading a
  // quiz for every lesson in the curriculum up front.
  useEffect(() => {
    setArenaOpen(false);
    if (!activeId) {
      setActiveQuiz(null);
      return;
    }
    let cancelled = false;
    quizQueries
      .getByLessonId(activeId)
      .then(quiz => !cancelled && setActiveQuiz(quiz))
      .catch(() => !cancelled && setActiveQuiz(null));
    return () => {
      cancelled = true;
    };
  }, [activeId]);

  const activeLesson = useMemo(() => lessons.find(l => l.id === activeId) ?? null, [lessons, activeId]);
  const activeIndex = useMemo(() => lessons.findIndex(l => l.id === activeId), [lessons, activeId]);
  const progressPct = lessons.length > 0 ? Math.round((completedIds.length / lessons.length) * 100) : 0;

  const goTo = (lessonId: string) => {
    setActiveId(lessonId);
    setSidebarOpen(false);
  };

  const handleMarkComplete = async () => {
    if (!user || !course || !activeLesson) return;
    setCompleting(true);
    try {
      await lessonQueries.markComplete(activeLesson.id, user.id, course.id);
      setCompletedIds(prev => (prev.includes(activeLesson.id) ? prev : [...prev, activeLesson.id]));
      logActivity();
    } catch (err) {
      console.error("[Lesson completion] error:", err);
    } finally {
      setCompleting(false);
    }
  };

  if (authLoading || loading || enrolled === null) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-night">
        <div className="h-10 w-10 animate-spin rounded-pill border-4 border-hairline border-t-accent" />
      </main>
    );
  }

  // Not signed in, course missing, or not enrolled: send back to the course
  // landing page rather than showing a dead end here.
  if (!user) return <Navigate to={`/courses/${id}`} replace />;
  if (!course) return <Navigate to="/courses" replace />;
  const isOwner = course.teacher_id === user.id;
  if (!enrolled && !isOwner) return <Navigate to={`/courses/${course.id}`} replace />;

  return (
    <>
      <SEOHead titleKey={`${t("pages.Learn.seoPrefix")} · ${course.title}`} descriptionKey={course.description ?? ""} />
      <main className="flex h-screen flex-col overflow-hidden bg-night text-night-foreground">
        <header className="flex shrink-0 items-center gap-tight border-b border-hairline px-gutter py-tight">
          <Link
            to={`/courses/${course.id}`}
            aria-label={t("pages.Learn.exit")}
            className="flex items-center gap-1 rounded-control p-2 text-lavender transition-colors duration-base hover:text-night-foreground"
          >
            <ChevronLeft size={18} aria-hidden="true" />
          </Link>
          <div className="min-w-0 flex-1">
            <p className="truncate text-sm font-medium text-night-foreground">{course.title}</p>
            {lessons.length > 0 ? (
              <div className="mt-1 flex items-center gap-tight">
                <div className="h-1.5 w-32 overflow-hidden rounded-pill bg-hairline">
                  <div className="gradient-brand h-full rounded-pill transition-all duration-base" style={{ width: `${progressPct}%` }} />
                </div>
                <span className="text-xs text-lavender">{progressPct}%</span>
              </div>
            ) : null}
          </div>
          <button
            type="button"
            onClick={() => setSidebarOpen(v => !v)}
            className="flex shrink-0 items-center gap-1 rounded-control border border-hairline px-stack py-tight text-xs text-lavender lg:hidden"
          >
            <List size={14} aria-hidden="true" />
            {t("pages.Learn.curriculum")}
          </button>
        </header>

        <div className="relative flex flex-1 overflow-hidden">
          <aside
            className={`absolute inset-y-0 left-0 z-30 w-80 max-w-[85vw] overflow-y-auto border-r border-hairline bg-panel transition-transform duration-base lg:static lg:z-auto lg:translate-x-0 ${
              sidebarOpen ? "translate-x-0" : "-translate-x-full"
            }`}
          >
            <div className="flex items-center justify-between px-stack py-tight lg:hidden">
              <span className="text-xs uppercase tracking-widest text-lavender">{t("pages.Learn.curriculum")}</span>
              <button type="button" onClick={() => setSidebarOpen(false)} aria-label={t("pages.Learn.closeSidebar")}>
                <X size={16} className="text-lavender" aria-hidden="true" />
              </button>
            </div>
            {lessons.length === 0 ? (
              <p className="px-stack py-block text-sm text-lavender">{t("pages.Learn.noLessons")}</p>
            ) : (
              <ol className="flex flex-col gap-1 p-stack">
                {lessons.map((lesson, i) => {
                  const isActive = lesson.id === activeId;
                  const isDone = completedIds.includes(lesson.id);
                  return (
                    <li key={lesson.id}>
                      <button
                        type="button"
                        onClick={() => goTo(lesson.id)}
                        aria-current={isActive ? "true" : undefined}
                        className={`flex w-full items-start gap-tight rounded-control px-stack py-tight text-left text-sm transition-colors duration-base ${
                          isActive ? "bg-accent/15 text-night-foreground" : "text-lilac hover:bg-hairline/40"
                        }`}
                      >
                        {isDone ? (
                          <CircleCheck size={16} className="mt-0.5 shrink-0 text-success" aria-hidden="true" />
                        ) : (
                          <PlayCircle
                            size={16}
                            className={`mt-0.5 shrink-0 ${isActive ? "text-accent" : "text-lavender"}`}
                            aria-hidden="true"
                          />
                        )}
                        <span>
                          <span className="block text-xs text-lavender">
                            {t("pages.Learn.lesson")} {i + 1}
                          </span>
                          {lesson.title}
                        </span>
                      </button>
                    </li>
                  );
                })}
              </ol>
            )}
          </aside>

          {sidebarOpen ? (
            <button
              type="button"
              aria-label={t("pages.Learn.closeSidebar")}
              onClick={() => setSidebarOpen(false)}
              className="absolute inset-0 z-20 bg-night/70 lg:hidden"
            />
          ) : null}

          <div className="flex flex-1 flex-col overflow-y-auto">
            {activeLesson ? (
              <div className="mx-auto flex w-full max-w-3xl flex-col gap-stack px-gutter py-block">
                <LessonVideo url={activeLesson.video_url} emptyLabel={t("pages.Learn.noVideo")} />

                <LessonContentCard
                  title={activeLesson.title}
                  lessonLabel={`${t("pages.Learn.lesson")} ${activeIndex + 1} / ${lessons.length}`}
                  content={activeLesson.content}
                  attachments={activeLesson.attachments}
                  resourcesLabel={t("pages.Learn.resources")}
                />

                {activeQuiz ? (
                  <button
                    type="button"
                    onClick={() => setArenaOpen(true)}
                    className="group flex items-center gap-stack rounded-card border border-accent/30 bg-gradient-to-r from-primary/15 via-accent/15 to-ember/15 px-block py-stack text-left transition-transform duration-base hover:scale-hover"
                  >
                    <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-control bg-night text-accent">
                      <Zap size={22} aria-hidden="true" />
                    </span>
                    <span className="min-w-0 flex-1">
                      <span className="block font-heading text-base text-night-foreground">
                        {t("pages.Learn.quizCta")}
                      </span>
                      <span className="block text-sm text-lavender">{t("pages.Learn.quizCtaHint")}</span>
                    </span>
                    <ArrowRight
                      size={20}
                      className="shrink-0 text-accent transition-transform duration-base group-hover:translate-x-1"
                      aria-hidden="true"
                    />
                  </button>
                ) : null}

                <div className="flex flex-wrap items-center justify-between gap-stack border-t border-hairline pt-stack">
                  <button
                    type="button"
                    onClick={() => activeIndex > 0 && goTo(lessons[activeIndex - 1].id)}
                    disabled={activeIndex <= 0}
                    className="flex items-center gap-1 rounded-control border border-hairline px-stack py-tight text-sm text-lavender transition-colors duration-base hover:text-night-foreground disabled:opacity-30"
                  >
                    <ChevronLeft size={16} aria-hidden="true" />
                    {t("pages.Learn.previous")}
                  </button>

                  {completedIds.includes(activeLesson.id) ? (
                    <span className="flex items-center gap-1 text-sm text-success">
                      <CircleCheck size={16} aria-hidden="true" />
                      {t("pages.Learn.completed")}
                    </span>
                  ) : isOwner && !enrolled ? (
                    <span className="text-xs uppercase tracking-widest text-lavender">{t("pages.Learn.ownerPreview")}</span>
                  ) : (
                    <button
                      type="button"
                      onClick={handleMarkComplete}
                      disabled={completing}
                      className="gradient-brand rounded-control px-block py-tight text-sm text-primary-foreground transition-all duration-base hover:scale-hover disabled:opacity-60"
                    >
                      {t("pages.Learn.markComplete")}
                    </button>
                  )}

                  <button
                    type="button"
                    onClick={() => activeIndex < lessons.length - 1 && goTo(lessons[activeIndex + 1].id)}
                    disabled={activeIndex >= lessons.length - 1}
                    className="flex items-center gap-1 rounded-control border border-hairline px-stack py-tight text-sm text-lavender transition-colors duration-base hover:text-night-foreground disabled:opacity-30"
                  >
                    {t("pages.Learn.next")}
                    <ChevronRight size={16} aria-hidden="true" />
                  </button>
                </div>
              </div>
            ) : (
              <div className="flex flex-1 flex-col items-center justify-center gap-stack px-gutter text-center text-lavender">
                <Lock size={28} aria-hidden="true" />
                <p className="text-sm">{t("pages.Learn.noLessons")}</p>
              </div>
            )}
          </div>
        </div>
      </main>

      {arenaOpen && activeQuiz && activeLesson ? (
        <QuizArena
          quiz={activeQuiz}
          lessonTitle={activeLesson.title}
          courseTitle={course?.title ?? ""}
          onClose={() => setArenaOpen(false)}
        />
      ) : null}
    </>
  );
}
