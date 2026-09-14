import { supabase } from "./client";
import type { Profile, Quiz, QuizAttempt, QuizQuestion, QuizOption } from "./types";

// Draft question/option shape used while a teacher is still building a quiz
// client-side, before ids exist. Keeps QuizBuilder's local state simple and
// lets `quizQueries.save` do one bulk replace instead of a diffing dance.
//
// NOTE ON SCHEMA: your live Supabase project already has quizzes /
// quiz_questions / quiz_options / quiz_attempts / quiz_answers tables with
// their own column names (question_text, option_text, course_id, status,
// etc. — see supabase-quiz-system-live.sql). This file's *external* shape
// (DraftQuestion/DraftOption, and the Quiz/QuizQuestion/QuizOption/
// QuizAttempt types the UI consumes) is kept the same as before so
// QuizBuilder.tsx and QuizPlayer.tsx don't need to change — everything
// below just translates to/from your real column names at the edges.
export interface DraftOption {
  id?: string;
  label: string;
  image_url?: string | null;
  is_correct: boolean;
}

export interface DraftQuestion {
  id?: string;
  prompt: string;
  image_url?: string | null;
  explanation: string;
  points: number;
  multi_select: boolean;
  options: DraftOption[];
}

// --- row <-> app-shape mapping ------------------------------------------

function mapOption(row: any): QuizOption {
  return {
    id: row.id,
    question_id: row.question_id,
    label: row.option_text,
    image_url: row.image_url ?? null,
    is_correct: row.is_correct,
    order_index: row.order_index,
  };
}

function mapQuestion(row: any): QuizQuestion {
  return {
    id: row.id,
    quiz_id: row.quiz_id,
    prompt: row.question_text,
    image_url: row.image_url ?? null,
    explanation: row.explanation ?? null,
    points: row.points,
    multi_select: !!row.multi_select,
    order_index: row.order_index,
    quiz_options: (row.quiz_options ?? []).map(mapOption),
  };
}

function mapQuiz(row: any): Quiz {
  return {
    id: row.id,
    lesson_id: row.lesson_id,
    course_id: row.course_id,
    title: row.title,
    description: row.description,
    passing_score: row.passing_score ?? 70,
    time_limit_minutes: row.time_limit ?? null,
    shuffle_questions: !!row.randomize_questions,
    status: row.status ?? "draft",
    created_at: row.created_at,
    updated_at: row.updated_at,
    quiz_questions: (row.quiz_questions ?? []).map(mapQuestion),
  };
}

function mapAttempt(row: any): QuizAttempt {
  return {
    id: row.id,
    quiz_id: row.quiz_id,
    student_id: row.student_id,
    points_earned: row.points_earned ?? 0,
    points_possible: row.points_possible ?? 0,
    score: row.score ?? 0,
    passed: !!row.passed,
    responses: row.responses ?? [],
    started_at: row.started_at,
    submitted_at: row.completed_at ?? row.started_at,
  };
}

