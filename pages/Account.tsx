import { useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { Home, BookOpen, ClipboardCheck, User, GraduationCap, PlayCircle, CalendarDays, Trophy } from "lucide-react";
import SEOHead from "@/components/seo/SEOHead";
import { useAuth } from "@/context/AuthContext";
import { useLanguage } from "@/context/LanguageContext";
import AuthModal from "@/components/auth/AuthModal";
import DashboardShell, { type DashboardNavItem } from "@/components/dashboard/DashboardShell";
import DashboardTabs, { type DashboardTab } from "@/components/dashboard/DashboardTabs";
import StudentOverviewPanel from "@/components/student/StudentOverviewPanel";
import StudentCoursesPanel from "@/components/student/StudentCoursesPanel";
import StudentQuizzesPanel from "@/components/student/StudentQuizzesPanel";
import StudentProfilePanel from "@/components/student/StudentProfilePanel";
import StudentLearnPanel from "@/components/student/StudentLearnPanel";
import StudentCalendarPanel from "@/components/student/StudentCalendarPanel";
import StudentLeaderboardPanel from "@/components/student/StudentLeaderboardPanel";
import images from "@/assets/images.json";

type TabId = "overview" | "learn" | "courses" | "calendar" | "quizzes" | "leaderboard" | "profile";

export default function Account() {
  const { t } = useLanguage();
  const { user, profile, isLoading, isTeacher, isAdmin } = useAuth();
  const [authOpen, setAuthOpen] = useState(false);
  const [activeTab, setActiveTab] = useState<TabId>("overview");

  // Tabs and nav items share their labels/icons; tabs also get badges
  // where useful. `useMemo` because DashboardTabs/DashboardShell are
  // re-rendered on tab switch and we don't want new arrays each time.
  const tabs: DashboardTab[] = useMemo(
    () => [
      { id: "overview", label: t("pages.Account.navOverview"), icon: Home },
      { id: "learn", label: "Learn", icon: PlayCircle },
      { id: "courses", label: t("pages.Account.pathHeading"), icon: BookOpen },
      { id: "calendar", label: "Calendar", icon: CalendarDays },
      { id: "quizzes", label: "Quizzes", icon: ClipboardCheck },
      { id: "leaderboard", label: "Leaderboard", icon: Trophy },
      { id: "profile", label: "Profile", icon: User },
    ],
    [t]
  );

  const navItems: DashboardNavItem[] = useMemo(
    () =>
      tabs.map(tab => ({
        id: tab.id,
        label: tab.label,
        icon: tab.icon!,
        onClick: () => setActiveTab(tab.id as TabId),
        active: activeTab === tab.id,
      })),
    [tabs, activeTab]
  );

  // Signed-out: keep the marketing-style gate.
  if (!isLoading && !user) {
    return (
      <>
        <SEOHead titleKey={t("pages.Account.seo.title")} descriptionKey={t("pages.Account.seo.description")} />
        <main className="flex min-h-screen flex-col items-center justify-center gap-stack bg-night px-gutter text-center text-night-foreground">
          <img src={images["logo"]} data-image-id="logo" alt={t("pages.Account.logoAlt")} className="h-12 w-12" />
          <h1 data-text-id="pages.Account.signedOutTitle" className="font-heading text-2xl">
            {t("pages.Account.signedOutTitle")}
          </h1>
          <p data-text-id="pages.Account.signedOutBody" className="max-w-prose text-sm text-lilac">
            {t("pages.Account.signedOutBody")}
          </p>
          <button
            onClick={() => setAuthOpen(true)}
            className="gradient-brand rounded-control px-block py-tight text-sm text-primary-foreground transition-all duration-base hover:scale-hover active:scale-active"
          >
            <span data-text-id="pages.Account.signIn">{t("pages.Account.signIn")}</span>
          </button>
        </main>
        <AuthModal isOpen={authOpen} onClose={() => setAuthOpen(false)} />
      </>
    );
  }

  if (isLoading || !user) {
    return (
      <main className="dash-theme flex min-h-screen items-center justify-center bg-mist">
        <div className="h-10 w-10 animate-spin rounded-pill border-4 border-line border-t-accent" />
      </main>
    );
  }

  const greeting = `${t("pages.Account.welcome")}${profile?.full_name ? `, ${profile.full_name.split(" ")[0]}` : ""}`;

  return (
    <div className="dash-theme">
      <SEOHead titleKey={t("pages.Account.seo.title")} descriptionKey={t("pages.Account.seo.description")} />
      <DashboardShell
        navItems={navItems}
        roleBadge={isTeacher ? t("pages.teacher.TeacherDashboard.badge") : isAdmin ? "Admin" : "Student"}
        title={t("pages.Account.welcome")}
      >
        {/* Violet header — same shape as the teacher dashboard */}
        <section className="dash-header-block px-gutter pb-24 pt-8 md:px-gutter-lg md:pb-28 md:pt-10">
          <div className="mx-auto flex max-w-shell flex-wrap items-end justify-between gap-stack">
            <div className="min-w-0">
              <p className="dash-header-eyebrow text-xs uppercase tracking-[0.2em]">
                {isTeacher ? t("pages.teacher.TeacherDashboard.badge") : "Student"}
              </p>
              <h1 className="mt-1 font-heading text-2xl leading-tight text-white md:text-3xl">
                {greeting}
              </h1>
              <p className="mt-2 max-w-prose text-sm text-white/75">
                {t("pages.Account.seo.description")}
              </p>
            </div>

            {/* Small banner for a teacher browsing their learner view —
                a quick jump back to their teaching dashboard. */}
            {isTeacher ? (
              <Link
                to="/teacher"
                className="inline-flex items-center gap-2 rounded-control bg-white px-4 py-2 text-sm font-medium text-[#624BFF] shadow-sm transition-transform duration-base hover:-translate-y-0.5"
              >
                <GraduationCap size={16} />
                Teaching dashboard
              </Link>
            ) : null}
          </div>
        </section>

        <DashboardTabs
          tabs={tabs}
          activeId={activeTab}
          onChange={id => setActiveTab(id as TabId)}
        />

        <div className="relative z-10 -mt-16 px-gutter pb-block md:px-gutter-lg">
          <div className="mx-auto max-w-shell">
            {activeTab === "overview" ? <StudentOverviewPanel /> : null}
            {activeTab === "learn" ? <StudentLearnPanel /> : null}
            {activeTab === "courses" ? <StudentCoursesPanel /> : null}
            {activeTab === "calendar" ? <StudentCalendarPanel /> : null}
            {activeTab === "quizzes" ? <StudentQuizzesPanel /> : null}
            {activeTab === "leaderboard" ? <StudentLeaderboardPanel /> : null}
            {activeTab === "profile" ? <StudentProfilePanel /> : null}
          </div>
        </div>
      </DashboardShell>

      <AuthModal isOpen={authOpen} onClose={() => setAuthOpen(false)} />
    </div>
  );
}
