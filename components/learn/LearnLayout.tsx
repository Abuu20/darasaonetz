import { useEffect, useState, type ReactNode } from "react";
import { useLocation, useNavigate, useParams } from "react-router-dom";
import {
  BookOpen,
  ChevronLeft,
  Home,
  Layers,
  List,
  LogOut,
  Menu,
  User,
  X,
} from "lucide-react";
import DashboardShell, { type DashboardNavItem } from "@/components/dashboard/DashboardShell";
import NotificationBell from "@/components/ui/NotificationBell";
import { useAuth } from "@/context/AuthContext";
import { useLanguage } from "@/context/LanguageContext";
import { courseQueries, enrollmentQueries } from "@/lib/db/courses";
import type { Course, Enrollment, Lesson } from "@/lib/db/types";
import LessonNavSidebar from "@/components/learn/LessonNavSidebar";
import LessonProgressRing from "@/components/learn/LessonProgressRing";

/**
 * Layout for /learn/:id — puts the lesson player inside the DashUI shell.
 *
 * The DashboardShell topbar is suppressed here (hideTopbar) so this page
 * owns the full viewport height. The breadcrumb bar below is the only
 * header, and it is now sticky without any overlap. It carries:
 *   • ☰ (mobile only)  → opens the app navigation drawer
 *   • 📋 (mobile only) → opens the course curriculum drawer
 *   • 🔔 (mobile only) → notifications (used to live in the topbar)
 *   • breadcrumb + progress ring (always)
 *
 * On desktop, the DashboardShell sidebar handles navigation as before,
 * including its own "Back to site" link, so no topbar is missed.
 * On mobile, the app-nav drawer includes a "Back to site" entry at the
 * bottom, mirroring what the sidebar does on desktop.
 */