export const quizQueries = {
  // Fetches the quiz for a lesson with questions + options ordered, or null
  // if the lesson has no quiz yet. Used by both the teacher builder (needs
  // is_correct) and the student player (RLS strips is_correct for them).
  getByLessonId: async (lessonId: string): Promise<Quiz | null> => {
    const { data, error } = await supabase
      .from("quizzes")
      .select("*, quiz_questions(*, quiz_options(*))")
      .eq("lesson_id", lessonId)
      .maybeSingle();
    if (error) throw error;
    if (!data) return null;
    const quiz = mapQuiz(data);
    quiz.quiz_questions = [...(quiz.quiz_questions ?? [])]
      .sort((a, b) => a.order_index - b.order_index)
      .map(q => ({
        ...q,
        quiz_options: [...(q.quiz_options ?? [])].sort((a, b) => a.order_index - b.order_index),
      }));
    return quiz;
  },

  // Lightweight bulk lookup for the lesson list: just enough to render a
  // "Quiz: 5 questions" / "Quiz: draft" badge per lesson without pulling
  // full question/option payloads for every lesson in the course at once.
  getStatusByCourse: async (
    courseId: string
  ): Promise<Record<string, { title: string; status: string; questionCount: number }>> => {
    const { data, error } = await supabase
      .from("quizzes")
      .select("lesson_id, title, status, quiz_questions(count)")
      .eq("course_id", courseId);
    if (error) throw error;
    const out: Record<string, { title: string; status: string; questionCount: number }> = {};
    for (const row of data ?? []) {
      const r = row as any;
      out[r.lesson_id] = {
        title: r.title,
        status: r.status ?? "draft",
        questionCount: r.quiz_questions?.[0]?.count ?? 0,
      };
    }
    return out;
  },

  // Full replace-save: a teacher's builder holds the whole quiz in memory,
  // so on save we upsert the quiz row, then drop and recreate its questions
  // and options in one go. The live `quizzes` table has no unique
  // constraint on lesson_id (course_id + lesson_id + status all live on the
  // same row), so this looks up any existing row for the lesson first
  // rather than relying on an upsert onConflict target.
  save: async (
    lessonId: string,
    courseId: string,
    quizId: string | null,
    fields: { title: string; description: string; passing_score: number; time_limit_minutes: number | null; shuffle_questions: boolean },
    questions: DraftQuestion[]
  ): Promise<Quiz> => {
    const { data: existing } = await supabase
      .from("quizzes")
      .select("id, status")
      .eq("lesson_id", lessonId)
      .maybeSingle();

    const quizPayload = {
      course_id: courseId,
      lesson_id: lessonId,
      title: fields.title,
      description: fields.description || null,
      passing_score: fields.passing_score,
      time_limit: fields.time_limit_minutes,
      randomize_questions: fields.shuffle_questions,
      updated_at: new Date().toISOString(),
    };

    const targetId = quizId ?? existing?.id ?? null;
    let quizRow: any;
    if (targetId) {
      const { data, error } = await supabase.from("quizzes").update(quizPayload).eq("id", targetId).select().single();
      if (error) throw error;
      quizRow = data;
    } else {
      const { data, error } = await supabase
        .from("quizzes")
        .insert([{ ...quizPayload, status: "draft" }])
        .select()
        .single();
      if (error) throw error;
      quizRow = data;
    }

    const { error: deleteError } = await supabase.from("quiz_questions").delete().eq("quiz_id", quizRow.id);
    if (deleteError) throw deleteError;

    for (let i = 0; i < questions.length; i++) {
      const q = questions[i];
      const { data: questionRow, error: questionError } = await supabase
        .from("quiz_questions")
        .insert([
          {
            quiz_id: quizRow.id,
            question_text: q.prompt,
            question_type: "multiple_choice",
            image_url: q.image_url || null,
            explanation: q.explanation || null,
            points: q.points,
            multi_select: q.multi_select,
            order_index: i,
          },
        ])
        .select()
        .single();
      if (questionError) throw questionError;

      const optionsPayload = q.options.map((o, j) => ({
        question_id: (questionRow as any).id,
        option_text: o.label,
        image_url: o.image_url || null,
        is_correct: o.is_correct,
        order_index: j,
      }));
      if (optionsPayload.length > 0) {
        const { error: optionsError } = await supabase.from("quiz_options").insert(optionsPayload);
        if (optionsError) throw optionsError;
      }
    }

    const full = await quizQueries.getByLessonId(lessonId);
    return full as Quiz;
  },

  // Flips a quiz between draft/published/archived — draft quizzes are
  // invisible to students (see the RLS policy in
  // supabase-quiz-system-live.sql), matching the same status field the
  // rest of this app already uses for courses.
  setStatus: async (quizId: string, status: "draft" | "published" | "archived"): Promise<void> => {
    const { error } = await supabase.from("quizzes").update({ status }).eq("id", quizId);
    if (error) throw error;
  },

  delete: async (quizId: string): Promise<true> => {
    const { error } = await supabase.from("quizzes").delete().eq("id", quizId);
    if (error) throw error;
    return true;
  },
};

export type QuizAttemptWithStudent = QuizAttempt & {
  student: Pick<Profile, "id" | "full_name" | "email" | "avatar_url"> | null;
};

