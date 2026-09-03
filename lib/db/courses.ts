import { supabase } from "./client";
import type { Category, Course, Enrollment, Lesson } from "./types";

export interface CourseFilters {
  category_id?: string;
  level?: string;
  type?: string;
  teacher_id?: string;
  search?: string;
}

export const categoryQueries = {
  getAll: async (): Promise<Category[]> => {
    const { data, error } = await supabase.from("categories").select("*").order("name");
    if (error) throw error;
    return (data ?? []) as Category[];
  },
};

const slugify = (text: string): string =>
  text
    .toLowerCase()
    .trim()
    .replace(/[^\w\s-]/g, "")
    .replace(/[\s_-]+/g, "-")
    .replace(/^-+|-+$/g, "");

// Turns a course title into a unique, URL-safe slug. Tries the plain slug
// first, then "-2", "-3", ... if it's already taken, so slugs stay readable
// (e.g. "intro-to-algebra") instead of random strings.
const generateUniqueSlug = async (title: string): Promise<string> => {
  const base = slugify(title) || "course";
  let candidate = base;
  for (let attempt = 2; attempt <= 26; attempt += 1) {
    const { data, error } = await supabase
      .from("courses")
      .select("id")
      .eq("slug", candidate)
      .maybeSingle();
    if (error) throw error;
    if (!data) return candidate;
    candidate = `${base}-${attempt}`;
  }
  return `${base}-${Date.now().toString(36)}`;
};

export const courseQueries = {
  getPublished: async (filters: CourseFilters = {}): Promise<Course[]> => {    let query = supabase
      .from("courses")
      .select(
        `*, categories (*), profiles!courses_teacher_id_fkey (id, full_name, email, avatar_url), lessons (count)`
      )
      .eq("status", "published")
      .order("created_at", { ascending: false });

    if (filters.category_id) query = query.eq("category_id", filters.category_id);
    if (filters.level) query = query.eq("level", filters.level);
    if (filters.type) query = query.eq("type", filters.type);
    if (filters.teacher_id) query = query.eq("teacher_id", filters.teacher_id);
    if (filters.search) query = query.ilike("title", `%${filters.search}%`);

    const { data, error } = await query;
    if (error) throw error;
    return (data ?? []) as Course[];
  },

  // maybeSingle (not single): a row that's been deleted, or one RLS is
  // currently hiding from this viewer (e.g. a course a student was
  // enrolled in got reverted to draft/rejected after the fact), is a
  // normal "not found" case here — not a thrown error. `.single()" throws
  // on zero rows either way, which is what was turning old notification
  // links into unhandled console errors instead of the app's own
  // not-found state.
  getById: async (courseId: string): Promise<Course | null> => {
    const { data, error } = await supabase
      .from("courses")
      .select(
        `*, categories (*), profiles!courses_teacher_id_fkey (id, full_name, email, avatar_url, bio, expertise, qualifications), lessons (*, lesson_completions (student_id, completed_at))`
      )
      .eq("id", courseId)
      .maybeSingle();
    if (error) throw error;
    return data as Course | null;
  },

  getByTeacher: async (teacherId: string): Promise<Course[]> => {
    const { data, error } = await supabase
      .from("courses")
      .select(`*, categories (*), lessons (count)`)
      .eq("teacher_id", teacherId)
      .order("created_at", { ascending: false });
    if (error) throw error;
    return (data ?? []) as Course[];
  },

  create: async (courseData: Partial<Course>): Promise<Course> => {
    const baseTitle = courseData.title || "course";
    const explicitSlug = courseData.slug;
    let slug = explicitSlug || (await generateUniqueSlug(baseTitle));
    const MAX_RETRIES = 5;

    for (let attempt = 0; attempt <= MAX_RETRIES; attempt += 1) {
      const { data, error } = await supabase
        .from("courses")
        .insert([{ ...courseData, slug }])
        .select()
        .single();
      if (!data && !error) throw new Error("Course creation returned no data.");
      if (!error) return data as Course;

      // 23505 = Postgres unique_violation. Only auto-retry when it's the
      // slug collision specifically (not some other constraint) and when
      // we're the ones who picked the slug — if the caller passed an
      // explicit slug, respect it and surface the real error instead of
      // silently swapping it out.
      const isSlugConflict = error.code === "23505" && /slug/i.test(error.message ?? "");
      if (!isSlugConflict || explicitSlug) throw error;

      // Someone else claimed this exact slug between our uniqueness check
      // and this insert — either a genuine race (e.g. a double-click before
      // the "Next" button disabled) or a row our check couldn't see (RLS
      // hiding another teacher's course with the same title). Either way,
      // mint a slug that's certain to be free and try again rather than
      // showing the raw database error.
      slug = `${slugify(baseTitle) || "course"}-${Date.now().toString(36)}${attempt}`;
    }

    throw new Error("Could not generate a unique course URL after several attempts — please try again.");
  },

  update: async (courseId: string, updates: Partial<Course>): Promise<Course> => {
    const { data, error } = await supabase
      .from("courses")
      .update(updates)
      .eq("id", courseId)
      .select()
      .single();
    if (error) throw error;
    return data as Course;
  },

  delete: async (courseId: string): Promise<true> => {
    const { error } = await supabase.from("courses").delete().eq("id", courseId);
    if (error) throw error;
    return true;
  },
};

