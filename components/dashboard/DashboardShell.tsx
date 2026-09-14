import { useEffect, useRef, useState, type ComponentType, type ReactNode } from "react";
import { Link } from "react-router-dom";
import { Menu, LogOut, ArrowLeft, Search, PanelLeftClose, PanelLeftOpen } from "lucide-react";
import { useAuth, displayNameFor } from "@/context/AuthContext";
import { useLanguage } from "@/context/LanguageContext";
import NotificationBell from "@/components/ui/NotificationBell";
import Avatar from "@/components/ui/Avatar";
import ThemeToggle from "@/components/dashboard/ThemeToggle";
import {
  getStoredTheme,
  setStoredTheme,
  getStoredSidebarCollapsed,
  setStoredSidebarCollapsed,
  type DashboardTheme,
} from "@/lib/theme";
import images from "@/assets/images.json";

export interface DashboardNavItem {
  id: string;
  label: string;
  icon: ComponentType<{ size?: number; className?: string; "aria-hidden"?: boolean | "true" | "false" }>;
  onClick: () => void;
  active?: boolean;
  badge?: string | number;
}

/**
 * DashUI-style shell. Dark sidebar rail (#212B36, #0D1319 in dark mode),
 * white topbar, content canvas. Two extra features vs. the earlier version:
 *   * sidebar collapses to an icon-only rail (persisted per device)
 *   * theme toggle (light/dark) in the sidebar footer, affecting only the
 *     content area — the rail stays dark either way, matching DashUI Pro.
 */
