import { ArrowDown } from "lucide-react";

interface ResumePromptProps {
  savedPct: number;
  onJump: () => void;
  onDismiss: () => void;
}

/**
 * Slim, dismissible prompt shown at the top of the Lesson tab when a
 * student has a saved reading position between 5% and 95%. The pattern is
 * drawn from Medium/Kindle: never force the student to scroll-hunt, never
 * silently skip what they came to read.
 */
export default function ResumePrompt({
  savedPct,
  onJump,
  onDismiss,
}: ResumePromptProps) {
  return (
    <div className="flex items-center gap-3 rounded-control border border-accent/30 bg-accent/5 px-3 py-2">
      <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-pill bg-accent/15 text-accent">
        <ArrowDown size={14} aria-hidden="true" />
      </span>
      <span className="min-w-0 flex-1 text-xs text-ink">
        You were at <strong>{savedPct}%</strong> of this lesson.
      </span>
      <button
        type="button"
        onClick={onJump}
        className="shrink-0 rounded-control bg-accent px-3 py-1 text-xs font-medium text-accent-foreground transition-opacity duration-base hover:opacity-90"
      >
        Resume
      </button>
      <button
        type="button"
        onClick={onDismiss}
        className="shrink-0 text-xs text-slate hover:text-ink"
      >
        Dismiss
      </button>
    </div>
  );
}
