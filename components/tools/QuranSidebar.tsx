import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { Search } from "lucide-react";
import { useLanguage } from "@/context/LanguageContext";
import { quranApi } from "@/lib/quran/quranApi";
import type { SurahMeta } from "@/lib/quran/types";

interface QuranSidebarProps {
  // Highlights this surah in the list — the surah currently open in the
  // reader, if any. Left undefined on pages (like the juz picker) that
  // aren't anchored to one surah.
  activeSurah?: number;
  // Called after a surah link is clicked. QuranReaderShell passes this so
  // picking a surah from the mobile drawer also closes the drawer, the way
  // tapping a nav link closes Header's mobile menu.
  onNavigate?: () => void;
  className?: string;
}

// Self-contained: fetches its own surah list rather than requiring a
// parent page to pass one down, so it can be dropped into any Quran page
// (surah reader, juz reader, and eventually the index) without that page
// needing to know the sidebar exists. quranApi.getSurahList() caches its
// response, so mounting this on every reader page navigation costs nothing
// after the first fetch.
export default function QuranSidebar({ activeSurah, onNavigate, className = "" }: QuranSidebarProps) {
  const { t } = useLanguage();
  const [surahs, setSurahs] = useState<SurahMeta[]>([]);
  const [loadError, setLoadError] = useState(false);
  const [query, setQuery] = useState("");

  useEffect(() => {
    let cancelled = false;
    quranApi
      .getSurahList()
      .then(list => {
        if (!cancelled) setSurahs(list);
      })
      .catch(() => {
        if (!cancelled) setLoadError(true);
      });
    return () => {
      cancelled = true;
    };
  }, []);

  const visible = useMemo(() => {
    const needle = query.trim().toLowerCase();
    if (needle.length === 0) return surahs;
    return surahs.filter(surah => {
      const haystack = `${surah.number} ${surah.englishName} ${surah.englishNameTranslation} ${surah.name}`.toLowerCase();
      return haystack.includes(needle);
    });
  }, [surahs, query]);

  return (
    <div className={`flex h-full min-h-0 flex-col gap-tight ${className}`}>
      <div className="flex shrink-0 items-center gap-tight rounded-pill border border-line px-stack py-tight">
        <Search size={14} className="text-slate" aria-hidden="true" />
        <label className="sr-only" htmlFor="quran-sidebar-filter">
          {t("components.tools.QuranSidebar.filterLabel")}
        </label>
        <input
          id="quran-sidebar-filter"
          type="search"
          value={query}
          onChange={event => setQuery(event.target.value)}
          placeholder={t("components.tools.QuranSidebar.filterPlaceholder")}
          className="w-full bg-transparent text-sm text-ink outline-none placeholder:text-slate"
        />
      </div>

      <nav
        aria-label={t("components.tools.QuranSidebar.navLabel")}
        className="min-h-0 flex-1 overflow-y-auto rounded-panel border border-line"
      >
        {loadError ? (
          <p className="p-stack text-center text-xs text-slate">{t("components.tools.QuranSidebar.empty")}</p>
        ) : surahs.length === 0 ? (
          <div className="flex flex-col gap-1 p-tight">
            {[0, 1, 2, 3, 4, 5, 6, 7, 8, 9].map(index => (
              <div key={index} className="h-9 animate-pulse rounded-control bg-mist" />
            ))}
          </div>
        ) : visible.length === 0 ? (
          <p className="p-stack text-center text-xs text-slate">{t("components.tools.QuranSidebar.empty")}</p>
        ) : (
          <ul className="divide-y divide-line">
            {visible.map(surah => {
              const active = surah.number === activeSurah;
              return (
                <li key={surah.number}>
                  <Link
                    to={`/tools/quran/${surah.number}`}
                    onClick={onNavigate}
                    aria-current={active ? "page" : undefined}
                    className={`flex items-center gap-tight px-stack py-tight text-sm transition-colors duration-base ${
                      active ? "bg-accent/10" : "hover:bg-mist"
                    }`}
                  >
                    <span
                      className={`flex h-7 w-7 shrink-0 items-center justify-center rounded-pill text-xs ${
                        active ? "gradient-brand text-primary-foreground" : "bg-mist text-slate"
                      }`}
                    >
                      {surah.number}
                    </span>
                    <span className="flex min-w-0 flex-1 flex-col">
                      <span className={`truncate ${active ? "text-accent" : "text-ink"}`}>{surah.englishName}</span>
                      <span className="truncate text-xs text-slate">
                        {surah.englishNameTranslation} · {surah.numberOfAyahs}{" "}
                        {t("components.tools.QuranSidebar.ayahsLabel")}
                      </span>
                    </span>
                    <span dir="rtl" lang="ar" className="font-quran shrink-0 text-base text-ink">
                      {surah.name}
                    </span>
                  </Link>
                </li>
              );
            })}
          </ul>
        )}
      </nav>
    </div>
  );
}