export default function LearnLayout({ children }: { children: ReactNode }) {
  const { id } = useParams<{ id: string }>();
  const { t } = useLanguage();
  const { user } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const [course, setCourse] = useState<Course | null>(null);
  const [lessons, setLessons] = useState<Lesson[]>([]);
  const [enrollment, setEnrollment] = useState<Enrollment | null>(null);
  const [loadingCourse, setLoadingCourse] = useState(true);
  const [curriculumOpen, setCurriculumOpen] = useState(false);
  const [appNavOpen, setAppNavOpen] = useState(false);

  const activeLessonId = new URLSearchParams(location.search).get("lesson");

  useEffect(() => {
    if (!id) return;
    setLoadingCourse(true);
    courseQueries
      .getById(id)
      .then(record => {
        setCourse(record);
        const raw = (record && Array.isArray(record.lessons) ? record.lessons : []) as Lesson[];
        setLessons([...raw].sort((a, b) => a.order_index - b.order_index));
      })
      .catch(() => setCourse(null))
      .finally(() => setLoadingCourse(false));
  }, [id]);

  useEffect(() => {
    if (!user || !id) return;
    enrollmentQueries
      .isEnrolled(user.id, id)
      .then(ok => {
        if (ok) {
          enrollmentQueries.getByStudent(user.id).then(list => {
            setEnrollment(list.find(e => e.course_id === id) ?? null);
          });
        }
      })
      .catch(() => setEnrollment(null));
  }, [user, id]);

  useEffect(() => {
    setAppNavOpen(false);
    setCurriculumOpen(false);
  }, [location.pathname, location.search]);

  const appNavItems: { id: string; label: string; icon: typeof Home; to: string; active?: boolean }[] = [
    { id: "overview", label: t("pages.Account.navOverview"), icon: Home, to: "/account" },
    { id: "courses", label: t("pages.Account.navCourses"), icon: Layers, to: "/account" },
    { id: "learn", label: t("pages.Account.navLearn"), icon: BookOpen, to: `/learn/${id}`, active: true },
    { id: "profile", label: t("pages.Account.navProfile"), icon: User, to: "/account" },
  ];

  const navItems: DashboardNavItem[] = appNavItems.map(item => ({
    id: item.id,
    label: item.label,
    icon: item.icon,
    active: item.active,
    onClick: () => navigate(item.to),
  }));

  const progressPct = (() => {
    if (!enrollment || lessons.length === 0) return 0;
    return Math.round(enrollment.progress ?? 0);
  })();

  const completedIds = (() => {
    if (!user || lessons.length === 0) return [];
    return lessons
      .filter(l => l.lesson_completions?.some(c => c.student_id === user.id))
      .map(l => l.id);
  })();

  const activeLesson = lessons.find(l => l.id === activeLessonId) ?? null;

  return (
    <DashboardShell
      navItems={navItems}
      roleBadge="Student"
      title={course?.title ?? ""}
      hideTopbar
    >
      {/* ── Sticky breadcrumb bar — the only header on this route ────── */}
      <div className="learn-breadcrumb sticky top-0 z-30 border-b border-line bg-background/95 backdrop-blur-xl">
        <div className="mx-auto flex max-w-shell items-center gap-2 px-gutter py-2 md:gap-3 md:px-gutter-lg">
          {/* Mobile: app navigation */}
          <button
            type="button"
            onClick={() => setAppNavOpen(true)}
            aria-label="Open navigation menu"
            className="learn-menu-button inline-flex h-11 w-11 shrink-0 items-center justify-center rounded-control border border-line bg-mist text-ink transition-colors duration-base hover:border-accent hover:text-accent lg:hidden"
          >
            <Menu size={20} aria-hidden="true" />
          </button>

          {/* Desktop-only: back to course page */}
          <button
            type="button"
            onClick={() => navigate(course ? `/courses/${course.id}` : "/account")}
            className="hidden shrink-0 items-center gap-1.5 rounded-control border border-line px-3 py-1.5 text-xs text-slate transition-colors duration-base hover:border-accent hover:text-ink lg:inline-flex"
          >
            <ChevronLeft size={14} aria-hidden="true" />
            <span>{t("pages.CourseDetail.back")}</span>
          </button>

          <div className="min-w-0 flex-1">
            <p className="truncate text-[10px] uppercase tracking-[0.18em] text-slate">
              {course?.categories?.name ?? t("pages.Learn.curriculum")}
            </p>
            <h1 className="truncate font-heading text-sm leading-snug text-ink">
              {loadingCourse ? "…" : course?.title ?? ""}
            </h1>
          </div>

          {/* Notifications — took over the topbar's bell so mobile students
              still see them without the topbar. */}
          <div className="shrink-0">
            <NotificationBell />
          </div>

          <LessonProgressRing progress={progressPct} size={30} strokeWidth={2.5} />

          {/* Mobile: curriculum drawer toggle */}
          <button
            type="button"
            onClick={() => setCurriculumOpen(true)}
            aria-label={t("pages.Learn.curriculum")}
            className="learn-menu-button inline-flex h-11 w-11 shrink-0 items-center justify-center rounded-control border border-line bg-mist text-ink transition-colors duration-base hover:border-accent hover:text-accent lg:hidden"
          >
            <List size={18} aria-hidden="true" />
          </button>
        </div>
      </div>

      {/* ── Main body ─────────────────────────────────────────────────── */}
      <div className="mx-auto grid max-w-shell grid-cols-1 gap-block px-gutter py-block md:px-gutter-lg lg:grid-cols-[minmax(0,1fr)_minmax(280px,340px)] lg:items-start">
        <div className="min-w-0">{children}</div>

        {course ? (
          <aside className="hidden lg:sticky lg:top-24 lg:block">
            <div className="card-lift flex max-h-[calc(100vh-8rem)] flex-col overflow-hidden rounded-card border border-line bg-background">
              <LessonNavSidebar
                course={course}
                lessons={lessons}
                activeLesson={activeLesson}
                completedIds={completedIds}
                progressPct={progressPct}
                onSelect={lessonId => {
                  navigate(`/learn/${course.id}?lesson=${lessonId}`, { replace: true });
                }}
              />
            </div>
          </aside>
        ) : null}
      </div>

      {/* ── App navigation drawer ─────────────────────────────────────── */}
      {appNavOpen ? (
        <div className="fixed inset-0 z-[70] lg:hidden">
          <button
            type="button"
            aria-label="Close navigation"
            onClick={() => setAppNavOpen(false)}
            className="absolute inset-0 bg-ink/60 backdrop-blur-sm"
          />
          <div className="absolute inset-y-0 left-0 flex w-72 max-w-[85vw] flex-col bg-background shadow-xl">
            <div className="flex items-center justify-between border-b border-line px-4 py-4">
              <span className="font-heading text-base text-ink">Menu</span>
              <button
                type="button"
                onClick={() => setAppNavOpen(false)}
                aria-label="Close navigation"
                className="flex h-10 w-10 items-center justify-center rounded-control text-slate hover:bg-mist hover:text-ink"
              >
                <X size={20} />
              </button>
            </div>
            <nav className="flex flex-1 flex-col gap-1 overflow-y-auto p-3">
              {appNavItems.map(item => {
                const Icon = item.icon;
                return (
                  <button
                    key={item.id}
                    type="button"
                    onClick={() => {
                      navigate(item.to);
                      setAppNavOpen(false);
                    }}
                    data-active={item.active ? "true" : "false"}
                    className={`flex items-center gap-3 rounded-control px-3 py-3 text-left text-sm transition-colors duration-base ${
                      item.active
                        ? "bg-accent/10 font-medium text-accent"
                        : "text-slate hover:bg-mist hover:text-ink"
                    }`}
                  >
                    <Icon size={18} aria-hidden="true" />
                    <span>{item.label}</span>
                  </button>
                );
              })}
            </nav>
            {/* Footer — matches the desktop sidebar's bottom block,
                including its own "Back to site" link. */}
            <div className="border-t border-line p-3">
              <button
                type="button"
                onClick={() => {
                  navigate("/");
                  setAppNavOpen(false);
                }}
                className="flex w-full items-center gap-3 rounded-control px-3 py-3 text-sm text-slate hover:bg-mist hover:text-ink"
              >
                <LogOut size={18} aria-hidden="true" />
                <span>{t("components.dashboard.DashboardShell.backToSite")}</span>
              </button>
            </div>
          </div>
        </div>
      ) : null}

      {/* ── Curriculum drawer ─────────────────────────────────────────── */}
      {curriculumOpen && course ? (
        <div className="fixed inset-0 z-[70] lg:hidden">
          <button
            type="button"
            aria-label={t("pages.Learn.closeSidebar")}
            onClick={() => setCurriculumOpen(false)}
            className="absolute inset-0 bg-ink/60 backdrop-blur-sm"
          />
          <div className="absolute inset-y-0 right-0 flex w-80 max-w-[85vw] flex-col bg-background shadow-xl">
            <div className="flex items-center justify-between border-b border-line px-4 py-4">
              <span className="font-heading text-sm text-ink">
                {t("pages.Learn.curriculum")}
              </span>
              <button
                type="button"
                onClick={() => setCurriculumOpen(false)}
                aria-label={t("pages.Learn.closeSidebar")}
                className="flex h-10 w-10 items-center justify-center rounded-control text-slate hover:bg-mist hover:text-ink"
              >
                <X size={20} />
              </button>
            </div>
            <div className="min-h-0 flex-1 overflow-y-auto">
              <LessonNavSidebar
                course={course}
                lessons={lessons}
                activeLesson={activeLesson}
                completedIds={completedIds}
                progressPct={progressPct}
                onSelect={lessonId => {
                  navigate(`/learn/${course.id}?lesson=${lessonId}`, { replace: true });
                  setCurriculumOpen(false);
                }}
                onClose={() => setCurriculumOpen(false)}
              />
            </div>
          </div>
        </div>
      ) : null}
    </DashboardShell>
  );
}
