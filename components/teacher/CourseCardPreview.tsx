import { BookOpen, Users } from "lucide-react";
import { useLanguage } from "@/context/LanguageContext";
import images from "@/assets/images.json";

// Mirrors the real course card in components/Courses/CourseGrid.tsx as closely
// as possible (same classes, same layout) so what a teacher sees while filling
// in the form is exactly what students will see on the catalog page — not an
// approximation. Non-interactive: it's a preview, not a live enroll button.
export default function CourseCardPreview({
  title,
  description,
  categoryName,
  level,
  price,
  thumbnailPreview,
  teacherName,
  lessonCount,
}: {
  title: string;
  description: string;
  categoryName: string;
  level: string;
  price: number;
  thumbnailPreview: string | null;
  teacherName: string;
  lessonCount: number;
}) {
  const { t } = useLanguage();
  const src = thumbnailPreview || images["courses.hero"];

  return (
    <div className="flex flex-col overflow-hidden rounded-card bg-background">
      <div className="aspect-[16/10] w-full overflow-hidden bg-mist">
        <img
          src={src}
          alt=""
          onError={event => {
            event.currentTarget.onerror = null;
            event.currentTarget.src = images["courses.hero"];
          }}
          className="h-full w-full object-cover"
        />
      </div>
      <div className="flex flex-1 flex-col gap-tight px-tight py-stack sm:px-stack">
        <div className="flex items-center justify-between text-xs">
          <span className="uppercase tracking-widest text-accent">{categoryName}</span>
          <span className="text-slate capitalize">{level}</span>
        </div>
        <h3 className="line-clamp-2 font-heading text-lg text-ink">
          {title || t("components.teacher.CourseCardPreview.untitled")}
        </h3>
        <p className="line-clamp-2 text-sm text-slate sm:line-clamp-3">
          {description || t("components.teacher.CourseCardPreview.noDescription")}
        </p>

        <div className="mt-auto flex flex-col gap-stack pt-tight">
          <div className="flex flex-wrap items-center gap-stack text-xs text-slate">
            <span className="inline-flex items-center gap-1">
              <BookOpen size={14} aria-hidden="true" />
              <span>{lessonCount}</span>
              <span>{t("components.Courses.CourseGrid.lessons")}</span>
            </span>
            <span className="inline-flex items-center gap-1">
              <Users size={14} aria-hidden="true" />
              <span>{teacherName}</span>
            </span>
          </div>

          <button
            type="button"
            disabled
            className="rounded-control px-stack py-tight text-sm gradient-brand text-primary-foreground disabled:cursor-default"
          >
            {price > 0
              ? `${t("components.teacher.CourseCardPreview.enroll")} — ${price}`
              : t("components.teacher.CourseCardPreview.enrollFree")}
          </button>
        </div>
      </div>
    </div>
  );
}
