import { useEffect, useMemo, useRef, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { AlertTriangle, ChevronLeft, ChevronRight, RotateCw } from "lucide-react";
import SEOHead from "@/components/seo/SEOHead";
import { useLanguage } from "@/context/LanguageContext";
import { quranApi } from "@/lib/quran/quranApi";
import type { QuranBookmark } from "@/lib/quran/bookmark";
import { useToolProgress } from "@/lib/hooks/useToolProgress";
import { getQuranViewMode, setQuranViewMode, type QuranViewMode } from "@/lib/quran/viewMode";
import { getQuranReciter, getQuranScriptEdition, setQuranReciter, setQuranScriptEdition } from "@/lib/quran/readerPrefs";
import type { SurahEdition } from "@/lib/quran/types";
import { getQcf4AyahsForSurah, loadQcf4Font, type Qcf4Ayah } from "@/lib/quran/qcf4";
import AyahCard from "@/components/tools/AyahCard";
import MushafView from "@/components/tools/MushafView";
import ViewModeToggle from "@/components/tools/ViewModeToggle";
import QuranReaderSettings from "@/components/tools/QuranReaderSettings";
import QuranReaderShell from "@/components/tools/QuranReaderShell";
import VerseSearch from "@/components/tools/VerseSearch";

const FIRST_SURAH = 1;
const LAST_SURAH = 114;

export default function QuranSurah() {
  const { t, language } = useLanguage();
  const params = useParams<{ number: string }>();
  const surahNumber = Math.min(LAST_SURAH, Math.max(FIRST_SURAH, Number(params.number) || FIRST_SURAH));

  const [reading, setReading] = useState<{ arabic: SurahEdition; translation: SurahEdition; audio: SurahEdition } | null>(null);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState(false);
  const [playingAyah, setPlayingAyah] = useState<number | null>(null);
  const audioRef = useRef<HTMLAudioElement | null>(null);
  // A second, never-played <audio> element used purely to warm the
  // browser's cache for the *next* ayah while the current one is still
  // playing — see the comment in playAyahAt for why.
  const preloadRef = useRef<HTMLAudioElement | null>(null);
  const [viewMode, setViewMode] = useState<QuranViewMode>(() => getQuranViewMode());
  const [scriptEdition, setScriptEditionState] = useState(() => getQuranScriptEdition());
  const [reciter, setReciterState] = useState(() => getQuranReciter());
  const [, setBookmark] = useToolProgress<QuranBookmark | null>("quran-reading", "darasaone.quran.bookmark", null);

  const changeViewMode = (mode: QuranViewMode) => {
    setViewMode(mode);
    setQuranViewMode(mode);
  };

  const changeScriptEdition = (id: string) => {
    setScriptEditionState(id);
    setQuranScriptEdition(id);
  };

  const changeReciter = (id: string) => {
    setReciterState(id);
    setQuranReciter(id);
  };

  // `reloadToken` lets the manual "Retry" button re-run the same fetch
  // without needing a `cancelled` flag of its own — it just bumps a
  // dependency so the effect below fires again.
  const [reloadToken, setReloadToken] = useState(0);
  const loadSurah = () => setReloadToken(token => token + 1);

  // Guarded against races: switching surahs quickly (Next/Previous, or
  // picking another surah from the list before the first one finishes
  // loading) fires this effect again while the previous request is still
  // in flight. Without `cancelled`, an older request that happens to
  // resolve *after* the newer one would call setReading with the wrong
  // surah's ayahs, translations and audio — showing verses that don't
  // match the surah the reader actually navigated to.
  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    setLoadError(false);
    setReading(null);
    quranApi
      .getDefaultTranslationEdition(language)
      .then(translationEdition => quranApi.getSurahReading(surahNumber, translationEdition, scriptEdition, reciter))
      .then(result => {
        if (!cancelled) setReading(result);
      })
      .catch(() => {
        if (!cancelled) setLoadError(true);
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [surahNumber, language, scriptEdition, reciter, reloadToken]);

  useEffect(() => {
    if (reading) setBookmark({ surahNumber: reading.arabic.number, surahName: reading.arabic.englishName, updatedAt: Date.now() });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [reading]);

  // Deep-linking from search results (/tools/quran/2#ayah-255) scrolls the
  // matched verse into view once its card has actually rendered.
  useEffect(() => {
    if (!reading || typeof window === "undefined") return;
    const hash = window.location.hash;
    if (!hash) return;
    const target = document.getElementById(hash.slice(1));
    target?.scrollIntoView({ behavior: "smooth", block: "center" });
  }, [reading]);

  useEffect(() => {
    return () => {
      audioRef.current?.pause();
    };
  }, [surahNumber]);

  const ayahs = useMemo(() => {
    if (!reading) return [];
    // Keyed by `number` — an ayah's fixed position across the whole mushaf
    // (1-6236), the same in every edition — rather than by array position.
    // Matching by index assumed the arabic/translation/audio editions'
    // ayahs arrays line up 1:1 entry-for-entry; that isn't guaranteed
    // across three independently-fetched editions, and is exactly the
    // kind of mismatch that quietly pairs the wrong translation with the
    // wrong ayah number.
    const translationByNumber = new Map(reading.translation.ayahs.map(ayah => [ayah.number, ayah.text]));
    const audioByNumber = new Map(reading.audio.ayahs.map(ayah => [ayah.number, ayah.audio]));
    return reading.arabic.ayahs.map(arabicAyah => ({
      numberInSurah: arabicAyah.numberInSurah,
      arabicText: arabicAyah.text,
      translationText: translationByNumber.get(arabicAyah.number) ?? "",
      audioUrl: audioByNumber.get(arabicAyah.number),
    }));
  }, [reading]);

  // Reuses the translation text already fetched for the "ayah" view, keyed
  // by numberInSurah, so switching to Mushaf view opening a verse's meaning
  // doesn't cost a second request against a different data source.
  const translationsByAyah = useMemo(
    () => Object.fromEntries(ayahs.map(ayah => [ayah.numberInSurah, ayah.translationText])),
    [ayahs]
  );

  // Feeds the sticky toolbar's search box — same ayahs already loaded for
  // this surah, just reshaped with the DOM id each one scrolls to.
  const searchableAyahs = useMemo(
    () =>
      ayahs.map(ayah => ({
        id: `ayah-${ayah.numberInSurah}`,
        numberInSurah: ayah.numberInSurah,
        arabicText: ayah.arabicText,
        translationText: ayah.translationText,
      })),
    [ayahs]
  );

  // Search results only exist as DOM anchors in "ayah" view (Mushaf pages
  // don't expose one). Picking a match while in Mushaf view queues the
  // target and switches modes first; the effect below scrolls to it once
  // the ayah list has actually rendered.
  const [pendingScrollId, setPendingScrollId] = useState<string | null>(null);

  // Briefly tints the row a search result lands on, so it's obvious which
  // verse the jump actually landed on rather than just relying on scroll
  // position. `highlightTimeoutRef` cancels the previous flash's timeout
  // when a new one starts, so jumping to a second result quickly doesn't
  // have an earlier timer clear the new highlight out from under it.
  const [highlightedId, setHighlightedId] = useState<string | null>(null);
  const highlightTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const flashHighlight = (id: string) => {
    if (highlightTimeoutRef.current) clearTimeout(highlightTimeoutRef.current);
    setHighlightedId(id);
    highlightTimeoutRef.current = setTimeout(() => setHighlightedId(null), 2500);
  };

  useEffect(() => {
    return () => {
      if (highlightTimeoutRef.current) clearTimeout(highlightTimeoutRef.current);
    };
  }, []);

  const scrollToAyah = (id: string) => {
    if (viewMode !== "ayah") {
      setPendingScrollId(id);
      changeViewMode("ayah");
      return;
    }
    document.getElementById(id)?.scrollIntoView({ behavior: "smooth", block: "center" });
    flashHighlight(id);
  };

  useEffect(() => {
    if (viewMode !== "ayah" || !pendingScrollId) return;
    document.getElementById(pendingScrollId)?.scrollIntoView({ behavior: "smooth", block: "center" });
    flashHighlight(pendingScrollId);
    setPendingScrollId(null);
  }, [viewMode, pendingScrollId, ayahs]);

  // QCF4 glyph words for the ayah-by-ayah view, so it renders the same
  // pixel-accurate Madinah Mushaf glyphs as Mushaf view instead of plain
  // Unicode text. Fetched independently of `reading` above (a different,
  // keyless data source — see lib/quran/qcf4.ts) and, until it resolves,
  // AyahCard falls back to the plain-text `arabicText` it already has, so
  // the ayah view never shows a blank verse while this loads.
  const [qcfAyahs, setQcfAyahs] = useState<Qcf4Ayah[] | null>(null);
  const [, setQcfFontsTick] = useState(0);

  useEffect(() => {
    let cancelled = false;
    setQcfAyahs(null);

    getQcf4AyahsForSurah(surahNumber)
      .then(loadedAyahs => {
        if (cancelled) return;
        setQcfAyahs(loadedAyahs);

        const fonts = new Set(loadedAyahs.flatMap(ayah => ayah.words.map(word => word.font)));
        fonts.forEach(fontName => {
          loadQcf4Font(fontName)
            .then(() => {
              if (!cancelled) setQcfFontsTick(tick => tick + 1);
            })
            .catch(() => {
              // A missing/blocked font file still leaves the QPC-style
              // fallback text (and the plain-text branch below) readable.
            });
        });
      })
      .catch(() => {
        // Ayah view still works from the Al Quran Cloud text above — this
        // data source is an enhancement, not a hard dependency.
      });

    return () => {
      cancelled = true;
    };
  }, [surahNumber]);

  // Trusts the QCF4 glyphs for this surah only when its ayah count agrees
  // with the Al Quran Cloud edition's count for the same surah. Both
  // datasets number their own ayahs correctly *internally* — but they're
  // two independent, third-party projects, and nothing guarantees they
  // draw every verse boundary in exactly the same place. If they ever
  // disagree for a given surah, matching glyphs to translations purely by
  // numberInSurah would confidently pair the wrong glyph words under a
  // translation/ayah number they don't actually belong to — showing what
  // looks like a different verse under the right surah. A count mismatch
  // is the cheapest signal that's happening, and falling back to the
  // plain Unicode Arabic (already fetched, already correct) for the whole
  // surah is a safe, visible degrade instead of a silently wrong verse.
  const qcfAyahCountMatches = qcfAyahs != null && reading != null && qcfAyahs.length === reading.arabic.numberOfAyahs;

  const qcfWordsByAyah = useMemo(() => {
    if (!qcfAyahs || !qcfAyahCountMatches) return null;
    return new Map(qcfAyahs.map(ayah => [ayah.numberInSurah, ayah.words]));
  }, [qcfAyahs, qcfAyahCountMatches]);

  // Plays one ayah's recitation, replacing whatever is currently playing.
  const playAyahAt = (numberInSurah: number, audioUrl: string) => {
    const audio = audioRef.current;
    if (!audio) return;
    audio.src = audioUrl;
    audio.play().catch(() => setPlayingAyah(null));
    setPlayingAyah(numberInSurah);

    // Each ayah's recitation is its own separate audio file, fetched fresh
    // when it's needed — that's why continuous playback's gap to the next
    // verse varies (sometimes near-instant, sometimes a noticeable pause):
    // it's however long that particular file's cold network fetch happens
    // to take, not an inconsistency in when the app decides to advance.
    // Kicking off that fetch here, as soon as this ayah *starts*, instead
    // of waiting for handleAudioEnded to ask for it, gives the browser the
    // ayah's full duration to have it cached and ready before it's
    // actually needed.
    const currentIndex = ayahs.findIndex(ayah => ayah.numberInSurah === numberInSurah);
    const next = currentIndex >= 0 ? ayahs[currentIndex + 1] : undefined;
    if (next?.audioUrl && preloadRef.current) {
      preloadRef.current.src = next.audioUrl;
      preloadRef.current.load();
    }
  };

  const togglePlay = (numberInSurah: number, audioUrl: string | undefined) => {
    if (!audioUrl) return;
    if (playingAyah === numberInSurah) {
      audioRef.current?.pause();
      setPlayingAyah(null);
      return;
    }
    playAyahAt(numberInSurah, audioUrl);
  };

  // Continuous playback: when the ayah currently playing finishes, start
  // the next one automatically — without this, recitation stopped after a
  // single verse and reading through a surah meant tapping play again for
  // every ayah. Playback simply stops after the surah's last ayah.
  const handleAudioEnded = () => {
    if (playingAyah == null) return;
    const currentIndex = ayahs.findIndex(ayah => ayah.numberInSurah === playingAyah);
    const next = currentIndex >= 0 ? ayahs[currentIndex + 1] : undefined;
    if (next?.audioUrl) {
      playAyahAt(next.numberInSurah, next.audioUrl);
    } else {
      setPlayingAyah(null);
    }
  };

  const seoTitle = reading ? `${reading.arabic.englishName} — ${reading.translation.englishNameTranslation}` : t("pages.tools.QuranSurah.seo.title");

  return (
    <>
      <SEOHead titleKey={seoTitle} descriptionKey={t("pages.tools.QuranSurah.seo.description")} />
      <QuranReaderShell activeSurah={surahNumber}>
          <Link to="/tools/quran" className="inline-flex items-center gap-1 text-sm text-accent hover:underline">
            <ChevronLeft size={14} aria-hidden="true" />
            {t("pages.tools.QuranSurah.backToList")}
          </Link>

          {loading ? (
            <div className="mt-block flex flex-col gap-stack">
              <div className="h-8 w-2/3 animate-pulse rounded-control bg-mist" />
              {[0, 1, 2].map(index => (
                <div key={index} className="h-32 animate-pulse rounded-card bg-mist" />
              ))}
            </div>
          ) : loadError || !reading ? (
            <div className="mt-block flex flex-col items-center gap-stack rounded-card bg-mist px-block py-block text-center">
              <AlertTriangle size={32} className="text-slate" aria-hidden="true" />
              <p className="text-sm text-slate">{t("pages.tools.QuranSurah.loadError")}</p>
              <button
                type="button"
                onClick={loadSurah}
                className="inline-flex items-center gap-tight rounded-control bg-ink px-stack py-tight text-sm text-ink-foreground transition-all duration-base hover:scale-hover active:scale-active"
              >
                <RotateCw size={14} aria-hidden="true" />
                {t("pages.tools.QuranSurah.retry")}
              </button>
            </div>
          ) : (
            <>
              <div className="mt-block flex flex-col items-center gap-1 text-center">
                <span className="text-xs uppercase tracking-widest text-slate">
                  {reading.arabic.revelationType} · {reading.arabic.numberOfAyahs} {t("pages.tools.QuranSurah.ayahsLabel")}
                </span>
                <h1 className="font-heading text-3xl text-ink">{reading.arabic.englishName}</h1>
                <p className="text-sm text-slate">{reading.translation.englishNameTranslation}</p>
                <p dir="rtl" lang="ar" className="font-quran mt-1 text-2xl text-ink">
                  {reading.arabic.name}
                </p>
              </div>

              <div className="sticky top-block z-10 -mx-gutter mt-block flex items-center justify-between gap-stack border-b border-line bg-background/95 px-gutter py-tight backdrop-blur md:-mx-gutter-lg md:px-gutter-lg">
                <span className="hidden min-w-0 truncate font-heading text-sm text-ink sm:block">
                  {reading.arabic.englishName}
                </span>
                <div className="flex shrink-0 items-center gap-tight">
                  <VerseSearch
                    ayahs={searchableAyahs}
                    onSelect={scrollToAyah}
                    searchLabel={t("pages.tools.QuranSurah.search")}
                    placeholder={t("pages.tools.QuranSurah.searchPlaceholder")}
                    closeLabel={t("pages.tools.QuranSurah.searchClose")}
                    noResultsLabel={t("pages.tools.QuranSurah.searchNoResults")}
                    resultsLabel={t("pages.tools.QuranSurah.searchResultsSuffix")}
                  />
                  <ViewModeToggle
                    mode={viewMode}
                    onChange={changeViewMode}
                    ayahLabel={t("pages.tools.QuranSurah.viewModeAyah")}
                    mushafLabel={t("pages.tools.QuranSurah.viewModeMushaf")}
                  />
                  <QuranReaderSettings
                    scriptEdition={scriptEdition}
                    onScriptChange={changeScriptEdition}
                    reciter={reciter}
                    onReciterChange={changeReciter}
                    settingsLabel={t("pages.tools.QuranSurah.readerSettings")}
                    scriptLabel={t("pages.tools.QuranSurah.scriptLabel")}
                    reciterLabel={t("pages.tools.QuranSurah.reciterLabel")}
                    scriptOptionLabels={{
                      scriptUthmani: t("pages.tools.QuranSurah.scriptUthmani"),
                      scriptSimple: t("pages.tools.QuranSurah.scriptSimple"),
                    }}
                  />
                </div>
              </div>

              {viewMode === "mushaf" ? (
                <div className="mx-auto mt-stack max-w-3xl">
                  <MushafView
                    surahNumber={surahNumber}
                    translations={translationsByAyah}
                    playingAyah={playingAyah}
                    onTogglePlay={numberInSurah => {
                      const ayah = ayahs.find(item => item.numberInSurah === numberInSurah);
                      if (ayah) togglePlay(numberInSurah, ayah.audioUrl);
                    }}
                    playLabel={t("pages.tools.QuranSurah.play")}
                    pauseLabel={t("pages.tools.QuranSurah.pause")}
                    pageLabel={t("pages.tools.QuranSurah.pageLabel")}
                    loadErrorLabel={t("pages.tools.QuranSurah.mushafLoadError")}
                    retryLabel={t("pages.tools.QuranSurah.retry")}
                  />
                </div>
              ) : (
                <div className="lesson-card mx-auto mt-stack max-w-3xl divide-y divide-line">
                  {ayahs.map(ayah => (
                    <div key={ayah.numberInSurah} id={`ayah-${ayah.numberInSurah}`} className="scroll-mt-block">
                      <AyahCard
                        numberInSurah={ayah.numberInSurah}
                        arabicText={ayah.arabicText}
                        words={qcfWordsByAyah?.get(ayah.numberInSurah)}
                        translationText={ayah.translationText}
                        isPlaying={playingAyah === ayah.numberInSurah}
                        isHighlighted={highlightedId === `ayah-${ayah.numberInSurah}`}
                        onTogglePlay={() => togglePlay(ayah.numberInSurah, ayah.audioUrl)}
                        playLabel={t("pages.tools.QuranSurah.play")}
                        pauseLabel={t("pages.tools.QuranSurah.pause")}
                      />
                    </div>
                  ))}
                </div>
              )}

              <div className="mx-auto mt-block flex max-w-3xl items-center justify-between gap-stack">
                {surahNumber > FIRST_SURAH ? (
                  <Link
                    to={`/tools/quran/${surahNumber - 1}`}
                    className="inline-flex items-center gap-1 rounded-control border border-line px-stack py-tight text-sm text-ink transition-colors duration-base hover:border-accent hover:text-accent"
                  >
                    <ChevronLeft size={14} aria-hidden="true" />
                    {t("pages.tools.QuranSurah.previous")}
                  </Link>
                ) : (
                  <span />
                )}
                {surahNumber < LAST_SURAH ? (
                  <Link
                    to={`/tools/quran/${surahNumber + 1}`}
                    className="inline-flex items-center gap-1 rounded-control border border-line px-stack py-tight text-sm text-ink transition-colors duration-base hover:border-accent hover:text-accent"
                  >
                    {t("pages.tools.QuranSurah.next")}
                    <ChevronRight size={14} aria-hidden="true" />
                  </Link>
                ) : (
                  <span />
                )}
              </div>
            </>
          )}
      </QuranReaderShell>

      {/* Single shared player: only one ayah's recitation ever plays at a
          time, and pausing/switching surahs (see the cleanup effect above)
          never leaves stray audio running in the background. */}
      <audio ref={audioRef} onEnded={handleAudioEnded} className="hidden" />
      <audio ref={preloadRef} preload="auto" className="hidden" />
    </>
  );
}
