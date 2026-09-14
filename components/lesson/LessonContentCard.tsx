import { sanitizeLessonContent } from "@/lib/sanitizeLessonContent";
import LessonResourceList from "@/components/lesson/LessonResourceList";
import type { LessonAttachment } from "@/lib/db/types";

interface LessonContentCardProps {
  title: string;
  lessonLabel?: string; // e.g. "Lesson 3 / 12" — omitted in the raw editor preview
  content: string | null | undefined;
  emptyLabel?: string;
  attachments?: LessonAttachment[] | null;
  resourcesLabel?: string;
}

// The light "paper" surface every major course platform (Udemy, Coursera,
// Khan Academy) uses for lesson text, even when the surrounding player
// chrome is dark: sustained reading needs a high-contrast, low-fatigue
// surface, distinct from short UI copy. This card is that surface.
export default function LessonContentCard({
  title,
  lessonLabel,
  content,
  emptyLabel,
  attachments,
  resourcesLabel,
}: LessonContentCardProps) {
  const html = content ? sanitizeLessonContent(content) : "";

  return (
    <div className="lesson-card flex flex-col gap-stack px-block py-block">
      <div className="flex flex-col gap-1">
        {lessonLabel ? (
          <span className="text-xs uppercase tracking-widest text-slate">{lessonLabel}</span>
        ) : null}
        <h1 className="font-heading text-xl text-ink">{title}</h1>
      </div>
      {html ? (
        <div className="lesson-content" dangerouslySetInnerHTML={{ __html: html }} />
      ) : emptyLabel ? (
        <p className="text-sm text-slate">{emptyLabel}</p>
      ) : null}
      {resourcesLabel ? <LessonResourceList attachments={attachments} label={resourcesLabel} /> : null}
    </div>
  );
}
