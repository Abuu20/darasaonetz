import { useState } from "react";
import { Star } from "lucide-react";

const SIZES = { sm: 14, md: 18, lg: 26 } as const;

// Read-only star display — used on course cards, the rating summary, and
// inside each review. `value` can be fractional (e.g. 4.3) for the display
// case; stars fill proportionally rather than only ever showing whole stars,
// matching how Coursera/Udemy render an average rating.
export function StarRatingDisplay({
  value,
  size = "sm",
  className = "",
}: {
  value: number;
  size?: keyof typeof SIZES;
  className?: string;
}) {
  const px = SIZES[size];
  return (
    <span className={`inline-flex items-center gap-0.5 ${className}`} role="img" aria-label={`${value.toFixed(1)} out of 5 stars`}>
      {[1, 2, 3, 4, 5].map(position => {
        const fillPct = Math.max(0, Math.min(1, value - (position - 1))) * 100;
        return (
          <span key={position} className="relative inline-block" style={{ width: px, height: px }} aria-hidden="true">
            <Star size={px} className="absolute inset-0 text-line" strokeWidth={1.5} />
            <span className="absolute inset-0 overflow-hidden" style={{ width: `${fillPct}%` }}>
              <Star size={px} className="text-ember" fill="currentColor" strokeWidth={1.5} />
            </span>
          </span>
        );
      })}
    </span>
  );
}

// Interactive 1–5 star picker for the "write a review" form. Keyboard
// accessible (radiogroup + arrow-free simple tab/enter — each star is its
// own button) and supports hover preview before committing a click.
export function StarRatingInput({
  value,
  onChange,
  size = "lg",
  disabled = false,
}: {
  value: number;
  onChange: (next: number) => void;
  size?: keyof typeof SIZES;
  disabled?: boolean;
}) {
  const [hovered, setHovered] = useState<number | null>(null);
  const px = SIZES[size];
  const shown = hovered ?? value;

  return (
    <div role="radiogroup" aria-label="Rating" className="inline-flex items-center gap-1">
      {[1, 2, 3, 4, 5].map(position => (
        <button
          key={position}
          type="button"
          role="radio"
          aria-checked={value === position}
          aria-label={`${position} star${position > 1 ? "s" : ""}`}
          disabled={disabled}
          onMouseEnter={() => setHovered(position)}
          onMouseLeave={() => setHovered(null)}
          onFocus={() => setHovered(position)}
          onBlur={() => setHovered(null)}
          onClick={() => onChange(position)}
          className="rounded-control p-0.5 transition-transform duration-fast hover:scale-hover disabled:cursor-default disabled:hover:scale-100"
        >
          <Star
            size={px}
            className={position <= shown ? "text-ember" : "text-line"}
            fill={position <= shown ? "currentColor" : "none"}
            strokeWidth={1.5}
          />
        </button>
      ))}
    </div>
  );
}
