import { ArrowRight, Clock } from "lucide-react";
import LessonTypeBadges from "@/components/learn/LessonTypeBadges";
import type { Lesson } from "@/lib/db/types";

interface LessonNextUpProps {
  nextLesson: Lesson;
  onSelect: () => void;
}

/**
 * Continuation prompt shown at the end of the Lesson tab. Tells the student
 * exactly what's coming next (title, type, duration) with a single primary
 * action — the pattern every streaming and course UI converges on because
 * it's the single biggest lever on course completion rates.
 */
export default function LessonNextUp({ nextLesson, onSelect }: LessonNextUpProps) {
  return (
    <div className="mt-block flex flex-col gap-stack rounded-card border border-accent/30 bg-gradient-to-br from-accent/10 via-accent/5 to-transparent p-block md:flex-row md:items-center md:justify-between">
      <div className="min-w-0 flex-1">
        <p className="text-[10px] uppercase tracking-[0.18em] text-slate">Up next</p>
        <h3 className="mt-1 truncate font-heading text-base text-ink">
          {nextLesson.title}
        </h3>
        <div className="mt-2 flex flex-wrap items-center gap-2">
          <LessonTypeBadges lesson={nextLesson} size="sm" />
          {nextLesson.duration_minutes ? (
            <span className="inline-flex items-center gap-1 text-xs text-slate">
              <Clock size={12} aria-hidden="true" />
              {nextLesson.duration_minutes} min
            </span>
          ) : null}
        </div>
      </div>
      <button
        type="button"
        onClick={onSelect}
        className="gradient-brand inline-flex shrink-0 items-center gap-2 rounded-control px-block py-tight text-sm font-medium text-primary-foreground transition-all duration-base hover:scale-hover active:scale-active"
      >
        Continue
        <ArrowRight size={14} aria-hidden="true" />
      </button>
    </div>
  );
}
