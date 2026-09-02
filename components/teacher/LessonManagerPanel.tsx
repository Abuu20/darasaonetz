import { useEffect, useRef, useState } from "react";
import { motion, AnimatePresence } from "motion/react";
import { ChevronDown, GripVertical, Loader2, Plus, Trash2, UploadCloud, Video } from "lucide-react";
import LessonContentCard from "@/components/lesson/LessonContentCard";
import LessonVideo from "@/components/lesson/LessonVideo";
import LessonAttachmentsEditor from "@/components/lesson/LessonAttachmentsEditor";
import { generateId } from "@/lib/uuid";
import RichTextEditor from "@/components/lesson/RichTextEditor";
import ResizableSplit from "@/components/ui/ResizableSplit";
import { useLanguage } from "@/context/LanguageContext";
import { lessonQueries, enrollmentQueries } from "@/lib/db/courses";
import { notificationQueries } from "@/lib/db/notifications";
import { videoStorage } from "@/lib/db/storage";
import { saveLessonDraft, loadLessonDraft, clearLessonDraft } from "@/lib/lessonDraft";
import type { Course, Lesson, LessonAttachment } from "@/lib/db/types";

const COLLAPSE_AFTER = 6;
const MAX_VIDEO_MB = 500;

export default function LessonManagerPanel({ course }: { course: Course }) {
  const { t } = useLanguage();
  const [lessons, setLessons] = useState<Lesson[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAll, setShowAll] = useState(false);
  const [openLessonId, setOpenLessonId] = useState<string | null>(null);
  const [creating, setCreating] = useState(false);
  const [draftLessonId, setDraftLessonId] = useState<string>("");
  const [newTitle, setNewTitle] = useState("");
  const [newContent, setNewContent] = useState("");
  const [newVideo, setNewVideo] = useState<File | null>(null);
  const [newVideoUrl, setNewVideoUrl] = useState("");
  const [newAttachments, setNewAttachments] = useState<LessonAttachment[]>([]);
  const [notifyStudents, setNotifyStudents] = useState(true);
  const [saving, setSaving] = useState(false);
  const [uploadPct, setUploadPct] = useState(0);
  const [error, setError] = useState("");
  const [showFullPreview, setShowFullPreview] = useState(false);
  const [newVideoPreviewUrl, setNewVideoPreviewUrl] = useState<string | null>(null);
  const [editingLessonId, setEditingLessonId] = useState<string | null>(null);
  const [editTitle, setEditTitle] = useState("");
  const [editContent, setEditContent] = useState("");
  const [editVideoUrl, setEditVideoUrl] = useState("");
  const [editVideo, setEditVideo] = useState<File | null>(null);
  const [editVideoPreviewUrl, setEditVideoPreviewUrl] = useState<string | null>(null);
  const [editUploadPct, setEditUploadPct] = useState(0);
  const [editSaving, setEditSaving] = useState(false);
  const [draftRestored, setDraftRestored] = useState(false);
  const [editDraftRestored, setEditDraftRestored] = useState(false);

  const newDraftKey = `new:${course.id}`;

  // --- Autosave: "new lesson" form -----------------------------------
  // If a half-written lesson is sitting in localStorage for this course
  // (left behind by a reload, a closed tab, a dead battery), open the
  // form back up with it already filled in instead of losing it silently.
  useEffect(() => {
    const draft = loadLessonDraft<{
      title: string;
      content: string;
      draftLessonId?: string;
      notifyStudents?: boolean;
      attachments?: LessonAttachment[];
    }>(newDraftKey);
    if (draft && (draft.title.trim() || draft.content.trim())) {
      setDraftLessonId(draft.draftLessonId || generateId());
      setNewTitle(draft.title);
      setNewContent(draft.content);
      if (typeof draft.notifyStudents === "boolean") setNotifyStudents(draft.notifyStudents);
      if (draft.attachments) setNewAttachments(draft.attachments);
      setCreating(true);
      setDraftRestored(true);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [course.id]);

  useEffect(() => {
    if (!creating) return;
    const timer = setTimeout(() => {
      saveLessonDraft(newDraftKey, {
        title: newTitle,
        content: newContent,
        draftLessonId,
        notifyStudents,
        attachments: newAttachments,
      });
    }, 500);
    return () => clearTimeout(timer);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [creating, newTitle, newContent, draftLessonId, notifyStudents, newAttachments]);

  // --- Autosave: "edit lesson" form -----------------------------------
  useEffect(() => {
    if (!editingLessonId) return;
    const timer = setTimeout(() => {
      saveLessonDraft(`edit:${editingLessonId}`, { title: editTitle, content: editContent });
    }, 500);
    return () => clearTimeout(timer);
  }, [editingLessonId, editTitle, editContent]);

  // Belt-and-braces: flush whatever is currently typed the instant the tab
  // is backgrounded or closed, rather than waiting out the debounce above.
  // This is what actually protects a teacher from a reload/tab-discard
  // landing mid-keystroke.
  const latest = useRef({ creating, newDraftKey, newTitle, newContent, draftLessonId, notifyStudents, newAttachments, editingLessonId, editTitle, editContent });
  latest.current = { creating, newDraftKey, newTitle, newContent, draftLessonId, notifyStudents, newAttachments, editingLessonId, editTitle, editContent };
  useEffect(() => {
    const flush = () => {
      const l = latest.current;
      if (l.creating) {
        saveLessonDraft(l.newDraftKey, {
          title: l.newTitle,
          content: l.newContent,
          draftLessonId: l.draftLessonId,
          notifyStudents: l.notifyStudents,
          attachments: l.newAttachments,
        });
      }
      if (l.editingLessonId) {
        saveLessonDraft(`edit:${l.editingLessonId}`, { title: l.editTitle, content: l.editContent });
      }
    };
    document.addEventListener("visibilitychange", flush);
    window.addEventListener("pagehide", flush);
    return () => {
      document.removeEventListener("visibilitychange", flush);
      window.removeEventListener("pagehide", flush);
    };
  }, []);

  const attachmentLabels = {
    addFile: t("components.teacher.LessonManagerPanel.addFile"),
    addLink: t("components.teacher.LessonManagerPanel.addLink"),
    linkPlaceholder: t("components.teacher.LessonManagerPanel.linkPlaceholder"),
    linkNamePlaceholder: t("components.teacher.LessonManagerPanel.linkNamePlaceholder"),
    uploadFailed: t("components.teacher.LessonManagerPanel.uploadFailed"),
  };

  const load = () => {
    setLoading(true);
    lessonQueries
      .getByCourse(course.id)
      .then(setLessons)
      .catch(() => setLessons([]))
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [course.id]);

  const visible = showAll ? lessons : lessons.slice(0, COLLAPSE_AFTER);

  const resetForm = () => {
    clearLessonDraft(newDraftKey);
    setCreating(false);
    setDraftLessonId("");
    setNewTitle("");
    setNewContent("");
    setNewVideo(null);
    setNewVideoUrl("");
    setNewAttachments([]);
    setUploadPct(0);
    setError("");
    setShowFullPreview(false);
    setDraftRestored(false);
    if (newVideoPreviewUrl) URL.revokeObjectURL(newVideoPreviewUrl);
    setNewVideoPreviewUrl(null);
  };

  const handleVideoSelect = (file: File | null) => {
    if (!file) return;
    if (!file.type.startsWith("video/")) {
      setError(t("components.teacher.LessonManagerPanel.videoInvalidType"));
      return;
    }
    if (file.size > MAX_VIDEO_MB * 1024 * 1024) {
      setError(t("components.teacher.LessonManagerPanel.videoTooLarge"));
      return;
    }
    setError("");
    setNewVideo(file);
    setNewVideoUrl("");
    if (newVideoPreviewUrl) URL.revokeObjectURL(newVideoPreviewUrl);
    setNewVideoPreviewUrl(URL.createObjectURL(file));
  };

  const handleVideoUrlChange = (value: string) => {
    setNewVideoUrl(value);
    if (value.trim() && newVideo) {
      // A pasted link takes over from a previously chosen file — only one
      // video source is saved per lesson.
      setNewVideo(null);
      if (newVideoPreviewUrl) URL.revokeObjectURL(newVideoPreviewUrl);
      setNewVideoPreviewUrl(null);
    }
  };

  // Same file-upload path as handleVideoSelect above, but for the "edit
  // lesson" form. Previously the edit form only exposed the video-URL text
  // input, so a lesson originally created with an uploaded file had no way
  // to have that video replaced short of deleting and recreating the whole
  // lesson.
  const handleEditVideoSelect = (file: File | null) => {
    if (!file) return;
    if (!file.type.startsWith("video/")) {
      setError(t("components.teacher.LessonManagerPanel.videoInvalidType"));
      return;
    }
    if (file.size > MAX_VIDEO_MB * 1024 * 1024) {
      setError(t("components.teacher.LessonManagerPanel.videoTooLarge"));
      return;
    }
    setError("");
    setEditVideo(file);
    setEditVideoUrl("");
    if (editVideoPreviewUrl) URL.revokeObjectURL(editVideoPreviewUrl);
    setEditVideoPreviewUrl(URL.createObjectURL(file));
  };

  const handleEditVideoUrlChange = (value: string) => {
    setEditVideoUrl(value);
    if (value.trim() && editVideo) {
      setEditVideo(null);
      if (editVideoPreviewUrl) URL.revokeObjectURL(editVideoPreviewUrl);
      setEditVideoPreviewUrl(null);
    }
  };

  const handleCreate = async () => {
    if (!newTitle.trim()) return;
    setSaving(true);
    setError("");
    try {
      // Upload the video (if any) BEFORE creating the lesson row, reusing
      // the draft id generated when the form opened (attachments already
      // uploaded to storage under this same id as they were added).
      // Previously the lesson row was created first and the video attached
      // after — if the upload failed partway (bad connection, file too
      // large, storage quota), the lesson was left behind in the database
      // with no video and no way for the teacher to tell it apart from a
      // real text-only lesson. Doing the upload first means a failed
      // upload leaves nothing behind to clean up.
      const lessonId = draftLessonId || generateId();
      let video_url: string | null = newVideoUrl.trim() || null;
      if (newVideo && !video_url) {
        video_url = await videoStorage.upload(course.id, lessonId, newVideo, pct => setUploadPct(pct));
      }

      const lesson = await lessonQueries.create({
        id: lessonId,
        course_id: course.id,
        title: newTitle.trim(),
        content: newContent.trim() || null,
        video_url,
        attachments: newAttachments.length > 0 ? newAttachments : null,
        order_index: lessons.length,
      });
      setUploadPct(100);

      if (notifyStudents) {
        const enrolled = await enrollmentQueries.getByCourse(course.id).catch(() => []);
        await Promise.all(
          enrolled.map(e =>
            notificationQueries
              .create(
                e.student_id,
                "new_lesson",
                t("components.teacher.LessonManagerPanel.notifyTitle"),
                `${course.title}: ${newTitle.trim()}`,
                { course_id: course.id, lesson_id: lesson.id }
              )
              .catch(() => {})
          )
        );
      }

      resetForm();
      load();
    } catch (err: any) {
      setError(err?.message || t("components.teacher.LessonManagerPanel.failed"));
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (lessonId: string) => {
    if (!confirm(t("components.teacher.LessonManagerPanel.confirmDelete"))) return;
    try {
      await lessonQueries.delete(lessonId);
      setLessons(prev => prev.filter(l => l.id !== lessonId));
    } catch (err) {
      console.error("[Lesson delete] error:", err);
    }
  };

  const move = async (index: number, direction: -1 | 1) => {
    const target = index + direction;
    if (target < 0 || target >= lessons.length) return;
    const next = [...lessons];
    [next[index], next[target]] = [next[target], next[index]];
    setLessons(next);
    await lessonQueries.reorder(next.map((l, i) => ({ id: l.id, order_index: i }))).catch(() => {});
  };

  const handleUpdateAttachments = async (lessonId: string, attachments: LessonAttachment[]) => {
    setLessons(prev => prev.map(l => (l.id === lessonId ? { ...l, attachments } : l)));
    await lessonQueries.update(lessonId, { attachments: attachments.length > 0 ? attachments : null }).catch(() => {});
  };

  const startEditLesson = (lesson: Lesson) => {
    const draft = loadLessonDraft<{ title: string; content: string }>(`edit:${lesson.id}`);
    setEditingLessonId(lesson.id);
    setEditVideoUrl(lesson.video_url ?? "");
    setEditVideo(null);
    setEditVideoPreviewUrl(null);
    setEditUploadPct(0);
    if (draft && (draft.title.trim() || draft.content.trim())) {
      setEditTitle(draft.title);
      setEditContent(draft.content);
      setEditDraftRestored(true);
    } else {
      setEditTitle(lesson.title);
      setEditContent(lesson.content ?? "");
      setEditDraftRestored(false);
    }
  };

  const cancelEditLesson = () => {
    if (editingLessonId) clearLessonDraft(`edit:${editingLessonId}`);
    setEditingLessonId(null);
    setEditTitle("");
    setEditContent("");
    setEditVideoUrl("");
    setEditDraftRestored(false);
    if (editVideoPreviewUrl) URL.revokeObjectURL(editVideoPreviewUrl);
    setEditVideo(null);
    setEditVideoPreviewUrl(null);
    setEditUploadPct(0);
  };

  const discardEditDraft = (lesson: Lesson) => {
    clearLessonDraft(`edit:${lesson.id}`);
    setEditTitle(lesson.title);
    setEditContent(lesson.content ?? "");
    setEditVideoUrl(lesson.video_url ?? "");
    if (editVideoPreviewUrl) URL.revokeObjectURL(editVideoPreviewUrl);
    setEditVideo(null);
    setEditVideoPreviewUrl(null);
    setEditDraftRestored(false);
  };

  const saveEditLesson = async (lessonId: string) => {
    if (!editTitle.trim()) return;
    setEditSaving(true);
    setError("");
    try {
      // If a new video file was picked, upload it and use the resulting
      // URL — otherwise fall back to whatever's in the URL field (which
      // may be unchanged, cleared, or a freshly pasted link).
      let video_url = editVideoUrl.trim() || null;
      if (editVideo) {
        video_url = await videoStorage.upload(course.id, lessonId, editVideo, pct => setEditUploadPct(pct));
      }
      const updated = await lessonQueries.update(lessonId, {
        title: editTitle.trim(),
        content: editContent.trim() || null,
        video_url,
      });
      setLessons(prev => prev.map(l => (l.id === lessonId ? { ...l, ...updated } : l)));
      clearLessonDraft(`edit:${lessonId}`);
      cancelEditLesson();
    } catch (err: any) {
      setError(err?.message || t("components.teacher.LessonManagerPanel.failed"));
      console.error("[Lesson edit] error:", err);
    } finally {
      setEditSaving(false);
    }
  };

  if (loading) {
    return <div className="h-24 animate-pulse rounded-control bg-mist" />;
  }

  return (
    <div className="flex flex-col gap-tight border-t border-line pt-stack">
      {lessons.length === 0 && !creating ? (
        <p className="text-sm text-slate">{t("components.teacher.LessonManagerPanel.empty")}</p>
      ) : (
        <div className="flex flex-col gap-1">
          {visible.map((lesson, i) => {
            const isOpen = openLessonId === lesson.id;
            return (
              <div key={lesson.id} className="overflow-hidden rounded-control border border-line">
                <div className="flex items-center gap-tight px-stack py-tight">
                  <div className="flex flex-col text-slate">
                    <button type="button" onClick={() => move(i, -1)} disabled={i === 0} aria-label="up" className="disabled:opacity-30">
                      <GripVertical size={12} />
                    </button>
                  </div>
                  <button
                    type="button"
                    onClick={() => setOpenLessonId(isOpen ? null : lesson.id)}
                    className="flex flex-1 items-center justify-between gap-tight text-left text-sm text-ink"
                  >
                    <span>
                      {i + 1}. {lesson.title}
                      {lesson.video_url ? <Video size={12} className="ml-1 inline text-accent" aria-hidden="true" /> : null}
                    </span>
                    <ChevronDown size={16} className={`text-slate transition-transform duration-base ${isOpen ? "rotate-180" : ""}`} aria-hidden="true" />
                  </button>
                  {isOpen && editingLessonId !== lesson.id ? (
                    <button
                      type="button"
                      onClick={() => startEditLesson(lesson)}
                      className="shrink-0 text-[10px] uppercase tracking-widest text-accent underline"
                    >
                      {t("components.teacher.LessonManagerPanel.edit")}
                    </button>
                  ) : null}
                  <button type="button" onClick={() => handleDelete(lesson.id)} aria-label={t("components.teacher.LessonManagerPanel.delete")} className="text-slate hover:text-danger">
                    <Trash2 size={16} />
                  </button>
                </div>
                <AnimatePresence initial={false}>
                  {isOpen ? (
                    <motion.div
                      initial={{ height: 0, opacity: 0.001 }}
                      animate={{ height: "auto", opacity: 1 }}
                      exit={{ height: 0, opacity: 0.001 }}
                      transition={{ duration: 0.25 }}
                      className="border-t border-line px-stack py-tight text-sm text-slate"
                    >
                      {lesson.video_url && editingLessonId !== lesson.id ? (
                        <div className="mb-tight">
                          <LessonVideo url={lesson.video_url} />
                        </div>
                      ) : null}
                      {editingLessonId === lesson.id ? (
                        <ResizableSplit
                          className="lg:h-[560px]"
                          dividerLabel={t("components.teacher.LessonManagerPanel.resizeSplit")}
                          left={
                            <div className="flex h-full min-h-0 flex-col gap-tight py-tight pr-tight">
                              {editDraftRestored ? (
                                <p className="flex items-center justify-between gap-tight text-xs text-accent">
                                  <span>{t("components.teacher.LessonManagerPanel.draftRestored")}</span>
                                  <button
                                    type="button"
                                    onClick={() => discardEditDraft(lesson)}
                                    className="shrink-0 underline text-slate hover:text-ink"
                                  >
                                    {t("components.teacher.LessonManagerPanel.discardDraft")}
                                  </button>
                                </p>
                              ) : null}
                              <input
                                value={editTitle}
                                onChange={e => setEditTitle(e.target.value)}
                                className="rounded-control border border-line bg-mist px-stack py-tight text-sm text-ink outline-none focus:border-accent"
                              />
                              <label className="flex cursor-pointer items-center gap-tight rounded-control border border-dashed border-line px-stack py-tight text-xs text-slate hover:border-accent">
                                <UploadCloud size={16} />
                                <span>{editVideo ? editVideo.name : t("components.teacher.LessonManagerPanel.videoUpload")}</span>
                                <input
                                  type="file"
                                  accept="video/*"
                                  className="hidden"
                                  onChange={e => handleEditVideoSelect(e.target.files?.[0] ?? null)}
                                />
                              </label>
                              <div className="flex items-center gap-tight text-[10px] uppercase tracking-widest text-slate">
                                <span className="h-px flex-1 bg-line" />
                                {t("components.teacher.LessonManagerPanel.or")}
                                <span className="h-px flex-1 bg-line" />
                              </div>
                              <input
                                value={editVideoUrl}
                                onChange={e => handleEditVideoUrlChange(e.target.value)}
                                placeholder={t("components.teacher.LessonManagerPanel.videoUrlPlaceholder")}
                                className="rounded-control border border-line bg-mist px-stack py-tight text-sm text-ink outline-none focus:border-accent"
                              />
                              {editUploadPct > 0 && editUploadPct < 100 ? (
                                <div className="h-1.5 w-full overflow-hidden rounded-pill bg-line">
                                  <div className="h-full bg-accent" style={{ width: `${editUploadPct}%` }} />
                                </div>
                              ) : null}
                              <RichTextEditor
                                className="min-h-0 flex-1"
                                value={editContent}
                                onChange={setEditContent}
                                placeholder={t("components.teacher.LessonManagerPanel.contentPlaceholder")}
                              />
                              <div className="flex gap-tight">
                                <button
                                  type="button"
                                  onClick={() => saveEditLesson(lesson.id)}
                                  disabled={editSaving || !editTitle.trim()}
                                  className="gradient-brand flex items-center gap-1 rounded-control px-stack py-tight text-xs text-primary-foreground disabled:opacity-60"
                                >
                                  {editSaving ? <Loader2 size={14} className="animate-spin" /> : null}
                                  {t("components.teacher.LessonManagerPanel.save")}
                                </button>
                                <button
                                  type="button"
                                  onClick={cancelEditLesson}
                                  className="rounded-control border border-line px-stack py-tight text-xs text-slate"
                                >
                                  {t("components.teacher.LessonManagerPanel.cancel")}
                                </button>
                              </div>
                            </div>
                          }
                          right={
                            <div className="flex h-full flex-col gap-tight bg-night py-tight pl-tight">
                              <span className="text-[10px] uppercase tracking-widest text-slate">
                                {t("components.teacher.LessonManagerPanel.previewLabel")}
                              </span>
                              {editVideoPreviewUrl || editVideoUrl.trim() ? (
                                <LessonVideo url={editVideoUrl.trim() || editVideoPreviewUrl!} />
                              ) : null}
                              <LessonContentCard
                                title={editTitle || lesson.title}
                                content={editContent}
                                emptyLabel={t("components.teacher.LessonManagerPanel.noContent")}
                                attachments={lesson.attachments}
                                resourcesLabel={t("components.teacher.LessonManagerPanel.resources")}
                              />
                            </div>
                          }
                        />
                      ) : (
                        <LessonContentCard
                          title={lesson.title}
                          content={lesson.content}
                          emptyLabel={t("components.teacher.LessonManagerPanel.noContent")}
                          attachments={lesson.attachments}
                          resourcesLabel={t("components.teacher.LessonManagerPanel.resources")}
                        />
                      )}
                      <div className="mt-stack border-t border-line pt-stack">
                        <span className="mb-tight block text-[10px] uppercase tracking-widest text-slate">
                          {t("components.teacher.LessonManagerPanel.manageResources")}
                        </span>
                        <LessonAttachmentsEditor
                          courseId={course.id}
                          lessonId={lesson.id}
                          attachments={lesson.attachments ?? []}
                          onChange={next => handleUpdateAttachments(lesson.id, next)}
                          labels={attachmentLabels}
                        />
                      </div>
                    </motion.div>
                  ) : null}
                </AnimatePresence>
              </div>
            );
          })}
          {lessons.length > COLLAPSE_AFTER ? (
            <button type="button" onClick={() => setShowAll(v => !v)} className="w-fit self-center text-xs text-slate underline">
              {showAll ? t("pages.CourseDetail.showLess") : `${t("pages.CourseDetail.showAll")} (${lessons.length - COLLAPSE_AFTER})`}
            </button>
          ) : null}
        </div>
      )}

      {creating ? (
        <div className="flex flex-col gap-tight rounded-control border border-line">
          {error ? <p className="px-stack pt-stack text-xs text-danger">{error}</p> : null}
          {draftRestored ? (
            <p className="flex items-center justify-between gap-tight px-stack pt-stack text-xs text-accent">
              <span>{t("components.teacher.LessonManagerPanel.draftRestored")}</span>
              <button type="button" onClick={resetForm} className="shrink-0 underline text-slate hover:text-ink">
                {t("components.teacher.LessonManagerPanel.discardDraft")}
              </button>
            </p>
          ) : null}
          <ResizableSplit
            className="lg:h-[720px]"
            dividerLabel={t("components.teacher.LessonManagerPanel.resizeSplit")}
            left={
              <div className="flex h-full min-h-0 flex-col gap-tight p-stack">
                <input
                  placeholder={t("components.teacher.LessonManagerPanel.titlePlaceholder")}
                  value={newTitle}
                  onChange={e => setNewTitle(e.target.value)}
                  className="rounded-control border border-line bg-mist px-stack py-tight text-sm text-ink outline-none focus:border-accent"
                />
                <RichTextEditor
                  className="min-h-0 flex-1"
                  value={newContent}
                  onChange={setNewContent}
                  placeholder={t("components.teacher.LessonManagerPanel.contentPlaceholder")}
                />
                <label className="flex cursor-pointer items-center gap-tight rounded-control border border-dashed border-line px-stack py-tight text-xs text-slate hover:border-accent">
                  <UploadCloud size={16} />
                  <span>{newVideo ? newVideo.name : t("components.teacher.LessonManagerPanel.videoUpload")}</span>
                  <input
                    type="file"
                    accept="video/*"
                    className="hidden"
                    onChange={e => handleVideoSelect(e.target.files?.[0] ?? null)}
                  />
                </label>
                <div className="flex items-center gap-tight text-[10px] uppercase tracking-widest text-slate">
                  <span className="h-px flex-1 bg-line" />
                  {t("components.teacher.LessonManagerPanel.or")}
                  <span className="h-px flex-1 bg-line" />
                </div>
                <input
                  value={newVideoUrl}
                  onChange={e => handleVideoUrlChange(e.target.value)}
                  placeholder={t("components.teacher.LessonManagerPanel.videoUrlPlaceholder")}
                  className="rounded-control border border-line bg-mist px-stack py-tight text-sm text-ink outline-none focus:border-accent"
                />
                <div className="flex flex-col gap-1.5">
                  <span className="text-[10px] uppercase tracking-widest text-slate">
                    {t("components.teacher.LessonManagerPanel.resources")}
                  </span>
                  <LessonAttachmentsEditor
                    courseId={course.id}
                    lessonId={draftLessonId}
                    attachments={newAttachments}
                    onChange={setNewAttachments}
                    labels={attachmentLabels}
                  />
                </div>
                {uploadPct > 0 && uploadPct < 100 ? (
                  <div className="h-1.5 w-full overflow-hidden rounded-pill bg-line">
                    <div className="h-full bg-accent" style={{ width: `${uploadPct}%` }} />
                  </div>
                ) : null}
                <label className="flex items-center gap-tight text-xs text-slate">
                  <input type="checkbox" checked={notifyStudents} onChange={e => setNotifyStudents(e.target.checked)} />
                  {t("components.teacher.LessonManagerPanel.notifyStudents")}
                </label>
                <div className="flex gap-tight">
                  <button
                    type="button"
                    onClick={handleCreate}
                    disabled={saving || !newTitle.trim()}
                    className="gradient-brand flex items-center gap-1 rounded-control px-stack py-tight text-xs text-primary-foreground disabled:opacity-60"
                  >
                    {saving ? <Loader2 size={14} className="animate-spin" /> : null}
                    {t("components.teacher.LessonManagerPanel.publish")}
                  </button>
                  <button type="button" onClick={resetForm} className="rounded-control border border-line px-stack py-tight text-xs text-slate">
                    {t("components.teacher.LessonManagerPanel.cancel")}
                  </button>
                </div>
              </div>
            }
            right={
              // Same LessonContentCard component the real Learn page uses —
              // not a lookalike — so what's shown here is the actual final
              // product, updating on every keystroke, not an approximation.
              <div className="flex h-full flex-col gap-tight bg-night p-stack">
                <div className="flex items-center justify-between">
                  <span className="text-[10px] uppercase tracking-widest text-slate">
                    {t("components.teacher.LessonManagerPanel.previewLabel")}
                  </span>
                  <button
                    type="button"
                    onClick={() => setShowFullPreview(true)}
                    className="text-[10px] uppercase tracking-widest text-accent underline"
                  >
                    {t("components.teacher.LessonManagerPanel.fullPreview")}
                  </button>
                </div>
                {newVideoPreviewUrl || newVideoUrl.trim() ? (
                  <LessonVideo url={newVideoUrl.trim() || newVideoPreviewUrl} />
                ) : null}
                <LessonContentCard
                  title={newTitle || "…"}
                  content={newContent}
                  emptyLabel={t("components.teacher.LessonManagerPanel.noContent")}
                  attachments={newAttachments}
                  resourcesLabel={t("components.teacher.LessonManagerPanel.resources")}
                />
              </div>
            }
          />
        </div>
      ) : (
        <button
          type="button"
          onClick={() => {
            setDraftLessonId(generateId());
            setCreating(true);
          }}
          className="flex w-fit items-center gap-1 rounded-control border border-dashed border-line px-stack py-tight text-xs text-slate transition-colors duration-base hover:border-accent hover:text-ink"
        >
          <Plus size={14} /> {t("components.teacher.LessonManagerPanel.addLesson")}
        </button>
      )}

      {/* Full-page preview: reproduces the actual Learn page shell (dark
          header + video pane + reading card) around the unpublished draft,
          so the teacher previews the real final layout rather than an
          isolated snippet of text. */}
      {showFullPreview ? (
        <div className="fixed inset-0 z-50 flex flex-col overflow-hidden bg-night text-ink">
          <div className="flex shrink-0 items-center justify-between gap-tight border-b border-line px-gutter py-tight">
            <span className="text-xs uppercase tracking-widest text-slate">
              {t("components.teacher.LessonManagerPanel.previewLabel")}
            </span>
            <button
              type="button"
              onClick={() => setShowFullPreview(false)}
              className="rounded-control border border-line px-stack py-tight text-xs text-slate hover:text-ink"
            >
              {t("components.teacher.LessonManagerPanel.cancel")}
            </button>
          </div>
          <div className="flex-1 overflow-y-auto">
            <div className="mx-auto flex w-full max-w-3xl flex-col gap-stack px-gutter py-block">
              <LessonVideo url={newVideoUrl.trim() || newVideoPreviewUrl} emptyLabel={t("pages.Learn.noVideo")} />
              <LessonContentCard
                title={newTitle || t("components.teacher.LessonManagerPanel.titlePlaceholder")}
                lessonLabel={`${t("pages.Learn.lesson")} ${lessons.length + 1} / ${lessons.length + 1}`}
                content={newContent}
                attachments={newAttachments}
                resourcesLabel={t("components.teacher.LessonManagerPanel.resources")}
              />
            </div>
          </div>
        </div>
      ) : null}
    </div>
  );
}
