import { motion } from "motion/react";
import SEOHead from "@/components/seo/SEOHead";
import { useLanguage } from "@/context/LanguageContext";
import CourseGrid from "@/components/Courses/CourseGrid";
import CourseFaq from "@/components/Courses/CourseFaq";
import images from "@/assets/images.json";

export default function Courses() {
  const { t } = useLanguage();

  return (
    <>
      <SEOHead titleKey={t("pages.Courses.seo.title")} descriptionKey={t("pages.Courses.seo.description")} />
      <main>
        <section className="relative flex min-h-[70vh] items-end overflow-hidden px-gutter pb-block pt-section-spacing-mobile md:px-gutter-lg md:pt-section-spacing">
          <img
            src={images["courses.hero"]}
            data-image-id="courses.hero"
            alt=""
            aria-hidden="true"
            className="absolute inset-0 h-full w-full object-cover"
          />
          <div className="absolute inset-0 bg-night/70" />
          <motion.div
            initial={{ opacity: 0.001, y: 24 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, ease: [0.22, 1, 0.36, 1] }}
            className="relative mx-auto flex w-full max-w-shell flex-col gap-stack"
          >
            <span data-text-id="pages.Courses.eyebrow" className="text-gradient-head text-sm uppercase tracking-widest">
              {t("pages.Courses.eyebrow")}
            </span>
            <h1
              data-text-id="pages.Courses.title"
              className="max-w-3xl font-heading leading-tight text-night-foreground"
              style={{ fontSize: "clamp(32px, 4vw, 56px)" }}
            >
              {t("pages.Courses.title")}
            </h1>
            <p data-text-id="pages.Courses.paragraph" className="max-w-prose text-lavender">
              {t("pages.Courses.paragraph")}
            </p>
          </motion.div>
        </section>

        <CourseGrid />
        <CourseFaq />
      </main>
    </>
  );
}
