import { useState } from "react";
import { FileText, FileImage, File as FileIcon, Link as LinkIcon, Loader2, Plus, X } from "lucide-react";
import type { LessonAttachment } from "@/lib/db/types";
import { ATTACHMENT_ACCEPT, classifyAttachment, formatFileSize } from "@/lib/lessonAttachments";
import { attachmentStorage } from "@/lib/db/storage";
import { generateId } from "@/lib/uuid";

const ICONS: Record<LessonAttachment["type"], typeof FileText> = {
  pdf: FileText,
  doc: FileIcon,
  image: FileImage,
  link: LinkIcon,
};

interface LessonAttachmentsEditorProps {
  courseId: string;
  lessonId: string;
  attachments: LessonAttachment[];
  onChange: (attachments: LessonAttachment[]) => void;
  labels: {
    addFile: string;
    addLink: string;
    linkPlaceholder: string;
    linkNamePlaceholder: string;
    uploadFailed?: string;
  };
}

export default function LessonAttachmentsEditor({
  courseId,
  lessonId,
  attachments,
  onChange,
  labels,
}: LessonAttachmentsEditorProps) {
  const [uploading, setUploading] = useState(false);
  const [addingLink, setAddingLink] = useState(false);
  const [linkName, setLinkName] = useState("");
  const [linkUrl, setLinkUrl] = useState("");
  const [error, setError] = useState("");

  const handleFiles = async (files: FileList | null) => {
    if (!files || files.length === 0) return;
    setUploading(true);
    setError("");
    try {
      const uploaded: LessonAttachment[] = [];
      for (const file of Array.from(files)) {
        const { url, size_bytes } = await attachmentStorage.upload(courseId, lessonId, file);
        uploaded.push({
          id: generateId(),
          name: file.name,
          url,
          type: classifyAttachment(file.name),
          size_bytes,
        });
      }
      onChange([...attachments, ...uploaded]);
    } catch (err: any) {
      // Most likely cause: the lesson-attachments storage bucket doesn't
      // exist yet because supabase-lesson-attachments.sql hasn't been run
      // against this Supabase project. Surface the real message so that's
      // diagnosable instead of the upload just silently doing nothing.
      setError(err?.message || labels.uploadFailed || "Upload failed.");
    } finally {
      setUploading(false);
    }
  };

  const handleAddLink = () => {
    if (!linkUrl.trim()) return;
    onChange([
      ...attachments,
      { id: generateId(), name: linkName.trim() || linkUrl.trim(), url: linkUrl.trim(), type: "link" },
    ]);
    setLinkName("");
    setLinkUrl("");
    setAddingLink(false);
  };

  const remove = (id: string) => onChange(attachments.filter(a => a.id !== id));

  return (
    <div className="flex flex-col gap-tight">
      {error ? <p className="text-xs text-danger">{error}</p> : null}
      {attachments.length > 0 ? (
        <ul className="flex flex-col gap-1">
          {attachments.map(att => {
            const Icon = ICONS[att.type] ?? FileIcon;
            return (
              <li
                key={att.id}
                className="flex items-center gap-tight rounded-control border border-hairline px-stack py-tight text-sm text-lilac"
              >
                <Icon size={14} className="shrink-0 text-accent" aria-hidden="true" />
                <span className="min-w-0 flex-1 truncate">{att.name}</span>
                {att.size_bytes ? (
                  <span className="shrink-0 text-xs text-lavender">{formatFileSize(att.size_bytes)}</span>
                ) : null}
                <button
                  type="button"
                  onClick={() => remove(att.id)}
                  aria-label="Remove"
                  className="shrink-0 text-lavender hover:text-danger"
                >
                  <X size={14} />
                </button>
              </li>
            );
          })}
        </ul>
      ) : null}

      {addingLink ? (
        <div className="flex flex-col gap-1.5 rounded-control border border-dashed border-hairline p-stack">
          <input
            placeholder={labels.linkNamePlaceholder}
            value={linkName}
            onChange={e => setLinkName(e.target.value)}
            className="rounded-control border border-hairline bg-night/60 px-stack py-tight text-sm text-night-foreground outline-none focus:border-accent"
          />
          <input
            placeholder={labels.linkPlaceholder}
            value={linkUrl}
            onChange={e => setLinkUrl(e.target.value)}
            className="rounded-control border border-hairline bg-night/60 px-stack py-tight text-sm text-night-foreground outline-none focus:border-accent"
          />
          <div className="flex gap-tight">
            <button
              type="button"
              onClick={handleAddLink}
              disabled={!linkUrl.trim()}
              className="rounded-control bg-accent/20 px-stack py-tight text-xs text-night-foreground disabled:opacity-40"
            >
              {labels.addLink}
            </button>
            <button
              type="button"
              onClick={() => setAddingLink(false)}
              className="rounded-control border border-hairline px-stack py-tight text-xs text-lavender"
            >
              <X size={14} />
            </button>
          </div>
        </div>
      ) : (
        <div className="flex flex-wrap gap-tight">
          <label className="flex cursor-pointer items-center gap-1 rounded-control border border-dashed border-hairline px-stack py-tight text-xs text-lavender hover:border-accent">
            {uploading ? <Loader2 size={14} className="animate-spin" /> : <Plus size={14} />}
            {labels.addFile}
            <input
              type="file"
              accept={ATTACHMENT_ACCEPT}
              multiple
              className="hidden"
              disabled={uploading}
              onChange={e => handleFiles(e.target.files)}
            />
          </label>
          <button
            type="button"
            onClick={() => setAddingLink(true)}
            className="flex items-center gap-1 rounded-control border border-dashed border-hairline px-stack py-tight text-xs text-lavender hover:border-accent"
          >
            <LinkIcon size={14} />
            {labels.addLink}
          </button>
        </div>
      )}
    </div>
  );
}
