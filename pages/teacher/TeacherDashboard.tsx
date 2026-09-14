/* [teacher-dashboard-fix] */
import { useCallback, useEffect, useMemo, useState } from "react";
import { Navigate, useNavigate, useSearchParams } from "react-router-dom";
import { motion, AnimatePresence } from "motion/react";
import {
  BookOpen,
  CalendarDays,
  ChevronDown,
  ClipboardList,
  GraduationCap,
  Home,
  Layers,
  LayoutList,
  MessageSquare,
  Pencil,
  Plus,
  Star,
  Trash2,
  Trophy,
  User,
  Users,
} from "lucide-react";
import SEOHead from "@/components/seo/SEOHead";
import { useAuth } from "@/context/AuthContext";
import { useLanguage } from "@/context/LanguageContext";
import { courseQueries, enrollmentQueries } from "@/lib/db/courses";
import type { Course, Enrollment, Lesson, Quiz } from "@/lib/db/types";
import DashboardShell, { type DashboardNavItem } from "@/components/dashboard/DashboardShell";
import DashboardTabs, { type DashboardTab } from "@/components/dashboard/DashboardTabs";
import CoursePerformanceChart, { type CoursePerformancePoint } from "@/components/dashboard/CoursePerformanceChart";
import QuizPerformanceChart, { type QuizPerformancePoint } from "@/components/dashboard/QuizPerformanceChart";
import StatCard from "@/components/dashboard/StatCard";
import TeacherActivityChart, { type ActivityPoint } from "@/components/dashboard/TeacherActivityChart";
import EnrollmentChart, { type EnrollmentPoint } from "@/components/dashboard/EnrollmentChart";
import CourseFormPanel from "@/components/teacher/CourseFormPanel";
import TeacherProfilePanel from "@/components/teacher/TeacherProfilePanel";
import StudentsPanel from "@/components/teacher/StudentsPanel";
import QuizzesPanel from "@/components/teacher/QuizzesPanel";
import QuizBuilderPanel from "@/components/teacher/QuizBuilderPanel";
import QuizResultsPanel from "@/components/teacher/QuizResultsPanel";
import CommentsPanel from "@/components/teacher/CommentsPanel";
import ReviewsPanel from "@/components/teacher/ReviewsPanel";
import TeacherClassLeaderboardPanel from "@/components/teacher/TeacherClassLeaderboardPanel";
import TeacherCalendarPanel from "@/components/teacher/TeacherCalendarPanel";
import { lessonQueries } from "@/lib/db/courses";
import { quizQueries, quizAttemptQueries } from "@/lib/db/quizzes";
import { commentQueries } from "@/lib/db/comments";
import images from "@/assets/images.json";

type TabId =
  | "overview"
  | "courses"
  | "quizzes"
  | "students"
  | "leaderboard"
  | "calendar"
  | "comments"
  | "reviews"
  | "profile";
const VALID_TABS: readonly TabId[] = [
  "overview",
  "courses",
  "quizzes",
  "students",
  "leaderboard",
  "calendar",
  "comments",
  "reviews",
  "profile",
];

interface CourseStats {
  students: number;
  avgProgress: number;
  enrollments: Enrollment[];
}

function lessonCount(course: Course): number {
  const lessons = course.lessons as unknown;
  if (Array.isArray(lessons) && lessons.length > 0 && "count" in (lessons[0] as object)) {
    return Number((lessons[0] as { count: number }).count ?? 0);
  }
  return Array.isArray(lessons) ? lessons.length : 0;
}

function greetingKey(): string {
  const hour = new Date().getHours();
  if (hour < 12) return "pages.teacher.TeacherDashboard.greetingMorning";
  if (hour < 18) return "pages.teacher.TeacherDashboard.greetingAfternoon";
  return "pages.teacher.TeacherDashboard.greetingEvening";
}

function statusBadgeClass(status: Course["status"]): string {
  switch (status) {
    case "published":
      return "bg-success/15 text-success";
    case "pending":
      return "bg-ember/15 text-ember";
    case "rejected":
      return "bg-danger/15 text-danger";
    default:
      return "bg-accent/15 text-accent";
  }
}

