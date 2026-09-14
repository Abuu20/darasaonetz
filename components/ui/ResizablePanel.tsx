import { useEffect, useRef, useState, type ReactNode } from "react";
import { Maximize2, Minimize2 } from "lucide-react";

interface ResizablePanelProps {
  children: ReactNode;
  className?: string;
  defaultWidth: number;
  defaultHeight: number;
  minWidth?: number;
  minHeight?: number;
  maxWidth?: number;
  maxHeight?: number;
  resizeLabel?: string;
  // When set, the panel remembers the teacher's last chosen size (per
  // browser) under this key and restores it next time this editor opens —
  // set the size once on a big screen and every future session opens that
  // large, instead of resetting to the modest default every time.
  storageKey?: string;
  maximizeLabel?: string;
  restoreLabel?: string;
  // Opens already filling the screen — useful for editors that are mostly
  // used on desktop, where starting small just adds a click.
  defaultMaximized?: boolean;
}

const EDGE_MARGIN = 32; // keep a small margin so the panel never touches the viewport edge

function readStoredSize(storageKey: string | undefined) {
  if (!storageKey || typeof window === "undefined") return null;
  try {
    const raw = window.localStorage.getItem(`resizable-panel:${storageKey}`);
    if (!raw) return null;
    const parsed = JSON.parse(raw);
    if (typeof parsed?.width === "number" && typeof parsed?.height === "number") return parsed as { width: number; height: number };
  } catch {
    // Corrupt or inaccessible storage — fall back to defaults silently.
  }
  return null;
}

