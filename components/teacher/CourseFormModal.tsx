import { useEffect, useRef, useState } from "react";
import { X, Loader2, ImagePlus, ChevronLeft, ChevronRight, Check, Cloud } from "lucide-react";
import { useLanguage } from "@/context/LanguageContext";
import { useAuth, displayNameFor } from "@/context/AuthContext";
import { courseQueries, categoryQueries } from "@/lib/db/courses";
import { thumbnailStorage } from "@/lib/db/storage";
import type { Category, Course } from "@/lib/db/types";
import CourseCardPreview from "@/components/teacher/CourseCardPreview";
import LessonManagerPanel from "@/components/teacher/LessonManagerPanel";
import ResizablePanel from "@/components/ui/ResizablePanel";

const LEVELS = ["beginner", "intermediate", "advanced"];
const STEP_IDS = ["basics", "media", "curriculum", "publish"] as const;
type StepId = (typeof STEP_IDS)[number];
const AUTOSAVE_DELAY_MS = 900;

export default function CourseFormModal({
  course,
  onClose,
  onSaved,
}: {
  course: Course | null;
  onClose: () => void;
  onSaved: (course: Course) => void;
}) {
  const { t } = useLanguage();
  const { user, profile } = useAuth();
  const [categories, setCategories] = useState<Category[]>([]);

  const [step, setStep] = useState(0);
  // New courses unlock steps as the teacher progresses; editing an existing
  // (already-saved) course starts fully unlocked since there's nothing left
  // to gate — every field already has somewhere to be saved.
  const [maxStepReached, setMaxStepReached] = useState(course ? STEP_IDS.length - 1 : 0);

  const [title, setTitle] = useState(course?.title ?? "");
  const [description, setDescription] = useState(course?.description ?? "");
  const [categoryId, setCategoryId] = useState(course?.category_id ?? "");
  const [level, setLevel] = useState(course?.level ?? "beginner");
  const [price, setPrice] = useState(course?.price != null ? String(course.price) : "0");
  const [thumbnailPreview, setThumbnailPreview] = useState<string | null>(course?.thumbnail_url ?? null);

  // savedCourse is the source of truth for whatever's actually persisted —
  // null until the very first autosave creates the draft row. Once set, its
  // id is what every subsequent update/upload writes against.
  const [savedCourse, setSavedCourse] = useState<Course | null>(course);
  const [saveStatus, setSaveStatus] = useState<"idle" | "saving" | "saved" | "error">("idle");
  const [creatingDraft, setCreatingDraft] = useState(false);
  const [publishing, setPublishing] = useState(false);
  const [error, setError] = useState("");
  const didMount = useRef(false);

  useEffect(() => {
    categoryQueries.getAll().then(setCategories).catch(() => setCategories([]));
  }, []);

  // Autosave: once a draft exists, any change to these fields quietly
  // persists after a short pause instead of requiring an explicit save.
  useEffect(() => {
    if (!savedCourse) return;
    if (!didMount.current) {
      didMount.current = true;
      return;
    }
    setSaveStatus("saving");
    const timeout = setTimeout(async () => {
      try {
        const updated = await courseQueries.update(savedCourse.id, {
          title: title.trim(),
          description: description.trim(),
          category_id: categoryId || null,
          level,
          price: Number(price) || 0,
        });
        setSavedCourse(prev => (prev ? { ...prev, ...updated } : updated));
        setSaveStatus("saved");
      } catch {
        setSaveStatus("error");
      }
    }, AUTOSAVE_DELAY_MS);
    return () => clearTimeout(timeout);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [title, description, categoryId, level, price]);

  const goToStep = (index: number) => {
    if (index > maxStepReached) return;
    setStep(index);
  };

  const creatingDraftRef = useRef(false);

  const handleNext = async () => {
    if (step === 0) {
      if (!title.trim() || !description.trim()) {
        setError(t("components.teacher.CourseFormModal.requiredFields"));
        return;
      }
      setError("");
      if (!savedCourse) {
        if (!user) return;
        // Belt-and-braces against a double-click/double-tap firing this
        // handler twice before React re-renders the disabled button: a
        // synchronous ref check closes that gap immediately, where the
        // `creatingDraft` state alone would still allow a same-tick re-entry.
        if (creatingDraftRef.current) return;
        creatingDraftRef.current = true;
        setCreatingDraft(true);
        try {
          const created = await courseQueries.create({
            title: title.trim(),
            description: description.trim(),
            category_id: categoryId || null,
            level,
            price: Number(price) || 0,
            status: "draft",
            teacher_id: user.id,
            type: "islamic",
            enrolled_students: 0,
            rating: 0,
          });
          setSavedCourse(created);
          didMount.current = true;
        } catch (err: any) {
          setError(err?.message || t("components.teacher.CourseFormModal.failed"));
          creatingDraftRef.current = false;
          setCreatingDraft(false);
          return;
        }
        creatingDraftRef.current = false;
        setCreatingDraft(false);
      }
    }
    const next = Math.min(step + 1, STEP_IDS.length - 1);
    setMaxStepReached(m => Math.max(m, next));
    setStep(next);
    // Leaving the curriculum step: refresh the saved course so the "X
    // lessons" count in the live preview reflects what was just added,
    // rather than staying frozen at whatever it was on modal open.
    if (STEP_IDS[step] === "curriculum" && savedCourse) {
      courseQueries
        .getById(savedCourse.id)
        .then(fresh => {
          if (!fresh) return;
          setSavedCourse(prev => (prev ? { ...prev, lessons: fresh.lessons } : fresh));
        })
        .catch(() => {});
    }
  };

  const handleBack = () => setStep(s => Math.max(s - 1, 0));

  const handleThumbnail = async (file: File) => {
    const localUrl = URL.createObjectURL(file);
    setThumbnailPreview(localUrl);
    if (!savedCourse) return;
    setSaveStatus("saving");
    try {
      const thumbnail_url = await thumbnailStorage.upload(savedCourse.id, file);
      const updated = await courseQueries.update(savedCourse.id, { thumbnail_url });
      setSavedCourse(prev => (prev ? { ...prev, ...updated } : updated));
      setSaveStatus("saved");
    } catch {
      setSaveStatus("error");
    }
  };

  const finish = async (status: Course["status"]) => {
    if (!savedCourse) return;
    setPublishing(true);
    setError("");
    try {
      const updated = await courseQueries.update(savedCourse.id, { status });
      onSaved({ ...savedCourse, ...updated });
    } catch (err: any) {
      setError(err?.message || t("components.teacher.CourseFormModal.failed"));
    } finally {
      setPublishing(false);
    }
  };

  const fieldClass =
    "w-full rounded-control border border-line bg-mist px-stack py-tight text-sm text-ink outline-none transition-colors duration-base placeholder:text-slate focus:border-accent";

  const selectedCategoryName = categories.find(cat => cat.id === categoryId)?.name ?? "";
  const lessonsSource = savedCourse?.lessons ?? course?.lessons;
  const existingLessonCount = Array.isArray(lessonsSource)
    ? lessonsSource.length
    : (lessonsSource as { count: number }[] | undefined)?.[0]?.count ?? 0;

  const stepLabel = (id: StepId) => t(`components.teacher.CourseFormModal.step.${id}`);
  const isCurriculumStep = STEP_IDS[step] === "curriculum";

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-night/80 px-gutter py-block" role="dialog" aria-modal="true">
      <ResizablePanel
        // Desktop teachers get a roomy, document-editor-sized canvas by
        // default (a small monitor still comfortably fits it); phones fall
        // back to nearly the full viewport since there's no spare room to
        // spare either way. Dragging the corner or the fill-screen button
        // goes all the way up to the edge of whatever screen it's on — no
        // artificial cap — and the chosen size is remembered next time.
        defaultWidth={typeof window !== "undefined" ? Math.min(1180, window.innerWidth - 48) : 1180}
        defaultHeight={typeof window !== "undefined" ? Math.min(820, window.innerHeight - 48) : 820}
        minWidth={480}
        minHeight={420}
        storageKey="course-form"
        className="overflow-hidden rounded-panel border border-line bg-background"
        resizeLabel={t("components.teacher.CourseFormModal.resizeWindow")}
        maximizeLabel={t("components.teacher.CourseFormModal.maximizeWindow")}
        restoreLabel={t("components.teacher.CourseFormModal.restoreWindow")}
      >
      <div className="flex h-full min-h-0 w-full flex-1 flex-col overflow-hidden lg:flex-row">
        <div className="flex flex-1 flex-col overflow-hidden">
          <div className="flex items-center justify-between gap-stack border-b border-line px-block py-tight">
            <div>
              <h2 className="font-heading text-lg text-ink">
                {course
                  ? t("components.teacher.CourseFormModal.editTitle")
                  : t("components.teacher.CourseFormModal.createTitle")}
              </h2>
              <div className="mt-1 flex items-center gap-1 text-[10px] uppercase tracking-widest text-slate">
                {saveStatus === "saving" ? (
                  <>
                    <Loader2 size={11} className="animate-spin" /> {t("components.teacher.CourseFormModal.saving")}
                  </>
                ) : saveStatus === "saved" ? (
                  <>
                    <Check size={11} className="text-success" /> {t("components.teacher.CourseFormModal.saved")}
                  </>
                ) : saveStatus === "error" ? (
                  <span className="text-danger">{t("components.teacher.CourseFormModal.saveFailed")}</span>
                ) : savedCourse ? (
                  <>
                    <Cloud size={11} /> {t("components.teacher.CourseFormModal.draftSaved")}
                  </>
                ) : null}
              </div>
            </div>
            <button type="button" onClick={onClose} aria-label={t("components.teacher.CourseFormModal.close")} className="text-slate hover:text-ink">
              <X size={20} />
            </button>
          </div>

          <p className="border-b border-line bg-mist/60 px-block py-1 text-[11px] text-slate lg:hidden">
            {t("components.teacher.CourseFormModal.largeScreenHint")}
          </p>

          <div className="flex items-center gap-1.5 border-b border-line px-block py-tight">
            {STEP_IDS.map((id, i) => {
              const reached = i <= maxStepReached;
              const active = i === step;
              return (
                <button
                  key={id}
                  type="button"
                  onClick={() => goToStep(i)}
                  disabled={!reached}
                  className={`flex flex-1 items-center gap-1.5 rounded-control px-1.5 py-1 text-left text-[11px] transition-colors duration-base ${
                    active ? "text-ink" : reached ? "text-slate hover:text-ink" : "text-slate/50"
                  }`}
                >
                  <span
                    className={`flex h-4 w-4 shrink-0 items-center justify-center rounded-pill text-[9px] ${
                      active ? "bg-accent text-accent-foreground" : reached ? "border border-lavender" : "border border-line"
                    }`}
                  >
                    {reached && !active ? <Check size={9} /> : i + 1}
                  </span>
                  <span className="hidden truncate sm:inline">{stepLabel(id)}</span>
                </button>
              );
            })}
          </div>

          <div className="flex flex-1 flex-col gap-stack overflow-y-auto px-block py-block">
            {error ? <div className="rounded-control border border-danger/50 bg-danger/10 px-stack py-tight text-sm text-ink">{error}</div> : null}

            {step === 0 ? (
              <div className="flex flex-col gap-stack">
                <div>
                  <label className="mb-1 block text-xs uppercase tracking-widest text-slate" htmlFor="course-title">
                    {t("components.teacher.CourseFormModal.titleLabel")}
                  </label>
                  <input id="course-title" value={title} onChange={e => setTitle(e.target.value)} className={fieldClass} />
                </div>
                <div>
                  <label className="mb-1 block text-xs uppercase tracking-widest text-slate" htmlFor="course-desc">
                    {t("components.teacher.CourseFormModal.descriptionLabel")}
                  </label>
                  <textarea id="course-desc" rows={4} value={description} onChange={e => setDescription(e.target.value)} className={fieldClass} />
                </div>
                <div className="grid grid-cols-2 gap-stack">
                  <div>
                    <label className="mb-1 block text-xs uppercase tracking-widest text-slate" htmlFor="course-category">
                      {t("components.teacher.CourseFormModal.categoryLabel")}
                    </label>
                    <select id="course-category" value={categoryId} onChange={e => setCategoryId(e.target.value)} className={fieldClass}>
                      <option value="">{t("components.teacher.CourseFormModal.categoryNone")}</option>
                      {categories.map(cat => (
                        <option key={cat.id} value={cat.id}>
                          {cat.name}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="mb-1 block text-xs uppercase tracking-widest text-slate" htmlFor="course-level">
                      {t("components.teacher.CourseFormModal.levelLabel")}
                    </label>
                    <select id="course-level" value={level} onChange={e => setLevel(e.target.value)} className={fieldClass}>
                      {LEVELS.map(l => (
                        <option key={l} value={l}>
                          {t(`components.teacher.CourseFormModal.level.${l}`)}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>
              </div>
            ) : null}

            {step === 1 ? (
              <div className="flex flex-col gap-stack">
                <label className="flex cursor-pointer flex-col items-center gap-tight rounded-control border border-dashed border-line px-stack py-block text-center transition-colors duration-base hover:border-accent">
                  {thumbnailPreview ? (
                    <img src={thumbnailPreview} alt="" className="h-40 w-full rounded-control object-cover" />
                  ) : (
                    <>
                      <ImagePlus size={24} className="text-slate" aria-hidden="true" />
                      <span className="text-xs text-slate">{t("components.teacher.CourseFormModal.thumbnail")}</span>
                    </>
                  )}
                  <input
                    type="file"
                    accept="image/*"
                    className="hidden"
                    onChange={event => {
                      const file = event.target.files?.[0];
                      if (file) handleThumbnail(file);
                    }}
                  />
                </label>
                <p className="text-xs text-slate">{t("components.teacher.CourseFormModal.thumbnailHint")}</p>
              </div>
            ) : null}

            {step === 2 ? (
              <div className="flex flex-col gap-tight">
                <p className="text-xs text-slate">{t("components.teacher.CourseFormModal.curriculumHint")}</p>
                {savedCourse ? <LessonManagerPanel course={savedCourse} /> : null}
              </div>
            ) : null}

            {step === 3 ? (
              <div className="flex flex-col gap-stack">
                <div>
                  <label className="mb-1 block text-xs uppercase tracking-widest text-slate" htmlFor="course-price">
                    {t("components.teacher.CourseFormModal.priceLabel")}
                  </label>
                  <input id="course-price" type="number" min={0} value={price} onChange={e => setPrice(e.target.value)} className={fieldClass} />
                </div>
                {savedCourse?.status ? (
                  <p className="text-xs text-slate">
                    {t("components.teacher.CourseFormModal.currentStatus")}:{" "}
                    <span className="text-ink">{savedCourse.status}</span>
                  </p>
                ) : null}
                <div className="flex flex-wrap gap-tight pt-tight">
                  <button
                    type="button"
                    onClick={() => finish("draft")}
                    disabled={publishing}
                    className="flex items-center gap-tight rounded-control border border-line px-block py-tight text-sm text-ink transition-colors duration-base hover:border-accent disabled:opacity-60"
                  >
                    {publishing ? <Loader2 size={16} className="animate-spin" /> : null}
                    {t("components.teacher.CourseFormModal.saveDraft")}
                  </button>
                  <button
                    type="button"
                    onClick={() => finish("published")}
                    disabled={publishing}
                    className="gradient-brand flex items-center gap-tight rounded-control px-block py-tight text-sm text-primary-foreground transition-all duration-base hover:scale-hover disabled:opacity-60"
                  >
                    {publishing ? <Loader2 size={16} className="animate-spin" /> : null}
                    {t("components.teacher.CourseFormModal.publishNow")}
                  </button>
                </div>
              </div>
            ) : null}
          </div>

          {step !== 3 ? (
            <div className="flex items-center justify-between border-t border-line px-block py-tight">
              <button
                type="button"
                onClick={handleBack}
                disabled={step === 0}
                className="flex items-center gap-1 rounded-control px-stack py-tight text-sm text-slate transition-colors duration-base hover:text-ink disabled:opacity-30"
              >
                <ChevronLeft size={16} /> {t("components.teacher.CourseFormModal.back")}
              </button>
              <button
                type="button"
                onClick={handleNext}
                disabled={creatingDraft}
                className="gradient-brand flex items-center gap-1 rounded-control px-block py-tight text-sm text-primary-foreground transition-all duration-base hover:scale-hover disabled:opacity-60"
              >
                {creatingDraft ? <Loader2 size={16} className="animate-spin" /> : null}
                {t("components.teacher.CourseFormModal.next")} <ChevronRight size={16} />
              </button>
            </div>
          ) : null}
        </div>

        {!isCurriculumStep ? (
          <div className="hidden w-full max-w-xs flex-col overflow-hidden border-line bg-night/40 lg:flex lg:border-l">
            <div className="flex items-center justify-between border-b border-line px-stack py-tight">
              <span className="text-xs uppercase tracking-widest text-slate">
                {t("components.teacher.CourseFormModal.livePreview")}
              </span>
            </div>
            <div className="flex-1 overflow-y-auto px-stack py-stack">
              <CourseCardPreview
                title={title}
                description={description}
                categoryName={selectedCategoryName}
                level={level}
                price={Number(price) || 0}
                thumbnailPreview={thumbnailPreview}
                teacherName={displayNameFor(user, profile)}
                lessonCount={existingLessonCount}
              />
            </div>
          </div>
        ) : null}
      </div>
      </ResizablePanel>
    </div>
  );
}
