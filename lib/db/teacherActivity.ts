import { supabase } from "./client";

// Every dot on the teacher calendar comes from something that actually
// happened in one of their courses — same rule StudentCalendarPanel
// follows. No invented deadlines: the schema has no due-date field on
// lessons or quizzes to schedule from.

export interface ActivityEvent {
  type: "enrollment" | "lesson_completion" | "quiz_attempt" | "review";
  at: string; // ISO timestamp
  course_id: string;
  student_name: string | null;
  detail: string; // lesson title / quiz title / rating, for the day's agenda list
}

export const teacherActivityQueries = {
  getForCourses: async (courseIds: string[]): Promise<ActivityEvent[]> => {
    if (courseIds.length === 0) return [];

    const [enrollments, completions, attempts, reviews] = await Promise.all([
      supabase
        .from("enrollments")
        .select("course_id, enrolled_at, profiles!enrollments_student_id_fkey (full_name)")
        .in("course_id", courseIds),
      supabase
        .from("lesson_completions")
        .select("course_id, completed_at, lessons (title), profiles!lesson_completions_student_id_fkey (full_name)")
        .in("course_id", courseIds),
      supabase
        .from("quiz_attempts")
        .select("submitted_at, score, quizzes!inner (title, course_id), profiles!quiz_attempts_student_id_fkey (full_name)")
        .in("quizzes.course_id", courseIds),
      supabase
        .from("course_reviews")
        .select("course_id, rating, created_at, profiles!course_reviews_student_id_fkey (full_name)")
        .in("course_id", courseIds),
    ]);

    const events: ActivityEvent[] = [];

    for (const row of enrollments.data ?? []) {
      events.push({
        type: "enrollment",
        at: (row as any).enrolled_at,
        course_id: (row as any).course_id,
        student_name: (row as any).profiles?.full_name ?? null,
        detail: "Enrolled",
      });
    }
    for (const row of completions.data ?? []) {
      events.push({
        type: "lesson_completion",
        at: (row as any).completed_at,
        course_id: (row as any).course_id,
        student_name: (row as any).profiles?.full_name ?? null,
        detail: (row as any).lessons?.title ?? "Lesson completed",
      });
    }
    for (const row of attempts.data ?? []) {
      events.push({
        type: "quiz_attempt",
        at: (row as any).submitted_at,
        course_id: (row as any).quizzes?.course_id,
        student_name: (row as any).profiles?.full_name ?? null,
        detail: `${(row as any).quizzes?.title ?? "Quiz"} — ${Math.round((row as any).score ?? 0)}%`,
      });
    }
    for (const row of reviews.data ?? []) {
      events.push({
        type: "review",
        at: (row as any).created_at,
        course_id: (row as any).course_id,
        student_name: (row as any).profiles?.full_name ?? null,
        detail: `${(row as any).rating}★ review`,
      });
    }

    return events.sort((a, b) => new Date(b.at).getTime() - new Date(a.at).getTime());
  },
};