export const quizAttemptQueries = {
  // Every attempt on a quiz, across every student, newest first — this is
  // what powers the teacher's results view. quiz_attempts only carries
  // student_id, so this does a manual second lookup into profiles rather
  // than assuming a specific FK constraint name (the table predates this
  // file — see the schema note at the top of this file).
  getByQuiz: async (quizId: string): Promise<QuizAttemptWithStudent[]> => {
    const { data, error } = await supabase
      .from("quiz_attempts")
      .select("*")
      .eq("quiz_id", quizId)
      .order("completed_at", { ascending: false });
    if (error) throw error;
    const attempts = (data ?? []).map(mapAttempt);

    const studentIds = [...new Set(attempts.map(a => a.student_id))];
    if (studentIds.length === 0) return attempts.map(a => ({ ...a, student: null }));

    const { data: profileRows, error: profileError } = await supabase
      .from("profiles")
      .select("id, full_name, email, avatar_url")
      .in("id", studentIds);
    if (profileError) throw profileError;
    const profileMap = new Map((profileRows ?? []).map((p: any) => [p.id, p as Profile]));

    return attempts.map(a => ({ ...a, student: profileMap.get(a.student_id) ?? null }));
  },

  getHistory: async (quizId: string, studentId: string): Promise<QuizAttempt[]> => {
    const { data, error } = await supabase
      .from("quiz_attempts")
      .select("*")
      .eq("quiz_id", quizId)
      .eq("student_id", studentId)
      .order("started_at", { ascending: false });
    if (error) throw error;
    return (data ?? []).map(mapAttempt);
  },

  // One row per quiz in the course, with its average score across every
  // attempt (most-recent attempt per student, so a retake doesn't count
  // the same student twice) — powers the teacher's "Quiz performance"
  // chart. Aggregated client-side rather than a SQL view, since a
  // teacher's per-course attempt volume is small and this keeps the same
  // pattern the rest of the dashboard's charts already use.
  getAverageScoresByCourse: async (
    courseId: string
  ): Promise<{ quizId: string; title: string; avgScore: number; attempts: number }[]> => {
    const { data, error } = await supabase
      .from("quiz_attempts")
      .select("quiz_id, student_id, score, submitted_at, quizzes!inner(title, course_id)")
      .eq("quizzes.course_id", courseId)
      .order("submitted_at", { ascending: false });
    if (error) throw error;

    // Keep only each student's latest attempt per quiz.
    const latestPerStudentQuiz = new Map<string, { score: number; title: string }>();
    for (const row of (data ?? []) as any[]) {
      const key = `${row.quiz_id}:${row.student_id}`;
      if (!latestPerStudentQuiz.has(key)) {
        latestPerStudentQuiz.set(key, { score: row.score, title: row.quizzes?.title ?? "Untitled quiz" });
      }
    }

    const byQuiz = new Map<string, { title: string; scores: number[] }>();
    for (const [key, { score, title }] of latestPerStudentQuiz) {
      const quizId = key.split(":")[0];
      const entry = byQuiz.get(quizId) ?? { title, scores: [] };
      entry.scores.push(score);
      byQuiz.set(quizId, entry);
    }

    return [...byQuiz.entries()].map(([quizId, { title, scores }]) => ({
      quizId,
      title,
      avgScore: Math.round(scores.reduce((a, b) => a + b, 0) / scores.length),
      attempts: scores.length,
    }));
  },

  // Grading happens server-side in the `grade_quiz_attempt` RPC (see
  // supabase-quiz-system-live.sql) — the client never sees is_correct on
  // the options it's answering, only the graded result that comes back.
  // Network calls can fail on slow/flaky connections, so this retries once
  // after a short delay before surfacing the error to the UI (the caller
  // already guards against double-submit with its own ref).
  submit: async (quizId: string, answers: { question_id: string; option_ids: string[] }[]): Promise<QuizAttempt> => {
    const attempt = async () => {
      const { data, error } = await supabase.rpc("grade_quiz_attempt", {
        p_quiz_id: quizId,
        p_answers: answers,
      });
      if (error) throw error;
      return mapAttempt(data);
    };
    try {
      return await attempt();
    } catch (err) {
      await new Promise(resolve => setTimeout(resolve, 1200));
      return await attempt();
    }
  },
};

// Every attempt by one student, with the quiz title joined in so the
// student dashboard can render a score-history list without a second
// round trip per row. Newest first.
export type StudentAttemptRow = QuizAttempt & {
  quiz_title: string | null;
  course_id: string | null;
};

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const mapStudentAttempt = (row: any): StudentAttemptRow => ({
  ...mapAttempt(row),
  quiz_title: row.quizzes?.title ?? null,
  course_id: row.quizzes?.course_id ?? null,
});

export const studentQuizQueries = {
  getByStudent: async (studentId: string, limit = 100): Promise<StudentAttemptRow[]> => {
    const { data, error } = await supabase
      .from("quiz_attempts")
      .select("*, quizzes (title, course_id)")
      .eq("student_id", studentId)
      .order("started_at", { ascending: false })
      .limit(limit);
    if (error) throw error;
    return (data ?? []).map(mapStudentAttempt);
  },
};