// Wraps a fixed-size panel (a modal's content box) so the teacher can drag
// its bottom-right corner to make it bigger or smaller — extra room while
// polishing a long lesson, back to compact for a quick edit. Pointer Events
// cover mouse, touch and pen in one code path. Width/height are clamped to
// the viewport on every move (and again if the browser window itself is
// resized) so the handle can never drag the window off screen or past the
// min/max bounds. A floating corner button offers a one-tap jump to "fill
// the screen" for anyone who'd rather not drag at all, and — when a
// storageKey is given — the chosen size sticks around for next time.
export default function ResizablePanel({
  children,
  className = "",
  defaultWidth,
  defaultHeight,
  minWidth = 320,
  minHeight = 320,
  maxWidth,
  maxHeight,
  resizeLabel = "Resize window",
  storageKey,
  maximizeLabel = "Fill screen",
  restoreLabel = "Restore size",
  defaultMaximized = false,
}: ResizablePanelProps) {
  const stored = useRef(readStoredSize(storageKey)).current;
  const [size, setSize] = useState({ width: stored?.width ?? defaultWidth, height: stored?.height ?? defaultHeight });
  const dragState = useRef<{ startX: number; startY: number; startW: number; startH: number } | null>(null);
  const [dragging, setDragging] = useState(false);
  const [maximized, setMaximized] = useState(defaultMaximized);
  // Bumped on window resize purely to force a re-render while maximized, so
  // the "fill the screen" size tracks the new viewport instead of freezing
  // at whatever size the window happened to be when maximize was toggled.
  const [, forceTick] = useState(0);

  const clamp = (width: number, height: number) => {
    const capW = Math.min(maxWidth ?? Infinity, window.innerWidth - EDGE_MARGIN);
    const capH = Math.min(maxHeight ?? Infinity, window.innerHeight - EDGE_MARGIN);
    return {
      width: Math.min(Math.max(width, minWidth), capW),
      height: Math.min(Math.max(height, minHeight), capH),
    };
  };

  const persist = (next: { width: number; height: number }) => {
    if (!storageKey || typeof window === "undefined") return;
    try {
      window.localStorage.setItem(`resizable-panel:${storageKey}`, JSON.stringify(next));
    } catch {
      // Storage full or blocked — the resize itself still works, it just won't stick.
    }
  };

  // Keep the panel on-screen (and, while maximized, filling the new
  // viewport) if the browser window itself is resized.
  useEffect(() => {
    const onResize = () => {
      if (maximized) {
        forceTick(t => t + 1);
        return;
      }
      setSize(prev => clamp(prev.width, prev.height));
    };
    window.addEventListener("resize", onResize);
    return () => window.removeEventListener("resize", onResize);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [maximized, maxWidth, maxHeight, minWidth, minHeight]);

  const onPointerDown = (event: React.PointerEvent<HTMLDivElement>) => {
    event.preventDefault();
    (event.target as HTMLElement).setPointerCapture(event.pointerId);
    dragState.current = { startX: event.clientX, startY: event.clientY, startW: size.width, startH: size.height };
    setDragging(true);
  };

  const onPointerMove = (event: React.PointerEvent<HTMLDivElement>) => {
    if (!dragState.current) return;
    const dx = event.clientX - dragState.current.startX;
    const dy = event.clientY - dragState.current.startY;
    setSize(clamp(dragState.current.startW + dx, dragState.current.startH + dy));
  };

  const endDrag = (event: React.PointerEvent<HTMLDivElement>) => {
    if (!dragState.current) return;
    dragState.current = null;
    setDragging(false);
    (event.target as HTMLElement).releasePointerCapture(event.pointerId);
    setSize(current => {
      persist(current);
      return current;
    });
  };

  const toggleMaximize = () => setMaximized(m => !m);

  // The size actually rendered: the full (margin-clamped) viewport while
  // maximized, otherwise whatever the teacher last dragged it to.
  const rendered = maximized
    ? {
        width: (typeof window !== "undefined" ? window.innerWidth : defaultWidth) - EDGE_MARGIN,
        height: (typeof window !== "undefined" ? window.innerHeight : defaultHeight) - EDGE_MARGIN,
      }
    : size;

  return (
    <div
      className={`relative flex flex-col ${className}`}
      style={{ width: rendered.width, height: rendered.height, maxWidth: "100%", maxHeight: "100%" }}
    >
      {children}

      <button
        type="button"
        onClick={toggleMaximize}
        aria-label={maximized ? restoreLabel : maximizeLabel}
        title={maximized ? restoreLabel : maximizeLabel}
        className="absolute -right-3 -top-3 z-20 flex h-7 w-7 items-center justify-center rounded-pill bg-night text-night-foreground shadow-md transition-transform duration-base hover:scale-105"
      >
        {maximized ? <Minimize2 size={13} aria-hidden="true" /> : <Maximize2 size={13} aria-hidden="true" />}
      </button>

      {!maximized ? (
        <div
          role="separator"
          aria-orientation="horizontal"
          aria-label={resizeLabel}
          tabIndex={0}
          onPointerDown={onPointerDown}
          onPointerMove={onPointerMove}
          onPointerUp={endDrag}
          onPointerCancel={endDrag}
          onDoubleClick={toggleMaximize}
          onKeyDown={event => {
            const step = 24;
            if (event.key === "ArrowRight") setSize(s => { const n = clamp(s.width + step, s.height); persist(n); return n; });
            if (event.key === "ArrowLeft") setSize(s => { const n = clamp(s.width - step, s.height); persist(n); return n; });
            if (event.key === "ArrowDown") setSize(s => { const n = clamp(s.width, s.height + step); persist(n); return n; });
            if (event.key === "ArrowUp") setSize(s => { const n = clamp(s.width, s.height - step); persist(n); return n; });
            if (event.key === "Enter") toggleMaximize();
          }}
          className={`group absolute bottom-0 right-0 z-10 flex h-6 w-6 cursor-nwse-resize touch-none items-end justify-end p-1 outline-none ${
            dragging ? "opacity-100" : "opacity-60 hover:opacity-100"
          }`}
        >
          <svg width="10" height="10" viewBox="0 0 10 10" className="text-lavender group-focus-visible:text-accent" aria-hidden="true">
            <circle cx="8" cy="2" r="1.1" fill="currentColor" />
            <circle cx="8" cy="5" r="1.1" fill="currentColor" />
            <circle cx="8" cy="8" r="1.1" fill="currentColor" />
            <circle cx="5" cy="5" r="1.1" fill="currentColor" />
            <circle cx="5" cy="8" r="1.1" fill="currentColor" />
            <circle cx="2" cy="8" r="1.1" fill="currentColor" />
          </svg>
        </div>
      ) : null}
    </div>
  );
}
