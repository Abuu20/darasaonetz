import { useRef, useState, type ReactNode } from "react";

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
}

// Wraps a fixed-size panel (a modal's content box) so the teacher can drag
// its bottom-right corner to make it bigger or smaller — extra room while
// polishing a long lesson, back to compact for a quick edit. Pointer Events
// cover mouse, touch and pen in one code path. Width/height are clamped to
// the viewport on every move so the handle can never drag the window off
// screen or past the min/max bounds.
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
}: ResizablePanelProps) {
  const [size, setSize] = useState({ width: defaultWidth, height: defaultHeight });
  const dragState = useRef<{ startX: number; startY: number; startW: number; startH: number } | null>(null);
  const [dragging, setDragging] = useState(false);

  const clamp = (width: number, height: number) => {
    const viewportMax = 32; // keep a small margin so the panel never touches the edge
    const capW = Math.min(maxWidth ?? Infinity, window.innerWidth - viewportMax);
    const capH = Math.min(maxHeight ?? Infinity, window.innerHeight - viewportMax);
    return {
      width: Math.min(Math.max(width, minWidth), capW),
      height: Math.min(Math.max(height, minHeight), capH),
    };
  };

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
  };

  return (
    <div
      className={`relative flex flex-col ${className}`}
      style={{ width: size.width, height: size.height, maxWidth: "100%", maxHeight: "100%" }}
    >
      {children}
      <div
        role="separator"
        aria-orientation="horizontal"
        aria-label={resizeLabel}
        tabIndex={0}
        onPointerDown={onPointerDown}
        onPointerMove={onPointerMove}
        onPointerUp={endDrag}
        onPointerCancel={endDrag}
        onKeyDown={event => {
          const step = 24;
          if (event.key === "ArrowRight") setSize(s => clamp(s.width + step, s.height));
          if (event.key === "ArrowLeft") setSize(s => clamp(s.width - step, s.height));
          if (event.key === "ArrowDown") setSize(s => clamp(s.width, s.height + step));
          if (event.key === "ArrowUp") setSize(s => clamp(s.width, s.height - step));
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
    </div>
  );
}
