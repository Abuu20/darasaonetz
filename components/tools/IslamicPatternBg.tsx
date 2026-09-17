/**
 * IslamicPatternBg
 *
 * Purely decorative, tiled geometric backdrop — an 8-point star / interlocking
 * lattice motif in the classical Islamic geometric-pattern tradition (this is
 * a hand-drawn construction from basic geometry, not a scan or reproduction
 * of any specific historical artwork). Rendered as inline SVG so it inherits
 * color from `currentColor` and needs no image asset or extra dependency.
 *
 * Usage: place absolutely inside a `relative` wrapper, behind your content:
 *
 *   <section className="relative overflow-hidden">
 *     <IslamicPatternBg />
 *     <div className="relative z-10"> ...actual content... </div>
 *   </section>
 */
export default function IslamicPatternBg({ className = "" }: { className?: string }) {
  return (
    <svg
      aria-hidden="true"
      className={`pointer-events-none absolute inset-0 h-full w-full text-primary/[0.09] ${className}`}
      xmlns="http://www.w3.org/2000/svg"
    >
      <defs>
        <pattern
          id="islamic-star-lattice"
          x="0"
          y="0"
          width="96"
          height="96"
          patternUnits="userSpaceOnUse"
        >
          {/* One 8-point star tile, built from two overlapping squares. */}
          <g transform="translate(48,48)" fill="none" stroke="currentColor" strokeWidth="1.25">
            <rect x="-24" y="-24" width="48" height="48" transform="rotate(0)" />
            <rect x="-24" y="-24" width="48" height="48" transform="rotate(45)" />
          </g>
          {/* Connecting lattice lines to the tile's neighbors. */}
          <g stroke="currentColor" strokeWidth="1.25">
            <line x1="0" y1="0" x2="48" y2="0" />
            <line x1="0" y1="0" x2="0" y2="48" />
            <line x1="96" y1="0" x2="48" y2="0" />
            <line x1="0" y1="96" x2="0" y2="48" />
          </g>
        </pattern>
      </defs>
      <rect width="100%" height="100%" fill="url(#islamic-star-lattice)" />
    </svg>
  );
}
