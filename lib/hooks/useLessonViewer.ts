import { useEffect, useMemo, useState } from "react";
import { courseQueries, enrollmentQueries, lessonQueries } from "@/lib/db/courses";
import { quizQueries } from "@/lib/db/quizzes";
import { useStreak } from "@/lib/hooks/useStreak";
import { useAuth } from "@/context/AuthContext";
import type { Course, Lesson, Quiz } from "@/lib/db/types";

export interface UseLessonViewerResult {
  course: Course | null;
  lessons: Lesson[];
  activeLesson: Lesson | null;
  activeIndex: number;
  completedIds: string[];
  activeQuiz: Quiz | null;
  progressPct: number;
  loading: boolean;
  enrolled: boolean | null;
  isOwner: boolean;
  completing: boolean;
  goTo: (lessonId: string) => void;
  markComplete: () => Promise<void>;
}

/**
 * All the data/state a lesson viewer needs, regardless of which chrome
 * wraps it (dashboard tab or immersive /learn page). Kept chrome-free so
 * both callers can render whichever shell they like around the same core.
 *
 * Behavior notes:
 *  - "Resume where you left off": starts on the first lesson that isn't
 *    marked complete yet, so returning students land exactly where they
 *    stopped instead of re-watching lesson 1.
 *  - The lesson-quiz is lazily fetched per active lesson, so a 40-lesson
 *    course doesn't fire 40 quiz queries on open.
 *  - markComplete() is optimistic on the local `completedIds` (matches the
 *    DB update the same way lessons.js did in the old app, and the streak
 *    counter logs on success).
 */
export function useLessonViewer(
  courseId: string | undefined,
  initialLessonId: string | null = null
): UseLessonViewerResult {
  const { user } = useAuth();
  const { logActivity } = useStreak();

  const [course, setCourse] = useState<Course | null>(null);
  const [lessons, setLessons] = useState<Lesson[]>([]);
  const [completedIds, setCompletedIds] = useState<string[]>([]);
  const [enrolled, setEnrolled] = useState<boolean | null>(null);
  const [loading, setLoading] = useState(true);
  const [activeId, setActiveId] = useState<string | null>(initialLessonId);
  const [completing, setCompleting] = useState(false);
  const [activeQuiz, setActiveQuiz] = useState<Quiz | null>(null);

  useEffect(() => {
    if (!courseId) return;
    setLoading(true);
    courseQueries
      .getById(courseId)
      .then(record => {
        setCourse(record);
        const raw = (record && Array.isArray(record.lessons) ? record.lessons : []) as Lesson[];
        setLessons([...raw].sort((a, b) => a.order_index - b.order_index));
      })
      .catch(() => setCourse(null))
      .finally(() => setLoading(false));
  }, [courseId]);

  useEffect(() => {
    if (!user || !courseId) {
      setEnrolled(user ? false : null);
      return;
    }
    enrollmentQueries
      .isEnrolled(user.id, courseId)
      .then(setEnrolled)
      .catch(() => setEnrolled(false));
  }, [user, courseId]);

  useEffect(() => {
    if (!user) {
      setCompletedIds([]);
      return;
    }
    setCompletedIds(
      lessons
        .filter(l => l.lesson_completions?.some(c => c.student_id === user.id))
        .map(l => l.id)
    );
  }, [lessons, user]);

  useEffect(() => {
    if (activeId || lessons.length === 0) return;
    const firstIncomplete = lessons.find(l => !completedIds.includes(l.id));
    setActiveId((firstIncomplete ?? lessons[0]).id);
  }, [lessons, completedIds, activeId]);

  useEffect(() => {
    if (!activeId) {
      setActiveQuiz(null);
      return;
    }
    let cancelled = false;
    quizQueries
      .getByLessonId(activeId)
      .then(q => !cancelled && setActiveQuiz(q))
      .catch(() => !cancelled && setActiveQuiz(null));
    return () => {
      cancelled = true;
    };
  }, [activeId]);

  const activeLesson = useMemo(
    () => lessons.find(l => l.id === activeId) ?? null,
    [lessons, activeId]
  );
  const activeIndex = useMemo(
    () => lessons.findIndex(l => l.id === activeId),
    [lessons, activeId]
  );
  const progressPct =
    lessons.length > 0 ? Math.round((completedIds.length / lessons.length) * 100) : 0;

  const goTo = (lessonId: string) => setActiveId(lessonId);

  const markComplete = async () => {
    if (!user || !course || !activeLesson) return;
    setCompleting(true);
    try {
      await lessonQueries.markComplete(activeLesson.id, user.id, course.id);
      setCompletedIds(prev =>
        prev.includes(activeLesson.id) ? prev : [...prev, activeLesson.id]
      );
      logActivity();
    } catch (err) {
      console.error("[Lesson completion] error:", err);
    } finally {
      setCompleting(false);
    }
  };

  return {
    course,
    lessons,
    activeLesson,
    activeIndex,
    completedIds,
    activeQuiz,
    progressPct,
    loading,
    enrolled,
    isOwner: !!user && !!course && course.teacher_id === user.id,
    completing,
    goTo,
    markComplete,
  };
}
