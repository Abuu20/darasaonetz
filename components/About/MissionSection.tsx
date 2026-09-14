import { motion } from "motion/react";
import { Link } from "react-router-dom";
import { ArrowRight } from "lucide-react";
import { useLanguage } from "@/context/LanguageContext";
import images from "@/assets/images.json";

export default function MissionSection() {
  const { t } = useLanguage();

  return (
    <section className="overflow-hidden bg-background px-gutter py-section-spacing-mobile md:px-gutter-lg md:py-section-spacing">
      <div className="mx-auto max-w-shell">
        <div className="mb-stack flex items-center gap-tight">
          <span className="flex h-7 w-7 items-center justify-center rounded-pill bg-ink text-xs text-ink-foreground">1</span>
          <span data-text-id="components.About.MissionSection.badge" className="rounded-pill text-sm text-slate">
            {t("components.About.MissionSection.badge")}
          </span>
        </div>

        <motion.h2
          initial={{ opacity: 0.001, y: 24 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, amount: 0.3 }}
          transition={{ duration: 0.7, ease: [0.22, 1, 0.36, 1] }}
          data-text-id="components.About.MissionSection.heading"
          className="mb-block max-w-3xl font-heading leading-tight text-ink"
          style={{ fontSize: "clamp(24px, 4vw, 51px)" }}
        >
          {t("components.About.MissionSection.heading")}
        </motion.h2>

        <div className="grid grid-cols-1 items-end gap-stack lg:grid-cols-[26%_1fr_44%] lg:gap-block">
          <div className="self-end">
            <img
              src={images["about.small"]}
              data-image-id="about.small"
              alt={t("components.About.MissionSection.smallAlt")}
              className="aspect-[438/346] w-full rounded-card object-cover"
            />
          </div>

          <div className="flex flex-col gap-stack self-start">
            <p data-text-id="components.About.MissionSection.paragraph" className="text-base leading-relaxed text-ink md:text-lg">
              {t("components.About.MissionSection.paragraph")}
            </p>
            <Link
              to="/courses"
              className="group inline-flex w-fit items-center gap-tight rounded-pill bg-ember py-2 pl-block pr-2 text-sm text-ember-foreground transition-all duration-base hover:scale-hover active:scale-active"
            >
              <span data-text-id="components.About.MissionSection.cta">{t("components.About.MissionSection.cta")}</span>
              <span className="flex h-8 w-8 items-center justify-center rounded-pill bg-background">
                <ArrowRight size={16} className="text-ember -rotate-45 transition-transform duration-slow group-hover:rotate-0" aria-hidden="true" />
              </span>
            </Link>
          </div>

          <div className="self-end">
            <img
              src={images["about.large"]}
              data-image-id="about.large"
              alt={t("components.About.MissionSection.largeAlt")}
              className="aspect-[3/2] w-full rounded-card object-cover"
            />
          </div>
        </div>
      </div>
    </section>
  );
}
