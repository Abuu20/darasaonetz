import { motion } from "motion/react";
import { ShieldCheck } from "lucide-react";
import { useLanguage } from "@/context/LanguageContext";
import images from "@/assets/images.json";

const NEGATIVES = [
  { id: "scattered", key: "components.Home.FreedomSection.negative1" },
  { id: "lost-files", key: "components.Home.FreedomSection.negative2" },
  { id: "no-feedback", key: "components.Home.FreedomSection.negative3" },
  { id: "language", key: "components.Home.FreedomSection.negative4" },
  { id: "no-progress", key: "components.Home.FreedomSection.negative5" },
] as const;

const POSITIVES = [
  { id: "one-place", key: "components.Home.FreedomSection.positive1" },
  { id: "library", key: "components.Home.FreedomSection.positive2" },
  { id: "quiz", key: "components.Home.FreedomSection.positive3" },
  { id: "bilingual", key: "components.Home.FreedomSection.positive4" },
  { id: "path", key: "components.Home.FreedomSection.positive5" },
] as const;

export default function FreedomSection() {
  const { t } = useLanguage();

  return (
    <section className="flex flex-col items-center gap-block bg-background px-gutter py-section-spacing-mobile md:px-gutter-lg md:py-section-spacing">
      <motion.div
        initial={{ opacity: 0.001, y: 24 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true, amount: 0.3 }}
        transition={{ duration: 0.7, ease: [0.22, 1, 0.36, 1] }}
        className="flex flex-col items-center gap-stack text-center"
      >
        <span className="inline-flex items-center gap-tight rounded-pill bg-mist px-stack py-tight text-sm text-ink">
          <ShieldCheck size={18} className="text-accent" aria-hidden="true" />
          <span data-text-id="components.Home.FreedomSection.chip">{t("components.Home.FreedomSection.chip")}</span>
        </span>
        <h2 className="font-heading leading-tight text-ink" style={{ fontSize: "clamp(32px, 4vw, 56px)" }}>
          <span data-text-id="components.Home.FreedomSection.headingA">{t("components.Home.FreedomSection.headingA")}</span>
          <br />
          <span data-text-id="components.Home.FreedomSection.headingB" className="text-gradient-head">
            {t("components.Home.FreedomSection.headingB")}
          </span>
        </h2>
      </motion.div>

      <div className="grid w-full max-w-shell grid-cols-1 items-start gap-stack lg:grid-cols-[1fr_auto_1fr] lg:gap-block">
        <div className="flex flex-col gap-tight">
          {NEGATIVES.map(item => (
            <div key={item.id} className="card-lift flex items-start gap-tight rounded-panel bg-background px-stack py-tight">
              <img src={images["icons.cross"]} data-image-id="icons.cross" alt="" aria-hidden="true" className="mt-0.5 h-5 w-5" />
              <p data-text-id={item.key} className="text-sm text-slate">
                {t(item.key)}
              </p>
            </div>
          ))}
        </div>

        <div className="order-first mx-auto overflow-hidden rounded-pill lg:order-none" style={{ width: "clamp(200px, 22vw, 400px)", height: "clamp(200px, 22vw, 400px)" }}>
          <img
            src={images["freedom.circle"]}
            data-image-id="freedom.circle"
            alt={t("components.Home.FreedomSection.mediaAlt")}
            className="h-full w-full object-cover"
          />
        </div>

        <div className="flex flex-col gap-tight">
          {POSITIVES.map(item => (
            <div key={item.id} className="card-lift flex items-start gap-tight rounded-panel bg-background px-stack py-tight">
              <img src={images["icons.check"]} data-image-id="icons.check" alt="" aria-hidden="true" className="mt-0.5 h-5 w-5" />
              <p data-text-id={item.key} className="text-sm text-ink">
                {t(item.key)}
              </p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
