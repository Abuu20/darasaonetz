import { useEffect, useLayoutEffect, useRef, useState, type ReactNode } from "react";
import { AlertTriangle, Pause, Play, RotateCw } from "lucide-react";
import {
  ayahNumberFromVerseKey,
  collectPageFonts,
  getExactQcf4PagesForSurah,
  loadQcf4Font,
  type Qcf4Page,
  type Qcf4Word,
} from "@/lib/quran/qcf4";
import QcfGlyph from "@/components/tools/QcfGlyph";

interface MushafViewProps {
  surahNumber: number;
  // Keyed by numberInSurah — reuses the translation text the "ayah" view
  // already fetched from Al Quran Cloud, so opening a verse's meaning here
  // costs no extra request.
  translations: Record<number, string>;
  // Which ayah's recitation is currently playing (shared <audio> element
  // lives in the parent page), so the marker for that ayah can look
  // visibly "live" instead of identical to every other ayah.
  playingAyah?: number | null;
  onTogglePlay?: (numberInSurah: number) => void;
  playLabel: string;
  pauseLabel: string;
  pageLabel: string; // e.g. "Page" — rendered as "{pageLabel} 12"
  loadErrorLabel: string;
  retryLabel: string;
}

// Renders real Madinah Mushaf pages using QCF4 glyph fonts — see
// lib/quran/qcf4.ts for why this replaced plain Unicode text. Each page is
// fetched with its exact line breaks already computed by the data source,
// so (unlike the old implementation) this component does no text layout of
// its own: it renders the lines and words exactly as they come back.
export default function MushafView({
  surahNumber,
  translations,
  playingAyah,
  onTogglePlay,
  playLabel,
  pauseLabel,
  pageLabel,
  loadErrorLabel,
  retryLabel,
}: MushafViewProps) {
  const [pages, setPages] = useState<Qcf4Page[] | null>(null);
  const [loadError, setLoadError] = useState(false);
  const [reloadToken, setReloadToken] = useState(0);
  const [loadedFontsTick, setLoadedFontsTick] = useState(0);

  // Tapping an ayah opens (or, on a second tap, closes) a translation panel
  // below the page it belongs to. Independent from `playingAyah` — reading
  // a verse's meaning and listening to its recitation are two different
  // things a reader might want, so tapping the Arabic never force-starts
  // audio; the panel's own button does that.
  const [openAyah, setOpenAyah] = useState<number | null>(null);

  useEffect(() => {
    let cancelled = false;
    setPages(null);
    setLoadError(false);
    setOpenAyah(null);

    getExactQcf4PagesForSurah(surahNumber)
      .then(loadedPages => {
        if (cancelled) return;
        setPages(loadedPages);

        // Load every font these pages need. Fonts are cached globally (see
        // qcf4.ts), so flipping between surahs that share a font (most
        // adjacent surahs do — only 47 fonts cover all 604 pages) re-renders
        // instantly. Each font swaps in as soon as it lands rather than
        // waiting on the slowest one, so the reader sees progress instead
        // of one long blank wait.
        const fonts = new Set(loadedPages.flatMap(collectPageFonts));
        fonts.forEach(fontName => {
          loadQcf4Font(fontName)
            .then(() => {
              if (!cancelled) setLoadedFontsTick(tick => tick + 1);
            })
            .catch(() => {
              // A single missing/blocked font file still leaves the plain
              // Arabic fallback text readable — not worth failing the page.
            });
        });
      })
      .catch(() => {
        if (!cancelled) setLoadError(true);
      });

    return () => {
      cancelled = true;
    };
  }, [surahNumber, reloadToken]);

  if (loadError) {
    return (
      <div className="lesson-card flex flex-col items-center gap-stack px-block py-block text-center">
        <AlertTriangle size={28} className="text-slate" aria-hidden="true" />
        <p className="text-sm text-slate">{loadErrorLabel}</p>
        <button
          type="button"
          onClick={() => setReloadToken(token => token + 1)}
          className="inline-flex items-center gap-tight rounded-control bg-ink px-stack py-tight text-sm text-ink-foreground transition-all duration-base hover:scale-hover active:scale-active"
        >
          <RotateCw size={14} aria-hidden="true" />
          {retryLabel}
        </button>
      </div>
    );
  }

  if (!pages) {
    return (
      <div className="flex flex-col gap-stack">
        {[0, 1].map(index => (
          <div key={index} className="h-64 animate-pulse rounded-card bg-mist" />
        ))}
      </div>
    );
  }

  const openTranslation = openAyah != null ? translations[openAyah] : undefined;

  return (
    <div className="flex flex-col gap-block" key={loadedFontsTick}>
      {pages.map(page => (
        <div key={page.page} className="flex flex-col gap-stack">
          <MushafPage
            page={page}
            pageLabel={pageLabel}
            openAyah={openAyah}
            playingAyah={playingAyah}
            onWordClick={verseKey => setOpenAyah(current => (current === verseKey ? null : verseKey))}
          />
          {/*
            Rendered right after the page that actually contains the tapped
            ayah — not once at the very end of the whole surah. A long
            surah can span dozens of pages, and a panel that only ever
            appeared after the last one would be invisible (or a long
            scroll away) for every ayah opened earlier in the surah.
          */}
          {openAyah != null && openTranslation && pageContainsAyah(page, openAyah) ? (
            <TranslationPanel
              translation={openTranslation}
              isPlaying={playingAyah === openAyah}
              onTogglePlay={onTogglePlay ? () => onTogglePlay(openAyah) : undefined}
              playLabel={playLabel}
              pauseLabel={pauseLabel}
            />
          ) : null}
        </div>
      ))}
    </div>
  );
}

