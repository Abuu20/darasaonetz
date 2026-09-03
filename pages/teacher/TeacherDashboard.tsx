import { useEffect, useMemo, useState } from "react";
import { Navigate } from "react-router-dom";
import { motion, AnimatePresence } from "motion/react";
import { BookOpen, ChevronDown, GraduationCap, Layers, Pencil, Plus } from "lucide-react";
import SEOHead from "@/components/seo/SEOHead";
import { useAuth } from "@/context/AuthContext";
import { useLanguage } from "@/context/LanguageContext";
import { courseQueries, enrollmentQueries } from "@/lib/db/courses";
import type { Course } from "@/lib/db/types";
import CourseFormModal from "@/components/teacher/CourseFormModal";
import LessonManagerPanel from "@/components/teacher/LessonManagerPanel";
import TeacherProfileEditor from "@/components/teacher/TeacherProfileEditor";
import AvatarUpload from "@/components/account/AvatarUpload";
import images from "@/assets/images.json";

function lessonCount(course: Course): number {
  const lessons = course.lessons as unknown;
  if (Array.isArray(lessons) && lessons.length > 0 && "count" in (lessons[0] as object)) {
    return Number((lessons[0] as { count: number }).count ?? 0);
  }
  return Array.isArray(lessons) ? lessons.length : 0;
}

