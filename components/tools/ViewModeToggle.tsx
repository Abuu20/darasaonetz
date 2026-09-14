import { BookOpenText, Rows3 } from "lucide-react";
import type { QuranViewMode } from "@/lib/quran/viewMode";

interface ViewModeToggleProps {
  mode: QuranViewMode;
  onChange: (mode: QuranViewMode) => void;
  ayahLabel: string;
  mushafLabel: string;
}

export default function ViewModeToggle({ mode, onChange, ayahLabel, mushafLabel }: ViewModeToggleProps) {
  const options: { value: QuranViewMode; label: string; icon: typeof Rows3 }[] = [
    { value: "ayah", label: ayahLabel, icon: Rows3 },
    { value: "mushaf", label: mushafLabel, icon: BookOpenText },
  ];

  return (
    <div className="inline-flex items-center gap-1 rounded-pill border border-line bg-background p-1">
      {options.map(option => (
        <button
          key={option.value}
          type="button"
          onClick={() => onChange(option.value)}
          aria-pressed={mode === option.value}
          aria-label={option.label}
          title={option.label}
          className={`inline-flex items-center gap-tight rounded-pill px-2.5 py-1.5 text-sm transition-colors duration-base sm:px-stack ${
            mode === option.value ? "gradient-brand text-primary-foreground" : "text-slate hover:text-ink"
          }`}
        >
          <option.icon size={14} aria-hidden="true" />
          {/* Labels only from sm up — on a phone this toggle sits in a
              non-wrapping toolbar alongside search and settings, and full
              text labels here were wide enough to push the settings gear
              off the right edge of the screen. quran.com's own mobile
              toolbar is icon-only for the same reason. */}
          <span className="hidden sm:inline">{option.label}</span>
        </button>
      ))}
    </div>
  );
}
