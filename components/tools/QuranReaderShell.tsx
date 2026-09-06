import { useEffect, useState, type ReactNode } from "react";
import { Menu, PanelLeftOpen, X } from "lucide-react";
import { useLanguage } from "@/context/LanguageContext";
import QuranSidebar from "@/components/tools/QuranSidebar";
import { getQuranSidebarCollapsed, setQuranSidebarCollapsed } from "@/lib/quran/readerPrefs";

interface QuranReaderShellProps {
  activeSurah?: number;
  children: ReactNode;
}

// Wraps every Quran reading page (surah, juz) with a quran.com-style surah
// list. On narrower screens it's a drawer opened from a menu button, since
// a permanent column would crowd out the reading column entirely. On
// desktop it's a column the reader can tuck away with the panel toggle —
// collapsed by default (see readerPrefs.getQuranSidebarCollapsed) so the
// page is just the mushaf until the reader actually wants to browse or
// jump surahs, at which point one click brings the list back and the
// choice is remembered for next time.
export default function QuranReaderShell({ activeSurah, children }: QuranReaderShellProps) {
  const { t } = useLanguage();
  const [navOpen, setNavOpen] = useState(false);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(() => getQuranSidebarCollapsed());

  // Closing on route change (a surah picked from the drawer, or the
  // Previous/Next pager) mirrors Header's mobile menu, which closes the
  // same way — see components/layout/Header.tsx.
  useEffect(() => {
    setNavOpen(false);
  }, [activeSurah]);

  const toggleSidebar = () => {
    setSidebarCollapsed(collapsed => {
      const next = !collapsed;
      setQuranSidebarCollapsed(next);
      return next;
    });
  };

  return (
    <main className="pt-block">
      <div className="mx-auto flex max-w-shell gap-block px-gutter pb-block pt-section-spacing-mobile md:px-gutter-lg md:pt-section-spacing lg:items-start">
        {sidebarCollapsed ? null : (
          <aside
            aria-label={t("components.tools.QuranSidebar.navLabel")}
            className="sticky top-block hidden h-[calc(100vh-var(--spacing-block)*2)] w-72 shrink-0 lg:block"
          >
            <QuranSidebar activeSurah={activeSurah} />
          </aside>
        )}

        <div className="min-w-0 flex-1">
          <div className="mb-stack flex items-center gap-tight">
            <button
              type="button"
              onClick={() => setNavOpen(true)}
              className="inline-flex items-center gap-tight rounded-control border border-line px-stack py-tight text-sm text-ink transition-colors duration-base hover:border-accent hover:text-accent lg:hidden"
            >
              <Menu size={14} aria-hidden="true" />
              {t("components.tools.QuranSidebar.browseSurahs")}
            </button>

            <button
              type="button"
              onClick={toggleSidebar}
              aria-pressed={!sidebarCollapsed}
              className="hidden items-center gap-tight rounded-control border border-line px-stack py-tight text-sm text-ink transition-colors duration-base hover:border-accent hover:text-accent lg:inline-flex"
            >
              <PanelLeftOpen size={14} aria-hidden="true" />
              {sidebarCollapsed
                ? t("components.tools.QuranSidebar.browseSurahs")
                : t("components.tools.QuranSidebar.hideSurahs")}
            </button>
          </div>

          {children}
        </div>
      </div>

      {navOpen ? (
        <div className="fixed inset-0 z-50 lg:hidden">
          <div className="absolute inset-0 bg-ink/40" onClick={() => setNavOpen(false)} aria-hidden="true" />
          <div className="absolute inset-y-0 left-0 flex w-80 max-w-[85vw] flex-col bg-background px-stack py-block shadow-lg">
            <div className="mb-stack flex shrink-0 items-center justify-between">
              <span className="font-heading text-sm text-ink">{t("components.tools.QuranSidebar.browseSurahs")}</span>
              <button
                type="button"
                onClick={() => setNavOpen(false)}
                aria-label={t("components.tools.QuranSidebar.close")}
                className="flex h-9 w-9 items-center justify-center rounded-control text-ink transition-colors duration-base hover:bg-mist"
              >
                <X size={18} aria-hidden="true" />
              </button>
            </div>
            <QuranSidebar activeSurah={activeSurah} onNavigate={() => setNavOpen(false)} />
          </div>
        </div>
      ) : null}
    </main>
  );
}
