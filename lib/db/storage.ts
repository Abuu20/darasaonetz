import { supabase } from "./client";
import { r2VideoStorage } from "./r2";

export const BUCKETS = {
  AVATARS: "avatars",
  COURSE_THUMBNAILS: "course-thumbnails",
  LESSON_VIDEOS: "lesson-videos",
  LESSON_ATTACHMENTS: "lesson-attachments",
  QUIZ_IMAGES: "quiz-images",
} as const;

function publicUrl(bucket: string, path: string): string {
  return supabase.storage.from(bucket).getPublicUrl(path).data.publicUrl;
}

export const avatarStorage = {
  upload: async (userId: string, file: File, onProgress?: (pct: number) => void): Promise<string> => {
    const fileExt = file.name.split(".").pop();
    const filePath = `${userId}/avatar.${fileExt}`;
    onProgress?.(10);
    const { error } = await supabase.storage.from(BUCKETS.AVATARS).upload(filePath, file, { upsert: true });
    if (error) throw error;
    onProgress?.(100);
    // Cache-bust so the new avatar shows immediately everywhere it's rendered.
    return `${publicUrl(BUCKETS.AVATARS, filePath)}?v=${Date.now()}`;
  },
};

export const thumbnailStorage = {
  upload: async (courseId: string, file: File): Promise<string> => {
    const fileExt = file.name.split(".").pop();
    const filePath = `${courseId}/${Date.now()}.${fileExt}`;
    const { error } = await supabase.storage.from(BUCKETS.COURSE_THUMBNAILS).upload(filePath, file);
    if (error) throw error;
    return publicUrl(BUCKETS.COURSE_THUMBNAILS, filePath);
  },
};

export const videoStorage = {
  // Prefers R2 (large files, zero egress cost — see cloudflare-worker/) when
  // the upload worker is configured; falls back to Supabase Storage
  // otherwise so video upload still works out of the box before R2 is set
  // up. Either way the caller just gets back a playable URL.
  upload: async (
    courseId: string,
    lessonId: string,
    file: File,
    onProgress?: (pct: number) => void
  ): Promise<string> => {
    if (r2VideoStorage.isConfigured()) {
      return r2VideoStorage.upload(courseId, lessonId, file, onProgress);
    }
    const fileExt = file.name.split(".").pop();
    const filePath = `${courseId}/${lessonId}/${Date.now()}.${fileExt}`;
    onProgress?.(10);
    const { error } = await supabase.storage
      .from(BUCKETS.LESSON_VIDEOS)
      .upload(filePath, file, { cacheControl: "3600", upsert: false });
    if (error) throw error;
    onProgress?.(100);
    return publicUrl(BUCKETS.LESSON_VIDEOS, filePath);
  },

};

// A diagram or photo attached to a quiz question or answer option — e.g.
// "label the diagram" or "which of these is a mammal?" where the choices
// are pictures rather than text. Same per-course/per-lesson path shape as
// the other lesson assets.
export const quizImageStorage = {
  upload: async (courseId: string, file: File): Promise<string> => {
    const fileExt = file.name.split(".").pop();
    const filePath = `${courseId}/${Date.now()}-${Math.random().toString(36).slice(2, 8)}.${fileExt}`;
    const { error } = await supabase.storage
      .from(BUCKETS.QUIZ_IMAGES)
      .upload(filePath, file, { cacheControl: "3600", upsert: false });
    if (error) throw error;
    return publicUrl(BUCKETS.QUIZ_IMAGES, filePath);
  },
};

// Handouts a teacher attaches to a lesson — PDFs, Word/PowerPoint docs,
// reference images. Same per-course/per-lesson path shape as videos, kept
// as its own bucket so attachment permissions/limits can differ from video
// (smaller files, more of them, no transcoding).
export const attachmentStorage = {
  upload: async (courseId: string, lessonId: string, file: File): Promise<{ url: string; size_bytes: number }> => {
    const filePath = `${courseId}/${lessonId}/${Date.now()}-${file.name}`;
    const { error } = await supabase.storage
      .from(BUCKETS.LESSON_ATTACHMENTS)
      .upload(filePath, file, { cacheControl: "3600", upsert: false });
    if (error) throw error;
    return { url: publicUrl(BUCKETS.LESSON_ATTACHMENTS, filePath), size_bytes: file.size };
  },
};
