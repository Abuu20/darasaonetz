import { useEffect, useState } from "react";
import { BookOpen, GraduationCap, PlayCircle, ArrowRight } from "lucide-react";
import { useAuth } from "@/context/AuthContext";
import { useLanguage } from "@/context/LanguageContext";
import { enrollmentQueries } from "@/lib/db/courses";
import type { Enrollment } from "@/lib/db/types";
import LessonViewer from "@/components/learn/LessonViewer";
import images from "@/assets/images.json";

/**
 * The "Learn" tab on the student dashboard.
 *
 * Flow: the student picks one of their enrolled courses → hands off to
 * <LessonViewer variant="dashboard" /> → watches the video, reads notes,
 * takes the quiz, marks lessons complete — all inside the DashUI shell.
 * "Focus mode" in the viewer header jumps to /learn/:id at the exact
 * lesson they were on for deep-study sessions.
 */
export default function StudentLearnPanel() {
  const { user } = useAuth();
  const { t } = useLanguage();
  const [enrollments, setEnrollments] = useState<Enrollment[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedCourseId, setSelectedCourseId] = useState<string | null>(null);

  useEffect(() => {
    if (!user) return;
    setLoading(true);
    enrollmentQueries
      .getByStudent(user.id)
      .then(setEnrollments)
      .catch(() => setEnrollments([]))
      .finally(() => setLoading(false));
  }, [user]);

  if (selectedCourseId) {
    return (
      <LessonViewer
        courseId={selectedCourseId}
        variant="dashboard"
        onExit={() => setSelectedCourseId(null)}
      />
    );
  }

  if (loading) {
    return (
      <div className="grid grid-cols-1 gap-stack sm:grid-cols-2 lg:grid-cols-3">
        {[0, 1, 2].map(i => (
          <div key={i} className="h-44 animate-pulse rounded-card bg-mist" />
        ))}
      </div>
    );
  }

  if (enrollments.length === 0) {
    return (
      <div className="card-lift flex flex-col items-center gap-stack rounded-card border border-line bg-background p-block text-center">
        <img
          src={images["account.empty"]}
          alt=""
          aria-hidden="true"
          className="h-40 w-full max-w-sm rounded-panel object-cover"
        />
        <p className="text-sm text-slate">{t("pages.Account.pathEmpty")}</p>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-block">
      <div className="flex items-center justify-between gap-stack">
        <h2 className="font-heading text-lg text-ink">{t("pages.Learn.seoPrefix")}</h2>
        <span className="flex items-center gap-1.5 text-xs text-slate">
          <GraduationCap size={13} aria-hidden="true" />
          {enrollments.length} {enrollments.length === 1 ? "course" : "courses"}
        </span>
      </div>

      <div className="grid grid-cols-1 gap-stack sm:grid-cols-2 lg:grid-cols-3">
        {enrollments.map(enrollment => {
          const course = enrollment.courses;
          if (!course) return null;
          const progress = Math.round(enrollment.progress ?? 0);
          const lessonCount = Array.isArray(course.lessons) ? course.lessons.length : 0;
          return (
            <button
              key={enrollment.id}
              type="button"
              onClick={() => setSelectedCourseId(course.id)}
              className="card-lift group flex flex-col overflow-hidden rounded-card border border-line bg-background text-left transition-all duration-base hover:-translate-y-0.5 hover:border-accent/60"
            >
              <div className="aspect-[16/10] w-full overflow-hidden bg-mist">
                <img
                  src={course.thumbnail_url || images["courses.hero"]}
                  alt=""
                  onError={e => {
                    e.currentTarget.onerror = null;
                    e.currentTarget.src = images["courses.hero"];
                  }}
                  className="h-full w-full object-cover transition-transform duration-slow group-hover:scale-hover"
                />
              </div>
              <div className="flex flex-1 flex-col gap-tight p-4">
                <p className="truncate text-[10px] uppercase tracking-[0.18em] text-slate">
                  {course.categories?.name ?? ""}
                </p>
                <h3 className="line-clamp-2 font-heading text-base text-ink">{course.title}</h3>

                <div className="mt-1 flex items-center gap-2 text-xs text-slate">
                  <BookOpen size={13} aria-hidden="true" />
                  <span>{lessonCount}</span>
                  <span>{t("pages.teacher.TeacherDashboard.lessons")}</span>
                </div>

                <div className="mt-auto flex items-center gap-2 pt-2">
                  <div className="h-1.5 flex-1 overflow-hidden rounded-pill bg-line">
                    <div
                      className="gradient-brand h-full rounded-pill transition-all duration-slow"
                      style={{ width: `${Math.min(progress, 100)}%` }}
                    />
                  </div>
                  <span className="shrink-0 text-xs text-slate">{progress}%</span>
                </div>

                <span className="mt-1 inline-flex items-center gap-1.5 text-xs text-accent">
                  <PlayCircle size={13} aria-hidden="true" />
                  {progress > 0 ? "Continue" : "Start learning"}
                  <ArrowRight
                    size={11}
                    className="transition-transform duration-base group-hover:translate-x-0.5"
                    aria-hidden="true"
                  />
                </span>
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );
}
