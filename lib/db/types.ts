export type UserRole = "admin" | "teacher" | "student";

export interface Profile {
  id: string;
  email: string;
  full_name: string | null;
  avatar_url: string | null;
  bio: string | null;
  expertise: string | null;
  qualifications: string | null;
  role: UserRole;
  phone?: string | null;
  created_at: string;
  updated_at?: string;
}

export interface Category {
  id: string;
  name: string;
  type?: string | null;
}

export interface Course {
  id: string;
  teacher_id: string;
  category_id: string | null;
  title: string;
  slug: string;
  description: string | null;
  thumbnail_url: string | null;
  price: number | null;
  level: string | null;
  type: string | null;
  status: "draft" | "pending" | "published" | "rejected";
  enrolled_students?: number;
  rating?: number;
  created_at: string;
  categories?: Category | null;
  profiles?: Pick<Profile, "id" | "full_name" | "email" | "avatar_url" | "bio" | "expertise" | "qualifications"> | null;
  lessons?: Lesson[] | { count: number }[];
}

export type LessonAttachmentType = "pdf" | "doc" | "image" | "link";

export interface LessonAttachment {
  id: string;
  name: string;
  url: string;
  type: LessonAttachmentType;
  size_bytes?: number | null;
}

export interface Lesson {
  id: string;
  course_id: string;
  title: string;
  content: string | null;
  video_url: string | null;
  attachments?: LessonAttachment[] | null;
  order_index: number;
  duration_minutes?: number | null;
  is_preview?: boolean;
  created_at?: string;
  lesson_completions?: { student_id: string; completed_at: string }[];
}

export interface Enrollment {
  id: string;
  student_id: string;
  course_id: string;
  progress?: number;
  enrolled_at: string;
  courses?: Course;
}

export type NotificationType =
  | "enrollment"
  | "new_lesson"
  | "course_approved"
  | "course_rejected"
  | "quiz_result"
  | "announcement"
  | "system";

export interface AppNotification {
  id: string;
  user_id: string;
  type: NotificationType | string;
  title: string;
  content: string | null;
  data?: Record<string, unknown> | null;
  is_read: boolean;
  created_at: string;
  read_at?: string | null;
}
