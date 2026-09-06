import { useEffect, useRef, useState } from "react";
import { Link, useLocation } from "react-router-dom";
import { Menu, Search, X } from "lucide-react";
import { useAuth, displayNameFor } from "@/context/AuthContext";
import { useLanguage } from "@/context/LanguageContext";
import AuthModal from "@/components/auth/AuthModal";
import { onOpenAuthModal, type AuthModalRequest } from "@/lib/authModalBus";
import ContactButton from "@/components/ui/ContactButton";
import NotificationBell from "@/components/ui/NotificationBell";
import StreakBadge from "@/components/streaks/StreakBadge";
import LanguageSwitcher from "@/components/layout/LanguageSwitcher";
import images from "@/assets/images.json";

const NAV_ITEMS = [
  { id: "courses", to: "/courses", labelKey: "components.layout.Header.navCourses" },
  { id: "games", to: "/games", labelKey: "components.layout.Header.navGames" },
  { id: "tools", to: "/tools", labelKey: "components.layout.Header.navTools" },
  { id: "about", to: "/about", labelKey: "components.layout.Header.navAbout" },
  { id: "teach", to: "/about#teach", labelKey: "components.layout.Header.navTeach" },
  { id: "contact", to: "/contact", labelKey: "components.layout.Header.navContact" },
] as const;

