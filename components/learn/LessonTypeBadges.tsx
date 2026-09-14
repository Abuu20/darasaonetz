import { BookOpen, FileText, PlayCircle, Zap } from "lucide-react";
import type { Lesson } from "@/lib/db/types";

interface Badge {
  key: string;
  Icon: typeof PlayCircle;
  label: string;
  className: string;
}

/**
 * Derives a lesson's "shape" from fields it already carries — no schema
 * change needed. Video / Reading / Quiz / Resources tells a student what
 * to expect before they click, which is the pattern every mature course
 * platform uses (Coursera's item-type icons, Udemy's lecture-type tags).
 */
export function deriveBadges(lesson: Lesson, hasQuiz: boolean): Badge[] {
  const badges: Badge[] = [];
  const hasVideo = !!lesson.video_url;
  const hasText = !!(lesson.content && lesson.content.trim().length > 50);
  const resourceCount = Array.isArray(lesson.attachments) ? lesson.attachments.length : 0;

  if (hasVideo) {
    badges.push({
      key: "video",
      Icon: PlayCircle,
      label: "Video",
      className: "bg-accent/10 text-accent",
    });
  }
  if (hasText) {
    badges.push({
      key: "reading",
      Icon: BookOpen,
      label: "Reading",
      className: "bg-primary/10 text-primary",
    });
  }
  if (hasQuiz) {
    badges.push({
      key: "quiz",
      Icon: Zap,
      label: "Quiz",
      className: "bg-ember/10 text-ember",
    });
  }
  if (resourceCount > 0) {
    badges.push({
      key: "resources",
      Icon: FileText,
      label: `${resourceCount} resource${resourceCount === 1 ? "" : "s"}`,
      className: "bg-slate/10 text-slate",
    });
  }
  return badges;
}

export default function LessonTypeBadges({
  lesson,
  hasQuiz = false,
  size = "md",
}: {
  lesson: Lesson;
  hasQuiz?: boolean;
  size?: "sm" | "md";
}) {
  const badges = deriveBadges(lesson, hasQuiz);
  if (badges.length === 0) return null;

  const cls =
    size === "sm"
      ? "gap-1 px-1.5 py-0.5 text-[10px]"
      : "gap-1.5 px-2 py-0.5 text-xs";
  const iconSize = size === "sm" ? 10 : 12;

  return (
    <>
      {badges.map(b => (
        <span
          key={b.key}
          className={`inline-flex items-center rounded-pill ${b.className} ${cls}`}
        >
          <b.Icon size={iconSize} aria-hidden="true" />
          {b.label}
        </span>
      ))}
    </>
  );
}
