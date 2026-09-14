import { Fragment } from "react";
import { Pause, Play } from "lucide-react";
import type { Qcf4Word } from "@/lib/quran/qcf4";
import QcfGlyph from "@/components/tools/QcfGlyph";

interface AyahCardProps {
  numberInSurah: number;
  arabicText: string;
  // QCF4 glyph words for this ayah — same pixel-accurate Madinah Mushaf
  // rendering MushafView uses. Optional and additive: while these haven't
  // loaded yet (or for a caller that never fetches them), the card falls
  // straight back to `arabicText`, so nothing ever renders blank.
  words?: Qcf4Word[];
  translationText: string;
  isPlaying: boolean;
  // True for a couple of seconds right after this verse is scrolled to
  // from a search result (see QuranSurah.tsx / QuranJuz.tsx's
  // `flashHighlight`) — a brief, stronger tint than the steady one below,
  // so it's obvious which row search actually landed on.
  isHighlighted?: boolean;
  onTogglePlay: () => void;
  playLabel: string;
  pauseLabel: string;
}

// One verse's row inside a continuous reading surface — the caller (see
// QuranSurah.tsx / QuranJuz.tsx) lays several of these one after another
// inside a single shared `.lesson-card` container with a `divide-y`
// between rows, so a surah reads as one flowing page (à la quran.com)
// rather than a stack of separately boxed/shadowed cards, one per verse.
// This component only owns what's inside one row: the verse-number
// marker, its play control, the Arabic, and the translation underneath.
export default function AyahCard({
  numberInSurah,
  arabicText,
  words,
  translationText,
  isPlaying,
  isHighlighted = false,
  onTogglePlay,
  playLabel,
  pauseLabel,
}: AyahCardProps) {
  return (
    <div
      className={`flex flex-col gap-stack px-block py-stack transition-colors duration-700 ${
        isHighlighted ? "bg-accent/10" : isPlaying ? "bg-accent/5" : "bg-transparent"
      }`}
    >
      <div className="flex items-center gap-tight">
        <span
          className={`flex h-7 w-7 shrink-0 items-center justify-center rounded-pill text-xs transition-colors duration-base ${
            isPlaying ? "gradient-brand text-primary-foreground" : "bg-mist text-slate"
          }`}
        >
          {numberInSurah}
        </span>
        <button
          type="button"
          onClick={onTogglePlay}
          aria-label={isPlaying ? pauseLabel : playLabel}
          aria-pressed={isPlaying}
          className={`flex h-7 w-7 shrink-0 items-center justify-center rounded-pill text-slate transition-colors duration-base hover:bg-mist hover:text-ink ${
            isPlaying ? "text-accent" : ""
          }`}
        >
          {isPlaying ? <Pause size={14} aria-hidden="true" /> : <Play size={14} className="ml-0.5" aria-hidden="true" />}
        </button>
      </div>
      <p dir="rtl" lang="ar" className="font-mushaf text-2xl leading-loose text-ink md:text-3xl">
        {words && words.length > 0
          ? words.map((word, index) => (
              <Fragment key={index}>
                <QcfGlyph word={word} />
                {index < words.length - 1 ? " " : null}
              </Fragment>
            ))
          : arabicText}
      </p>
      <p className="text-sm leading-relaxed text-slate" style={{ unicodeBidi: "plaintext" }}>
        {translationText}
      </p>
    </div>
  );
}
