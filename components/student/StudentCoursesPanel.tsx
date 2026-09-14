import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { GraduationCap, PlayCircle, ArrowRight } from "lucide-react";
import { useAuth } from "@/context/AuthContext";
import { useLanguage } from "@/context/LanguageContext";
import { enrollmentQueries } from "@/lib/db/courses";
import type { Enrollment } from "@/lib/db/types";
import images from "@/assets/images.json";

export default function StudentCoursesPanel() {
  const { user } = useAuth();
  const { t } = useLanguage();
  const [enrollments, setEnrollments] = useState<Enrollment[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) return;
    setLoading(true);
    enrollmentQueries
      .getByStudent(user.id)
      .then(setEnrollments)
      .catch(() => setEnrollments([]))
      .finally(() => setLoading(false));
  }, [user]);

  if (loading) {
    return (
      <div className="flex flex-col gap-2">
        {[0, 1, 2].map(i => (
          <div key={i} className="h-16 animate-pulse rounded-card bg-mist" />
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
        <Link
          to="/courses"
          className="gradient-brand rounded-control px-block py-tight text-sm text-primary-foreground transition-all duration-base hover:scale-hover"
        >
          {t("pages.Account.browseCourses")}
        </Link>
      </div>
    );
  }

  return (
    <section className="flex flex-col gap-stack">
      <h2 className="font-heading text-lg text-ink">{t("pages.Account.pathHeading")}</h2>

      <div className="card-lift overflow-hidden rounded-card border border-line bg-background">
        <div className="hidden grid-cols-[minmax(0,2.4fr)_minmax(0,1.4fr)_140px] items-center gap-stack border-b border-line px-block py-3 text-[11px] font-semibold uppercase tracking-[0.12em] text-slate lg:grid">
          <span>Course</span>
          <span>Progress</span>
          <span className="text-right">Actions</span>
        </div>

        {enrollments.map(enrollment => {
          const course = enrollment.courses;
          if (!course) return null;
          const progress = Math.round(enrollment.progress ?? 0);
          const lessonCount = Array.isArray(course.lessons)
            ? course.lessons.length
            : 0;

          return (
            <div
              key={enrollment.id}
              className="grid grid-cols-1 items-center gap-stack border-b border-line px-block py-stack last:border-b-0 lg:grid-cols-[minmax(0,2.4fr)_minmax(0,1.4fr)_140px]"
            >
              <div className="flex min-w-0 items-center gap-3">
                <img
                  src={course.thumbnail_url || images["courses.hero"]}
                  alt=""
                  onError={event => {
                    event.currentTarget.onerror = null;
                    event.currentTarget.src = images["courses.hero"];
                  }}
                  className="h-11 w-11 shrink-0 rounded-panel object-cover"
                />
                <div className="min-w-0">
                  <Link
                    to={`/courses/${course.id}`}
                    className="truncate font-heading text-sm text-ink transition-colors duration-base hover:text-accent"
                  >
                    {course.title}
                  </Link>
                  <p className="truncate text-xs text-slate">
                    {course.profiles?.full_name ?? ""} · {lessonCount} {t("pages.teacher.TeacherDashboard.lessons")}
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <div className="h-1.5 min-w-[80px] flex-1 overflow-hidden rounded-pill bg-line">
                  <div
                    className="gradient-brand h-full rounded-pill transition-all duration-slow"
                    style={{ width: `${Math.min(progress, 100)}%` }}
                  />
                </div>
                <span className="w-9 shrink-0 text-right text-xs text-slate">{progress}%</span>
              </div>

              <div className="flex items-center justify-end">
                <Link
                  to={`/learn/${course.id}`}
                  className="gradient-brand inline-flex items-center gap-1.5 rounded-control px-stack py-tight text-xs text-primary-foreground transition-all duration-base hover:scale-hover"
                >
                  <PlayCircle size={13} aria-hidden="true" />
                  {progress > 0 ? "Continue" : "Start"}
                  <ArrowRight size={11} aria-hidden="true" />
                </Link>
              </div>
            </div>
          );
        })}
      </div>

      <div className="flex items-center gap-2 rounded-control border border-line bg-mist/60 px-4 py-2 text-xs text-slate">
        <GraduationCap size={13} aria-hidden="true" />
        {enrollments.length} {enrollments.length === 1 ? "course" : "courses"} enrolled
      </div>
    </section>
  );
}
