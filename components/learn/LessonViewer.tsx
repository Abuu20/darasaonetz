import { useEffect, useMemo, useRef, useState } from "react";
import {
  ChevronLeft,
  ChevronRight,
  CircleCheck,
  FileText,
  MessageSquare,
  NotebookPen,
  PlayCircle,
  Zap,
} from "lucide-react";
import LessonVideo from "@/components/lesson/LessonVideo";
import LessonContentCard from "@/components/lesson/LessonContentCard";
import LessonResourceList from "@/components/lesson/LessonResourceList";
import QuizPlayer from "@/components/quiz/QuizPlayer";
import LessonNavSidebar from "@/components/learn/LessonNavSidebar";
import LessonProgressRing from "@/components/learn/LessonProgressRing";
import LessonNextUp from "@/components/learn/LessonNextUp";
import LessonNotesTab from "@/components/learn/LessonNotesTab";
import LessonDiscussionTab from "@/components/learn/LessonDiscussionTab";
import LessonTypeBadges from "@/components/learn/LessonTypeBadges";
import AskTeacherButton from "@/components/learn/AskTeacherButton";
import OfflineDownloadButton from "@/components/learn/OfflineDownloadButton";
import ResumePrompt from "@/components/learn/ResumePrompt";
import { useLessonScrollProgress } from "@/lib/hooks/useLessonScrollProgress";
import { useLessonViewer } from "@/lib/hooks/useLessonViewer";
import { useLanguage } from "@/context/LanguageContext";

type ViewerVariant = "dashboard" | "embedded";
type TabId = "lesson" | "quiz" | "notes" | "discussion" | "resources";

interface LessonViewerProps {
  courseId: string;
  /**
   * "dashboard" — mounted directly inside the DashUI shell with its own
   *               curriculum sidebar. Used by StudentLearnPanel.
   * "embedded"  — mounted inside LearnLayout. Renders only the tabs +
   *               content; the wrapper supplies the sub-header + curriculum.
   */
  variant: ViewerVariant;
  initialLessonId?: string | null;
  onExit?: () => void;
}

