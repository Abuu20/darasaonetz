import { useEffect, useRef, useState } from "react";
import { Search, X } from "lucide-react";

export interface SearchableAyah {
  // DOM id of the element to scroll to when this ayah is picked, e.g.
  // `ayah-12` (QuranSurah) or `ayah-1037` (QuranJuz, keyed by absolute
  // mushaf position since numberInSurah repeats across surahs in a juz).
  id: string;
  numberInSurah: number;
  arabicText: string;
  translationText: string;
}

interface VerseSearchProps {
  ayahs: SearchableAyah[];
  onSelect: (id: string) => void;
  searchLabel: string;
  placeholder: string;
  closeLabel: string;
  noResultsLabel: string;
  // Appended after the match count, e.g. "12 matching ayahs".
  resultsLabel: string;
}

const MAX_RESULTS = 30;

// Quran.com-style search scoped to whatever's currently open (one surah, or
// one juz's worth of ayahs) rather than the whole mushaf — that's what the
// /tools/quran index page's search already covers. Matches instantly against
// the translation and ayah text already loaded for this reading, so picking
// a result just scrolls the reader to it instead of firing a new request.
export default function VerseSearch({
  ayahs,
  onSelect,
  searchLabel,
  placeholder,
  closeLabel,
  noResultsLabel,
  resultsLabel,
}: VerseSearchProps) {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const inputRef = useRef<HTMLInputElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (open) inputRef.current?.focus();
  }, [open]);

  useEffect(() => {
    if (!open) return;
    const handleClickOutside = (event: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [open]);

  const closeSearch = () => {
    setOpen(false);
    setQuery("");
  };

  const trimmed = query.trim();
  const needle = trimmed.toLowerCase();

  // Arabic matching is a plain substring check against the Uthmani text as
  // stored (diacritics and all) — typing without tashkeel won't match. Left
  // in because it still catches copy-pasted Arabic phrases; the translation
  // and verse-number matches below cover the common case.
  const matches =
    needle.length === 0
      ? []
      : ayahs
          .filter(
            ayah =>
              String(ayah.numberInSurah) === trimmed ||
              ayah.translationText.toLowerCase().includes(needle) ||
              ayah.arabicText.includes(trimmed)
          )
          .slice(0, MAX_RESULTS);

  const highlightTranslation = (text: string) => {
    const index = text.toLowerCase().indexOf(needle);
    if (index === -1) return text;
    return (
      <>
        {text.slice(0, index)}
        <mark className="rounded-sm bg-accent/20 text-ink">{text.slice(index, index + needle.length)}</mark>
        {text.slice(index + needle.length)}
      </>
    );
  };

  const handleSelect = (id: string) => {
    onSelect(id);
    closeSearch();
  };

  if (!open) {
    return (
      <button
        type="button"
        onClick={() => setOpen(true)}
        aria-label={searchLabel}
        title={searchLabel}
        className="inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-pill border border-line bg-background text-slate transition-colors duration-base hover:text-ink"
      >
        <Search size={16} aria-hidden="true" />
      </button>
    );
  }

  return (
    <div ref={containerRef} className="relative shrink-0">
      <div className="flex items-center gap-tight rounded-pill border border-line bg-background px-stack py-1.5">
        <Search size={14} className="shrink-0 text-slate" aria-hidden="true" />
        <input
          ref={inputRef}
          type="search"
          value={query}
          onChange={event => setQuery(event.target.value)}
          onKeyDown={event => {
            if (event.key === "Escape") closeSearch();
          }}
          placeholder={placeholder}
          className="w-28 bg-transparent text-sm text-ink outline-none placeholder:text-slate sm:w-48"
        />
        <button
          type="button"
          onClick={closeSearch}
          aria-label={closeLabel}
          title={closeLabel}
          className="shrink-0 text-slate transition-colors duration-base hover:text-ink"
        >
          <X size={14} aria-hidden="true" />
        </button>
      </div>

      {needle.length > 0 ? (
        <div className="absolute end-0 z-20 mt-2 max-h-80 w-72 overflow-y-auto rounded-card border border-line bg-background p-1 text-start shadow-lg sm:w-80">
          {matches.length === 0 ? (
            <p className="px-stack py-tight text-sm text-slate">{noResultsLabel}</p>
          ) : (
            <>
              {matches.map(ayah => (
                <button
                  key={ayah.id}
                  type="button"
                  onClick={() => handleSelect(ayah.id)}
                  className="flex w-full flex-col gap-0.5 rounded-control px-stack py-tight text-start transition-colors duration-base hover:bg-mist"
                >
                  <span className="text-xs text-slate">#{ayah.numberInSurah}</span>
                  <span className="line-clamp-2 text-sm text-ink">{highlightTranslation(ayah.translationText)}</span>
                </button>
              ))}
              <p className="border-t border-line px-stack py-tight text-xs text-slate">
                {matches.length}
                {matches.length === MAX_RESULTS ? "+" : ""} {resultsLabel}
              </p>
            </>
          )}
        </div>
      ) : null}
    </div>
  );
}
