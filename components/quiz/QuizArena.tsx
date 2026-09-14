import { motion } from "motion/react";
import { X, Zap } from "lucide-react";
import QuizPlayer from "@/components/quiz/QuizPlayer";
import { useLanguage } from "@/context/LanguageContext";
import type { Quiz } from "@/lib/db/types";

interface QuizArenaProps {
  quiz: Quiz;
  lessonTitle: string;
  courseTitle: string;
  onClose: () => void;
}

// The full-screen, occasion-marking surface a student lands on after
// choosing to test what they learned — not another card in the scroll,
// but a destination of its own. Chrome is entirely decorative (glow +
// grid, see .quiz-arena-bg in index.css); QuizPlayer's own light
// .lesson-card stays the one readable surface, same component the old
// inline card used, so scoring/grading logic is untouched.
export default function QuizArena({ quiz, lessonTitle, courseTitle, onClose }: QuizArenaProps) {
  const { t } = useLanguage();

  return (
    <div className="quiz-arena-bg fixed inset-0 z-50 flex flex-col overflow-hidden">
      <div className="flex shrink-0 items-center justify-between gap-tight border-b border-hairline px-gutter py-tight">
        <div className="flex min-w-0 items-center gap-tight">
          <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-control bg-accent/15 text-accent">
            <Zap size={16} aria-hidden="true" />
          </span>
          <div className="min-w-0">
            <p className="truncate text-[10px] uppercase tracking-widest text-lavender">{courseTitle}</p>
            <p className="truncate text-sm font-medium text-night-foreground">{lessonTitle}</p>
          </div>
        </div>
        <button
          type="button"
          onClick={onClose}
          aria-label={t("components.quiz.QuizArena.exit")}
          className="flex shrink-0 items-center gap-1.5 rounded-control border border-hairline px-stack py-tight text-xs text-lavender transition-colors duration-base hover:border-accent hover:text-night-foreground"
        >
          <X size={14} aria-hidden="true" />
          {t("components.quiz.QuizArena.exit")}
        </button>
      </div>

      <div className="flex-1 overflow-y-auto px-gutter py-block md:px-gutter-lg">
        <motion.div
          initial={{ opacity: 0.001, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.35, ease: [0.22, 1, 0.36, 1] }}
          className="mx-auto flex w-full max-w-2xl flex-col gap-stack"
        >
          <div className="text-center">
            <span className="text-gradient-head font-heading text-2xl font-medium">
              {t("components.quiz.QuizArena.title")}
            </span>
            <p className="mt-1 text-sm text-lavender">{t("components.quiz.QuizArena.subtitle")}</p>
          </div>
          <QuizPlayer quiz={quiz} />
        </motion.div>
      </div>
    </div>
  );
}
