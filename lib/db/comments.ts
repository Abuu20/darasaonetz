import { supabase } from "./client";
import type { Profile } from "./types";

export interface CourseComment {
  id: string;
  course_id: string;
  lesson_id: string | null;
  author_id: string;
  parent_id: string | null;
  body: string;
  created_at: string;
  updated_at: string;
  profiles?: Pick<Profile, "id" | "full_name" | "avatar_url" | "role"> | null;
}

export interface CommentThread extends CourseComment {
  replies: CourseComment[];
  /** True when the course's teacher has posted at least one reply. */
  answered: boolean;
}

export const commentQueries = {
  /** Fetch all top-level comments for a course, with their replies nested. */
  getThreadsForCourse: async (courseId: string): Promise<CommentThread[]> => {
    const { data, error } = await supabase
      .from("course_comments")
      .select(`*, profiles!course_comments_author_id_fkey (id, full_name, avatar_url, role)`)
      .eq("course_id", courseId)
      .order("created_at", { ascending: true });
    if (error) throw error;

    const all = (data ?? []) as CourseComment[];
    const byParent = new Map<string, CourseComment[]>();
    const roots: CourseComment[] = [];
    for (const c of all) {
      if (c.parent_id) {
        const list = byParent.get(c.parent_id) ?? [];
        list.push(c);
        byParent.set(c.parent_id, list);
      } else {
        roots.push(c);
      }
    }

    return roots.map(root => {
      const replies = (byParent.get(root.id) ?? []).sort(
        (a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime()
      );
      const answered = replies.some(r => r.profiles?.role === "teacher");
      return { ...root, replies, answered };
    });
  },

  /** Post a comment. Pass `parentId` for a reply. */
  post: async (params: {
    courseId: string;
    lessonId?: string | null;
    authorId: string;
    parentId?: string | null;
    body: string;
  }): Promise<CourseComment> => {
    const { data, error } = await supabase
      .from("course_comments")
      .insert([
        {
          course_id: params.courseId,
          lesson_id: params.lessonId ?? null,
          author_id: params.authorId,
          parent_id: params.parentId ?? null,
          body: params.body.trim(),
        },
      ])
      .select(`*, profiles!course_comments_author_id_fkey (id, full_name, avatar_url, role)`)
      .single();
    if (error) throw error;
    return data as CourseComment;
  },

  delete: async (commentId: string): Promise<true> => {
    const { error } = await supabase.from("course_comments").delete().eq("id", commentId);
    if (error) throw error;
    return true;
  },
};
