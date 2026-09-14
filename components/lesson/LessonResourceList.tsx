import { useState } from "react";
import { FileText, FileImage, Link as LinkIcon, File as FileIcon, Download, Maximize2 } from "lucide-react";
import type { LessonAttachment } from "@/lib/db/types";
import { formatFileSize } from "@/lib/lessonAttachments";
import ResourceViewerModal from "@/components/lesson/ResourceViewerModal";

const ICONS: Record<LessonAttachment["type"], typeof FileText> = {
  pdf: FileText,
  doc: FileIcon,
  image: FileImage,
  link: LinkIcon,
};

// pdf/image resources open in the in-app fullscreen viewer; doc/link
// resources go straight to a new tab (a .docx can't be rendered inline by
// the browser, and a link is just a link).
const VIEWABLE_INLINE = new Set<LessonAttachment["type"]>(["pdf", "image"]);

export default function LessonResourceList({
  attachments,
  label,
}: {
  attachments: LessonAttachment[] | null | undefined;
  label: string;
}) {
  const [viewing, setViewing] = useState<LessonAttachment | null>(null);

  if (!attachments || attachments.length === 0) return null;

  return (
    <div className="flex flex-col gap-2 border-t border-line pt-stack">
      <span className="text-xs uppercase tracking-widest text-slate">{label}</span>
      <ul className="flex flex-col gap-1.5">
        {attachments.map(att => {
          const Icon = ICONS[att.type] ?? FileIcon;
          const isLink = att.type === "link";
          const inline = VIEWABLE_INLINE.has(att.type);

          if (inline) {
            return (
              <li key={att.id}>
                <button
                  type="button"
                  onClick={() => setViewing(att)}
                  className="flex w-full items-center gap-tight rounded-control border border-line px-stack py-tight text-left text-sm text-ink transition-colors duration-base hover:border-primary hover:bg-mist"
                >
                  <Icon size={16} className="shrink-0 text-primary" aria-hidden="true" />
                  <span className="min-w-0 flex-1 truncate">{att.name}</span>
                  {att.size_bytes ? (
                    <span className="shrink-0 text-xs text-slate">{formatFileSize(att.size_bytes)}</span>
                  ) : null}
                  <Maximize2 size={14} className="shrink-0 text-slate" aria-hidden="true" />
                </button>
              </li>
            );
          }

          return (
            <li key={att.id}>
              <a
                href={att.url}
                target="_blank"
                rel="noopener noreferrer"
                download={!isLink}
                className="flex items-center gap-tight rounded-control border border-line px-stack py-tight text-sm text-ink transition-colors duration-base hover:border-primary hover:bg-mist"
              >
                <Icon size={16} className="shrink-0 text-primary" aria-hidden="true" />
                <span className="min-w-0 flex-1 truncate">{att.name}</span>
                {att.size_bytes ? (
                  <span className="shrink-0 text-xs text-slate">{formatFileSize(att.size_bytes)}</span>
                ) : null}
                {!isLink ? <Download size={14} className="shrink-0 text-slate" aria-hidden="true" /> : null}
              </a>
            </li>
          );
        })}
      </ul>

      {viewing ? <ResourceViewerModal attachment={viewing} onClose={() => setViewing(null)} /> : null}
    </div>
  );
}
