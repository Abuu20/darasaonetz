import { useRef, useState, type ReactNode } from "react";

interface ResizableSplitProps {
  left: ReactNode;
  right: ReactNode;
  defaultLeftPercent?: number; // 0-100, desktop only
  minPercent?: number;
  maxPercent?: number;
  className?: string;
  dividerLabel?: string;
}

// A left/right split with a draggable divider — the editor on one side, a
// live "what the student will actually see" preview on the other, and the
// teacher controls exactly how much room each gets. Below the `lg`
// breakpoint the two panes stack full-width instead (dragging a thin
// divider isn't usable on a phone, and there's no spare horizontal room
// for a split anyway) — the CSS variables driving the split only apply
// through an `lg:` utility, so they have no effect on the stacked layout.
export default function ResizableSplit({
  left,
  right,
  defaultLeftPercent = 50,
  minPercent = 25,
  maxPercent = 75,
  className = "",
  dividerLabel = "Resize panels",
}: ResizableSplitProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [leftPercent, setLeftPercent] = useState(defaultLeftPercent);
  const [dragging, setDragging] = useState(false);

  const updateFromClientX = (clientX: number) => {
    const rect = containerRef.current?.getBoundingClientRect();
    if (!rect || rect.width === 0) return;
    const pct = ((clientX - rect.left) / rect.width) * 100;
    setLeftPercent(Math.min(Math.max(pct, minPercent), maxPercent));
  };

  const onPointerDown = (event: React.PointerEvent<HTMLDivElement>) => {
    event.preventDefault();
    (event.target as HTMLElement).setPointerCapture(event.pointerId);
    setDragging(true);
  };

  const onPointerMove = (event: React.PointerEvent<HTMLDivElement>) => {
    if (!dragging) return;
    updateFromClientX(event.clientX);
  };

  const endDrag = (event: React.PointerEvent<HTMLDivElement>) => {
    setDragging(false);
    (event.target as HTMLElement).releasePointerCapture(event.pointerId);
  };

  return (
    <div ref={containerRef} className={`flex flex-col lg:flex-row ${className}`}>
      <div
        className="min-w-0 overflow-y-auto lg:shrink lg:grow-0 lg:basis-[var(--split-left)]"
        style={{ ["--split-left" as any]: `${leftPercent}%` }}
      >
        {left}
      </div>

      <div
        role="separator"
        aria-orientation="vertical"
        aria-label={dividerLabel}
        tabIndex={0}
        onPointerDown={onPointerDown}
        onPointerMove={onPointerMove}
        onPointerUp={endDrag}
        onPointerCancel={endDrag}
        onKeyDown={event => {
          const step = 3;
          if (event.key === "ArrowLeft") setLeftPercent(p => Math.max(p - step, minPercent));
          if (event.key === "ArrowRight") setLeftPercent(p => Math.min(p + step, maxPercent));
        }}
        className={`relative hidden shrink-0 touch-none items-center justify-center outline-none lg:flex ${
          dragging ? "bg-accent/40" : "bg-hairline hover:bg-accent/30"
        }`}
        style={{ width: 6, cursor: "col-resize" }}
      >
        <span className="absolute h-8 w-1 rounded-pill bg-lavender" aria-hidden="true" />
      </div>

      <div
        className="min-w-0 overflow-y-auto border-t border-hairline lg:shrink lg:grow-0 lg:border-l lg:border-t-0 lg:basis-[var(--split-right)]"
        style={{ ["--split-right" as any]: `${100 - leftPercent}%` }}
      >
        {right}
      </div>
    </div>
  );
}
