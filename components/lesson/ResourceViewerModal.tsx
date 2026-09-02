import { useEffect, useRef } from "react";
import { Download, Maximize, X } from "lucide-react";
import type { LessonAttachment } from "@/lib/db/types";

interface ResourceViewerModalProps {
  attachment: LessonAttachment;
  onClose: () => void;
}

// A real in-app viewer for images and PDFs — not just "open the raw file
// in a new tab." Browsers render PDFs fine inside an <iframe>, so this gets
// the same native pinch-zoom/print/fullscreen a new tab would give, but
// without leaving the lesson. The explicit fullscreen button is separate
// from "close" because a viewer that's already a full-screen overlay still
// benefits from true browser Fullscreen API (hides the address bar on
// mobile, which matters most for reading a dense PDF on a phone).
export default function ResourceViewerModal({ attachment, onClose }: ResourceViewerModalProps) {
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    document.addEventListener("keydown", onKey);
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", onKey);
      document.body.style.overflow = "";
    };
  }, [onClose]);

  const toggleFullscreen = () => {
    if (document.fullscreenElement) {
      document.exitFullscreen?.();
    } else {
      containerRef.current?.requestFullscreen?.().catch(() => {});
    }
  };

  return (
    <div
      className="fixed inset-0 z-[100] flex flex-col bg-black/95"
      role="dialog"
      aria-modal="true"
      aria-label={attachment.name}
      onClick={e => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div className="flex shrink-0 items-center justify-between gap-tight px-gutter py-tight text-white">
        <span className="min-w-0 truncate text-sm">{attachment.name}</span>
        <div className="flex shrink-0 items-center gap-1">
          <a
            href={attachment.url}
            download
            target="_blank"
            rel="noopener noreferrer"
            aria-label="Download"
            className="rounded-control p-2 text-white/80 transition-colors duration-base hover:bg-white/10 hover:text-white"
          >
            <Download size={18} />
          </a>
          <button
            type="button"
            onClick={toggleFullscreen}
            aria-label="Toggle fullscreen"
            className="rounded-control p-2 text-white/80 transition-colors duration-base hover:bg-white/10 hover:text-white"
          >
            <Maximize size={18} />
          </button>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close"
            className="rounded-control p-2 text-white/80 transition-colors duration-base hover:bg-white/10 hover:text-white"
          >
            <X size={18} />
          </button>
        </div>
      </div>

      <div ref={containerRef} className="flex flex-1 items-center justify-center overflow-auto bg-black">
        {attachment.type === "image" ? (
          <img src={attachment.url} alt={attachment.name} className="max-h-full max-w-full object-contain" />
        ) : (
          <iframe src={attachment.url} title={attachment.name} className="h-full w-full border-0 bg-white" />
        )}
      </div>
    </div>
  );
}
