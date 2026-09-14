import { useEffect, useRef, useState } from "react";
import { Settings2, X } from "lucide-react";
import { RECITERS, SCRIPT_EDITIONS } from "@/lib/quran/quranApi";

interface QuranReaderSettingsProps {
  scriptEdition: string;
  onScriptChange: (id: string) => void;
  reciter: string;
  onReciterChange: (id: string) => void;
  settingsLabel: string;
  scriptLabel: string;
  reciterLabel: string;
  scriptOptionLabels: Record<string, string>;
}

// Lets the reader pick which mushaf script (Uthmani vs. simple) and which
// reciter's audio to use — both persisted in lib/quran/readerPrefs.ts so the
// choice carries across surahs. Kept as its own small popover, next to
// ViewModeToggle, rather than always-visible selects, since most readers
// never need to touch these.
//
// On phones this renders as a bottom sheet (quran.com's own pattern for this
// exact panel) instead of the anchored floating box used on larger screens.
// A ~256px absolutely-positioned box anchored to a small icon button sitting
// right at the screen edge has nowhere safe to land on a narrow viewport —
// that's what was floating off-screen. A bottom sheet sidesteps the problem
// entirely: it's always full-width and anchored to the viewport itself, not
// to the button.
export default function QuranReaderSettings({
  scriptEdition,
  onScriptChange,
  reciter,
  onReciterChange,
  settingsLabel,
  scriptLabel,
  reciterLabel,
  scriptOptionLabels,
}: QuranReaderSettingsProps) {
  const [open, setOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

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

  const fields = (
    <>
      <label className="flex flex-col gap-1 text-xs text-slate">
        {scriptLabel}
        <select
          value={scriptEdition}
          onChange={event => onScriptChange(event.target.value)}
          className="rounded-control border border-line bg-background px-tight py-1.5 text-sm text-ink"
        >
          {SCRIPT_EDITIONS.map(option => (
            <option key={option.id} value={option.id}>
              {scriptOptionLabels[option.labelKey] ?? option.id}
            </option>
          ))}
        </select>
      </label>

      <label className="mt-stack flex flex-col gap-1 text-xs text-slate">
        {reciterLabel}
        <select
          value={reciter}
          onChange={event => onReciterChange(event.target.value)}
          className="rounded-control border border-line bg-background px-tight py-1.5 text-sm text-ink"
        >
          {RECITERS.map(option => (
            <option key={option.id} value={option.id}>
              {option.name}
            </option>
          ))}
        </select>
      </label>
    </>
  );

  return (
    <div ref={containerRef} className="relative">
      <button
        type="button"
        onClick={() => setOpen(current => !current)}
        aria-expanded={open}
        aria-label={settingsLabel}
        title={settingsLabel}
        className="inline-flex h-9 w-9 items-center justify-center rounded-pill border border-line bg-background text-slate transition-colors duration-base hover:text-ink"
      >
        <Settings2 size={16} aria-hidden="true" />
      </button>

      {open ? (
        <>
          {/* Bottom sheet: phones only (below sm). Anchored to the viewport
              via `fixed`, not to the button, so it can never overflow off
              the side of a narrow screen. */}
          <div className="fixed inset-0 z-50 sm:hidden">
            <div className="absolute inset-0 bg-ink/40" onClick={() => setOpen(false)} aria-hidden="true" />
            <div className="absolute inset-x-0 bottom-0 rounded-t-card border-t border-line bg-background p-block shadow-lg">
              <div className="mb-stack flex items-center justify-between">
                <span className="font-heading text-sm text-ink">{settingsLabel}</span>
                <button
                  type="button"
                  onClick={() => setOpen(false)}
                  aria-label={settingsLabel}
                  className="flex h-9 w-9 items-center justify-center rounded-control text-ink transition-colors duration-base hover:bg-mist"
                >
                  <X size={18} aria-hidden="true" />
                </button>
              </div>
              {fields}
            </div>
          </div>

          {/* Anchored popover: sm and up, where a 256px box next to the
              button comfortably fits within the viewport. */}
          <div className="absolute end-0 z-10 mt-2 hidden w-64 rounded-card border border-line bg-background p-stack text-start shadow-lg sm:block">
            {fields}
          </div>
        </>
      ) : null}
    </div>
  );
}