function buildWeeklyEnrollments(enrollments: Enrollment[], weeks = 12): EnrollmentPoint[] {
  const buckets = Array.from({ length: weeks }, (_, i) => {
    const end = new Date();
    end.setHours(23, 59, 59, 999);
    end.setDate(end.getDate() - (weeks - 1 - i) * 7);
    const start = new Date(end);
    start.setDate(start.getDate() - 6);
    start.setHours(0, 0, 0, 0);
    return {
      label: `${start.getMonth() + 1}/${start.getDate()}`,
      students: 0,
      startMs: start.getTime(),
      endMs: end.getTime(),
    };
  });
  for (const e of enrollments) {
    const t = new Date(e.enrolled_at).getTime();
    for (const b of buckets) {
      if (t >= b.startMs && t <= b.endMs) {
        b.students += 1;
        break;
      }
    }
  }
  return buckets.map(({ label, students }) => ({ label, students }));
}

type CoursesView = { kind: "list" } | { kind: "edit"; course: Course | null };

type QuizzesView =
  | { kind: "list" }
  | { kind: "builder"; lesson: Lesson; courseId: string }
  | { kind: "results"; lesson: Lesson; courseId: string; quiz: Quiz };

export default function TeacherDashboard() {
  const { t } = useLanguage();
  const { user, profile, isLoading, isTeacher } = useAuth();
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();

  const rawTab = searchParams.get("tab") as TabId | null;
  const activeTab: TabId = rawTab && VALID_TABS.includes(rawTab) ? rawTab : "overview";
  const setActiveTab = (id: TabId) => {
    setSearchParams(
      (prev) => {
        const next = new URLSearchParams(prev);
        next.set("tab", id);
        return next;
      },
      { replace: true }
    );
  };
  const deepLinkedCourseId = searchParams.get("course");

  const [courses, setCourses] = useState<Course[]>([]);
  const [courseStats, setCourseStats] = useState<Record<string, CourseStats>>({});
  const [loading, setLoading] = useState(true);

  const [coursesView, setCoursesView] = useState<CoursesView>({ kind: "list" });
  const [quizzesView, setQuizzesView] = useState<QuizzesView>({ kind: "list" });

  const [openCourseId, setOpenCourseId] = useState<string | null>(null);
  const [studentsCourseId, setStudentsCourseId] = useState<string | null>(null);

  const [unansweredComments, setUnansweredComments] = useState<number>(0);
  const [unansweredReviews, setUnansweredReviews] = useState<number>(0);

  const [lessonsByCourse, setLessonsByCourse] = useState<Record<string, Lesson[]>>({});

  // Inline "are you sure?" state — keyed by course id, so deleting one
  // course doesn't pop a confirm for all of them.
  const [confirmDeleteCourseId, setConfirmDeleteCourseId] = useState<string | null>(null);
  const [deletingCourseId, setDeletingCourseId] = useState<string | null>(null);

  const loadCourses = () => {
    if (!user) return;
    setLoading(true);
    courseQueries
      .getByTeacher(user.id)
      .then(async (list) => {
        setCourses(list);
        const entries = await Promise.all(
          list.map(async (c) => {
            const enrollments = await enrollmentQueries.getByCourse(c.id).catch(() => []);
            const avg =
              enrollments.length > 0
                ? Math.round(
                    enrollments.reduce((sum, e) => sum + (e.progress ?? 0), 0) / enrollments.length
                  )
                : 0;
            return [c.id, { students: enrollments.length, avgProgress: avg, enrollments }] as const;
          })
        );
        setCourseStats(Object.fromEntries(entries));

        const lessonEntries = await Promise.all(
          list.map(async (c) => [c.id, await lessonQueries.getByCourse(c.id).catch(() => [])] as const)
        );
        setLessonsByCourse(Object.fromEntries(lessonEntries));
      })
      .catch(() => setCourses([]))
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    loadCourses();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user]);

  const refreshUnanswered = useCallback(() => {
    if (courses.length === 0) {
      setUnansweredComments(0);
      return;
    }
    Promise.all(
      courses.map((c) => commentQueries.getThreadsForCourse(c.id).catch(() => []))
    ).then((all) => {
      const total = all.flat().filter((thr) => !thr.answered).length;
      setUnansweredComments(total);
    });
  }, [courses]);

  useEffect(() => {
    refreshUnanswered();
  }, [refreshUnanswered]);

  const [quizPerformance, setQuizPerformance] = useState<QuizPerformancePoint[]>([]);

  useEffect(() => {
    if (courses.length === 0) {
      setQuizPerformance([]);
      return;
    }
    Promise.all(
      courses.map((c) => quizAttemptQueries.getAverageScoresByCourse(c.id).catch(() => []))
    ).then((all) => {
      setQuizPerformance(all.flat());
    });
  }, [courses]);

  const studentCounts = useMemo(
    () => Object.fromEntries(Object.entries(courseStats).map(([id, s]) => [id, s.students])),
    [courseStats]
  );

  const stats = useMemo(() => {
    const totalStudents = Object.values(courseStats).reduce((sum, s) => sum + s.students, 0);
    const published = courses.filter((c) => c.status === "published").length;
    const totalLessons = courses.reduce((sum, c) => sum + lessonCount(c), 0);
    return {
      totalCourses: courses.length,
      published,
      draft: courses.length - published,
      totalStudents,
      totalLessons,
    };
  }, [courses, courseStats]);

  const weeklyEnrollments = useMemo(() => {
    const all = Object.values(courseStats).flatMap((s) => s.enrollments);
    return buildWeeklyEnrollments(all, 12);
  }, [courseStats]);

  const coursePerformanceData = useMemo<CoursePerformancePoint[]>(() => {
    return courses.map((c) => ({
      courseId: c.id,
      title: c.title,
      avgProgress: Math.round(courseStats[c.id]?.avgProgress ?? 0),
      students: courseStats[c.id]?.students ?? 0,
    }));
  }, [courses, courseStats]);

  const activityData = useMemo<ActivityPoint[]>(() => {
    const total = stats.totalStudents;
    if (total === 0) {
      return [
        { name: "Enrolled", value: 0, fill: "#624BFF" },
        { name: "Active", value: 0, fill: "#F4A261" },
        { name: "Completed", value: 0, fill: "#2A9D8F" },
      ];
    }
    const activeCount = Object.values(courseStats).reduce(
      (sum, s) =>
        sum + s.enrollments.filter((e) => (e.progress ?? 0) > 0 && (e.progress ?? 0) < 100).length,
      0
    );
    const completedCount = Object.values(courseStats).reduce(
      (sum, s) => sum + s.enrollments.filter((e) => (e.progress ?? 0) >= 100).length,
      0
    );
    return [
      { name: "Enrolled", value: 100, fill: "#624BFF" },
      { name: "Active", value: Math.round((activeCount / total) * 100), fill: "#F4A261" },
      { name: "Completed", value: Math.round((completedCount / total) * 100), fill: "#2A9D8F" },
    ];
  }, [courseStats, stats.totalStudents]);

  if (isLoading || loading) {
    return (
      <main className="dash-theme flex min-h-screen items-center justify-center bg-mist">
        <div className="h-10 w-10 animate-spin rounded-pill border-4 border-line border-t-accent" />
      </main>
    );
  }
  if (!user) return <Navigate to="/account" replace />;
  if (!isTeacher) return <Navigate to="/account" replace />;

  const openNewCourse = () => {
    setCoursesView({ kind: "edit", course: null });
    setActiveTab("courses");
  };
  const openEditCourse = (course: Course) => {
    setCoursesView({ kind: "edit", course });
    setActiveTab("courses");
  };
  const backToCoursesList = () => {
    setCoursesView({ kind: "list" });
    loadCourses();
  };

  const handleDeleteCourse = async (course: Course) => {
    setDeletingCourseId(course.id);
    try {
      await courseQueries.delete(course.id);
      // Optimistic: drop it from local state so the row disappears the
      // instant the delete succeeds, then reload to be sure.
      setCourses((prev) => prev.filter((c) => c.id !== course.id));
      setConfirmDeleteCourseId(null);
      loadCourses();
    } catch (err) {
      console.error("[delete course]", err);
      window.alert("Could not delete this course. Please try again.");
    } finally {
      setDeletingCourseId(null);
    }
  };

  const openQuizBuilder = (lesson: Lesson, courseId: string) => {
    setQuizzesView({ kind: "builder", lesson, courseId });
    setActiveTab("quizzes");
  };
  const openQuizResults = async (lesson: Lesson, courseId: string) => {
    const quiz = await quizQueries.getByLessonId(lesson.id).catch(() => null);
    if (!quiz) return;
    setQuizzesView({ kind: "results", lesson, courseId, quiz });
    setActiveTab("quizzes");
  };
  const backToQuizzesList = () => {
    setQuizzesView({ kind: "list" });
    loadCourses();
  };

  const navItems: DashboardNavItem[] = [
    {
      id: "overview",
      label: t("pages.teacher.TeacherDashboard.navOverview"),
      icon: Home,
      onClick: () => {
        setActiveTab("overview");
      },
      active: activeTab === "overview",
    },
    {
      id: "courses",
      label: t("pages.teacher.TeacherDashboard.coursesHeading"),
      icon: Layers,
      onClick: () => {
        setCoursesView({ kind: "list" });
        setActiveTab("courses");
      },
      active: activeTab === "courses",
    },
    {
      id: "quizzes",
      label: t("pages.teacher.TeacherDashboard.quizzes"),
      icon: ClipboardList,
      onClick: () => {
        setQuizzesView({ kind: "list" });
        setActiveTab("quizzes");
      },
      active: activeTab === "quizzes",
    },
    {
      id: "students",
      label: t("pages.teacher.TeacherDashboard.viewStudents"),
      icon: Users,
      onClick: () => {
        setActiveTab("students");
      },
      active: activeTab === "students",
    },
    {
      id: "leaderboard",
      label: "Leaderboard",
      icon: Trophy,
      onClick: () => {
        setActiveTab("leaderboard");
      },
      active: activeTab === "leaderboard",
    },
    {
      id: "calendar",
      label: "Calendar",
      icon: CalendarDays,
      onClick: () => {
        setActiveTab("calendar");
      },
      active: activeTab === "calendar",
    },
    {
      id: "comments",
      label: "Comments",
      icon: MessageSquare,
      onClick: () => {
        setActiveTab("comments");
      },
      active: activeTab === "comments",
      badge: unansweredComments > 0 ? unansweredComments : undefined,
    },
    {
      id: "reviews",
      label: "Reviews",
      icon: Star,
      onClick: () => {
        setActiveTab("reviews");
      },
      active: activeTab === "reviews",
      badge: unansweredReviews > 0 ? unansweredReviews : undefined,
    },
    {
      id: "profile",
      label: t("components.teacher.TeacherProfileEditor.editProfile"),
      icon: User,
      onClick: () => {
        setActiveTab("profile");
      },
      active: activeTab === "profile",
    },
    {
      id: "newCourse",
      label: t("pages.teacher.TeacherDashboard.newCourse"),
      icon: Plus,
      onClick: openNewCourse,
    },
    {
      id: "student-view",
      label: "My student dashboard",
      icon: GraduationCap,
      onClick: () => navigate("/account"),
    },
  ];

  const tabs: DashboardTab[] = [
    { id: "overview", label: t("pages.teacher.TeacherDashboard.navOverview"), icon: Home },
    {
      id: "courses",
      label: t("pages.teacher.TeacherDashboard.coursesHeading"),
      icon: Layers,
      badge: stats.totalCourses || undefined,
    },
    { id: "quizzes", label: t("pages.teacher.TeacherDashboard.quizzes"), icon: ClipboardList },
    {
      id: "students",
      label: t("pages.teacher.TeacherDashboard.viewStudents"),
      icon: Users,
      badge: stats.totalStudents || undefined,
    },
    { id: "leaderboard", label: "Leaderboard", icon: Trophy },
    { id: "calendar", label: "Calendar", icon: CalendarDays },
    {
      id: "comments",
      label: "Comments",
      icon: MessageSquare,
      badge: unansweredComments > 0 ? unansweredComments : undefined,
    },
    {
      id: "reviews",
      label: "Reviews",
      icon: Star,
      badge: unansweredReviews > 0 ? unansweredReviews : undefined,
    },
    { id: "profile", label: t("components.teacher.TeacherProfileEditor.editProfile"), icon: User },
  ];

  const greeting = `${t(greetingKey())}${
    profile?.full_name ? `, ${profile.full_name.split(" ")[0]}` : ""
  }`;

  const renderOverview = () => (
    <div className="mx-auto flex max-w-shell flex-col gap-block">
      <div className="grid grid-cols-2 gap-stack lg:grid-cols-4">
        <StatCard
          icon={Layers}
          value={stats.totalCourses}
          label={t("pages.teacher.TeacherDashboard.statCourses")}
        />
        <StatCard
          icon={BookOpen}
          value={stats.published}
          label={t("pages.teacher.TeacherDashboard.statPublished")}
          delta={{
            value: `${stats.draft} ${t("pages.teacher.TeacherDashboard.statDraft").toLowerCase()}`,
            tone: "flat",
          }}
        />
        <StatCard
          icon={GraduationCap}
          value={stats.totalStudents}
          label={t("pages.teacher.TeacherDashboard.statStudents")}
        />
        <StatCard
          icon={ClipboardList}
          value={stats.totalLessons}
          label={t("pages.teacher.TeacherDashboard.lessons")}
        />
      </div>

      <div className="grid grid-cols-1 gap-stack lg:grid-cols-3">
        <TeacherActivityChart
          data={activityData}
          title="Class activity"
          subtitle="Share of enrolled students by stage"
        />
        <div className="lg:col-span-2">
          <EnrollmentChart
            data={weeklyEnrollments}
            title="New enrollments"
            subtitle="Last 12 weeks"
          />
        </div>
      </div>

      {courses.length > 1 ? (
        <div className="grid grid-cols-1 gap-stack lg:grid-cols-2">
          <CoursePerformanceChart data={coursePerformanceData} />
          <QuizPerformanceChart data={quizPerformance} />
        </div>
      ) : quizPerformance.length > 0 ? (
        <QuizPerformanceChart data={quizPerformance} />
      ) : null}

      <section className="card-lift rounded-card border border-line bg-background p-block">
        <h2 className="mb-3 font-heading text-base text-ink">Recent courses</h2>
        {courses.length === 0 ? (
          <p className="text-sm text-slate">{t("pages.teacher.TeacherDashboard.empty")}</p>
        ) : (
          <ul className="flex flex-col divide-y divide-line">
            {courses.slice(0, 5).map((course) => (
              <li
                key={course.id}
                className="flex items-center justify-between gap-stack py-3 first:pt-0 last:pb-0"
              >
                <div className="flex min-w-0 items-center gap-3">
                  <img
                    src={course.thumbnail_url || images["courses.hero"]}
                    alt=""
                    className="h-9 w-9 shrink-0 rounded-panel object-cover"
                  />
                  <div className="min-w-0">
                    <p className="truncate text-sm text-ink">{course.title}</p>
                    <p className="truncate text-xs text-slate">
                      {course.categories?.name ?? "—"}
                    </p>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => openEditCourse(course)}
                  className="shrink-0 text-xs text-accent hover:underline"
                >
                  Edit
                </button>
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  );

  const renderCourses = () => {
    if (coursesView.kind === "edit") {
      return (
        <CourseFormPanel
          course={coursesView.course}
          onClose={backToCoursesList}
          onSaved={backToCoursesList}
        />
      );
    }

    return (
      <section className="flex flex-col gap-stack">
        <div className="flex items-center justify-between">
          <h2 className="font-heading text-lg text-ink">
            {t("pages.teacher.TeacherDashboard.coursesHeading")}
          </h2>
          <button
            type="button"
            onClick={openNewCourse}
            className="gradient-brand inline-flex items-center gap-1.5 rounded-control px-block py-tight text-sm text-primary-foreground transition-all duration-base hover:scale-hover"
          >
            <Plus size={15} /> {t("pages.teacher.TeacherDashboard.newCourse")}
          </button>
        </div>

        {courses.length === 0 ? (
          <div className="card-lift flex flex-col items-center gap-stack rounded-card border border-line bg-background p-block text-center">
            <img
              src={images["account.empty"]}
              alt=""
              aria-hidden="true"
              className="h-40 w-full max-w-sm rounded-panel object-cover"
            />
            <p className="text-sm text-slate">{t("pages.teacher.TeacherDashboard.empty")}</p>
            <button
              type="button"
              onClick={openNewCourse}
              className="gradient-brand rounded-control px-block py-tight text-sm text-primary-foreground"
            >
              {t("pages.teacher.TeacherDashboard.newCourse")}
            </button>
          </div>
        ) : (
          <div className="card-lift overflow-hidden rounded-card border border-line bg-background">
            <div className="hidden grid-cols-[minmax(0,2.4fr)_100px_110px_minmax(0,1.4fr)_170px] items-center gap-stack border-b border-line px-block py-3 text-[11px] font-semibold uppercase tracking-[0.12em] text-slate lg:grid">
              <span>Course</span>
              <span>Lessons</span>
              <span>Students</span>
              <span>Avg. progress</span>
              <span className="text-right">Actions</span>
            </div>
            {courses.map((course) => {
              const cs = courseStats[course.id];
              const avg = cs?.avgProgress ?? 0;
              const isOpen = openCourseId === course.id;
              const isConfirmingDelete = confirmDeleteCourseId === course.id;
              const isDeleting = deletingCourseId === course.id;
              return (
                <div key={course.id} className="border-b border-line last:border-b-0">
                  <div className="grid grid-cols-1 items-center gap-stack px-block py-stack lg:grid-cols-[minmax(0,2.4fr)_100px_110px_minmax(0,1.4fr)_170px]">
                    <div className="flex min-w-0 items-center gap-3">
                      <img
                        src={course.thumbnail_url || images["courses.hero"]}
                        alt=""
                        onError={(e) => {
                          e.currentTarget.onerror = null;
                          e.currentTarget.src = images["courses.hero"];
                        }}
                        className="h-10 w-10 shrink-0 rounded-panel object-cover"
                      />
                      <div className="min-w-0">
                        <div className="flex flex-wrap items-center gap-2">
                          <h3 className="truncate font-heading text-sm text-ink">{course.title}</h3>
                          <span
                            className={`shrink-0 rounded-pill px-2 py-0.5 text-[10px] uppercase tracking-widest ${statusBadgeClass(
                              course.status
                            )}`}
                          >
                            {course.status}
                          </span>
                        </div>
                        <p className="truncate text-xs text-slate">
                          {course.categories?.name ?? "—"}
                        </p>
                      </div>
                    </div>
                    <div className="text-sm text-ink">
                      <span className="text-xs text-slate lg:hidden">Lessons: </span>
                      {lessonCount(course)}
                    </div>
                    <div className="text-sm text-ink">
                      <span className="text-xs text-slate lg:hidden">Students: </span>
                      {cs?.students ?? 0}
                    </div>
                    <div className="flex items-center gap-2">
                      <div className="h-1.5 min-w-[80px] flex-1 overflow-hidden rounded-pill bg-line">
                        <div
                          className="gradient-brand h-full rounded-pill transition-all duration-slow"
                          style={{ width: `${Math.min(avg, 100)}%` }}
                        />
                      </div>
                      <span className="w-9 shrink-0 text-right text-xs text-slate">{avg}%</span>
                    </div>
                    <div className="flex items-center justify-end gap-1">
                      <button
                        type="button"
                        onClick={() => openEditCourse(course)}
                        title="Edit course"
                        aria-label="Edit course"
                        className="rounded-control p-2 text-slate hover:bg-mist hover:text-ink"
                      >
                        <Pencil size={15} />
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          setStudentsCourseId(course.id);
                          setActiveTab("students");
                        }}
                        title="Students"
                        aria-label="Students"
                        className="rounded-control p-2 text-slate hover:bg-mist hover:text-ink"
                      >
                        <Users size={15} />
                      </button>
                      <button
                        type="button"
                        onClick={() => setOpenCourseId(isOpen ? null : course.id)}
                        title={isOpen ? "Collapse" : "Show lessons"}
                        aria-label={isOpen ? "Collapse" : "Show lessons"}
                        className={`rounded-control p-2 transition-colors duration-base ${
                          isOpen ? "bg-accent/10 text-accent" : "text-slate hover:bg-mist hover:text-ink"
                        }`}
                      >
                        <ChevronDown
                          size={15}
                          className={`transition-transform duration-base ${
                            isOpen ? "rotate-180" : ""
                          }`}
                        />
                      </button>

                      {/* Delete — red, always visible. Two-step inline
                          confirm so an accidental click never destroys a
                          course. */}
                      {isConfirmingDelete ? (
                        <div className="flex items-center gap-1">
                          <button
                            type="button"
                            onClick={() => handleDeleteCourse(course)}
                            disabled={isDeleting}
                            className="inline-flex items-center gap-1 rounded-control bg-danger px-2.5 py-1.5 text-[11px] font-medium text-danger-foreground transition-opacity duration-base hover:opacity-90 disabled:opacity-60"
                          >
                            {isDeleting ? "Deleting…" : "Yes, delete"}
                          </button>
                          <button
                            type="button"
                            onClick={() => setConfirmDeleteCourseId(null)}
                            className="rounded-control border border-line px-2.5 py-1.5 text-[11px] text-slate hover:text-ink"
                          >
                            Cancel
                          </button>
                        </div>
                      ) : (
                        <button
                          type="button"
                          onClick={() => setConfirmDeleteCourseId(course.id)}
                          title="Delete course"
                          aria-label="Delete course"
                          className="rounded-control p-2 text-danger hover:bg-danger/10"
                        >
                          <Trash2 size={15} />
                        </button>
                      )}
                    </div>
                  </div>
                  <AnimatePresence initial={false}>
                    {isOpen ? (
                      <motion.div
                        initial={{ height: 0, opacity: 0.001 }}
                        animate={{ height: "auto", opacity: 1 }}
                        exit={{ height: 0, opacity: 0.001 }}
                        transition={{ duration: 0.3 }}
                        className="border-t border-line bg-mist/60 px-block pb-stack pt-stack"
                      >
                        <LessonsInline
                          course={course}
                          lessons={lessonsByCourse[course.id] ?? []}
                          onEditQuiz={openQuizBuilder}
                          onViewResults={openQuizResults}
                          onLessonsChanged={loadCourses}
                        />
                      </motion.div>
                    ) : null}
                  </AnimatePresence>
                </div>
              );
            })}
          </div>
        )}
      </section>
    );
  };

  const renderQuizzes = () => {
    if (quizzesView.kind === "builder") {
      return (
        <QuizBuilderPanel
          lesson={quizzesView.lesson}
          onClose={backToQuizzesList}
          onSaved={backToQuizzesList}
          onDeleted={backToQuizzesList}
        />
      );
    }
    if (quizzesView.kind === "results") {
      return (
        <QuizResultsPanel
          quiz={quizzesView.quiz}
          lessonTitle={quizzesView.lesson.title}
          enrolledCount={studentCounts[quizzesView.courseId]}
          onClose={backToQuizzesList}
        />
      );
    }
    return (
      <QuizzesPanel
        courses={courses}
        studentCounts={studentCounts}
        onClose={() => setActiveTab("overview")}
      />
    );
  };

  const renderStudents = () => {
    const selected = studentsCourseId ? courses.find((c) => c.id === studentsCourseId) : null;
    if (!selected) {
      return (
        <div className="card-lift rounded-card border border-line bg-background p-block">
          <h2 className="mb-3 font-heading text-base text-ink">Pick a course</h2>
          {courses.length === 0 ? (
            <p className="text-sm text-slate">{t("pages.teacher.TeacherDashboard.empty")}</p>
          ) : (
            <div className="flex flex-col divide-y divide-line">
              {courses.map((course) => (
                <button
                  key={course.id}
                  type="button"
                  onClick={() => setStudentsCourseId(course.id)}
                  className="flex items-center justify-between gap-stack py-3 text-left first:pt-0 last:pb-0 hover:bg-mist/50"
                >
                  <div className="flex min-w-0 items-center gap-3">
                    <img
                      src={course.thumbnail_url || images["courses.hero"]}
                      alt=""
                      className="h-9 w-9 shrink-0 rounded-panel object-cover"
                    />
                    <span className="truncate text-sm text-ink">{course.title}</span>
                  </div>
                  <span className="shrink-0 text-xs text-slate">
                    {courseStats[course.id]?.students ?? 0} students
                  </span>
                </button>
              ))}
            </div>
          )}
        </div>
      );
    }
    return <StudentsPanel course={selected} onClose={() => setStudentsCourseId(null)} />;
  };

  const renderProfile = () => <TeacherProfilePanel onClose={() => setActiveTab("overview")} />;

  return (
    <div className="dash-theme">
      <SEOHead
        titleKey={t("pages.teacher.TeacherDashboard.seo.title")}
        descriptionKey={t("pages.teacher.TeacherDashboard.seo.description")}
      />
      <DashboardShell
        navItems={navItems}
        roleBadge={t("pages.teacher.TeacherDashboard.badge")}
        title={t("pages.teacher.TeacherDashboard.navOverview")}
      >
        <section className="dash-header-block px-gutter pb-24 pt-8 md:px-gutter-lg md:pb-28 md:pt-10">
          <div className="mx-auto flex max-w-shell flex-wrap items-end justify-between gap-stack">
            <div className="min-w-0">
              <p className="dash-header-eyebrow text-xs uppercase tracking-[0.2em]">
                {t("pages.teacher.TeacherDashboard.badge")}
              </p>
              <h1 className="mt-1 font-heading text-2xl leading-tight text-white md:text-3xl">
                {greeting}
              </h1>
              <p className="mt-2 max-w-prose text-sm text-white/75">
                {t("pages.teacher.TeacherDashboard.seo.description")}
              </p>
            </div>
            <button
              type="button"
              onClick={openNewCourse}
              className="inline-flex items-center gap-2 rounded-control bg-white px-4 py-2 text-sm font-medium text-[#624BFF] shadow-sm transition-transform duration-base hover:-translate-y-0.5"
            >
              <Plus size={16} /> {t("pages.teacher.TeacherDashboard.newCourse")}
            </button>
          </div>
        </section>

        <DashboardTabs tabs={tabs} activeId={activeTab} onChange={(id) => setActiveTab(id as TabId)} />

        <div className="relative z-10 -mt-16 px-gutter pb-block md:px-gutter-lg">
          <div className="mx-auto max-w-shell">
            {activeTab === "overview" ? renderOverview() : null}
            {activeTab === "courses" ? renderCourses() : null}
            {activeTab === "quizzes" ? renderQuizzes() : null}
            {activeTab === "students" ? renderStudents() : null}
            {activeTab === "leaderboard" ? <TeacherClassLeaderboardPanel courses={courses} /> : null}
            {activeTab === "calendar" ? <TeacherCalendarPanel courses={courses} /> : null}
            {activeTab === "comments" ? (
              <CommentsPanel
                courses={courses}
                initialCourseId={deepLinkedCourseId}
                onUnansweredCount={() => refreshUnanswered()}
              />
            ) : null}
            {activeTab === "reviews" ? (
              <ReviewsPanel courses={courses} onUnansweredCount={setUnansweredReviews} />
            ) : null}
            {activeTab === "profile" ? renderProfile() : null}
          </div>
        </div>
      </DashboardShell>
    </div>
  );
}

function LessonsInline({
  course,
  lessons,
  onEditQuiz,
  onViewResults,
  onLessonsChanged,
}: {
  course: Course;
  lessons: Lesson[];
  onEditQuiz: (lesson: Lesson, courseId: string) => void;
  onViewResults: (lesson: Lesson, courseId: string) => void;
  onLessonsChanged: () => void;
}) {
  const { t } = useLanguage();
  const [quizStatus, setQuizStatus] = useState<
    Record<string, { title: string; status: string; questionCount: number }>
  >({});
  const [confirmDeleteLessonId, setConfirmDeleteLessonId] = useState<string | null>(null);
  const [deletingLessonId, setDeletingLessonId] = useState<string | null>(null);

  useEffect(() => {
    quizQueries
      .getStatusByCourse(course.id)
      .then(setQuizStatus)
      .catch(() => setQuizStatus({}));
  }, [course.id, lessons.length]);

  const handleDeleteLesson = async (lesson: Lesson) => {
    setDeletingLessonId(lesson.id);
    try {
      await lessonQueries.delete(lesson.id);
      setConfirmDeleteLessonId(null);
      onLessonsChanged();
    } catch (err) {
      console.error("[delete lesson]", err);
      window.alert("Could not delete this lesson. Please try again.");
    } finally {
      setDeletingLessonId(null);
    }
  };

  if (lessons.length === 0) {
    return (
      <p className="text-sm text-slate">{t("components.teacher.LessonManagerPanel.empty")}</p>
    );
  }

  return (
    <div className="flex flex-col gap-1">
      {lessons.map((lesson, i) => {
        const status = quizStatus[lesson.id];
        const isConfirming = confirmDeleteLessonId === lesson.id;
        const isDeleting = deletingLessonId === lesson.id;
        return (
          <div
            key={lesson.id}
            className="flex flex-wrap items-center gap-tight rounded-control border border-line bg-background px-stack py-2"
          >
            <span className="flex min-w-0 flex-1 items-center gap-2 text-sm text-ink">
              <span className="text-xs text-slate">{i + 1}.</span>
              <span className="truncate">{lesson.title}</span>
            </span>
            {status ? (
              <span
                className={`inline-flex items-center gap-1 rounded-pill px-2 py-0.5 text-[10px] uppercase tracking-widest ${
                  status.status === "published"
                    ? "bg-success/15 text-success"
                    : "bg-accent/15 text-accent"
                }`}
              >
                <LayoutList size={10} /> {status.questionCount} q · {status.status}
              </span>
            ) : null}
            <button
              type="button"
              onClick={() => onEditQuiz(lesson, course.id)}
              className="shrink-0 rounded-control border border-line px-3 py-1 text-xs text-ink hover:border-accent hover:text-accent"
            >
              {status ? "Edit quiz" : "Add quiz"}
            </button>
            {status ? (
              <button
                type="button"
                onClick={() => onViewResults(lesson, course.id)}
                className="shrink-0 rounded-control bg-accent/10 px-3 py-1 text-xs text-accent hover:bg-accent/20"
              >
                Results
              </button>
            ) : null}

            {isConfirming ? (
              <div className="flex shrink-0 items-center gap-1">
                <button
                  type="button"
                  onClick={() => handleDeleteLesson(lesson)}
                  disabled={isDeleting}
                  className="rounded-control bg-danger px-2.5 py-1 text-[11px] font-medium text-danger-foreground hover:opacity-90 disabled:opacity-60"
                >
                  {isDeleting ? "Deleting…" : "Yes"}
                </button>
                <button
                  type="button"
                  onClick={() => setConfirmDeleteLessonId(null)}
                  className="rounded-control border border-line px-2.5 py-1 text-[11px] text-slate hover:text-ink"
                >
                  No
                </button>
              </div>
            ) : (
              <button
                type="button"
                onClick={() => setConfirmDeleteLessonId(lesson.id)}
                title="Delete lesson"
                aria-label="Delete lesson"
                className="shrink-0 rounded-control p-1.5 text-danger hover:bg-danger/10"
              >
                <Trash2 size={14} />
              </button>
            )}
          </div>
        );
      })}
      <p className="mt-2 text-xs text-slate">
        Full lesson authoring lives in the Course editor → Curriculum step.
      </p>
    </div>
  );
}
