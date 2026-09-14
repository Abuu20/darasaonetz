import { useEffect, useRef, useState } from "react";
import { Loader2, ImagePlus, ChevronLeft, ChevronRight, Check, Cloud } from "lucide-react";
import { useLanguage } from "@/context/LanguageContext";
import { useAuth, displayNameFor } from "@/context/AuthContext";
import { courseQueries, categoryQueries } from "@/lib/db/courses";
import { thumbnailStorage } from "@/lib/db/storage";
import type { Category, Course } from "@/lib/db/types";
import CourseCardPreview from "@/components/teacher/CourseCardPreview";
import LessonManagerPanel from "@/components/teacher/LessonManagerPanel";

const LEVELS = ["beginner", "intermediate", "advanced"];
const STEP_IDS = ["basics", "media", "curriculum", "publish"] as const;
type StepId = (typeof STEP_IDS)[number];
const AUTOSAVE_DELAY_MS = 900;

interface CourseFormPanelProps {
  course: Course | null;
  onClose: () => void;
  onSaved: (course: Course) => void;
}

/**
 * Inline, tab-hosted version of the course create/edit form. Same wizard,
 * same autosave, same three-column layout — the only difference from the
 * old CourseFormModal is that this renders inline (no backdrop, no fixed
 * positioning, no ResizablePanel), so it can live inside a tab. Close is
 * repurposed as "back to courses list".
 */
export default function CourseFormPanel({ course, onClose, onSaved }: CourseFormPanelProps) {
  const { t } = useLanguage();
  const { user, profile } = useAuth();
  const [categories, setCategories] = useState<Category[]>([]);

  const [step, setStep] = useState(0);
  const [maxStepReached, setMaxStepReached] = useState(course ? STEP_IDS.length - 1 : 0);

  const [title, setTitle] = useState(course?.title ?? "");
  const [description, setDescription] = useState(course?.description ?? "");
  const [categoryId, setCategoryId] = useState(course?.category_id ?? "");
  const [level, setLevel] = useState(course?.level ?? "beginner");
  const [price, setPrice] = useState(course?.price != null ? String(course.price) : "0");
  const [thumbnailPreview, setThumbnailPreview] = useState<string | null>(course?.thumbnail_url ?? null);

  const [savedCourse, setSavedCourse] = useState<Course | null>(course);
  const [saveStatus, setSaveStatus] = useState<"idle" | "saving" | "saved" | "error">("idle");
  const [creatingDraft, setCreatingDraft] = useState(false);
  const [publishing, setPublishing] = useState(false);
  const [error, setError] = useState("");
  const didMount = useRef(false);

  useEffect(() => {
    categoryQueries.getAll().then(setCategories).catch(() => setCategories([]));
  }, []);

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
    <div className="card-lift flex flex-col overflow-hidden rounded-card border border-line bg-background">
      {/* Header row — the "X" is repurposed as "back to courses list". */}
      <div className="flex items-center justify-between gap-stack border-b border-line px-block py-3">
        <div className="flex min-w-0 items-center gap-stack">
          <button
            type="button"
            onClick={onClose}
            className="inline-flex items-center gap-1.5 rounded-control border border-line px-3 py-1.5 text-xs text-slate transition-colors duration-base hover:border-accent hover:text-ink"
          >
            <ChevronLeft size={14} aria-hidden="true" />
            {t("components.teacher.CourseFormModal.back")}
          </button>
          <div className="min-w-0">
            <h2 className="truncate font-heading text-base text-ink">
              {course
                ? t("components.teacher.CourseFormModal.editTitle")
                : t("components.teacher.CourseFormModal.createTitle")}
            </h2>
            <div className="mt-0.5 flex items-center gap-1 text-[10px] uppercase tracking-widest text-slate">
              {saveStatus === "saving" ? (
                <><Loader2 size={11} className="animate-spin" /> {t("components.teacher.CourseFormModal.saving")}</>
              ) : saveStatus === "saved" ? (
                <><Check size={11} className="text-success" /> {t("components.teacher.CourseFormModal.saved")}</>
              ) : saveStatus === "error" ? (
                <span className="text-danger">{t("components.teacher.CourseFormModal.saveFailed")}</span>
              ) : savedCourse ? (
                <><Cloud size={11} /> {t("components.teacher.CourseFormModal.draftSaved")}</>
              ) : null}
            </div>
          </div>
        </div>
      </div>

      {/* Stepper */}
      <div className="flex items-center gap-1.5 border-b border-line px-block py-2">
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
                  active ? "bg-accent text-accent-foreground" : reached ? "border border-accent/50 text-accent" : "border border-line"
                }`}
              >
                {reached && !active ? <Check size={9} /> : i + 1}
              </span>
              <span className="hidden truncate sm:inline">{stepLabel(id)}</span>
            </button>
          );
        })}
      </div>

      {/* Body — two columns on lg+: form left, live course-card preview right. */}
      <div className="flex flex-1 flex-col lg:flex-row">
        <div className="flex flex-1 flex-col">
          <div className="flex flex-1 flex-col gap-stack px-block py-block">
            {error ? (
              <div className="rounded-control border border-danger/50 bg-danger/10 px-stack py-tight text-sm text-ink">
                {error}
              </div>
            ) : null}

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
                <div className="grid grid-cols-1 gap-stack sm:grid-cols-2">
                  <div>
                    <label className="mb-1 block text-xs uppercase tracking-widest text-slate" htmlFor="course-category">
                      {t("components.teacher.CourseFormModal.categoryLabel")}
                    </label>
                    <select id="course-category" value={categoryId} onChange={e => setCategoryId(e.target.value)} className={fieldClass}>
                      <option value="">{t("components.teacher.CourseFormModal.categoryNone")}</option>
                      {categories.map(cat => (<option key={cat.id} value={cat.id}>{cat.name}</option>))}
                    </select>
                  </div>
                  <div>
                    <label className="mb-1 block text-xs uppercase tracking-widest text-slate" htmlFor="course-level">
                      {t("components.teacher.CourseFormModal.levelLabel")}
                    </label>
                    <select id="course-level" value={level} onChange={e => setLevel(e.target.value)} className={fieldClass}>
                      {LEVELS.map(l => (<option key={l} value={l}>{t(`components.teacher.CourseFormModal.level.${l}`)}</option>))}
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
                    onChange={e => { const f = e.target.files?.[0]; if (f) handleThumbnail(f); }}
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
          <div className="hidden w-full max-w-xs shrink-0 flex-col border-line bg-dash-tint lg:flex lg:border-l">
            <div className="flex items-center justify-between border-b border-line px-stack py-2">
              <span className="text-[10px] uppercase tracking-widest text-slate">
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
    </div>
  );
}
