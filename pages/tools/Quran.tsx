import { useEffect, useMemo, useState, type FormEvent } from "react";
import { Link } from "react-router-dom";
import { motion } from "motion/react";
import { AlertTriangle, BookOpen, RotateCw, Search } from "lucide-react";
import SEOHead from "@/components/seo/SEOHead";
import { useLanguage } from "@/context/LanguageContext";
import { JUZ_COUNT, quranApi } from "@/lib/quran/quranApi";
import type { QuranBookmark } from "@/lib/quran/bookmark";
import { useToolProgress } from "@/lib/hooks/useToolProgress";
import type { SearchMatch, SurahMeta } from "@/lib/quran/types";

export default function Quran() {
  const { t, language } = useLanguage();

  const [bookmark] = useToolProgress<QuranBookmark | null>("quran-reading", "darasaone.quran.bookmark", null);

  const [browseMode, setBrowseMode] = useState<"surah" | "juz">("surah");
  const juzNumbers = useMemo(() => Array.from({ length: JUZ_COUNT }, (_, index) => index + 1), []);

  const [surahs, setSurahs] = useState<SurahMeta[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState(false);
  const [query, setQuery] = useState("");

  const [searchInput, setSearchInput] = useState("");
  const [searchTerm, setSearchTerm] = useState("");
  const [matches, setMatches] = useState<SearchMatch[] | null>(null);
  const [searching, setSearching] = useState(false);
  const [searchError, setSearchError] = useState(false);

  const loadSurahs = () => {
    setLoading(true);
    setLoadError(false);
    quranApi
      .getSurahList()
      .then(setSurahs)
      .catch(() => setLoadError(true))
      .finally(() => setLoading(false));
  };

  useEffect(loadSurahs, []);

  const visible = useMemo(() => {
    const needle = query.trim().toLowerCase();
    if (needle.length === 0) return surahs;
    return surahs.filter(surah => {
      const haystack = `${surah.number} ${surah.englishName} ${surah.englishNameTranslation} ${surah.name}`.toLowerCase();
      return haystack.includes(needle);
    });
  }, [surahs, query]);

  const runSearch = async (event: FormEvent) => {
    event.preventDefault();
    const keyword = searchInput.trim();
    if (keyword.length === 0) return;
    setSearching(true);
    setSearchError(false);
    setSearchTerm(keyword);
    try {
      const translationEdition = await quranApi.getDefaultTranslationEdition(language);
      const result = await quranApi.search(keyword, translationEdition);
      setMatches(result.matches);
    } catch {
      setMatches(null);
      setSearchError(true);
    } finally {
      setSearching(false);
    }
  };

  return (
    <>
      <SEOHead titleKey={t("pages.tools.Quran.seo.title")} descriptionKey={t("pages.tools.Quran.seo.description")} />
      <main className="pt-block">
        <section className="mx-auto max-w-shell px-gutter pb-block pt-section-spacing-mobile text-center md:px-gutter-lg md:pt-section-spacing">
          <span data-text-id="pages.tools.Quran.eyebrow" className="text-gradient-head text-sm uppercase tracking-widest">
            {t("pages.tools.Quran.eyebrow")}
          </span>
          <h1 data-text-id="pages.tools.Quran.title" className="mt-2 font-heading text-3xl text-ink md:text-4xl">
            {t("pages.tools.Quran.title")}
          </h1>
          <p data-text-id="pages.tools.Quran.paragraph" className="mx-auto mt-2 max-w-prose text-ink/70">
            {t("pages.tools.Quran.paragraph")}
          </p>
          {bookmark ? (
            <Link
              to={`/tools/quran/${bookmark.surahNumber}`}
              className="mt-block inline-flex items-center gap-tight rounded-pill bg-mist px-stack py-tight text-sm text-ink transition-colors duration-base hover:bg-line"
            >
              <BookOpen size={16} className="text-accent" aria-hidden="true" />
              {t("pages.tools.Quran.continueReading")} {bookmark.surahName}
            </Link>
          ) : null}
        </section>

        <section className="bg-background px-gutter pb-section-spacing-mobile md:px-gutter-lg md:pb-section-spacing">
          <div className="mx-auto flex max-w-shell flex-col gap-block">
            <div className="flex justify-center">
              <div className="inline-flex items-center gap-1 rounded-pill border border-line bg-background p-1">
                <button
                  type="button"
                  onClick={() => setBrowseMode("surah")}
                  aria-pressed={browseMode === "surah"}
                  className={`rounded-pill px-stack py-1.5 text-sm transition-colors duration-base ${
                    browseMode === "surah" ? "gradient-brand text-primary-foreground" : "text-slate hover:text-ink"
                  }`}
                >
                  {t("pages.tools.Quran.browseBySurah")}
                </button>
                <button
                  type="button"
                  onClick={() => setBrowseMode("juz")}
                  aria-pressed={browseMode === "juz"}
                  className={`rounded-pill px-stack py-1.5 text-sm transition-colors duration-base ${
                    browseMode === "juz" ? "gradient-brand text-primary-foreground" : "text-slate hover:text-ink"
                  }`}
                >
                  {t("pages.tools.Quran.browseByJuz")}
                </button>
              </div>
            </div>

            {browseMode === "juz" ? (
              <div className="grid grid-cols-3 gap-stack sm:grid-cols-5 lg:grid-cols-6">
                {juzNumbers.map(number => (
                  <Link
                    key={number}
                    to={`/tools/quran/juz/${number}`}
                    className="card-lift flex flex-col items-center justify-center gap-1 rounded-panel bg-mist px-stack py-block text-center transition-transform duration-base hover:-translate-y-hover-lift"
                  >
                    <span className="gradient-brand flex h-9 w-9 items-center justify-center rounded-pill text-sm text-primary-foreground">
                      {number}
                    </span>
                    <span className="text-xs text-slate">{t("pages.tools.Quran.juzLabel")}</span>
                  </Link>
                ))}
              </div>
            ) : (
              <>
            <div className="flex items-center gap-tight rounded-pill border border-line px-stack py-tight">
              <Search size={18} className="text-slate" aria-hidden="true" />
              <label className="sr-only" htmlFor="surah-filter">
                {t("pages.tools.Quran.filterLabel")}
              </label>
              <input
                id="surah-filter"
                type="search"
                value={query}
                onChange={event => setQuery(event.target.value)}
                placeholder={t("pages.tools.Quran.filterPlaceholder")}
                className="w-full bg-transparent text-sm text-ink outline-none placeholder:text-slate"
              />
            </div>

            {loading ? (
              <div className="grid grid-cols-1 gap-stack sm:grid-cols-2 lg:grid-cols-3">
                {[0, 1, 2, 3, 4, 5, 6, 7].map(index => (
                  <div key={index} className="h-24 animate-pulse rounded-panel bg-mist" />
                ))}
              </div>
            ) : loadError ? (
              <div className="flex flex-col items-center gap-stack rounded-card bg-mist px-block py-block text-center">
                <AlertTriangle size={32} className="text-slate" aria-hidden="true" />
                <p className="text-sm text-slate">{t("pages.tools.Quran.loadError")}</p>
                <button
                  type="button"
                  onClick={loadSurahs}
                  className="inline-flex items-center gap-tight rounded-control bg-ink px-stack py-tight text-sm text-ink-foreground transition-all duration-base hover:scale-hover active:scale-active"
                >
                  <RotateCw size={14} aria-hidden="true" />
                  {t("pages.tools.Quran.retry")}
                </button>
              </div>
            ) : visible.length === 0 ? (
              <div className="flex flex-col items-center gap-stack rounded-card bg-mist px-block py-block text-center">
                <BookOpen size={32} className="text-slate" aria-hidden="true" />
                <p className="text-sm text-slate">{t("pages.tools.Quran.empty")}</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 gap-stack sm:grid-cols-2 lg:grid-cols-3">
                {visible.map((surah, index) => (
                  <motion.div
                    key={surah.number}
                    initial={{ opacity: 0.001, y: 16 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true, amount: 0.3 }}
                    transition={{ duration: 0.4, delay: (index % 9) * 0.04, ease: [0.22, 1, 0.36, 1] }}
                  >
                    <Link
                      to={`/tools/quran/${surah.number}`}
                      className="card-lift group flex items-center gap-stack rounded-panel bg-background px-stack py-stack transition-transform duration-base hover:-translate-y-hover-lift"
                    >
                      <span className="gradient-brand flex h-11 w-11 shrink-0 items-center justify-center rounded-pill text-sm text-primary-foreground">
                        {surah.number}
                      </span>
                      <div className="flex min-w-0 flex-1 flex-col">
                        <span className="truncate font-heading text-sm text-ink transition-colors duration-base group-hover:text-accent">
                          {surah.englishName}
                        </span>
                        <span className="truncate text-xs text-slate">
                          {surah.englishNameTranslation} · {surah.numberOfAyahs} {t("pages.tools.Quran.ayahsLabel")}
                        </span>
                      </div>
                      <span dir="rtl" lang="ar" className="font-quran text-lg text-ink">
                        {surah.name}
                      </span>
                    </Link>
                  </motion.div>
                ))}
              </div>
            )}
              </>
            )}
          </div>
        </section>

        <section className="bg-mist px-gutter py-section-spacing-mobile md:px-gutter-lg md:py-section-spacing">
          <div className="mx-auto flex max-w-shell flex-col gap-stack">
            <div className="flex flex-col gap-1 text-center">
              <h2 className="font-heading text-xl text-ink">{t("pages.tools.Quran.searchHeading")}</h2>
              <p className="mx-auto max-w-prose text-sm text-slate">{t("pages.tools.Quran.searchParagraph")}</p>
            </div>

            <form onSubmit={runSearch} className="mx-auto flex w-full max-w-lg items-center gap-tight rounded-pill bg-background px-stack py-tight">
              <Search size={18} className="text-slate" aria-hidden="true" />
              <label className="sr-only" htmlFor="verse-search">
                {t("pages.tools.Quran.searchLabel")}
              </label>
              <input
                id="verse-search"
                type="search"
                value={searchInput}
                onChange={event => setSearchInput(event.target.value)}
                placeholder={t("pages.tools.Quran.searchPlaceholder")}
                className="w-full bg-transparent text-sm text-ink outline-none placeholder:text-slate"
              />
              <button
                type="submit"
                disabled={searching}
                className="gradient-brand shrink-0 rounded-pill px-stack py-1.5 text-sm text-primary-foreground transition-all duration-base hover:scale-hover active:scale-active disabled:opacity-60"
              >
                {searching ? t("pages.tools.Quran.searching") : t("pages.tools.Quran.searchButton")}
              </button>
            </form>

            {searchError ? (
              <p className="text-center text-sm text-danger">{t("pages.tools.Quran.searchError")}</p>
            ) : matches ? (
              matches.length === 0 ? (
                <p className="text-center text-sm text-slate">
                  {t("pages.tools.Quran.searchEmpty")} "{searchTerm}"
                </p>
              ) : (
                <div className="mx-auto flex w-full max-w-2xl flex-col gap-tight">
                  <p className="text-center text-xs uppercase tracking-widest text-slate">
                    {matches.length} {t("pages.tools.Quran.searchResultsLabel")} "{searchTerm}"
                  </p>
                  {matches.slice(0, 20).map(match => (
                    <Link
                      key={`${match.surah.number}-${match.numberInSurah}`}
                      to={`/tools/quran/${match.surah.number}#ayah-${match.numberInSurah}`}
                      className="card-lift flex flex-col gap-1 rounded-panel bg-background px-stack py-tight transition-transform duration-base hover:-translate-y-hover-lift"
                    >
                      <span className="text-xs uppercase tracking-widest text-accent">
                        {match.surah.englishName} · {t("pages.tools.Quran.ayahLabel")} {match.numberInSurah}
                      </span>
                      <p className="text-sm text-ink" style={{ unicodeBidi: "plaintext" }}>
                        {match.text}
                      </p>
                    </Link>
                  ))}
                </div>
              )
            ) : null}
          </div>
        </section>
      </main>
    </>
  );
}