export default function DashboardShell({
  navItems,
  roleBadge,
  title,
  subtitle,
  hideTopbar = false,
  children,
}: {
  navItems: DashboardNavItem[];
  roleBadge: string;
  title?: string;
  subtitle?: string;
  /**
   * When true, the sticky topbar is not rendered. Used by LearnLayout so
   * the lesson player can own the full viewport height without fighting
   * the topbar for the sticky position on mobile.
   */
  hideTopbar?: boolean;
  children: ReactNode;
}) {
  const { t } = useLanguage();
  const { user, profile, signOut } = useAuth();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [collapsed, setCollapsed] = useState<boolean>(() => getStoredSidebarCollapsed());
  const [theme, setTheme] = useState<DashboardTheme>(() => getStoredTheme());
  const [profileMenuOpen, setProfileMenuOpen] = useState(false);
  const profileMenuRef = useRef<HTMLDivElement>(null);
  const name = displayNameFor(user, profile);

  useEffect(() => {
    const onClick = (event: MouseEvent) => {
      if (profileMenuRef.current && !profileMenuRef.current.contains(event.target as Node)) {
        setProfileMenuOpen(false);
      }
    };
    document.addEventListener("mousedown", onClick);
    return () => document.removeEventListener("mousedown", onClick);
  }, []);

  const toggleCollapsed = () => {
    setCollapsed(c => {
      const next = !c;
      setStoredSidebarCollapsed(next);
      return next;
    });
  };

  const changeTheme = (next: DashboardTheme) => {
    setTheme(next);
    setStoredTheme(next);
  };

  const sidebarContent = (
    <div className="flex h-full flex-col">
      {/* Brand */}
      <div className={`flex items-center border-b border-white/10 ${collapsed ? "justify-center py-4" : "gap-2.5 px-5 py-5"}`}>
        <Link to="/" className="flex items-center gap-2.5">
          <img src={images["logo"]} alt="" className="dash-logo-invert h-8 w-8 shrink-0" />
          <span className="dash-hide-collapsed dash-sidebar-brand-text font-heading text-base font-medium">
            {t("components.layout.Header.brand")}
          </span>
        </Link>
      </div>

      {/* Nav */}
      <nav className={`flex-1 overflow-y-auto ${collapsed ? "px-2 py-3" : "px-3 py-4"}`}>
        <p className="dash-sidebar-heading mb-2 px-2">Menu</p>
        <ul className="flex flex-col gap-1">
          {navItems.map(item => {
            const Icon = item.icon;
            return (
              <li key={item.id}>
                <button
                  type="button"
                  data-active={item.active ? "true" : "false"}
                  onClick={() => {
                    item.onClick();
                    setSidebarOpen(false);
                  }}
                  className="dash-nav-link flex w-full items-center gap-3 rounded-control px-3 py-2 text-left text-sm"
                  title={collapsed ? item.label : undefined}
                >
                  <Icon size={17} aria-hidden="true" />
                  <span className="dash-hide-collapsed flex-1 truncate">{item.label}</span>
                  {item.badge ? (
                    <span className="dash-hide-collapsed rounded-pill bg-[rgba(98,75,255,0.28)] px-2 py-0.5 text-[10px] font-medium text-white">
                      {item.badge}
                    </span>
                  ) : null}
                </button>
              </li>
            );
          })}
        </ul>
      </nav>

      {/* Footer — theme toggle + collapse + back to site */}
      <div className="dash-sidebar-divider border-t p-3">
        <div className={`mb-2 flex items-center ${collapsed ? "justify-center" : "justify-between gap-2"}`}>
          {!collapsed ? <ThemeToggle theme={theme} onChange={changeTheme} /> : null}
          <button
            type="button"
            onClick={toggleCollapsed}
            aria-label={collapsed ? "Expand sidebar" : "Collapse sidebar"}
            className="dash-sidebar-back hidden items-center justify-center rounded-control p-2 text-[color:var(--dash-sidebar-fg)] transition-colors duration-200 hover:bg-white/10 hover:text-white lg:flex"
          >
            {collapsed ? <PanelLeftOpen size={16} /> : <PanelLeftClose size={16} />}
          </button>
        </div>
        {collapsed ? (
          <div className="mb-2 flex justify-center">
            <ThemeToggle theme={theme} onChange={changeTheme} />
          </div>
        ) : null}
        <Link
          to="/"
          className="dash-sidebar-back flex items-center gap-3 rounded-control px-3 py-2 text-sm text-[color:var(--dash-sidebar-fg)] transition-colors duration-200"
          title={collapsed ? t("components.dashboard.DashboardShell.backToSite") : undefined}
        >
          <ArrowLeft size={16} aria-hidden="true" />
          <span className="dash-hide-collapsed">{t("components.dashboard.DashboardShell.backToSite")}</span>
        </Link>
      </div>
    </div>
  );

  return (
    <div className="dash-theme" data-theme={theme}>
      <div className="flex min-h-screen bg-mist text-ink">
        {/* Desktop sidebar (collapsible) */}
        <aside
          className="dash-sidebar hidden shrink-0 lg:block"
          data-collapsed={collapsed ? "true" : "false"}
        >
          <div className="sticky top-0 h-screen">{sidebarContent}</div>
        </aside>

        {/* Mobile drawer (always expanded) */}
        {sidebarOpen ? (
          <div className="fixed inset-0 z-50 lg:hidden">
            <div className="absolute inset-0 bg-ink/50 backdrop-blur-sm" onClick={() => setSidebarOpen(false)} aria-hidden="true" />
            <div className="dash-sidebar relative h-full w-72">{sidebarContent}</div>
          </div>
        ) : null}

        <div className="flex min-w-0 flex-1 flex-col">
          {/* Topbar — suppressed on routes that render their own header */}
          {!hideTopbar ? (
          <header className="z-30 flex items-center gap-3 border-b border-line bg-background px-gutter py-2.5 md:px-gutter-lg">
            <button
              type="button"
              onClick={() => setSidebarOpen(true)}
              aria-label={t("components.dashboard.DashboardShell.openSidebar")}
              className="dash-mobile-menu inline-flex h-11 w-11 shrink-0 items-center justify-center rounded-control border border-line bg-mist text-ink transition-colors duration-base hover:border-accent hover:text-accent lg:hidden"
            >
              <Menu size={20} />
            </button>

            {/* Desktop collapse button (also in topbar for discovery) */}
            <button
              type="button"
              onClick={toggleCollapsed}
              aria-label={collapsed ? "Expand sidebar" : "Collapse sidebar"}
              className="hidden rounded-control p-2 text-slate transition-colors duration-base hover:bg-mist hover:text-ink lg:block"
            >
              {collapsed ? <PanelLeftOpen size={18} /> : <PanelLeftClose size={18} />}
            </button>

            <div className="hidden min-w-0 flex-1 md:block">
              <div className="relative max-w-sm">
                <Search
                  size={15}
                  className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-slate"
                  aria-hidden="true"
                />
                <input
                  type="search"
                  placeholder={title || "Search…"}
                  className="w-full rounded-control border border-line bg-mist/60 py-2 pl-9 pr-3 text-sm text-ink outline-none transition-colors duration-base placeholder:text-slate focus:border-accent focus:bg-background"
                />
              </div>
            </div>

            <div className="ml-auto flex shrink-0 items-center gap-1.5">
              <span className="hidden rounded-pill bg-accent/10 px-2.5 py-1 text-[10px] font-semibold uppercase tracking-widest text-accent sm:inline">
                {roleBadge}
              </span>
              <NotificationBell tone="light" />
              <div className="relative" ref={profileMenuRef}>
                <button
                  type="button"
                  onClick={() => setProfileMenuOpen(open => !open)}
                  className="flex items-center gap-1.5 rounded-control p-1 transition-colors duration-base hover:bg-mist"
                  aria-label={t("components.dashboard.DashboardShell.profileMenu")}
                >
                  <Avatar name={name} src={profile?.avatar_url} size="sm" />
                </button>
                {profileMenuOpen ? (
                  <div className="card-lift absolute right-0 top-full mt-2 w-48 overflow-hidden rounded-control border border-line bg-background">
                    <div className="truncate border-b border-line px-4 py-2 text-xs text-slate">{name}</div>
                    <button
                      type="button"
                      onClick={() => {
                        setProfileMenuOpen(false);
                        signOut();
                      }}
                      className="flex w-full items-center gap-3 px-4 py-2 text-left text-sm text-ink transition-colors duration-base hover:bg-mist"
                    >
                      <LogOut size={14} aria-hidden="true" />
                      {t("components.dashboard.DashboardShell.signOut")}
                    </button>
                  </div>
                ) : null}
              </div>
            </div>
          </header>
          ) : null}

          <main className="flex-1">
            {subtitle ? (
              <p className="px-gutter pt-block text-sm text-slate md:px-gutter-lg">{subtitle}</p>
            ) : null}
            {children}
          </main>
        </div>
      </div>
    </div>
  );
}
