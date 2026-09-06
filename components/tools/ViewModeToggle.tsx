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
          className={`inline-flex items-center gap-tight rounded-pill px-stack py-1.5 text-sm transition-colors duration-base ${
            mode === option.value ? "gradient-brand text-primary-foreground" : "text-slate hover:text-ink"
          }`}
        >
          <option.icon size={14} aria-hidden="true" />
          {option.label}
        </button>
      ))}
    </div>
  );
}
