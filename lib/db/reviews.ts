import { supabase } from "./client";
import type { CourseReview } from "./types";

export interface RatingSummary {
  average: number;
  count: number;
  // counts[5] = number of 5-star reviews, counts[4] = number of 4-star, etc.
  counts: Record<1 | 2 | 3 | 4 | 5, number>;
}

// Derives the histogram + average from a review list rather than a second
// round trip — course lists are small enough (a few hundred at most) that
// this is cheaper than an RPC, and it stays correct even a beat before the
// `recalc_course_rating` trigger has updated `courses.rating`.
export const summarizeReviews = (reviews: CourseReview[]): RatingSummary => {
  const counts: RatingSummary["counts"] = { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 };
  for (const review of reviews) {
    const bucket = Math.min(5, Math.max(1, Math.round(review.rating))) as 1 | 2 | 3 | 4 | 5;
    counts[bucket] += 1;
  }
  const count = reviews.length;
  const average = count === 0 ? 0 : reviews.reduce((sum, r) => sum + r.rating, 0) / count;
  return { average, count, counts };
};

export const reviewQueries = {
  getByCourse: async (courseId: string): Promise<CourseReview[]> => {
    const { data, error } = await supabase
      .from("course_reviews")
      .select(`*, profiles!course_reviews_student_id_fkey (id, full_name, avatar_url)`)
      .eq("course_id", courseId)
      .order("created_at", { ascending: false });
    if (error) throw error;
    return (data ?? []) as CourseReview[];
  },

  getMine: async (courseId: string, studentId: string): Promise<CourseReview | null> => {
    const { data, error } = await supabase
      .from("course_reviews")
      .select("*")
      .eq("course_id", courseId)
      .eq("student_id", studentId)
      .maybeSingle();
    if (error) throw error;
    return (data as CourseReview) ?? null;
  },

  // One review per student per course — writing again edits the existing
  // row in place (same UPSERT-on-unique-constraint approach as the rest of
  // this codebase, e.g. lesson_completions) instead of creating duplicates.
  upsert: async (courseId: string, studentId: string, rating: number, comment: string): Promise<CourseReview> => {
    const { data, error } = await supabase
      .from("course_reviews")
      .upsert(
        [
          {
            course_id: courseId,
            student_id: studentId,
            rating,
            comment: comment.trim() || null,
            updated_at: new Date().toISOString(),
          },
        ],
        { onConflict: "course_id,student_id" }
      )
      .select(`*, profiles!course_reviews_student_id_fkey (id, full_name, avatar_url)`)
      .single();
    if (error) throw error;
    return data as CourseReview;
  },

  delete: async (reviewId: string): Promise<true> => {
    const { error } = await supabase.from("course_reviews").delete().eq("id", reviewId);
    if (error) throw error;
    return true;
  },
};