export const lessonQueries = {
  getByCourse: async (courseId: string): Promise<Lesson[]> => {
    const { data, error } = await supabase
      .from("lessons")
      .select("*")
      .eq("course_id", courseId)
      .order("order_index", { ascending: true });
    if (error) throw error;
    return (data ?? []) as Lesson[];
  },

  getById: async (lessonId: string): Promise<Lesson> => {
    const { data, error } = await supabase.from("lessons").select("*").eq("id", lessonId).single();
    if (error) throw error;
    return data as Lesson;
  },

  create: async (lessonData: Partial<Lesson>): Promise<Lesson> => {
    const { data, error } = await supabase.from("lessons").insert([lessonData]).select().single();
    if (error) throw error;
    return data as Lesson;
  },

  update: async (lessonId: string, updates: Partial<Lesson>): Promise<Lesson> => {
    const { data, error } = await supabase
      .from("lessons")
      .update(updates)
      .eq("id", lessonId)
      .select()
      .single();
    if (error) throw error;
    return data as Lesson;
  },

  delete: async (lessonId: string): Promise<true> => {
    const { error } = await supabase.from("lessons").delete().eq("id", lessonId);
    if (error) throw error;
    return true;
  },

  reorder: async (lessonOrders: { id: string; order_index: number }[]): Promise<true> => {
    await Promise.all(
      lessonOrders.map(({ id, order_index }) =>
        supabase.from("lessons").update({ order_index }).eq("id", id)
      )
    );
    return true;
  },

  markComplete: async (lessonId: string, studentId: string, courseId: string): Promise<true> => {
    // Mirrors the live app's exact completion logic (lib/supabase/queries/users.js
    // completeLesson) so `enrollments.progress` / `completed_lessons` stay in sync
    // whether a student uses the old app or this one.
    const { data: enrollment, error: enrollError } = await supabase
      .from("enrollments")
      .select("*")
      .eq("student_id", studentId)
      .eq("course_id", courseId)
      .single();
    if (enrollError) throw enrollError;

    const alreadyDone: string[] = enrollment.completed_lessons ?? [];
    if (alreadyDone.includes(lessonId)) return true;

    const updatedCompleted = [...alreadyDone, lessonId];

    const { data: course, error: courseError } = await supabase
      .from("courses")
      .select("lessons(count)")
      .eq("id", courseId)
      .single();
    if (courseError) throw courseError;

    const totalLessons = (course?.lessons as { count: number }[] | null)?.[0]?.count || 1;
    const progress = (updatedCompleted.length / totalLessons) * 100;

    const { error: updateError } = await supabase
      .from("enrollments")
      .update({
        progress,
        completed_lessons: updatedCompleted,
        last_accessed: new Date().toISOString(),
        completed_at: progress === 100 ? new Date().toISOString() : null,
      })
      .eq("id", enrollment.id);
    if (updateError) throw updateError;

    const { error: completionError } = await supabase
      .from("lesson_completions")
      .upsert([{ lesson_id: lessonId, student_id: studentId, course_id: courseId, completed_at: new Date().toISOString() }]);
    if (completionError) throw completionError;

    return true;
  },
};

export const enrollmentQueries = {
  getByStudent: async (studentId: string): Promise<Enrollment[]> => {
    const { data, error } = await supabase
      .from("enrollments")
      .select(`*, courses (*, categories (*), profiles!courses_teacher_id_fkey (full_name, avatar_url))`)
      .eq("student_id", studentId)
      .order("enrolled_at", { ascending: false });
    if (error) throw error;
    return (data ?? []) as Enrollment[];
  },

  getByCourse: async (courseId: string): Promise<Enrollment[]> => {
    const { data, error } = await supabase
      .from("enrollments")
      .select(`*, profiles!enrollments_student_id_fkey (id, full_name, email, avatar_url)`)
      .eq("course_id", courseId)
      .order("enrolled_at", { ascending: false });
    if (error) throw error;
    return (data ?? []) as Enrollment[];
  },

  isEnrolled: async (studentId: string, courseId: string): Promise<boolean> => {
    const { data, error } = await supabase
      .from("enrollments")
      .select("id")
      .eq("student_id", studentId)
      .eq("course_id", courseId)
      .maybeSingle();
    if (error) throw error;
    return !!data;
  },

  enroll: async (studentId: string, courseId: string): Promise<Enrollment> => {
    const { data, error } = await supabase
      .from("enrollments")
      .insert([{ student_id: studentId, course_id: courseId }])
      .select()
      .single();
    if (error) throw error;
    return data as Enrollment;
  },
};
