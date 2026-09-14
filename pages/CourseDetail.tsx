import { useEffect, useMemo, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { motion } from "motion/react";
import {
  BookOpen,
  CheckCircle2,
  ChevronLeft,
  CircleCheck,
  Lock,
  PlayCircle,
  Users,
} from "lucide-react";
import SEOHead from "@/components/seo/SEOHead";
import { courseQueries, enrollmentQueries } from "@/lib/db/courses";
import type { Course, Lesson } from "@/lib/db/types";
import { useLanguage } from "@/context/LanguageContext";
import { useAuth } from "@/context/AuthContext";
import AuthModal from "@/components/auth/AuthModal";
import ReviewsSection from "@/components/Courses/ReviewsSection";
import images from "@/assets/images.json";

export default function CourseDetail() {
  const { id } = useParams<{ id: string }>();
  const { t } = useLanguage();
  const { user, session } = useAuth();
  const [course, setCourse] = useState<Course | null>(null);
  const [lessons, setLessons] = useState<Lesson[]>([]);
  const [completedIds, setCompletedIds] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [enrolled, setEnrolled] = useState(false);
  const [enrolling, setEnrolling] = useState(false);
  const [authOpen, setAuthOpen] = useState(false);
  const [showAllLessons, setShowAllLessons] = useState(false);

  const COLLAPSE_AFTER = 6;

  useEffect(() => {
    if (!id) return;
    setLoading(true);
    courseQueries
      .getById(id)
      .then(record => {
        setCourse(record);
        const rawLessons = (record && Array.isArray(record.lessons) ? record.lessons : []) as Lesson[];
        const sorted = [...rawLessons].sort((a, b) => a.order_index - b.order_index);
        setLessons(sorted);
      })
      .catch(() => setCourse(null))
      .finally(() => setLoading(false));
  }, [id]);

  useEffect(() => {
    if (!user || !session || !id) {
      setEnrolled(false);
      return;
    }
    enrollmentQueries
      .isEnrolled(user.id, id)
      .then(setEnrolled)
      .catch(() => setEnrolled(false));
  }, [user, session, id]);

  useEffect(() => {
    if (!user) {
      setCompletedIds([]);
      return;
    }
    const ids = lessons
      .filter(l => l.lesson_completions?.some(c => c.student_id === user.id))
      .map(l => l.id);
    setCompletedIds(ids);
  }, [lessons, user]);

  const visibleLessons = useMemo(
    () => (showAllLessons ? lessons : lessons.slice(0, COLLAPSE_AFTER)),
    [lessons, showAllLessons]
  );

  const handleEnroll = async () => {
    if (!course || !user || !session) {
      setAuthOpen(true);
      return;
    }
    setEnrolling(true);
    try {
      await enrollmentQueries.enroll(user.id, course.id);
      setEnrolled(true);
    } catch (err) {
      console.error("[Course enrollment] error:", err);
    } finally {
      setEnrolling(false);
    }
  };

  if (loading) {
    return (
      <main className="flex min-h-[60vh] items-center justify-center pt-section-spacing-mobile md:pt-section-spacing">
        <div className="h-10 w-10 animate-spin rounded-full border-4 border-line border-t-accent" />
      </main>
    );
  }

  if (!course) {
    return (
      <main className="flex min-h-[60vh] flex-col items-center justify-center gap-stack px-gutter text-center">
        <h1 className="font-heading text-2xl text-ink">
          <span data-text-id="pages.CourseDetail.notFound">{t("pages.CourseDetail.notFound")}</span>
        </h1>
        <Link to="/courses" className="rounded-control bg-ink px-stack py-tight text-sm text-ink-foreground">
          <span data-text-id="pages.CourseDetail.back">{t("pages.CourseDetail.back")}</span>
        </Link>
      </main>
    );
  }

  const heroSrc = course.thumbnail_url || images["courses.hero"];
  const progressPct = lessons.length > 0 ? Math.round((completedIds.length / lessons.length) * 100) : 0;
  // The teacher who owns this course can always open it — publishing a
  // course used to leave the teacher stuck behind the same "Enroll first"
  // gate as any other visitor, so their own freshly-published lessons
  // never appeared reachable.
  const isOwner = !!(user && course.teacher_id === user.id);
  const canAccess = enrolled || isOwner;

  return (
    <>
      <SEOHead titleKey={course.title} descriptionKey={(course.description ?? "").slice(0, 155)} />
      <main className="flex flex-col gap-section-spacing-mobile pb-section-spacing-mobile md:gap-section-spacing md:pb-section-spacing">
        <section className="relative flex min-h-[55vh] items-end overflow-hidden px-gutter pb-block pt-section-spacing-mobile md:px-gutter-lg md:pt-section-spacing">
          <img
            src={heroSrc}
            alt=""
            aria-hidden="true"
            onError={event => {
              event.currentTarget.onerror = null;
              event.currentTarget.src = images["courses.hero"];
            }}
            className="absolute inset-0 h-full w-full object-cover"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-night from-10% via-night/85 via-60% to-night/30" />
          <motion.div
            initial={{ opacity: 0.001, y: 24 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7, ease: [0.22, 1, 0.36, 1] }}
            className="relative mx-auto flex w-full max-w-shell flex-col gap-stack"
          >
            <Link to="/courses" className="inline-flex w-fit items-center gap-1 text-sm text-lavender transition-colors duration-base hover:text-night-foreground">
              <ChevronLeft size={16} aria-hidden="true" />
              <span data-text-id="pages.CourseDetail.back">{t("pages.CourseDetail.back")}</span>
            </Link>
            <span className="text-gradient-head w-fit text-sm uppercase tracking-widest">{course.categories?.name ?? ""}</span>
            <h1 className="max-w-3xl font-heading leading-tight text-night-foreground" style={{ fontSize: "clamp(28px, 4vw, 48px)" }}>
              {course.title}
            </h1>
            <p className="max-w-prose text-lilac">{course.description}</p>
            <div className="flex flex-wrap items-center gap-stack pt-tight text-sm text-lavender">
              <span className="inline-flex items-center gap-1">
                <Users size={16} aria-hidden="true" />
                <span>{course.profiles?.full_name ?? ""}</span>
              </span>
              <span className="inline-flex items-center gap-1">
                <BookOpen size={16} aria-hidden="true" />
                <span>{lessons.length}</span>
                <span data-text-id="pages.CourseDetail.lessonsLabel">{t("pages.CourseDetail.lessonsLabel")}</span>
              </span>
            </div>
            {canAccess ? (
              <div className="flex flex-wrap items-center gap-stack">
                <span className="inline-flex w-fit items-center gap-tight rounded-pill border border-success bg-success/10 px-stack py-tight text-sm text-night-foreground">
                  <CheckCircle2 size={16} aria-hidden="true" />
                  <span data-text-id="pages.CourseDetail.enrolled">
                    {isOwner && !enrolled ? t("pages.CourseDetail.ownerPreview") : t("pages.CourseDetail.enrolled")}
                  </span>
                </span>
                {lessons.length > 0 ? (
                  <div className="flex items-center gap-tight text-xs text-lavender">
                    <div className="h-2 w-32 overflow-hidden rounded-pill bg-hairline">
                      <div className="gradient-brand h-full rounded-pill" style={{ width: `${progressPct}%` }} />
                    </div>
                    <span>{progressPct}%</span>
                  </div>
                ) : null}
                {lessons.length > 0 ? (
                  <Link
                    to={`/learn/${course.id}`}
                    className="gradient-brand inline-flex w-fit items-center gap-tight rounded-control px-block py-tight text-sm text-primary-foreground transition-all duration-base hover:scale-hover active:scale-active"
                  >
                    <PlayCircle size={16} aria-hidden="true" />
                    <span data-text-id="pages.CourseDetail.continueLearning">
                      {progressPct > 0 ? t("pages.CourseDetail.continueLearning") : t("pages.CourseDetail.startLearning")}
                    </span>
                  </Link>
                ) : null}
              </div>
            ) : (              <button
                type="button"
                onClick={handleEnroll}
                disabled={enrolling}
                className="gradient-brand w-fit rounded-control px-block py-tight text-sm text-primary-foreground transition-all duration-base hover:scale-hover active:scale-active"
              >
                <span data-text-id={enrolling ? "pages.CourseDetail.enrolling" : "pages.CourseDetail.enrollCta"}>
                  {enrolling ? t("pages.CourseDetail.enrolling") : t("pages.CourseDetail.enrollCta")}
                </span>
              </button>
            )}
          </motion.div>
        </section>

        <section className="px-gutter md:px-gutter-lg">
          <div className="mx-auto grid max-w-shell grid-cols-1 gap-block lg:grid-cols-3">
            <div className="flex flex-col gap-block lg:col-span-2">
              <div className="flex flex-col gap-stack">
                <h2 className="font-heading text-xl text-ink">
                  <span data-text-id="pages.CourseDetail.lessonsHeading">{t("pages.CourseDetail.lessonsHeading")}</span>
                </h2>

                {lessons.length === 0 ? (
                  <p className="rounded-card bg-mist px-block py-block text-center text-sm text-slate">
                    {t("pages.CourseDetail.noLessons")}
                  </p>
                ) : !canAccess ? (
                  <div className="flex flex-col items-center gap-stack rounded-card bg-mist px-block py-block text-center">
                    <Lock size={28} className="text-slate" aria-hidden="true" />
                    <p data-text-id="pages.CourseDetail.locked" className="text-sm text-slate">
                      {t("pages.CourseDetail.locked")}
                    </p>
                    <button
                      type="button"
                      onClick={handleEnroll}
                      disabled={enrolling}
                      className="gradient-brand rounded-control px-block py-tight text-sm text-primary-foreground transition-all duration-base hover:scale-hover"
                    >
                      <span data-text-id="pages.CourseDetail.enrollCta">{t("pages.CourseDetail.enrollCta")}</span>
                    </button>
                    {/* Preview lesson titles even when locked, collapsed. */}
                    <ul className="mt-stack flex w-full flex-col gap-1 text-left opacity-60">
                      {lessons.slice(0, 3).map((lesson, i) => (
                        <li key={lesson.id} className="flex items-center gap-tight rounded-control border border-line px-stack py-tight text-sm text-slate">
                          <Lock size={14} aria-hidden="true" />
                          <span>
                            {i + 1}. {lesson.title}
                          </span>
                        </li>
                      ))}
                    </ul>
                  </div>
                ) : (
                  // Compact, scannable curriculum outline. Actual viewing/
                  // playback happens on the dedicated /learn page — this list
                  // is for orientation ("what's in this course, what have I
                  // finished") and jumps straight to a lesson when clicked.
                  <div className="flex flex-col gap-tight">
                    {visibleLessons.map((lesson, i) => {
                      const isDone = completedIds.includes(lesson.id);
                      return (
                        <Link
                          key={lesson.id}
                          to={`/learn/${course.id}?lesson=${lesson.id}`}
                          className="flex items-center gap-tight rounded-control border border-line px-stack py-tight text-sm transition-colors duration-base hover:border-accent hover:bg-mist"
                        >
                          {isDone ? (
                            <CircleCheck size={18} className="shrink-0 text-success" aria-hidden="true" />
                          ) : (
                            <PlayCircle size={18} className="shrink-0 text-accent" aria-hidden="true" />
                          )}
                          <span className="text-ink">
                            {i + 1}. {lesson.title}
                          </span>
                        </Link>
                      );
                    })}

                    {lessons.length > COLLAPSE_AFTER ? (
                      <button
                        type="button"
                        onClick={() => setShowAllLessons(v => !v)}
                        className="mt-tight w-fit self-center rounded-pill border border-line px-stack py-tight text-xs text-slate transition-colors duration-base hover:border-accent hover:text-ink"
                      >
                        {showAllLessons
                          ? t("pages.CourseDetail.showLess")
                          : `${t("pages.CourseDetail.showAll")} (${lessons.length - COLLAPSE_AFTER} ${t("pages.CourseDetail.more")})`}
                      </button>
                    ) : null}
                  </div>
                )}
              </div>
            </div>

            <div className="flex flex-col gap-stack rounded-card border border-line bg-mist p-block">
              <h3 className="font-heading text-base text-ink">{t("pages.CourseDetail.aboutTeacher")}</h3>
              <div className="flex items-start gap-tight">
                <img
                  src={course.profiles?.avatar_url || images["logo"]}
                  alt=""
                  onError={event => {
                    event.currentTarget.onerror = null;
                    event.currentTarget.src = images["logo"];
                  }}
                  className="h-12 w-12 shrink-0 rounded-pill object-cover"
                />
                <div className="flex flex-col gap-0.5">
                  <p className="text-sm font-medium text-ink">{course.profiles?.full_name ?? ""}</p>
                  {course.profiles?.expertise ? (
                    <p className="text-xs font-medium text-accent">{course.profiles.expertise}</p>
                  ) : null}
                  {course.profiles?.qualifications ? (
                    <p className="text-xs text-slate">{course.profiles.qualifications}</p>
                  ) : null}
                  {course.profiles?.bio ? (
                    <p className="mt-1 text-xs text-slate">{course.profiles.bio}</p>
                  ) : null}
                </div>
              </div>
            </div>
          </div>
        </section>

        <ReviewsSection
          courseId={course.id}
          courseTitle={course.title}
          teacherId={course.teacher_id}
          userId={user?.id ?? null}
          canReview={enrolled && !isOwner && !!user}
          restrictedReason={
            isOwner
              ? t("components.Courses.ReviewsSection.ownerNotice")
              : !enrolled
                ? t("components.Courses.ReviewsSection.enrollToReview")
                : null
          }
        />
      </main>

      <AuthModal isOpen={authOpen} onClose={() => setAuthOpen(false)} />
    </>
  );
}
