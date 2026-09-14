import { useEffect, useState } from "react";
import ResizablePanel from "@/components/ui/ResizablePanel";
import {
  X,
  Plus,
  Trash2,
  GripVertical,
  CheckCircle2,
  Circle,
  CheckSquare,
  Square,
  Clock,
  Target,
  Loader2,
  Sparkles,
  ListChecks,
  Image as ImageIcon,
} from "lucide-react";
import { useLanguage } from "@/context/LanguageContext";
import { quizQueries, type DraftQuestion } from "@/lib/db/quizzes";
import { quizImageStorage } from "@/lib/db/storage";
import type { Lesson, Quiz } from "@/lib/db/types";

const emptyQuestion = (): DraftQuestion => ({
  prompt: "",
  image_url: null,
  explanation: "",
  points: 1,
  multi_select: false,
  options: [
    { label: "", image_url: null, is_correct: true },
    { label: "", image_url: null, is_correct: false },
  ],
});

// The teacher-facing quiz composer: attaches a graded multiple-choice quiz
// to a lesson. Lives in its own modal (same chrome as CourseFormModal) so
// it can be opened from anywhere a lesson is managed without competing for
// space with the lesson editor itself.
export default function QuizBuilder({
  lesson,
  onClose,
  onSaved,
  onDeleted,
}: {
  lesson: Lesson;
  onClose: () => void;
  onSaved: (quiz: Quiz) => void;
  onDeleted: () => void;
}) {
  const { t } = useLanguage();
  const T = (key: string) => t(`components.quiz.QuizBuilder.${key}`);

  const [loading, setLoading] = useState(true);
  const [existingQuizId, setExistingQuizId] = useState<string | null>(null);
  const [status, setStatus] = useState<"draft" | "published" | "archived">("draft");
  const [statusSaving, setStatusSaving] = useState(false);
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [passingScore, setPassingScore] = useState(70);
  const [timeLimit, setTimeLimit] = useState<string>("");
  const [shuffle, setShuffle] = useState(true);
  const [questions, setQuestions] = useState<DraftQuestion[]>([emptyQuestion()]);
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [error, setError] = useState("");
  const [uploadingKey, setUploadingKey] = useState<string | null>(null);

  const uploadImage = async (file: File, target: { qIndex: number; oIndex?: number }) => {
    const key = `${target.qIndex}-${target.oIndex ?? "q"}`;
    setUploadingKey(key);
    setError("");
    try {
      const url = await quizImageStorage.upload(lesson.course_id, file);
      if (target.oIndex === undefined) {
        updateQuestion(target.qIndex, { image_url: url });
      } else {
        updateOption(target.qIndex, target.oIndex, { image_url: url });
      }
    } catch (err) {
      console.error("[QuizBuilder] image upload error:", err);
      setError(T("errorImageUpload"));
    } finally {
      setUploadingKey(null);
    }
  };

  useEffect(() => {
    let cancelled = false;
    quizQueries
      .getByLessonId(lesson.id)
      .then(quiz => {
        if (cancelled || !quiz) return;
        setExistingQuizId(quiz.id);
        setStatus(quiz.status);
        setTitle(quiz.title);
        setDescription(quiz.description ?? "");
        setPassingScore(quiz.passing_score);
        setTimeLimit(quiz.time_limit_minutes != null ? String(quiz.time_limit_minutes) : "");
        setShuffle(quiz.shuffle_questions);
        const loaded = (quiz.quiz_questions ?? []).map(q => ({
          id: q.id,
          prompt: q.prompt,
          image_url: q.image_url ?? null,
          explanation: q.explanation ?? "",
          points: q.points,
          multi_select: q.multi_select,
          options: (q.quiz_options ?? []).map(o => ({ id: o.id, label: o.label, image_url: o.image_url ?? null, is_correct: !!o.is_correct })),
        }));
        if (loaded.length > 0) setQuestions(loaded);
      })
      .catch(() => {})
      .finally(() => !cancelled && setLoading(false));
    return () => {
      cancelled = true;
    };
  }, [lesson.id]);

  const updateQuestion = (index: number, patch: Partial<DraftQuestion>) => {
    setQuestions(prev => prev.map((q, i) => (i === index ? { ...q, ...patch } : q)));
  };

  const updateOption = (qIndex: number, oIndex: number, patch: Partial<DraftQuestion["options"][number]>) => {
    setQuestions(prev =>
      prev.map((q, i) => {
        if (i !== qIndex) return q;
        const options = q.options.map((o, j) => (j === oIndex ? { ...o, ...patch } : o));
        return { ...q, options };
      })
    );
  };

  // Single-select questions behave like a radio group: picking one correct
  // option clears the others so the data can never drift into an
  // impossible "single_select but two correct answers" state.
  const setCorrectSingle = (qIndex: number, oIndex: number) => {
    setQuestions(prev =>
      prev.map((q, i) => {
        if (i !== qIndex) return q;
        return { ...q, options: q.options.map((o, j) => ({ ...o, is_correct: j === oIndex })) };
      })
    );
  };

  const toggleCorrectMulti = (qIndex: number, oIndex: number) => {
    setQuestions(prev =>
      prev.map((q, i) => {
        if (i !== qIndex) return q;
        return { ...q, options: q.options.map((o, j) => (j === oIndex ? { ...o, is_correct: !o.is_correct } : o)) };
      })
    );
  };

  const addOption = (qIndex: number) => {
    setQuestions(prev =>
      prev.map((q, i) => (i === qIndex ? { ...q, options: [...q.options, { label: "", is_correct: false }] } : q))
    );
  };

  const removeOption = (qIndex: number, oIndex: number) => {
    setQuestions(prev =>
      prev.map((q, i) => (i === qIndex ? { ...q, options: q.options.filter((_, j) => j !== oIndex) } : q))
    );
  };

  const addQuestion = () => setQuestions(prev => [...prev, emptyQuestion()]);
  const removeQuestion = (index: number) => setQuestions(prev => prev.filter((_, i) => i !== index));
  const moveQuestion = (index: number, dir: -1 | 1) => {
    setQuestions(prev => {
      const next = [...prev];
      const target = index + dir;
      if (target < 0 || target >= next.length) return prev;
      [next[index], next[target]] = [next[target], next[index]];
      return next;
    });
  };

  const isValid =
    title.trim().length > 0 &&
    questions.length > 0 &&
    questions.every(
      q =>
        q.prompt.trim().length > 0 &&
        q.options.filter(o => o.label.trim().length > 0 || o.image_url).length >= 2 &&
        q.options.some(o => o.is_correct && (o.label.trim().length > 0 || o.image_url))
    );

  const handleSave = async () => {
    if (!isValid) {
      setError(T("errorIncomplete"));
      return;
    }
    setError("");
    setSaving(true);
    try {
      const cleaned = questions.map(q => ({ ...q, options: q.options.filter(o => o.label.trim().length > 0 || o.image_url) }));
      const saved = await quizQueries.save(
        lesson.id,
        lesson.course_id,
        existingQuizId,
        {
          title: title.trim(),
          description: description.trim(),
          passing_score: passingScore,
          time_limit_minutes: timeLimit.trim() ? Number(timeLimit) : null,
          shuffle_questions: shuffle,
        },
        cleaned
      );
      onSaved(saved);
    } catch (err) {
      console.error("[QuizBuilder] save error:", err);
      setError(T("errorSave"));
    } finally {
      setSaving(false);
    }
  };

  // A saved quiz starts as a draft (invisible to students) until the
  // teacher explicitly publishes it — same draft/published pattern already
  // used for courses in this app.
  const handleTogglePublish = async () => {
    if (!existingQuizId) return;
    const next = status === "published" ? "archived" : "published";
    setStatusSaving(true);
    try {
      await quizQueries.setStatus(existingQuizId, next);
      setStatus(next);
    } catch (err) {
      console.error("[QuizBuilder] status error:", err);
      setError(T("errorSave"));
    } finally {
      setStatusSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!existingQuizId) return;
    if (!window.confirm(T("confirmDelete"))) return;
    setDeleting(true);
    try {
      await quizQueries.delete(existingQuizId);
      onDeleted();
    } catch (err) {
      console.error("[QuizBuilder] delete error:", err);
      setError(T("errorSave"));
    } finally {
      setDeleting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-night/80 px-gutter py-block" role="dialog" aria-modal="true">
      <ResizablePanel
        // A quiz with a dozen questions and images is document-length work —
        // default to a canvas roomy enough to see several questions at
        // once on desktop, but it still shrinks to fit a phone screen, and
        // dragging the corner (or the fill-screen button) goes all the way
        // up to the edge of whatever screen it's on.
        defaultWidth={typeof window !== "undefined" ? Math.min(1100, window.innerWidth - 48) : 1100}
        defaultHeight={typeof window !== "undefined" ? Math.min(820, window.innerHeight - 48) : 820}
        minWidth={420}
        minHeight={420}
        storageKey="quiz-builder"
        className="overflow-hidden rounded-panel border border-line bg-background"
        resizeLabel={T("resizeWindow")}
        maximizeLabel={T("maximizeWindow")}
        restoreLabel={T("restoreWindow")}
      >
        <div className="flex shrink-0 items-center justify-between border-b border-line px-stack py-tight">
          <div className="flex items-center gap-tight">
            <span className="flex h-9 w-9 items-center justify-center rounded-control bg-accent/10 text-accent">
              <Sparkles size={16} aria-hidden="true" />
            </span>
            <div>
              <p className="text-sm font-medium text-ink">{T("heading")}</p>
              <p className="text-xs text-slate">{lesson.title}</p>
            </div>
          </div>
          <button type="button" onClick={onClose} aria-label={T("close")} className="rounded-control p-1.5 text-slate hover:bg-mist hover:text-ink">
            <X size={16} />
          </button>
        </div>

        <p className="shrink-0 border-b border-line bg-mist/60 px-stack py-1 text-[11px] text-slate lg:hidden">
          {T("largeScreenHint")}
        </p>

        {loading ? (
          <div className="flex flex-1 items-center justify-center py-block">
            <Loader2 size={22} className="animate-spin text-accent" aria-hidden="true" />
          </div>
        ) : (
          <div className="flex-1 overflow-y-auto px-stack py-stack">
            <div className="flex flex-col gap-tight">
              <label className="flex flex-col gap-1">
                <span className="text-xs font-medium text-slate">{T("titleLabel")}</span>
                <input
                  value={title}
                  onChange={e => setTitle(e.target.value)}
                  placeholder={T("titlePlaceholder")}
                  className="rounded-control border border-line bg-background px-stack py-tight text-sm text-ink outline-none focus:border-accent"
                />
              </label>
              <label className="flex flex-col gap-1">
                <span className="text-xs font-medium text-slate">{T("descriptionLabel")}</span>
                <textarea
                  value={description}
                  onChange={e => setDescription(e.target.value)}
                  rows={2}
                  placeholder={T("descriptionPlaceholder")}
                  className="resize-none rounded-control border border-line bg-background px-stack py-tight text-sm text-ink outline-none focus:border-accent"
                />
              </label>

              <div className="grid grid-cols-2 gap-tight sm:grid-cols-3">
                <label className="flex flex-col gap-1">
                  <span className="flex items-center gap-1 text-xs font-medium text-slate">
                    <Target size={12} aria-hidden="true" /> {T("passingScoreLabel")}
                  </span>
                  <input
                    type="number"
                    min={0}
                    max={100}
                    value={passingScore}
                    onChange={e => setPassingScore(Math.min(100, Math.max(0, Number(e.target.value))))}
                    className="rounded-control border border-line bg-background px-stack py-tight text-sm text-ink outline-none focus:border-accent"
                  />
                </label>
                <label className="flex flex-col gap-1">
                  <span className="flex items-center gap-1 text-xs font-medium text-slate">
                    <Clock size={12} aria-hidden="true" /> {T("timeLimitLabel")}
                  </span>
                  <input
                    type="number"
                    min={1}
                    value={timeLimit}
                    onChange={e => setTimeLimit(e.target.value)}
                    placeholder={T("timeLimitPlaceholder")}
                    className="rounded-control border border-line bg-background px-stack py-tight text-sm text-ink outline-none focus:border-accent"
                  />
                </label>
                <label className="flex items-end gap-1.5 pb-2">
                  <input type="checkbox" checked={shuffle} onChange={e => setShuffle(e.target.checked)} className="h-4 w-4 accent-accent" />
                  <span className="text-xs font-medium text-slate">{T("shuffleLabel")}</span>
                </label>
              </div>
            </div>

            {/* On a wide, resized-up panel this lays questions out two-up
                like a document with columns; on a phone-width panel it
                falls back to a single stacked column automatically. */}
            <div className="mt-block grid grid-cols-1 gap-stack lg:grid-cols-2 lg:items-start">
              {questions.map((q, qIndex) => (
                <div key={qIndex} className="rounded-panel border border-line p-stack">
                  <div className="flex items-start gap-tight">
                    <div className="flex flex-col items-center gap-1 pt-2 text-slate">
                      <GripVertical size={14} aria-hidden="true" />
                      <button type="button" onClick={() => moveQuestion(qIndex, -1)} disabled={qIndex === 0} className="text-[10px] disabled:opacity-20">
                        ▲
                      </button>
                      <button type="button" onClick={() => moveQuestion(qIndex, 1)} disabled={qIndex === questions.length - 1} className="text-[10px] disabled:opacity-20">
                        ▼
                      </button>
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center justify-between gap-tight">
                        <span className="text-[10px] font-medium uppercase tracking-widest text-slate">
                          {T("question")} {qIndex + 1}
                        </span>
                        {questions.length > 1 ? (
                          <button type="button" onClick={() => removeQuestion(qIndex)} className="text-slate hover:text-danger" aria-label={T("removeQuestion")}>
                            <Trash2 size={14} />
                          </button>
                        ) : null}
                      </div>
                      <textarea
                        value={q.prompt}
                        onChange={e => updateQuestion(qIndex, { prompt: e.target.value })}
                        rows={2}
                        placeholder={T("promptPlaceholder")}
                        className="mt-1 w-full resize-none rounded-control border border-line bg-background px-stack py-tight text-sm text-ink outline-none focus:border-accent"
                      />

                      {q.image_url ? (
                        <div className="relative mt-tight inline-block">
                          <img src={q.image_url} alt="" className="h-24 w-auto rounded-control border border-line object-cover" />
                          <button
                            type="button"
                            onClick={() => updateQuestion(qIndex, { image_url: null })}
                            aria-label={T("removeImage")}
                            className="absolute -right-2 -top-2 flex h-5 w-5 items-center justify-center rounded-pill bg-night text-night-foreground"
                          >
                            <X size={11} />
                          </button>
                        </div>
                      ) : (
                        <label className="mt-tight inline-flex cursor-pointer items-center gap-1.5 rounded-control border border-dashed border-line px-stack py-1.5 text-xs text-slate hover:border-accent hover:text-accent">
                          {uploadingKey === `${qIndex}-q` ? <Loader2 size={13} className="animate-spin" /> : <ImageIcon size={13} />}
                          {T("addQuestionImage")}
                          <input
                            type="file"
                            accept="image/*"
                            className="hidden"
                            disabled={uploadingKey !== null}
                            onChange={e => {
                              const file = e.target.files?.[0];
                              e.target.value = "";
                              if (file) uploadImage(file, { qIndex });
                            }}
                          />
                        </label>
                      )}

                      <div className="mt-tight flex flex-col gap-1">
                        {q.options.map((o, oIndex) => (
                          <div key={oIndex} className="flex items-center gap-1.5">
                            <button
                              type="button"
                              onClick={() => (q.multi_select ? toggleCorrectMulti(qIndex, oIndex) : setCorrectSingle(qIndex, oIndex))}
                              aria-label={T("markCorrect")}
                              className={o.is_correct ? "text-success" : "text-slate hover:text-accent"}
                            >
                              {q.multi_select ? (
                                o.is_correct ? <CheckSquare size={16} /> : <Square size={16} />
                              ) : o.is_correct ? (
                                <CheckCircle2 size={16} />
                              ) : (
                                <Circle size={16} />
                              )}
                            </button>
                            {o.image_url ? (
                              <div className="relative shrink-0">
                                <img src={o.image_url} alt="" className="h-9 w-9 rounded-control border border-line object-cover" />
                                <button
                                  type="button"
                                  onClick={() => updateOption(qIndex, oIndex, { image_url: null })}
                                  aria-label={T("removeImage")}
                                  className="absolute -right-1.5 -top-1.5 flex h-4 w-4 items-center justify-center rounded-pill bg-night text-night-foreground"
                                >
                                  <X size={9} />
                                </button>
                              </div>
                            ) : (
                              <label className="flex h-9 w-9 shrink-0 cursor-pointer items-center justify-center rounded-control border border-dashed border-line text-slate hover:border-accent hover:text-accent" title={T("addOptionImage")}>
                                {uploadingKey === `${qIndex}-${oIndex}` ? <Loader2 size={13} className="animate-spin" /> : <ImageIcon size={13} />}
                                <input
                                  type="file"
                                  accept="image/*"
                                  className="hidden"
                                  disabled={uploadingKey !== null}
                                  onChange={e => {
                                    const file = e.target.files?.[0];
                                    e.target.value = "";
                                    if (file) uploadImage(file, { qIndex, oIndex });
                                  }}
                                />
                              </label>
                            )}
                            <input
                              value={o.label}
                              onChange={e => updateOption(qIndex, oIndex, { label: e.target.value })}
                              placeholder={`${T("optionPlaceholder")} ${oIndex + 1}`}
                              className="flex-1 rounded-control border border-line bg-background px-stack py-1.5 text-sm text-ink outline-none focus:border-accent"
                            />
                            {q.options.length > 2 ? (
                              <button type="button" onClick={() => removeOption(qIndex, oIndex)} className="text-slate hover:text-danger" aria-label={T("removeOption")}>
                                <X size={14} />
                              </button>
                            ) : null}
                          </div>
                        ))}
                      </div>

                      <div className="mt-tight flex flex-wrap items-center gap-stack">
                        <button type="button" onClick={() => addOption(qIndex)} className="flex items-center gap-1 text-xs text-accent hover:underline">
                          <Plus size={12} aria-hidden="true" /> {T("addOption")}
                        </button>
                        <label className="flex items-center gap-1.5 text-xs text-slate">
                          <input
                            type="checkbox"
                            checked={q.multi_select}
                            onChange={e => updateQuestion(qIndex, { multi_select: e.target.checked })}
                            className="h-3.5 w-3.5 accent-accent"
                          />
                          {T("multiSelectLabel")}
                        </label>
                        <label className="ml-auto flex items-center gap-1.5 text-xs text-slate">
                          {T("pointsLabel")}
                          <input
                            type="number"
                            min={1}
                            value={q.points}
                            onChange={e => updateQuestion(qIndex, { points: Math.max(1, Number(e.target.value)) })}
                            className="w-14 rounded-control border border-line bg-background px-1.5 py-0.5 text-xs text-ink outline-none focus:border-accent"
                          />
                        </label>
                      </div>
                      <input
                        value={q.explanation}
                        onChange={e => updateQuestion(qIndex, { explanation: e.target.value })}
                        placeholder={T("explanationPlaceholder")}
                        className="mt-tight w-full rounded-control border border-dashed border-line bg-background px-stack py-1.5 text-xs text-slate outline-none focus:border-accent"
                      />
                    </div>
                  </div>
                </div>
              ))}

              <button
                type="button"
                onClick={addQuestion}
                className="flex items-center justify-center gap-1.5 rounded-control border border-dashed border-line py-tight text-sm text-slate transition-colors duration-base hover:border-accent hover:text-accent lg:col-span-2"
              >
                <Plus size={15} aria-hidden="true" /> {T("addQuestion")}
              </button>
            </div>
          </div>
        )}

        <div className="flex shrink-0 flex-wrap items-center justify-between gap-tight border-t border-line px-stack py-tight">
          <div className="flex flex-wrap items-center gap-tight">
            {existingQuizId ? (
              <>
                <button
                  type="button"
                  onClick={handleTogglePublish}
                  disabled={statusSaving}
                  className={`flex items-center gap-1 rounded-pill px-stack py-1 text-xs font-medium disabled:opacity-50 ${
                    status === "published" ? "bg-success/10 text-success" : "bg-mist text-slate"
                  }`}
                >
                  {statusSaving ? <Loader2 size={12} className="animate-spin" /> : null}
                  {status === "published" ? T("published") : T("unpublished")}
                </button>
                <button
                  type="button"
                  onClick={handleDelete}
                  disabled={deleting}
                  className="flex items-center gap-1 text-xs text-danger hover:underline disabled:opacity-50"
                >
                  {deleting ? <Loader2 size={12} className="animate-spin" /> : <Trash2 size={12} />}
                  {T("deleteQuiz")}
                </button>
              </>
            ) : (
              <span className="flex items-center gap-1 text-xs text-slate">
                <ListChecks size={12} aria-hidden="true" /> {questions.length} {T("questionsCount")}
              </span>
            )}
            {error ? <span className="text-xs text-danger">{error}</span> : null}
          </div>
          <div className="flex items-center gap-tight">
            <button type="button" onClick={onClose} className="rounded-control border border-line px-stack py-tight text-xs text-slate hover:text-ink">
              {T("cancel")}
            </button>
            <button
              type="button"
              onClick={handleSave}
              disabled={saving || loading}
              className="gradient-brand flex items-center gap-1.5 rounded-control px-block py-tight text-sm text-primary-foreground transition-all duration-base hover:scale-hover disabled:opacity-60"
            >
              {saving ? <Loader2 size={14} className="animate-spin" /> : null}
              {T("save")}
            </button>
          </div>
        </div>
      </ResizablePanel>
    </div>
  );
}
