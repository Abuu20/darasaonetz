import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { motion } from "motion/react";
import { BookOpen, Search, Users } from "lucide-react";
import { courseQueries, categoryQueries, enrollmentQueries } from "@/lib/db/courses";
import type { Category, Course } from "@/lib/db/types";
import { useLanguage } from "@/context/LanguageContext";
import { useAuth } from "@/context/AuthContext";
import AuthModal from "@/components/auth/AuthModal";
import { StarRatingDisplay } from "@/components/ui/StarRating";
import images from "@/assets/images.json";

function lessonCount(course: Course): number {
  const lessons = course.lessons as unknown;
  if (Array.isArray(lessons) && lessons.length > 0 && "count" in (lessons[0] as object)) {
    return Number((lessons[0] as { count: number }).count ?? 0);
  }
  return Array.isArray(lessons) ? lessons.length : 0;
}

export default function CourseGrid() {
  const { t } = useLanguage();
  const { user, session } = useAuth();
  const [courses, setCourses] = useState<Course[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [enrolledIds, setEnrolledIds] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [categoryId, setCategoryId] = useState<string>("all");
  const [query, setQuery] = useState("");
  const [authOpen, setAuthOpen] = useState(false);
  const [pendingId, setPendingId] = useState<string | null>(null);

  useEffect(() => {
    Promise.all([courseQueries.getPublished(), categoryQueries.getAll()])
      .then(([c, cat]) => {
        setCourses(c);
        setCategories(cat);
      })
      .catch(() => {
        setCourses([]);
        setCategories([]);
      })
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    if (!user || !session) {
      setEnrolledIds([]);
      return;
    }
    enrollmentQueries
      .getByStudent(user.id)
      .then(res => setEnrolledIds(res.map(e => e.course_id)))
      .catch(() => setEnrolledIds([]));
  }, [user, session]);

  const visible = useMemo(() => {
    const needle = query.trim().toLowerCase();
    return courses.filter(course => {
      const matchesCategory = categoryId === "all" || course.category_id === categoryId;
      const haystack = `${course.title} ${course.description ?? ""} ${course.profiles?.full_name ?? ""}`.toLowerCase();
      return matchesCategory && (needle.length === 0 || haystack.includes(needle));
    });
  }, [courses, categoryId, query]);

  const handleEnroll = async (course: Course) => {
    if (!user || !session) {
      setAuthOpen(true);
      return;
    }
    setPendingId(course.id);
    try {
      await enrollmentQueries.enroll(user.id, course.id);
      setEnrolledIds(prev => [...prev, course.id]);
    } catch (err) {
      console.error("[Enrollment] error:", err);
    } finally {
      setPendingId(null);
    }
  };

  return (
    <section id="catalog" className="bg-background px-gutter py-section-spacing-mobile md:px-gutter-lg md:py-section-spacing">
      <div className="mx-auto flex max-w-shell flex-col gap-block">
        <div className="flex flex-col gap-stack lg:flex-row lg:items-end lg:justify-between">
          <div className="flex flex-1 items-center gap-tight rounded-pill border border-line px-stack py-tight">
            <Search size={18} className="text-slate" aria-hidden="true" />
            <label className="sr-only" htmlFor="course-search">
              <span data-text-id="components.Courses.CourseGrid.searchLabel">
                {t("components.Courses.CourseGrid.searchLabel")}
              </span>
            </label>
            <input
              id="course-search"
              type="search"
              value={query}
              onChange={event => setQuery(event.target.value)}
              placeholder={t("components.Courses.CourseGrid.searchPlaceholder")}
              className="w-full bg-transparent text-sm text-ink outline-none placeholder:text-slate"
            />
          </div>

          <div className="flex flex-wrap gap-tight" role="group" aria-label={t("components.Courses.CourseGrid.filterLabel")}>
            <button
              type="button"
              onClick={() => setCategoryId("all")}
              aria-pressed={categoryId === "all"}
              className={`rounded-pill border px-stack py-tight text-sm transition-all duration-base ${
                categoryId === "all" ? "border-transparent bg-ink text-ink-foreground" : "border-line text-slate hover:border-accent hover:text-ink"
              }`}
            >
              <span data-text-id="components.Courses.CourseGrid.trackAll">{t("components.Courses.CourseGrid.trackAll")}</span>
            </button>
            {categories.map(cat => (
              <button
                key={cat.id}
                type="button"
                onClick={() => setCategoryId(cat.id)}
                aria-pressed={categoryId === cat.id}
                className={`rounded-pill border px-stack py-tight text-sm transition-all duration-base ${
                  categoryId === cat.id ? "border-transparent bg-ink text-ink-foreground" : "border-line text-slate hover:border-accent hover:text-ink"
                }`}
              >
                {cat.name}
              </button>
            ))}
          </div>
        </div>

        {loading ? (
          <div className="grid grid-cols-1 gap-stack sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {[0, 1, 2, 3, 4, 5, 6, 7].map(index => (
              <div key={index} className="h-72 animate-pulse rounded-card bg-mist" />
            ))}
          </div>
        ) : visible.length === 0 ? (
          <div className="flex flex-col items-center gap-stack rounded-card bg-mist px-block py-block text-center">
            <img src={images["account.empty"]} data-image-id="account.empty" alt="" aria-hidden="true" className="h-40 w-full max-w-xs rounded-panel object-cover" />
            <p data-text-id="components.Courses.CourseGrid.empty" className="text-sm text-slate">
              {t("components.Courses.CourseGrid.empty")}
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-stack sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {visible.map((course, index) => {
              const src = course.thumbnail_url || images["courses.hero"];
              const enrolled = enrolledIds.includes(course.id);
              return (
                <motion.article
                  key={course.id}
                  initial={{ opacity: 0.001, y: 24 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true, amount: 0.2 }}
                  transition={{ duration: 0.6, delay: (index % 3) * 0.08, ease: [0.22, 1, 0.36, 1] }}
                  className="card-lift flex flex-col overflow-hidden rounded-card bg-background"
                >
                  <Link to={`/courses/${course.id}`} className="aspect-[16/10] w-full overflow-hidden">
                    <img
                      src={src}
                      alt={course.title}
                      onError={event => {
                        event.currentTarget.onerror = null;
                        event.currentTarget.src = images["courses.hero"];
                      }}
                      className="h-full w-full object-cover transition-transform duration-slow hover:scale-hover"
                    />
                  </Link>
                  <div className="flex flex-1 flex-col gap-tight px-tight py-stack sm:px-stack">
                    <div className="flex items-center justify-between text-xs">
                      <span className="uppercase tracking-widest text-accent">{course.categories?.name ?? ""}</span>
                      <span className="text-slate">{course.level ?? ""}</span>
                    </div>
                    <Link to={`/courses/${course.id}`}>
                      <h3 className="line-clamp-2 font-heading text-lg text-ink transition-colors duration-base hover:text-accent">{course.title}</h3>
                    </Link>
                    {course.review_count ? (
                      <div className="flex items-center gap-1 text-xs">
                        <span className="font-medium text-ink">{(course.rating ?? 0).toFixed(1)}</span>
                        <StarRatingDisplay value={course.rating ?? 0} size="sm" />
                        <span className="text-slate">({course.review_count})</span>
                      </div>
                    ) : (
                      <span className="text-xs text-slate" data-text-id="components.Courses.CourseGrid.newBadge">
                        {t("components.Courses.CourseGrid.newBadge")}
                      </span>
                    )}
                    <p className="line-clamp-2 text-sm text-slate sm:line-clamp-3">{course.description}</p>

                    <div className="mt-auto flex flex-col gap-stack pt-tight">
                      <div className="flex flex-wrap items-center gap-stack text-xs text-slate">
                        <span className="inline-flex items-center gap-1">
                          <BookOpen size={14} aria-hidden="true" />
                          <span>{lessonCount(course)}</span>
                          <span data-text-id="components.Courses.CourseGrid.lessons">{t("components.Courses.CourseGrid.lessons")}</span>
                        </span>
                        <span className="inline-flex items-center gap-1">
                          <Users size={14} aria-hidden="true" />
                          <span>{course.profiles?.full_name ?? ""}</span>
                        </span>
                      </div>

                      <button
                        type="button"
                        onClick={() => handleEnroll(course)}
                        disabled={enrolled || pendingId === course.id}
                        className={`rounded-control px-stack py-tight text-sm transition-all duration-base ${
                          enrolled ? "border border-success bg-success/10 text-ink" : "gradient-brand text-primary-foreground hover:scale-hover active:scale-active"
                        } disabled:cursor-default`}
                      >
                        <span
                          data-text-id={
                            enrolled
                              ? "components.Courses.CourseGrid.enrolled"
                              : pendingId === course.id
                                ? "components.Courses.CourseGrid.enrolling"
                                : "components.Courses.CourseGrid.enroll"
                          }
                        >
                          {enrolled
                            ? t("components.Courses.CourseGrid.enrolled")
                            : pendingId === course.id
                              ? t("components.Courses.CourseGrid.enrolling")
                              : t("components.Courses.CourseGrid.enroll")}
                        </span>
                      </button>
                    </div>
                  </div>
                </motion.article>
              );
            })}
          </div>
        )}
      </div>

      <AuthModal isOpen={authOpen} onClose={() => setAuthOpen(false)} />
    </section>
  );
}