export default function Header() {
  const { t } = useLanguage();
  const { user, profile, isTeacher, isAdmin, signOut } = useAuth();
  const { pathname } = useLocation();
  const [scrolled, setScrolled] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [authOpen, setAuthOpen] = useState(false);
  const [authRequest, setAuthRequest] = useState<AuthModalRequest>({});
  const [menuOpen, setMenuOpen] = useState(false);
  const [avatarFailed, setAvatarFailed] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 20);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  useEffect(() => {
    setMobileOpen(false);
  }, [pathname]);

  useEffect(() => {
    if (user && authOpen) setAuthOpen(false);
  }, [user]);

  // Lets any page (the About page's "Apply to teach" CTA, for one) open
  // this same header-owned modal already set to sign-up + teacher, instead
  // of duplicating the whole auth form somewhere else.
  useEffect(() => {
    return onOpenAuthModal(request => {
      setAuthRequest(request);
      setAuthOpen(true);
    });
  }, []);

  useEffect(() => {
    const onClickOutside = (event: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) setMenuOpen(false);
    };
    document.addEventListener("mousedown", onClickOutside);
    return () => document.removeEventListener("mousedown", onClickOutside);
  }, []);

  return (
    <header className="fixed left-0 right-0 top-4 z-50 flex justify-center px-gutter">
      <nav
        className={`w-full rounded-panel bg-background shadow-lg transition-all duration-slow ease-in-out ${
          scrolled ? "max-w-3xl" : "max-w-shell"
        }`}
      >
        <div className={`flex items-center justify-between gap-stack ${scrolled ? "pl-stack pr-2 py-1.5" : "pl-block pr-2 py-1.5"}`}>
          <Link to="/" className="flex items-center gap-tight" aria-label={t("components.layout.Header.home")}>
            <img src={images["logo"]} data-image-id="logo" alt={t("components.layout.Header.logoAlt")} className="h-8 w-8" />
            <span data-text-id="components.layout.Header.brand" className="font-heading text-lg text-ink">
              {t("components.layout.Header.brand")}
            </span>
          </Link>

          <div className={`hidden items-center md:flex ${scrolled ? "gap-0" : "gap-1"}`}>
            {NAV_ITEMS.map(item => (
              <Link
                key={item.id}
                to={item.to}
                className={`rounded-control text-sm text-ink transition-all duration-base hover:bg-mist ${
                  scrolled ? "px-2 py-1.5" : "px-stack py-tight"
                }`}
              >
                <span data-text-id={item.labelKey}>{t(item.labelKey)}</span>
              </Link>
            ))}
          </div>

          <div className="flex items-center gap-1">
            <Link
              to="/courses"
              aria-label={t("components.layout.Header.search")}
              className="hidden h-10 w-10 items-center justify-center rounded-control text-ink transition-colors duration-base hover:bg-mist md:flex"
            >
              <Search size={20} />
            </Link>

            {user ? (
              <>
                <StreakBadge />
                <NotificationBell />
                <div className="relative" ref={menuRef}>
                  <button
                    onClick={() => setMenuOpen(open => !open)}
                    className="flex h-10 w-10 items-center justify-center overflow-hidden rounded-pill text-sm text-primary-foreground"
                    aria-label={t("components.layout.Header.account")}
                  >
                    {profile?.avatar_url && !avatarFailed ? (
                      <img src={profile.avatar_url} alt="" onError={() => setAvatarFailed(true)} className="h-10 w-10 rounded-pill object-cover" />
                    ) : (
                      <span className="gradient-brand flex h-10 w-10 items-center justify-center rounded-pill">
                        {displayNameFor(user, profile).charAt(0).toUpperCase()}
                      </span>
                    )}
                  </button>
                  {menuOpen ? (
                    <div className="absolute right-0 mt-2 w-56 overflow-hidden rounded-panel border border-line bg-background py-1 shadow-lg">
                      <p className="border-b border-line px-stack py-tight text-xs text-slate">{displayNameFor(user, profile)}</p>
                      {isTeacher ? (
                        <Link
                          to="/teacher"
                          onClick={() => setMenuOpen(false)}
                          className="block px-stack py-tight text-sm text-ink transition-colors duration-base hover:bg-mist"
                        >
                          <span data-text-id="components.layout.Header.teacherDashboard">{t("components.layout.Header.teacherDashboard")}</span>
                        </Link>
                      ) : null}
                      {isAdmin ? (
                        <Link
                          to="/admin/messages"
                          onClick={() => setMenuOpen(false)}
                          className="block px-stack py-tight text-sm text-ink transition-colors duration-base hover:bg-mist"
                        >
                          <span data-text-id="components.layout.Header.contactMessages">{t("components.layout.Header.contactMessages")}</span>
                        </Link>
                      ) : null}
                      <Link
                        to="/account"
                        onClick={() => setMenuOpen(false)}
                        className="block px-stack py-tight text-sm text-ink transition-colors duration-base hover:bg-mist"
                      >
                        <span data-text-id="components.layout.Header.dashboard">{t("components.layout.Header.dashboard")}</span>
                      </Link>
                      <button
                        onClick={() => {
                          signOut();
                          setMenuOpen(false);
                        }}
                        className="block w-full px-stack py-tight text-left text-sm text-ink transition-colors duration-base hover:bg-mist"
                      >
                        <span data-text-id="components.layout.Header.signOut">{t("components.layout.Header.signOut")}</span>
                      </button>
                    </div>
                  ) : null}
                </div>
              </>
            ) : (
              <button
                onClick={() => {
                  setAuthRequest({});
                  setAuthOpen(true);
                }}
                className="hidden rounded-control px-stack py-tight text-sm text-ink transition-colors duration-base hover:bg-mist md:block"
              >
                <span data-text-id="components.layout.Header.signIn">{t("components.layout.Header.signIn")}</span>
              </button>
            )}

            <div className="hidden md:block">
              <LanguageSwitcher />
            </div>

            <ContactButton to="/courses" label={t("components.layout.Header.cta")} className="hidden md:inline-flex" />

            <button
              type="button"
              onClick={() => setMobileOpen(open => !open)}
              className="flex h-10 w-10 items-center justify-center rounded-control text-ink transition-colors duration-base hover:bg-mist md:hidden"
              aria-label={t("components.layout.Header.menu")}
              aria-expanded={mobileOpen}
            >
              {mobileOpen ? <X size={20} /> : <Menu size={20} />}
            </button>
          </div>
        </div>

        {mobileOpen ? (
          <div className="flex flex-col gap-tight border-t border-line px-stack pb-stack pt-tight md:hidden">
            {NAV_ITEMS.map(item => (
              <Link
                key={item.id}
                to={item.to}
                className="rounded-control px-stack py-tight text-center text-sm text-ink transition-colors duration-base hover:bg-mist"
              >
                <span data-text-id={item.labelKey}>{t(item.labelKey)}</span>
              </Link>
            ))}
            {user ? (
              <>
                {isTeacher ? (
                  <Link
                    to="/teacher"
                    className="rounded-control px-stack py-tight text-center text-sm text-ink transition-colors duration-base hover:bg-mist"
                  >
                    <span data-text-id="components.layout.Header.teacherDashboard">{t("components.layout.Header.teacherDashboard")}</span>
                  </Link>
                ) : null}
                {isAdmin ? (
                  <Link
                    to="/admin/messages"
                    className="rounded-control px-stack py-tight text-center text-sm text-ink transition-colors duration-base hover:bg-mist"
                  >
                    <span data-text-id="components.layout.Header.contactMessages">{t("components.layout.Header.contactMessages")}</span>
                  </Link>
                ) : null}
                <Link
                  to="/account"
                  className="rounded-control px-stack py-tight text-center text-sm text-ink transition-colors duration-base hover:bg-mist"
                >
                  <span data-text-id="components.layout.Header.dashboard">{t("components.layout.Header.dashboard")}</span>
                </Link>
              </>
            ) : (
              <button
                onClick={() => {
                  setAuthRequest({});
                  setAuthOpen(true);
                  setMobileOpen(false);
                }}
                className="rounded-control px-stack py-tight text-center text-sm text-ink transition-colors duration-base hover:bg-mist"
              >
                <span data-text-id="components.layout.Header.signIn">{t("components.layout.Header.signIn")}</span>
              </button>
            )}
            <div className="flex justify-center py-tight">
              <LanguageSwitcher />
            </div>
            <ContactButton to="/courses" label={t("components.layout.Header.cta")} className="w-full" />
          </div>
        ) : null}
      </nav>

      <AuthModal
        isOpen={authOpen}
        onClose={() => setAuthOpen(false)}
        initialMode={authRequest.mode}
        initialRole={authRequest.role}
      />
    </header>
  );
}
