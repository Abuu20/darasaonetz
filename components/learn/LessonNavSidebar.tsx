import { CircleCheck, PlayCircle } from "lucide-react";
import { useLanguage } from "@/context/LanguageContext";
import LessonProgressRing from "@/components/learn/LessonProgressRing";
import LessonTypeBadges from "@/components/learn/LessonTypeBadges";
import type { Course, Lesson } from "@/lib/db/types";

interface LessonNavSidebarProps {
  course: Course;
  lessons: Lesson[];
  activeLesson: Lesson | null;
  completedIds: string[];
  progressPct: number;
  onSelect: (lessonId: string) => void;
  onClose?: () => void;
  /** Optional — lesson ids that have a quiz. Enables the Quiz badge. */
  quizLessonIds?: Set<string>;
}

/**
 * Sidebar used by the LearnLayout (immersive /learn/:id) and the dashboard
 * Learn tab. Shows course progress at the top and the lesson list below.
 * Each row carries type badges (Video / Reading / Quiz / N resources) so a
 * student knows what to expect before clicking.
 */
export default function LessonNavSidebar({
  course,
  lessons,
  activeLesson,
  completedIds,
  progressPct,
  onSelect,
  onClose,
  quizLessonIds,
}: LessonNavSidebarProps) {
  const { t } = useLanguage();
  const completedCount = completedIds.length;

  return (
    <aside className="flex h-full w-full flex-col bg-background">
      {/* Header block */}
      <div className="border-b border-line px-4 py-4">
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0 flex-1">
            <p className="text-[10px] uppercase tracking-[0.18em] text-slate">
              {t("pages.Learn.curriculum")}
            </p>
            <h2 className="mt-0.5 truncate font-heading text-sm leading-snug text-ink">
              {course.title}
            </h2>
          </div>
          <LessonProgressRing progress={progressPct} size={44} strokeWidth={3} />
        </div>

        <div className="mt-3 flex items-center justify-between text-xs text-slate">
          <span>
            {completedCount} / {lessons.length}{" "}
            {t("pages.Learn.lesson").toLowerCase()}
          </span>
          <span className="font-medium text-ink">{progressPct}%</span>
        </div>

        <div className="mt-2 h-1.5 w-full overflow-hidden rounded-pill bg-line">
          <div
            className="gradient-brand h-full rounded-pill transition-all duration-slow"
            style={{ width: `${Math.min(100, progressPct)}%` }}
          />
        </div>
      </div>

      {/* Lessons */}
      <nav className="lesson-sidebar-scroll flex-1 overflow-y-auto p-2">
        <ol className="flex flex-col gap-1">
          {lessons.map((lesson, index) => {
            const active = lesson.id === activeLesson?.id;
            const done = completedIds.includes(lesson.id);
            const hasQuiz = quizLessonIds?.has(lesson.id) ?? false;
            return (
              <li key={lesson.id}>
                <button
                  type="button"
                  onClick={() => {
                    onSelect(lesson.id);
                    onClose?.();
                  }}
                  aria-current={active ? "true" : undefined}
                  className={`group flex w-full items-start gap-3 rounded-control px-3 py-2.5 text-left transition-colors duration-base ${
                    active
                      ? "bg-accent/10 text-ink"
                      : "text-slate hover:bg-mist hover:text-ink"
                  }`}
                >
                  <span
                    className={`mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-pill text-[10px] font-medium ${
                      done
                        ? "bg-success/15 text-success"
                        : active
                          ? "gradient-brand text-white"
                          : "bg-mist text-slate group-hover:text-ink"
                    }`}
                  >
                    {done ? (
                      <CircleCheck size={14} aria-hidden="true" />
                    ) : active ? (
                      <PlayCircle size={14} aria-hidden="true" />
                    ) : (
                      index + 1
                    )}
                  </span>

                  <span className="min-w-0 flex-1">
                    <span className="block text-[10px] uppercase tracking-[0.16em] text-slate">
                      {t("pages.Learn.lesson")} {index + 1}
                    </span>
                    <span className="block truncate text-sm leading-snug">
                      {lesson.title}
                    </span>
                    <span className="mt-1 flex flex-wrap items-center gap-1">
                      <LessonTypeBadges
                        lesson={lesson}
                        hasQuiz={hasQuiz}
                        size="sm"
                      />
                    </span>
                  </span>

                  {lesson.duration_minutes ? (
                    <span className="mt-0.5 shrink-0 text-[10px] text-slate">
                      {lesson.duration_minutes}m
                    </span>
                  ) : null}
                </button>
              </li>
            );
          })}
        </ol>
      </nav>
    </aside>
  );
}
