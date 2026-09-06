import { useEffect, useRef, useState } from "react";
import { Settings2 } from "lucide-react";
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
        <div className="absolute end-0 z-10 mt-2 w-64 rounded-card border border-line bg-background p-stack text-start shadow-lg">
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
        </div>
      ) : null}
    </div>
  );
}