export default function LessonViewer({
  courseId,
  variant,
  initialLessonId = null,
  onExit,
}: LessonViewerProps) {
  const { t } = useLanguage();
  const {
    course,
    lessons,
    activeLesson,
    activeIndex,
    completedIds,
    activeQuiz,
    progressPct,
    loading,
    enrolled,
    isOwner,
    completing,
    goTo,
    markComplete,
  } = useLessonViewer(courseId, initialLessonId);

  const [activeTab, setActiveTab] = useState<TabId>("lesson");
  const contentRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    setActiveTab("lesson");
  }, [activeLesson?.id]);

  // Reading progress: tracked against the lesson-body element so the video
  // doesn't count toward "read %".
  const {
    pct: readingPct,
    savedPct,
    resumed,
    jumpToSaved,
    dismissResume,
  } = useLessonScrollProgress(activeLesson?.id ?? "", contentRef.current);

  const attachments = activeLesson?.attachments ?? null;

  const tabs = useMemo(() => {
    const list: { id: TabId; label: string; Icon?: typeof PlayCircle; badge?: number }[] = [
      { id: "lesson", label: t("pages.Learn.lesson") },
    ];
    if (activeQuiz) list.push({ id: "quiz", label: "Quiz", Icon: Zap });
    list.push({ id: "notes", label: "Notes", Icon: NotebookPen });
    list.push({ id: "discussion", label: "Discussion", Icon: MessageSquare });
    if (attachments && attachments.length > 0) {
      list.push({
        id: "resources",
        label: t("pages.Learn.resources"),
        Icon: FileText,
        badge: attachments.length,
      });
    }
    return list;
  }, [activeQuiz, attachments, t]);

  if (loading || enrolled === null) {
    return (
      <div className="flex min-h-[40vh] items-center justify-center">
        <div className="h-10 w-10 animate-spin rounded-pill border-4 border-line border-t-accent" />
      </div>
    );
  }

  if (!course || !activeLesson) {
    return (
      <div className="flex min-h-[40vh] flex-col items-center justify-center gap-3 px-gutter text-center text-sm text-slate">
        <PlayCircle size={32} />
        <p>{t("pages.Learn.noLessons")}</p>
      </div>
    );
  }

  const isDone = completedIds.includes(activeLesson.id);
  const nextLesson = activeIndex < lessons.length - 1 ? lessons[activeIndex + 1] : null;
  const teacherId = course.teacher_id;

  const handleNext = async () => {
    if (!nextLesson) return;
    if (!isDone && !completing && (enrolled || isOwner)) {
      try {
        await markComplete();
      } catch {
        /* non-fatal */
      }
    }
    goTo(nextLesson.id);
  };

  const tabBar = (
    <div className="relative border-b border-line">
      {/* Reading progress bar — sits flush with the tab row's bottom border
          so it reads as the same chrome. Only visible once the student
          has started reading (pct > 0). */}
      {readingPct > 0 ? (
        <div
          aria-hidden="true"
          className="pointer-events-none absolute inset-x-0 bottom-0 z-10 h-0.5"
        >
          <div
            className="h-full rounded-r-full bg-accent transition-all duration-500"
            style={{ width: `${readingPct}%` }}
          />
        </div>
      ) : null}
      <nav role="tablist" className="lesson-tabs flex gap-1 overflow-x-auto">
        {tabs.map(tab => {
          const active = tab.id === activeTab;
          const Icon = tab.Icon;
          return (
            <button
              key={tab.id}
              type="button"
              role="tab"
              aria-selected={active}
              onClick={() => setActiveTab(tab.id)}
              className={`relative flex shrink-0 items-center gap-2 px-4 py-3 text-sm transition-colors duration-base ${
                active ? "font-medium text-accent" : "text-slate hover:text-ink"
              }`}
            >
              {Icon ? <Icon size={14} aria-hidden="true" /> : null}
              <span>{tab.label}</span>
              {tab.badge ? (
                <span className="rounded-pill bg-accent/10 px-2 py-0.5 text-[10px] font-medium text-accent">
                  {tab.badge}
                </span>
              ) : null}
              {active ? (
                <span
                  className="absolute inset-x-0 bottom-0 h-0.5 rounded-t-full bg-accent"
                  aria-hidden="true"
                />
              ) : null}
            </button>
          );
        })}
      </nav>
    </div>
  );

  const lessonTab = (
    <div className="flex flex-col gap-block">
      {resumed ? (
        <ResumePrompt
          savedPct={savedPct}
          onJump={jumpToSaved}
          onDismiss={dismissResume}
        />
      ) : null}

      <LessonVideo url={activeLesson.video_url} emptyLabel={t("pages.Learn.noVideo")} />

      <div ref={contentRef}>
        <LessonContentCard
          title={activeLesson.title}
          lessonLabel={`${t("pages.Learn.lesson")} ${activeIndex + 1} / ${lessons.length}`}
          content={activeLesson.content}
        />
      </div>

      <div className="lesson-action-bar flex flex-wrap items-center justify-between gap-3 border-t border-line pt-block">
        <button
          type="button"
          onClick={() => activeIndex > 0 && goTo(lessons[activeIndex - 1].id)}
          disabled={activeIndex <= 0}
          className="flex items-center gap-1.5 rounded-control border border-line px-4 py-2 text-sm text-slate transition-colors duration-base hover:border-accent hover:text-ink disabled:pointer-events-none disabled:opacity-30"
        >
          <ChevronLeft size={16} aria-hidden="true" />
          <span className="hidden sm:inline">{t("pages.Learn.previous")}</span>
        </button>

        {isDone ? (
          <span className="flex items-center gap-1.5 text-sm text-success">
            <CircleCheck size={16} aria-hidden="true" />
            {t("pages.Learn.completed")}
          </span>
        ) : isOwner && !enrolled ? (
          <span className="text-xs uppercase tracking-[0.16em] text-slate">
            {t("pages.Learn.ownerPreview")}
          </span>
        ) : (
          <button
            type="button"
            onClick={markComplete}
            disabled={completing}
            className="rounded-control border border-line px-6 py-2 text-sm font-medium text-ink transition-colors duration-base hover:border-accent hover:text-accent disabled:opacity-60"
          >
            {t("pages.Learn.markComplete")}
          </button>
        )}

        <button
          type="button"
          onClick={handleNext}
          disabled={!nextLesson}
          className="gradient-brand flex items-center gap-1.5 rounded-control px-6 py-2 text-sm font-medium text-primary-foreground transition-all duration-base hover:scale-hover active:scale-active disabled:pointer-events-none disabled:opacity-30"
        >
          <span className="hidden sm:inline">{t("pages.Learn.next")}</span>
          <ChevronRight size={16} aria-hidden="true" />
        </button>
      </div>

      {nextLesson ? (
        <LessonNextUp nextLesson={nextLesson} onSelect={() => goTo(nextLesson.id)} />
      ) : (
        <div className="mt-block rounded-card border border-success/40 bg-success/5 p-block text-center">
          <p className="font-heading text-base text-ink">
            🎉 You've finished the last lesson.
          </p>
          <p className="mt-1 text-sm text-slate">
            Head back to the course page to leave a review, or start another course.
          </p>
        </div>
      )}
    </div>
  );

  const quizTab = activeQuiz ? <QuizPlayer quiz={activeQuiz} /> : null;

  const notesTab = (
    <LessonNotesTab lessonId={activeLesson.id} lessonTitle={activeLesson.title} />
  );

  const discussionTab = (
    <LessonDiscussionTab courseId={course.id} lessonId={activeLesson.id} />
  );

  const resourcesTab =
    attachments && attachments.length > 0 ? (
      <div className="lesson-card px-block py-block">
        <h2 className="mb-block font-heading text-lg text-ink">
          {t("pages.Learn.resources")}
        </h2>
        <LessonResourceList attachments={attachments} label="" />
      </div>
    ) : null;

  const body = (
    <div className="flex flex-col">
      {tabBar}
      <div className="pt-block">
        {activeTab === "lesson" ? lessonTab : null}
        {activeTab === "quiz" ? quizTab : null}
        {activeTab === "notes" ? notesTab : null}
        {activeTab === "discussion" ? discussionTab : null}
        {activeTab === "resources" ? resourcesTab : null}
      </div>
    </div>
  );

  // Ask-Teacher button — only shown to enrolled students. Owners previewing
  // their own course shouldn't see it (they are the teacher).
  const askTeacher =
    enrolled && !isOwner ? (
      <AskTeacherButton
        courseId={course.id}
        lessonId={activeLesson.id}
        lessonTitle={activeLesson.title}
        teacherId={teacherId}
      />
    ) : null;

  // ── EMBEDDED ───────────────────────────────────────────────────────────
  if (variant === "embedded") {
    return (
      <>
        <div className="learn-in-dash card-lift overflow-hidden rounded-card border border-line bg-background px-block py-block">
          {body}
        </div>
        {askTeacher}
      </>
    );
  }

  // ── DASHBOARD ──────────────────────────────────────────────────────────
  return (
    <div className="flex flex-col gap-block">
      <div className="card-lift flex flex-wrap items-center gap-3 rounded-card border border-line bg-background px-block py-3">
        {onExit ? (
          <button
            type="button"
            onClick={onExit}
            className="inline-flex items-center gap-1.5 rounded-control border border-line px-3 py-1.5 text-xs text-slate transition-colors duration-base hover:border-accent hover:text-ink"
          >
            <ChevronLeft size={14} aria-hidden="true" />
            My courses
          </button>
        ) : null}

        <div className="min-w-0 flex-1">
          <p className="truncate text-[10px] uppercase tracking-[0.18em] text-slate">
            {course.categories?.name ?? t("pages.Learn.curriculum")}
          </p>
          <h2 className="truncate font-heading text-base text-ink">
            {course.title}
          </h2>
        </div>

        <span className="hidden flex-wrap items-center gap-1 md:flex">
          <LessonTypeBadges lesson={activeLesson} hasQuiz={!!activeQuiz} size="sm" />
        </span>

        {/* Offline download — student-side control, hides on owner preview */}
        {enrolled && !isOwner ? <OfflineDownloadButton lesson={activeLesson} /> : null}

        {lessons.length > 0 ? (
          <span className="hidden shrink-0 items-center gap-2 lg:flex">
            <div className="h-1.5 w-28 overflow-hidden rounded-pill bg-line">
              <div
                className="gradient-brand h-full rounded-pill transition-all duration-base"
                style={{ width: `${Math.min(100, progressPct)}%` }}
              />
            </div>
            <span className="text-xs font-medium text-ink">{progressPct}%</span>
          </span>
        ) : null}

        <LessonProgressRing progress={progressPct} size={32} strokeWidth={2.5} />
      </div>

      <div className="grid grid-cols-1 gap-block lg:grid-cols-[minmax(0,1fr)_minmax(280px,340px)] lg:items-start">
        <div className="min-w-0">{body}</div>

        <aside className="hidden lg:sticky lg:top-24 lg:block">
          <div className="card-lift flex max-h-[calc(100vh-8rem)] flex-col overflow-hidden rounded-card border border-line bg-background">
            <LessonNavSidebar
              course={course}
              lessons={lessons}
              activeLesson={activeLesson}
              completedIds={completedIds}
              progressPct={progressPct}
              onSelect={goTo}
            />
          </div>
        </aside>
      </div>

      {askTeacher}
    </div>
  );
}
