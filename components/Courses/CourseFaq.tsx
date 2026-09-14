import { useState } from "react";
import { motion } from "motion/react";
import { ChevronDown } from "lucide-react";
import { useLanguage } from "@/context/LanguageContext";

const CATEGORIES = [
  { id: "general", labelKey: "components.Courses.CourseFaq.catGeneral" },
  { id: "study", labelKey: "components.Courses.CourseFaq.catStudy" },
  { id: "teaching", labelKey: "components.Courses.CourseFaq.catTeaching" },
] as const;

const FAQS = {
  general: [
    { id: "g1", qKey: "components.Courses.CourseFaq.g1.q", aKey: "components.Courses.CourseFaq.g1.a" },
    { id: "g2", qKey: "components.Courses.CourseFaq.g2.q", aKey: "components.Courses.CourseFaq.g2.a" },
    { id: "g3", qKey: "components.Courses.CourseFaq.g3.q", aKey: "components.Courses.CourseFaq.g3.a" },
    { id: "g4", qKey: "components.Courses.CourseFaq.g4.q", aKey: "components.Courses.CourseFaq.g4.a" },
  ],
  study: [
    { id: "s1", qKey: "components.Courses.CourseFaq.s1.q", aKey: "components.Courses.CourseFaq.s1.a" },
    { id: "s2", qKey: "components.Courses.CourseFaq.s2.q", aKey: "components.Courses.CourseFaq.s2.a" },
    { id: "s3", qKey: "components.Courses.CourseFaq.s3.q", aKey: "components.Courses.CourseFaq.s3.a" },
    { id: "s4", qKey: "components.Courses.CourseFaq.s4.q", aKey: "components.Courses.CourseFaq.s4.a" },
  ],
  teaching: [
    { id: "t1", qKey: "components.Courses.CourseFaq.t1.q", aKey: "components.Courses.CourseFaq.t1.a" },
    { id: "t2", qKey: "components.Courses.CourseFaq.t2.q", aKey: "components.Courses.CourseFaq.t2.a" },
    { id: "t3", qKey: "components.Courses.CourseFaq.t3.q", aKey: "components.Courses.CourseFaq.t3.a" },
    { id: "t4", qKey: "components.Courses.CourseFaq.t4.q", aKey: "components.Courses.CourseFaq.t4.a" },
  ],
} as const;

export default function CourseFaq() {
  const { t } = useLanguage();
  const [active, setActive] = useState<keyof typeof FAQS>("general");
  const [open, setOpen] = useState<string | null>(null);
  const contactEmail = import.meta.env.VITE_WEBSITE_CONTACT_EMAIL as string | undefined;

  return (
    <section id="faq" className="bg-night px-gutter py-section-spacing-mobile text-night-foreground md:px-gutter-lg md:py-section-spacing">
      <div className="mx-auto flex max-w-shell flex-col gap-block">
        <div className="flex flex-col gap-stack lg:flex-row lg:items-end lg:justify-between">
          <div className="flex max-w-prose flex-col gap-stack">
            <span className="inline-flex w-fit items-center gap-tight rounded-pill border border-hairline px-stack py-1 text-xs text-lilac">
              <span className="h-1.5 w-1.5 rounded-pill bg-accent" aria-hidden="true" />
              <span data-text-id="components.Courses.CourseFaq.pill">{t("components.Courses.CourseFaq.pill")}</span>
            </span>
            <h2
              data-text-id="components.Courses.CourseFaq.heading"
              className="font-heading leading-tight text-night-foreground"
              style={{ fontSize: "clamp(28px, 3.2vw, 44px)" }}
            >
              {t("components.Courses.CourseFaq.heading")}
            </h2>
          </div>
          <p data-text-id="components.Courses.CourseFaq.intro" className="max-w-sm text-sm text-lilac">
            {t("components.Courses.CourseFaq.intro")}
          </p>
        </div>

        <div className="grid grid-cols-1 items-stretch gap-block lg:grid-cols-[280px_1fr]">
          <div className="flex flex-col gap-stack">
            <div className="flex flex-col gap-tight rounded-card border border-hairline p-2">
              {CATEGORIES.map(category => (
                <button
                  key={category.id}
                  type="button"
                  onClick={() => {
                    setActive(category.id);
                    setOpen(null);
                  }}
                  aria-pressed={active === category.id}
                  className={`w-full rounded-pill border px-stack py-tight text-sm transition-colors duration-base ${
                    active === category.id
                      ? "border-hairline bg-panel text-night-foreground"
                      : "border-transparent text-lilac hover:text-night-foreground"
                  }`}
                >
                  <span data-text-id={category.labelKey}>{t(category.labelKey)}</span>
                </button>
              ))}
            </div>

            <div className="rounded-card border border-hairline bg-panel p-block">
              <h3 data-text-id="components.Courses.CourseFaq.helpTitle" className="font-heading text-lg text-night-foreground">
                {t("components.Courses.CourseFaq.helpTitle")}
              </h3>
              <p data-text-id="components.Courses.CourseFaq.helpBody" className="mt-tight text-sm text-lilac">
                {t("components.Courses.CourseFaq.helpBody")}
              </p>
              {contactEmail ? (
                <a
                  href={`mailto:${contactEmail}`}
                  className="mt-stack inline-flex items-center gap-1 text-sm text-night-foreground transition-opacity duration-base hover:opacity-80"
                >
                  <span data-text-id="components.Courses.CourseFaq.helpCta">{t("components.Courses.CourseFaq.helpCta")}</span>
                  <span aria-hidden="true">&rarr;</span>
                </a>
              ) : null}
            </div>
          </div>

          <div className="flex flex-col gap-tight rounded-card border border-hairline p-2">
            {FAQS[active].map((item, index) => {
              const isOpen = open === item.id;
              return (
                <motion.div
                  key={`${active}-${item.id}`}
                  initial={{ opacity: 0.001, y: 16 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true, amount: 0.3 }}
                  transition={{ duration: 0.5, delay: index * 0.06, ease: [0.22, 1, 0.36, 1] }}
                  className={`rounded-panel border border-hairline px-stack transition-colors duration-base ${
                    isOpen ? "bg-panel" : "bg-panel/60"
                  }`}
                >
                  <button
                    type="button"
                    onClick={() => setOpen(isOpen ? null : item.id)}
                    aria-expanded={isOpen}
                    className="flex w-full items-center justify-between gap-stack py-stack text-left"
                  >
                    <span data-text-id={item.qKey} className="flex-1 text-sm text-night-foreground md:text-base">
                      {t(item.qKey)}
                    </span>
                    <span
                      className={`flex h-7 w-7 shrink-0 items-center justify-center rounded-pill border border-hairline text-lilac transition-transform duration-base ${
                        isOpen ? "rotate-180" : "rotate-0"
                      }`}
                    >
                      <ChevronDown size={16} aria-hidden="true" />
                    </span>
                  </button>
                  {isOpen ? (
                    <p data-text-id={item.aKey} className="pb-stack text-sm text-lilac">
                      {t(item.aKey)}
                    </p>
                  ) : null}
                </motion.div>
              );
            })}
          </div>
        </div>
      </div>
    </section>
  );
}