export default function TeacherDashboard() {
  const { t } = useLanguage();
  const { user, profile, isLoading, isTeacher } = useAuth();
  const [courses, setCourses] = useState<Course[]>([]);
  const [studentCounts, setStudentCounts] = useState<Record<string, number>>({});
  const [loading, setLoading] = useState(true);
  const [modalCourse, setModalCourse] = useState<Course | null | undefined>(undefined);
  const [openCourseId, setOpenCourseId] = useState<string | null>(null);
  const [profileOpen, setProfileOpen] = useState(false);

  const loadCourses = () => {
    if (!user) return;
    setLoading(true);
    courseQueries
      .getByTeacher(user.id)
      .then(async list => {
        setCourses(list);
        const counts = await Promise.all(
          list.map(async c => ({ id: c.id, n: (await enrollmentQueries.getByCourse(c.id).catch(() => [])).length }))
        );
        setStudentCounts(Object.fromEntries(counts.map(c => [c.id, c.n])));
      })
      .catch(() => setCourses([]))
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    loadCourses();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user]);

  const stats = useMemo(() => {
    const totalStudents = Object.values(studentCounts).reduce((a, b) => a + b, 0);
    const published = courses.filter(c => c.status === "published").length;
    return {
      totalCourses: courses.length,
      published,
      draft: courses.length - published,
      totalStudents,
    };
  }, [courses, studentCounts]);

  if (isLoading || loading) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-night">
        <div className="h-10 w-10 animate-spin rounded-pill border-4 border-hairline border-t-accent" />
      </main>
    );
  }

  if (!user) return <Navigate to="/account" replace />;
  if (!isTeacher) return <Navigate to="/account" replace />;

  return (
    <>
      <SEOHead titleKey={t("pages.teacher.TeacherDashboard.seo.title")} descriptionKey={t("pages.teacher.TeacherDashboard.seo.description")} />
      <main className="min-h-screen bg-night px-gutter py-section-spacing-mobile text-night-foreground md:px-gutter-lg md:py-section-spacing">
        <div className="mx-auto flex max-w-shell flex-col gap-block">
          <div className="flex flex-col items-center gap-stack rounded-card border border-hairline bg-panel p-block text-center md:flex-row md:text-left">
            <AvatarUpload />
            <div className="flex-1">
              <span className="text-xs uppercase tracking-widest text-lavender">{t("pages.teacher.TeacherDashboard.badge")}</span>
              <h1 className="font-heading text-2xl">{profile?.full_name || user.email}</h1>
              <button
                type="button"
                onClick={() => setProfileOpen(true)}
                className="mt-1 flex items-center gap-1 text-xs text-accent underline underline-offset-2"
              >
                <Pencil size={12} aria-hidden="true" />
                {t("components.teacher.TeacherProfileEditor.editProfile")}
              </button>
            </div>
            <button
              type="button"
              onClick={() => setModalCourse(null)}
              className="gradient-brand flex items-center gap-tight rounded-control px-block py-tight text-sm text-primary-foreground transition-all duration-base hover:scale-hover"
            >
              <Plus size={16} />
              <span data-text-id="pages.teacher.TeacherDashboard.newCourse">{t("pages.teacher.TeacherDashboard.newCourse")}</span>
            </button>
          </div>

          <div className="grid grid-cols-2 gap-stack md:grid-cols-4">
            {[
              { icon: Layers, value: stats.totalCourses, labelKey: "pages.teacher.TeacherDashboard.statCourses" },
              { icon: BookOpen, value: stats.published, labelKey: "pages.teacher.TeacherDashboard.statPublished" },
              { icon: Pencil, value: stats.draft, labelKey: "pages.teacher.TeacherDashboard.statDraft" },
              { icon: GraduationCap, value: stats.totalStudents, labelKey: "pages.teacher.TeacherDashboard.statStudents" },
            ].map(({ icon: Icon, value, labelKey }) => (
              <div key={labelKey} className="flex flex-col gap-1 rounded-card border border-hairline bg-panel p-stack">
                <Icon size={18} className="text-accent" aria-hidden="true" />
                <span className="font-heading text-2xl">{value}</span>
                <span className="text-xs uppercase tracking-widest text-lavender">{t(labelKey)}</span>
              </div>
            ))}
          </div>

          <section className="flex flex-col gap-stack">
            <h2 className="font-heading text-lg">{t("pages.teacher.TeacherDashboard.coursesHeading")}</h2>

            {courses.length === 0 ? (
              <div className="flex flex-col items-center gap-stack rounded-card border border-hairline bg-panel p-block text-center">
                <img src={images["account.empty"]} alt="" aria-hidden="true" className="h-40 w-full max-w-sm rounded-panel object-cover" />
                <p className="text-sm text-lilac">{t("pages.teacher.TeacherDashboard.empty")}</p>
                <button
                  type="button"
                  onClick={() => setModalCourse(null)}
                  className="gradient-brand rounded-control px-block py-tight text-sm text-primary-foreground"
                >
                  {t("pages.teacher.TeacherDashboard.newCourse")}
                </button>
              </div>
            ) : (
              <div className="flex flex-col gap-tight">
                {courses.map(course => {
                  const isOpen = openCourseId === course.id;
                  return (
                    <div key={course.id} className="overflow-hidden rounded-card border border-hairline bg-panel">
                      <div className="flex flex-wrap items-center gap-stack px-block py-stack">
                        <img
                          src={course.thumbnail_url || images["courses.hero"]}
                          alt=""
                          onError={event => {
                            event.currentTarget.onerror = null;
                            event.currentTarget.src = images["courses.hero"];
                          }}
                          className="h-14 w-20 shrink-0 rounded-control object-cover"
                        />
                        <div className="flex-1">
                          <div className="flex flex-wrap items-center gap-tight">
                            <h3 className="font-heading text-base">{course.title}</h3>
                            <span
                              className={`rounded-pill px-tight py-0.5 text-[10px] uppercase tracking-widest ${
                                course.status === "published" ? "bg-success/15 text-success" : "bg-lavender/15 text-lavender"
                              }`}
                            >
                              {course.status}
                            </span>
                          </div>
                          <p className="text-xs text-lavender">
                            {lessonCount(course)} {t("pages.teacher.TeacherDashboard.lessons")} · {studentCounts[course.id] ?? 0}{" "}
                            {t("pages.teacher.TeacherDashboard.students")}
                          </p>
                        </div>
                        <button
                          type="button"
                          onClick={() => setModalCourse(course)}
                          className="rounded-control border border-hairline p-2 text-lavender transition-colors duration-base hover:border-accent hover:text-night-foreground"
                          aria-label={t("pages.teacher.TeacherDashboard.edit")}
                        >
                          <Pencil size={16} />
                        </button>
                        <button
                          type="button"
                          onClick={() => setOpenCourseId(isOpen ? null : course.id)}
                          aria-expanded={isOpen}
                          className="flex items-center gap-1 rounded-control border border-hairline px-stack py-tight text-xs text-night-foreground transition-colors duration-base hover:border-accent"
                        >
                          {t("pages.teacher.TeacherDashboard.manageLessons")}
                          <ChevronDown size={14} className={`transition-transform duration-base ${isOpen ? "rotate-180" : ""}`} aria-hidden="true" />
                        </button>
                      </div>
                      <AnimatePresence initial={false}>
                        {isOpen ? (
                          <motion.div
                            initial={{ height: 0, opacity: 0.001 }}
                            animate={{ height: "auto", opacity: 1 }}
                            exit={{ height: 0, opacity: 0.001 }}
                            transition={{ duration: 0.3 }}
                            className="px-block pb-stack"
                          >
                            <LessonManagerPanel course={course} />
                          </motion.div>
                        ) : null}
                      </AnimatePresence>
                    </div>
                  );
                })}
              </div>
            )}
          </section>
        </div>
      </main>

      {modalCourse !== undefined ? (
        <CourseFormModal
          course={modalCourse}
          onClose={() => setModalCourse(undefined)}
          onSaved={() => {
            setModalCourse(undefined);
            loadCourses();
          }}
        />
      ) : null}

      {profileOpen ? <TeacherProfileEditor onClose={() => setProfileOpen(false)} /> : null}
    </>
  );
}
