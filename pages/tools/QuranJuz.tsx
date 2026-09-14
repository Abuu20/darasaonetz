import { useEffect, useMemo, useRef, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { AlertTriangle, ChevronLeft, ChevronRight, RotateCw, BookOpen } from "lucide-react";
import SEOHead from "@/components/seo/SEOHead";
import { useLanguage } from "@/context/LanguageContext";
import { JUZ_COUNT, quranApi } from "@/lib/quran/quranApi";
import { getQuranViewMode, setQuranViewMode, type QuranViewMode } from "@/lib/quran/viewMode";
import { getQuranReciter, getQuranScriptEdition, setQuranReciter, setQuranScriptEdition } from "@/lib/quran/readerPrefs";
import type { JuzEdition } from "@/lib/quran/types";
import AyahCard from "@/components/tools/AyahCard";
import MushafView from "@/components/tools/MushafView";
import ViewModeToggle from "@/components/tools/ViewModeToggle";
import QuranReaderSettings from "@/components/tools/QuranReaderSettings";
import QuranReaderShell from "@/components/tools/QuranReaderShell";
import VerseSearch from "@/components/tools/VerseSearch";

const FIRST_JUZ = 1;

// What the page is showing right now: the surah picker for this juz, one
// chosen surah's ayahs, or every surah in the juz read back-to-back.
type Selection = { kind: "picker" } | { kind: "surah"; surahNumber: number } | { kind: "all" };

export default function QuranJuz() {
  const { t, language } = useLanguage();
  const params = useParams<{ number: string }>();
  const juzNumber = Math.min(JUZ_COUNT, Math.max(FIRST_JUZ, Number(params.number) || FIRST_JUZ));

  const [reading, setReading] = useState<{ arabic: JuzEdition; translation: JuzEdition; audio: JuzEdition } | null>(null);
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
  // Opening a juz lands on the surah picker first, rather than dumping every
  // surah's ayahs at once — the person picks a surah to read, or chooses to
  // read the whole juz straight through.
  const [selection, setSelection] = useState<Selection>({ kind: "picker" });

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

  const loadJuz = () => {
    setLoading(true);
    setLoadError(false);
    setReading(null);
    quranApi
      .getDefaultTranslationEdition(language)
      .then(translationEdition => quranApi.getJuzReading(juzNumber, translationEdition, scriptEdition, reciter))
      .then(setReading)
      .catch(() => setLoadError(true))
      .finally(() => setLoading(false));
  };

  // eslint-disable-next-line react-hooks/exhaustive-deps
  useEffect(loadJuz, [juzNumber, language, scriptEdition, reciter]);

  // Back to the picker every time the person moves to a different juz —
  // otherwise "next juz" would land straight inside whichever surah/mode
  // was open on the previous one.
  useEffect(() => {
    setSelection({ kind: "picker" });
  }, [juzNumber]);

  useEffect(() => {
    return () => {
      audioRef.current?.pause();
    };
  }, [juzNumber]);

  // A juz spans several surahs — group consecutive ayahs by their parent
  // surah so the page can show a header each time the surah changes, using
  // ayah.number (the absolute mushaf position) as a stable per-ayah key
  // since numberInSurah alone repeats across surahs within the same juz.
  const groups = useMemo(() => {
    if (!reading) return [];
    const bySection: {
      surahNumber: number;
      surahName: string;
      arabicName: string;
      ayahs: { key: number; numberInSurah: number; arabicText: string; translationText: string; audioUrl?: string }[];
    }[] = [];

    // Keyed by `number` (the absolute mushaf position, same across every
    // edition) rather than by array position — see QuranSurah.tsx's ayahs
    // useMemo for why matching by index between independently-fetched
    // editions risks pairing the wrong translation with the wrong ayah.
    const translationByNumber = new Map(reading.translation.ayahs.map(ayah => [ayah.number, ayah.text]));
    const audioByNumber = new Map(reading.audio.ayahs.map(ayah => [ayah.number, ayah.audio]));

    reading.arabic.ayahs.forEach(arabicAyah => {
      const surah = arabicAyah.surah;
      const surahNumber = surah?.number ?? 0;
      let group = bySection[bySection.length - 1];
      if (!group || group.surahNumber !== surahNumber) {
        group = {
          surahNumber,
          surahName: surah?.englishName ?? "",
          arabicName: surah?.name ?? "",
          ayahs: [],
        };
        bySection.push(group);
      }
      group.ayahs.push({
        key: arabicAyah.number,
        numberInSurah: arabicAyah.numberInSurah,
        arabicText: arabicAyah.text,
        translationText: translationByNumber.get(arabicAyah.number) ?? "",
        audioUrl: audioByNumber.get(arabicAyah.number),
      });
    });

    return bySection;
  }, [reading]);

  // What the reading view below actually renders: every group for "read
  // all", just the one the person picked, or nothing while still on the
  // picker (the picker itself doesn't need this).
  const visibleGroups = useMemo(() => {
    if (selection.kind === "all") return groups;
    if (selection.kind === "surah") return groups.filter(group => group.surahNumber === selection.surahNumber);
    return [];
  }, [groups, selection]);

  // Flat, in-order list of whatever's actually visible right now (either
  // the whole juz or just the picked surah) — what continuous playback
  // below walks through, so it naturally carries across a surah boundary
  // when reading the whole juz, and stays within one surah otherwise.
  const flatAyahs = useMemo(() => visibleGroups.flatMap(group => group.ayahs), [visibleGroups]);

  // Feeds the sticky toolbar's search box, scoped to whatever's currently
  // open — just the picked surah, or the whole juz when reading straight
  // through. Keyed by `key` (the absolute mushaf position), same as the
  // scroll anchors rendered in the ayah-view loop below, since
  // numberInSurah alone repeats across surahs within a juz.
  const searchableAyahs = useMemo(
    () =>
      flatAyahs.map(ayah => ({
        id: `ayah-${ayah.key}`,
        numberInSurah: ayah.numberInSurah,
        arabicText: ayah.arabicText,
        translationText: ayah.translationText,
      })),
    [flatAyahs]
  );

  // Search results only exist as DOM anchors in "ayah" view (Mushaf pages
  // don't expose one per ayah). Picking a match while in Mushaf view queues
  // the target and switches modes first; the effect below scrolls to it
  // once the ayah list has actually rendered.
  const [pendingScrollId, setPendingScrollId] = useState<string | null>(null);

  // Briefly tints the row a search result lands on — see QuranSurah.tsx's
  // identical `flashHighlight` for why the previous timeout is cancelled
  // before starting a new one.
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
  }, [viewMode, pendingScrollId, flatAyahs]);

  // Plays one ayah's recitation, replacing whatever is currently playing.
  const playAyahAt = (key: number, audioUrl: string) => {
    const audio = audioRef.current;
    if (!audio) return;
    audio.src = audioUrl;
    audio.play().catch(() => setPlayingAyah(null));
    setPlayingAyah(key);

    // Each ayah's recitation is its own separate audio file, fetched fresh
    // when it's needed — that's why continuous playback's gap to the next
    // verse varies (sometimes near-instant, sometimes a noticeable pause):
    // it's however long that particular file's cold network fetch happens
    // to take, not an inconsistency in when the app decides to advance.
    // Kicking off that fetch here, as soon as this ayah *starts*, instead
    // of waiting for handleAudioEnded to ask for it, gives the browser the
    // ayah's full duration to have it cached and ready before it's
    // actually needed.
    const currentIndex = flatAyahs.findIndex(ayah => ayah.key === key);
    const next = currentIndex >= 0 ? flatAyahs[currentIndex + 1] : undefined;
    if (next?.audioUrl && preloadRef.current) {
      preloadRef.current.src = next.audioUrl;
      preloadRef.current.load();
    }
  };

  const togglePlay = (key: number, audioUrl: string | undefined) => {
    if (!audioUrl) return;
    if (playingAyah === key) {
      audioRef.current?.pause();
      setPlayingAyah(null);
      return;
    }
    playAyahAt(key, audioUrl);
  };

  // Continuous playback: when the ayah currently playing finishes, start
  // the next one automatically instead of stopping after a single verse.
  const handleAudioEnded = () => {
    if (playingAyah == null) return;
    const currentIndex = flatAyahs.findIndex(ayah => ayah.key === playingAyah);
    const next = currentIndex >= 0 ? flatAyahs[currentIndex + 1] : undefined;
    if (next?.audioUrl) {
      playAyahAt(next.key, next.audioUrl);
    } else {
      setPlayingAyah(null);
    }
  };

  // Highlights the open surah in the sidebar once one is picked; the
  // picker and "read all" views aren't anchored to a single surah, so the
  // sidebar shows no active item for those.
  const activeSurahInSidebar = selection.kind === "surah" ? selection.surahNumber : undefined;

  return (
    <>
      <SEOHead
        titleKey={`${t("pages.tools.QuranJuz.titlePrefix")} ${juzNumber}`}
        descriptionKey={t("pages.tools.QuranJuz.seo.description")}
      />
      <QuranReaderShell activeSurah={activeSurahInSidebar}>
          <Link to="/tools/quran" className="inline-flex items-center gap-1 text-sm text-accent hover:underline">
            <ChevronLeft size={14} aria-hidden="true" />
            {t("pages.tools.QuranJuz.backToList")}
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
              <p className="text-sm text-slate">{t("pages.tools.QuranJuz.loadError")}</p>
              <button
                type="button"
                onClick={loadJuz}
                className="inline-flex items-center gap-tight rounded-control bg-ink px-stack py-tight text-sm text-ink-foreground transition-all duration-base hover:scale-hover active:scale-active"
              >
                <RotateCw size={14} aria-hidden="true" />
                {t("pages.tools.QuranJuz.retry")}
              </button>
            </div>
          ) : (
            <>
              <div className="mt-block flex flex-col items-center gap-1 text-center">
                <span className="text-xs uppercase tracking-widest text-slate">
                  {t("pages.tools.QuranJuz.titlePrefix")} {juzNumber} / {JUZ_COUNT}
                </span>
                <h1 className="font-heading text-3xl text-ink">
                  {t("pages.tools.QuranJuz.titlePrefix")} {juzNumber}
                </h1>
              </div>

              {selection.kind === "picker" ? (
                <div className="mx-auto mt-block flex max-w-3xl flex-col gap-stack">
                  <button
                    type="button"
                    onClick={() => setSelection({ kind: "all" })}
                    className="flex items-center justify-center gap-tight rounded-control bg-ink px-stack py-stack text-sm font-medium text-ink-foreground transition-all duration-base hover:scale-hover active:scale-active"
                  >
                    <BookOpen size={16} aria-hidden="true" />
                    {t("pages.tools.QuranJuz.readAll")}
                  </button>

                  <p className="mt-tight text-xs uppercase tracking-widest text-slate">
                    {t("pages.tools.QuranJuz.surahsInJuz")}
                  </p>

                  <div className="flex flex-col gap-1 overflow-hidden rounded-card border border-line">
                    {groups.map(group => (
                      <button
                        key={group.surahNumber}
                        type="button"
                        onClick={() => setSelection({ kind: "surah", surahNumber: group.surahNumber })}
                        className="flex items-center justify-between gap-stack border-b border-line bg-background px-stack py-tight text-left transition-colors duration-base last:border-b-0 hover:bg-mist"
                      >
                        <span className="flex flex-col">
                          <span className="font-heading text-base text-ink">{group.surahName}</span>
                          <span className="text-xs text-slate">
                            {t("pages.tools.QuranJuz.ayah")} {group.ayahs[0]?.numberInSurah}
                            {group.ayahs.length > 1
                              ? `–${group.ayahs[group.ayahs.length - 1]?.numberInSurah}`
                              : ""}
                          </span>
                        </span>
                        <span dir="rtl" lang="ar" className="font-quran text-lg text-ink">
                          {group.arabicName}
                        </span>
                      </button>
                    ))}
                  </div>
                </div>
              ) : (
                <>
                  <div className="sticky top-block z-10 -mx-gutter mt-block flex items-center justify-between gap-stack border-b border-line bg-background/95 px-gutter py-tight backdrop-blur md:-mx-gutter-lg md:px-gutter-lg">
                    <button
                      type="button"
                      onClick={() => setSelection({ kind: "picker" })}
                      aria-label={t("pages.tools.QuranJuz.backToSurahs")}
                      title={t("pages.tools.QuranJuz.backToSurahs")}
                      className="inline-flex min-w-0 shrink-0 items-center gap-1 truncate text-sm text-accent hover:underline"
                    >
                      <ChevronLeft size={14} className="shrink-0" aria-hidden="true" />
                      <span className="hidden sm:inline">{t("pages.tools.QuranJuz.backToSurahs")}</span>
                    </button>
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

                  <div className="mx-auto mt-stack flex max-w-3xl flex-col gap-block">
                    {visibleGroups.map(group => (
                      <div key={group.surahNumber} className="flex flex-col gap-stack">
                        <div className="flex items-center justify-between border-b border-line pb-tight">
                          <Link
                            to={`/tools/quran/${group.surahNumber}`}
                            className="font-heading text-lg text-ink transition-colors duration-base hover:text-accent"
                          >
                            {group.surahName}
                          </Link>
                          <span dir="rtl" lang="ar" className="font-quran text-lg text-ink">
                            {group.arabicName}
                          </span>
                        </div>

                        {viewMode === "mushaf" ? (
                          // Renders every mushaf page this surah's juz portion
                          // falls on. A page is a fixed, printed unit that
                          // doesn't respect juz boundaries — a page spanning
                          // two juz will show its full content either way,
                          // same as flipping through a physical Mushaf.
                          <MushafView
                            surahNumber={group.surahNumber}
                            translations={Object.fromEntries(group.ayahs.map(ayah => [ayah.numberInSurah, ayah.translationText]))}
                            playingAyah={
                              playingAyah != null ? group.ayahs.find(a => a.key === playingAyah)?.numberInSurah ?? null : null
                            }
                            onTogglePlay={numberInSurah => {
                              const ayah = group.ayahs.find(item => item.numberInSurah === numberInSurah);
                              if (ayah) togglePlay(ayah.key, ayah.audioUrl);
                            }}
                            playLabel={t("pages.tools.QuranSurah.play")}
                            pauseLabel={t("pages.tools.QuranSurah.pause")}
                            pageLabel={t("pages.tools.QuranSurah.pageLabel")}
                            loadErrorLabel={t("pages.tools.QuranSurah.mushafLoadError")}
                            retryLabel={t("pages.tools.QuranSurah.retry")}
                          />
                        ) : (
                          <div className="lesson-card divide-y divide-line">
                            {group.ayahs.map(ayah => (
                              <div key={ayah.key} id={`ayah-${ayah.key}`} className="scroll-mt-block">
                                <AyahCard
                                  numberInSurah={ayah.numberInSurah}
                                  arabicText={ayah.arabicText}
                                  translationText={ayah.translationText}
                                  isPlaying={playingAyah === ayah.key}
                                  isHighlighted={highlightedId === `ayah-${ayah.key}`}
                                  onTogglePlay={() => togglePlay(ayah.key, ayah.audioUrl)}
                                  playLabel={t("pages.tools.QuranSurah.play")}
                                  pauseLabel={t("pages.tools.QuranSurah.pause")}
                                />
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                </>
              )}

              <div className="mx-auto mt-block flex max-w-3xl items-center justify-between gap-stack">
                {juzNumber > FIRST_JUZ ? (
                  <Link
                    to={`/tools/quran/juz/${juzNumber - 1}`}
                    className="inline-flex items-center gap-1 rounded-control border border-line px-stack py-tight text-sm text-ink transition-colors duration-base hover:border-accent hover:text-accent"
                  >
                    <ChevronLeft size={14} aria-hidden="true" />
                    {t("pages.tools.QuranJuz.previous")}
                  </Link>
                ) : (
                  <span />
                )}
                {juzNumber < JUZ_COUNT ? (
                  <Link
                    to={`/tools/quran/juz/${juzNumber + 1}`}
                    className="inline-flex items-center gap-1 rounded-control border border-line px-stack py-tight text-sm text-ink transition-colors duration-base hover:border-accent hover:text-accent"
                  >
                    {t("pages.tools.QuranJuz.next")}
                    <ChevronRight size={14} aria-hidden="true" />
                  </Link>
                ) : (
                  <span />
                )}
              </div>
            </>
          )}
      </QuranReaderShell>

      <audio ref={audioRef} onEnded={handleAudioEnded} className="hidden" />
      <audio ref={preloadRef} preload="auto" className="hidden" />
    </>
  );
}
