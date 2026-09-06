import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { BookOpen, GraduationCap, Trophy, TrendingUp } from "lucide-react";
import SEOHead from "@/components/seo/SEOHead";
import { useAuth, displayNameFor } from "@/context/AuthContext";
import { useLanguage } from "@/context/LanguageContext";
import AuthModal from "@/components/auth/AuthModal";
import AvatarUpload from "@/components/account/AvatarUpload";
import { enrollmentQueries } from "@/lib/db/courses";
import StreakWidget from "@/components/streaks/StreakWidget";
import type { Enrollment } from "@/lib/db/types";
import images from "@/assets/images.json";

function courseProgress(enrollment: Enrollment): number {
  return Math.round(enrollment.progress ?? 0);
}

export default function Account() {
  const { t } = useLanguage();
  const { user, profile, isLoading, isTeacher, signOut } = useAuth();
  const [authOpen, setAuthOpen] = useState(false);
  const [enrollments, setEnrollments] = useState<Enrollment[]>([]);
  const [dataLoading, setDataLoading] = useState(false);

  useEffect(() => {
    if (!user) return;
    setDataLoading(true);
    enrollmentQueries
      .getByStudent(user.id)
      .then(setEnrollments)
      .catch(() => setEnrollments([]))
      .finally(() => setDataLoading(false));
  }, [user]);

  if (isLoading) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-night">
        <div className="h-10 w-10 animate-spin rounded-pill border-4 border-hairline border-t-accent" />
      </main>
    );
  }

  if (!user) {
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

  const averageProgress =
    enrollments.length > 0
      ? Math.round(enrollments.reduce((total, item) => total + courseProgress(item), 0) / enrollments.length)
      : 0;

  return (
    <>
      <SEOHead titleKey={t("pages.Account.seo.title")} descriptionKey={t("pages.Account.seo.description")} />
      <main className="min-h-screen bg-night px-gutter py-section-spacing-mobile text-night-foreground md:px-gutter-lg md:py-section-spacing">
        <div className="mx-auto flex max-w-shell flex-col gap-block">
          <div className="flex flex-col items-center gap-stack rounded-card border border-hairline bg-panel p-block text-center md:flex-row md:items-center md:text-left">
            <AvatarUpload />
            <div className="flex flex-1 flex-col gap-1">
              <span data-text-id="pages.Account.welcome" className="text-xs uppercase tracking-widest text-lavender">
                {t("pages.Account.welcome")}
              </span>
              <h1 className="font-heading text-2xl">{displayNameFor(user, profile)}</h1>
              <p className="text-sm text-lilac">{user.email}</p>
            </div>
            <div className="flex flex-col gap-tight sm:flex-row">
              {isTeacher ? (
                <Link
                  to="/teacher"
                  className="rounded-control border border-accent px-stack py-tight text-sm text-night-foreground transition-colors duration-base hover:bg-accent/10"
                >
                  <span data-text-id="pages.Account.teacherDashboard">{t("pages.Account.teacherDashboard")}</span>
                </Link>
              ) : null}
              <button
                onClick={signOut}
                className="rounded-control border border-hairline px-stack py-tight text-sm text-night-foreground transition-colors duration-base hover:border-accent"
              >
                <span data-text-id="pages.Account.signOut">{t("pages.Account.signOut")}</span>
              </button>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-stack sm:grid-cols-4">
            <div className="flex flex-col gap-1 rounded-card border border-hairline bg-panel p-block">
              <Trophy size={18} className="text-accent" aria-hidden="true" />
              <span className="font-heading text-3xl">{profile?.total_points ?? 0}</span>
              <span data-text-id="pages.Account.statPoints" className="text-xs uppercase tracking-widest text-lavender">
                {t("pages.Account.statPoints")}
              </span>
            </div>
            <div className="flex flex-col gap-1 rounded-card border border-hairline bg-panel p-block">
              <GraduationCap size={18} className="text-accent" aria-hidden="true" />
              <span className="font-heading text-3xl">{enrollments.length}</span>
              <span data-text-id="pages.Account.statCourses" className="text-xs uppercase tracking-widest text-lavender">
                {t("pages.Account.statCourses")}
              </span>
            </div>
            <div className="flex flex-col gap-1 rounded-card border border-hairline bg-panel p-block">
              <TrendingUp size={18} className="text-accent" aria-hidden="true" />
              <span className="font-heading text-3xl">{averageProgress}%</span>
              <span data-text-id="pages.Account.statProgress" className="text-xs uppercase tracking-widest text-lavender">
                {t("pages.Account.statProgress")}
              </span>
            </div>
            <div className="flex flex-col gap-1 rounded-card border border-hairline bg-panel p-block">
              <BookOpen size={18} className="text-accent" aria-hidden="true" />
              <span className="font-heading text-3xl">
                {enrollments.reduce((total, e) => total + (Array.isArray(e.courses?.lessons) ? e.courses!.lessons!.length : 0), 0)}
              </span>
              <span data-text-id="pages.Account.statLessons" className="text-xs uppercase tracking-widest text-lavender">
                {t("pages.Account.statLessons")}
              </span>
            </div>
          </div>

          <StreakWidget />

          <section className="flex flex-col gap-stack">
            <h2 data-text-id="pages.Account.pathHeading" className="font-heading text-lg">
              {t("pages.Account.pathHeading")}
            </h2>
            {dataLoading ? (
              <div className="h-32 animate-pulse rounded-card bg-panel" />
            ) : enrollments.length === 0 ? (
              <div className="flex flex-col items-start gap-stack rounded-card border border-hairline bg-panel p-block">
                <img src={images["account.empty"]} data-image-id="account.empty" alt="" aria-hidden="true" className="h-40 w-full max-w-sm rounded-panel object-cover" />
                <p data-text-id="pages.Account.pathEmpty" className="text-sm text-lilac">
                  {t("pages.Account.pathEmpty")}
                </p>
                <Link to="/courses" className="gradient-brand rounded-control px-stack py-tight text-sm text-primary-foreground">
                  {t("pages.Account.browseCourses")}
                </Link>
              </div>
            ) : (
              <div className="flex flex-col gap-tight">
                {enrollments.map(item => {
                  const progress = courseProgress(item);
                  return (
                    <Link
                      key={item.id}
                      to={`/courses/${item.course_id}`}
                      className="flex flex-col gap-tight rounded-card border border-hairline bg-panel/60 px-block py-stack text-left transition-colors duration-base hover:border-accent"
                    >
                      <div className="flex flex-wrap items-center justify-between gap-tight">
                        <span className="font-heading text-base">{item.courses?.title ?? ""}</span>
                        <span className="text-xs text-lavender">{progress}%</span>
                      </div>
                      <div className="h-2 w-full overflow-hidden rounded-pill bg-hairline">
                        <div className="gradient-brand h-full rounded-pill transition-all duration-slow" style={{ width: `${Math.min(progress, 100)}%` }} />
                      </div>
                    </Link>
                  );
                })}
              </div>
            )}
          </section>
        </div>
      </main>
    </>
  );
}
