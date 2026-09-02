import type { LessonAttachmentType } from "@/lib/db/types";

const DOC_EXTENSIONS = ["doc", "docx", "ppt", "pptx", "xls", "xlsx", "odt"];
const IMAGE_EXTENSIONS = ["png", "jpg", "jpeg", "gif", "webp", "svg"];

export function classifyAttachment(fileName: string): LessonAttachmentType {
  const ext = fileName.split(".").pop()?.toLowerCase() ?? "";
  if (ext === "pdf") return "pdf";
  if (DOC_EXTENSIONS.includes(ext)) return "doc";
  if (IMAGE_EXTENSIONS.includes(ext)) return "image";
  return "link";
}

// What a browser's native file picker should accept when a teacher is
// attaching lesson resources — matches what every major course platform
// treats as a downloadable handout rather than inline lesson body content.
export const ATTACHMENT_ACCEPT =
  ".pdf,.doc,.docx,.ppt,.pptx,.xls,.xlsx,.odt,image/*";

export function formatFileSize(bytes?: number | null): string {
  if (!bytes) return "";
  if (bytes < 1024 * 1024) return `${Math.round(bytes / 1024)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}