function pageContainsAyah(page: Qcf4Page, numberInSurah: number): boolean {
  return page.lines.some(line =>
    line.words.some(
      word => (word.type === "word" || word.type === "end") && word.verse_key != null && ayahNumberFromVerseKey(word.verse_key) === numberInSurah
    )
  );
}

interface TranslationPanelProps {
  translation: string;
  isPlaying: boolean;
  onTogglePlay?: () => void;
  playLabel: string;
  pauseLabel: string;
}

function TranslationPanel({ translation, isPlaying, onTogglePlay, playLabel, pauseLabel }: TranslationPanelProps) {
  const panelRef = useRef<HTMLDivElement | null>(null);

  // Scrolls the panel into view as soon as it appears, so tapping an ayah
  // anywhere on a long page — or near the top of a tall one — doesn't
  // leave the reader hunting for where its translation showed up.
  useEffect(() => {
    panelRef.current?.scrollIntoView({ behavior: "smooth", block: "nearest" });
  }, []);

  return (
    <div ref={panelRef} dir="ltr" className="lesson-card flex items-start justify-between gap-stack px-block py-stack">
      <p className="text-sm leading-relaxed text-slate" style={{ unicodeBidi: "plaintext" }}>
        {translation}
      </p>
      {onTogglePlay ? (
        <button
          type="button"
          onClick={onTogglePlay}
          aria-label={isPlaying ? pauseLabel : playLabel}
          aria-pressed={isPlaying}
          className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-pill transition-colors duration-base ${
            isPlaying ? "gradient-brand text-primary-foreground" : "bg-mist text-ink hover:bg-line"
          }`}
        >
          {isPlaying ? <Pause size={16} aria-hidden="true" /> : <Play size={16} className="ml-0.5" aria-hidden="true" />}
        </button>
      ) : null}
    </div>
  );
}

interface MushafPageProps {
  page: Qcf4Page;
  pageLabel: string;
  openAyah: number | null;
  playingAyah?: number | null;
  onWordClick: (numberInSurah: number) => void;
}

function MushafPage({ page, pageLabel, openAyah, playingAyah, onWordClick }: MushafPageProps) {
  return (
    <div className="lesson-card px-block py-block">
      <p className="mb-stack text-center text-xs uppercase tracking-widest text-slate">
        {pageLabel} {page.page}
      </p>

      {/*
        Each line is rendered exactly as the physical Mushaf lays it out —
        one flex row per print line, spread with justify-content:
        space-between so the words reach both edges the way a printed page's
        full-width lines do. This sidesteps the reason plain text-align:
        justify was removed from the old implementation: browsers can only
        justify RTL text by stretching inter-word spaces (no kashida
        support), which is exactly what made that look broken. Flex spacing
        the words apart, instead of asking the browser to justify running
        text, avoids that entirely. A short final line (end of a surah)
        will look sparse rather than stretched — the same as it does on a
        real Mushaf page.
      */}
      <div dir="rtl" lang="ar" className="flex flex-col gap-3">
        {page.lines.map(line => (
          <MushafLine key={line.line}>
            {line.words.map((word, index) => (
              <MushafGlyph
                key={`${line.line}-${index}`}
                word={word}
                isOpen={word.verse_key != null && ayahNumberFromVerseKey(word.verse_key) === openAyah}
                isPlaying={word.verse_key != null && ayahNumberFromVerseKey(word.verse_key) === playingAyah}
                onClick={onWordClick}
              />
            ))}
          </MushafLine>
        ))}
      </div>
    </div>
  );
}

// One printed Mushaf line, laid out exactly like quran.com: the words
// never wrap onto a second row. Instead, if a line is too wide for the
// screen at its normal font size (always true on phones — these lines are
// sized for a full print page), the whole line's font-size is shrunk down
// by just enough to fit on one row at the current width, then spread with
// `justify-between` so it still reaches both edges like a real page line.
// Wrapping (the old behavior) is what broke on mobile: a wrapped line split
// into sub-rows and `justify-between` then spaced those sub-rows unevenly,
// which is the "looks fine on PC, messy on phone" symptom this replaces.
function MushafLine({ children }: { children: ReactNode }) {
  const outerRef = useRef<HTMLDivElement | null>(null);
  const innerRef = useRef<HTMLDivElement | null>(null);
  const [fontSize, setFontSize] = useState<number | undefined>(undefined);

  useLayoutEffect(() => {
    const outer = outerRef.current;
    const inner = innerRef.current;
    if (!outer || !inner) return;

    const measure = () => {
      // Reset to the CSS default before measuring, so shrinking a line at a
      // narrow width doesn't permanently cap it once the viewport (or a
      // sidebar) grows back — every measurement starts from full size.
      inner.style.fontSize = "";
      const availableWidth = outer.clientWidth;
      const naturalWidth = inner.scrollWidth;
      if (naturalWidth <= availableWidth || naturalWidth === 0) {
        setFontSize(undefined);
        return;
      }
      const baseSize = parseFloat(getComputedStyle(inner).fontSize);
      // A hair under the exact ratio (0.98) so rounding in font metrics
      // never leaves the last word clipped by a sub-pixel.
      const nextSize = baseSize * (availableWidth / naturalWidth) * 0.98;
      setFontSize(nextSize);
    };

    measure();

    // Re-measure on rotation, window resize, or the sidebar/toolbar
    // changing the container's width — not just on first mount.
    const observer = new ResizeObserver(measure);
    observer.observe(outer);
    return () => observer.disconnect();
  }, [children]);

  return (
    <div ref={outerRef} className="w-full overflow-hidden">
      <div
        ref={innerRef}
        className="flex flex-nowrap items-baseline justify-between gap-x-1"
        style={fontSize ? { fontSize: `${fontSize}px` } : undefined}
      >
        {children}
      </div>
    </div>
  );
}

interface MushafGlyphProps {
  word: Qcf4Word;
  isOpen: boolean;
  isPlaying: boolean;
  onClick: (numberInSurah: number) => void;
}

function MushafGlyph({ word, isOpen, isPlaying, onClick }: MushafGlyphProps) {
  const isTappable = word.type === "word" || word.type === "end";
  // Surah-header banners and the bismillah line are decorative, not part of
  // the reading flow — larger and centered, matching how they appear on a
  // printed page, and not part of any line's word-spacing (they get their
  // own full-width row).
  const isBanner = word.type === "surah_header" || word.type === "bismillah";

  // The Arabic itself always stays the same ink color it's printed in,
  // playing or not — recoloring the glyph text (an earlier version of this
  // did, via `isPlaying`) fights the mushaf font's own legibility instead
  // of helping: a whole verse's worth of dense glyphs switching to a
  // saturated accent color is a lot harder to read than the same script in
  // its normal color with a soft tint sitting behind it. `isPlaying` only
  // affects the wrapping <span>'s background below.
  const textColorClass = isBanner ? "text-accent" : "text-ink";
  const glyph = (
    <QcfGlyph
      word={word}
      className={isBanner ? `font-mushaf text-xl ${textColorClass} md:text-2xl` : `font-mushaf text-2xl ${textColorClass} md:text-3xl`}
    />
  );

  if (isBanner) {
    return <div className="w-full py-1 text-center">{glyph}</div>;
  }

  if (!isTappable || !word.verse_key) {
    return glyph;
  }

  const numberInSurah = ayahNumberFromVerseKey(word.verse_key);

  return (
    <span
      onClick={() => onClick(numberInSurah)}
      className={`cursor-pointer rounded px-0.5 transition-colors duration-base ${
        isOpen ? "bg-mist" : isPlaying ? "bg-accent/10" : "hover:bg-mist/60"
      }`}
    >
      {glyph}
    </span>
  );
}
