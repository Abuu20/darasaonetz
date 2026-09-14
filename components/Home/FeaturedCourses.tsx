import { useEffect, useState } from "react";
import { motion } from "motion/react";
import { Link } from "react-router-dom";
import { ArrowRight, BookOpen } from "lucide-react";
import { courseQueries } from "@/lib/db/courses";
import type { Course } from "@/lib/db/types";
import { useLanguage } from "@/context/LanguageContext";
import images from "@/assets/images.json";

function lessonCount(course: Course): number {
  const lessons = course.lessons as unknown;
  if (Array.isArray(lessons) && lessons.length > 0 && "count" in (lessons[0] as object)) {
    return Number((lessons[0] as { count: number }).count ?? 0);
  }
  return Array.isArray(lessons) ? lessons.length : 0;
}

export default function FeaturedCourses() {
  const { t } = useLanguage();
  const [courses, setCourses] = useState<Course[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    courseQueries
      .getPublished()
      .then(res => setCourses(res.slice(0, 3)))
      .catch(() => setCourses([]))
      .finally(() => setLoading(false));
  }, []);

  return (
    <section className="bg-mist px-gutter py-section-spacing-mobile md:px-gutter-lg md:py-section-spacing">
      <div className="mx-auto flex max-w-shell flex-col gap-block">
        <div className="grid grid-cols-1 items-start gap-block md:grid-cols-2">
          <div className="flex flex-col gap-stack">
            <h2
              data-text-id="components.Home.FeaturedCourses.heading"
              className="font-heading leading-tight text-ink"
              style={{ fontSize: "clamp(28px, 3.4vw, 48px)" }}
            >
              {t("components.Home.FeaturedCourses.heading")}
            </h2>
            <Link
              to="/courses"
              className="group inline-flex w-fit items-center gap-tight rounded-pill bg-ink py-2 pl-block pr-2 text-sm text-ink-foreground transition-all duration-base hover:scale-hover active:scale-active"
            >
              <span data-text-id="components.Home.FeaturedCourses.cta">{t("components.Home.FeaturedCourses.cta")}</span>
              <span className="flex h-8 w-8 items-center justify-center rounded-pill bg-background">
                <ArrowRight size={16} className="text-ink" aria-hidden="true" />
              </span>
            </Link>
          </div>
          <p data-text-id="components.Home.FeaturedCourses.paragraph" className="text-lg text-slate md:text-xl">
            {t("components.Home.FeaturedCourses.paragraph")}
          </p>
        </div>

        {loading ? (
          <div className="grid grid-cols-1 gap-stack sm:grid-cols-2 lg:grid-cols-3">
            {[0, 1, 2].map(index => (
              <div key={index} className="h-72 animate-pulse rounded-card bg-background" />
            ))}
          </div>
        ) : courses.length === 0 ? (
          <p data-text-id="components.Home.FeaturedCourses.empty" className="rounded-card bg-background px-block py-block text-sm text-slate">
            {t("components.Home.FeaturedCourses.empty")}
          </p>
        ) : (
          <div className="grid grid-cols-1 items-start gap-stack sm:grid-cols-2 lg:grid-cols-3">
            {courses.map((course, index) => {
              const src = course.thumbnail_url || images["courses.hero"];
              return (
                <motion.article
                  key={course.id}
                  initial={{ opacity: 0.001, y: 24 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true, amount: 0.25 }}
                  transition={{ duration: 0.6, delay: index * 0.08, ease: [0.22, 1, 0.36, 1] }}
                  className="card-lift flex flex-col overflow-hidden rounded-card bg-background transition-transform duration-base hover:-translate-y-hover-lift"
                >
                  <Link to={`/courses/${course.id}`} className="aspect-[4/3] w-full overflow-hidden">
                    <img
                      src={src}
                      alt={course.title}
                      onError={event => {
                        event.currentTarget.onerror = null;
                        event.currentTarget.src = images["courses.hero"];
                      }}
                      className="h-full w-full object-cover"
                    />
                  </Link>
                  <div className="flex flex-1 flex-col gap-tight px-stack py-stack">
                    <span className="text-xs uppercase tracking-widest text-accent">{course.categories?.name ?? ""}</span>
                    <Link to={`/courses/${course.id}`}>
                      <h3 className="line-clamp-2 font-heading text-lg text-ink">{course.title}</h3>
                    </Link>
                    <p className="line-clamp-2 text-sm text-slate sm:line-clamp-3">{course.description}</p>
                    <div className="flex items-center gap-block pt-tight text-xs text-slate">
                      <span className="inline-flex items-center gap-1">
                        <BookOpen size={14} aria-hidden="true" />
                        <span>{lessonCount(course)}</span>
                        <span data-text-id="components.Home.FeaturedCourses.lessons">{t("components.Home.FeaturedCourses.lessons")}</span>
                      </span>
                    </div>
                  </div>
                </motion.article>
              );
            })}
          </div>
        )}
      </div>
    </section>
  );
}
