import { motion } from "motion/react";
import { Compass } from "lucide-react";
import { useLanguage } from "@/context/LanguageContext";
import images from "@/assets/images.json";

const PILLARS = [
  {
    id: "enroll",
    labelKey: "components.Home.PrecisionSection.pillar1.label",
    left: "2.8vw",
    bottom: "7vw",
    itemKeys: [
      "components.Home.PrecisionSection.pillar1.item1",
      "components.Home.PrecisionSection.pillar1.item2",
      "components.Home.PrecisionSection.pillar1.item3",
      "components.Home.PrecisionSection.pillar1.item4",
    ],
  },
  {
    id: "study",
    labelKey: "components.Home.PrecisionSection.pillar2.label",
    left: "22.4vw",
    bottom: "9.08vw",
    itemKeys: [
      "components.Home.PrecisionSection.pillar2.item1",
      "components.Home.PrecisionSection.pillar2.item2",
      "components.Home.PrecisionSection.pillar2.item3",
      "components.Home.PrecisionSection.pillar2.item4",
    ],
  },
  {
    id: "assess",
    labelKey: "components.Home.PrecisionSection.pillar3.label",
    left: "41.2vw",
    bottom: "11.16vw",
    itemKeys: [
      "components.Home.PrecisionSection.pillar3.item1",
      "components.Home.PrecisionSection.pillar3.item2",
      "components.Home.PrecisionSection.pillar3.item3",
      "components.Home.PrecisionSection.pillar3.item4",
    ],
  },
  {
    id: "advance",
    labelKey: "components.Home.PrecisionSection.pillar4.label",
    left: "61.1vw",
    bottom: "13.24vw",
    itemKeys: [
      "components.Home.PrecisionSection.pillar4.item1",
      "components.Home.PrecisionSection.pillar4.item2",
      "components.Home.PrecisionSection.pillar4.item3",
      "components.Home.PrecisionSection.pillar4.item4",
    ],
  },
] as const;

export default function PrecisionSection() {
  const { t } = useLanguage();

  return (
    <section
      className="flex flex-col items-center gap-block px-gutter py-section-spacing-mobile text-center md:px-gutter-lg md:py-section-spacing"
      style={{
        backgroundImage: `url(${images["pillars.background"]})`,
        backgroundSize: "cover",
        backgroundPosition: "center",
        backgroundRepeat: "no-repeat",
      }}
    >
      <motion.div
        initial={{ opacity: 0.001, y: 24 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true, amount: 0.3 }}
        transition={{ duration: 0.7, ease: [0.22, 1, 0.36, 1] }}
        className="flex flex-col items-center gap-stack"
      >
        <span className="inline-flex items-center gap-tight rounded-pill bg-mist px-stack py-tight text-sm text-ink">
          <Compass size={18} className="text-accent" aria-hidden="true" />
          <span data-text-id="components.Home.PrecisionSection.chip">{t("components.Home.PrecisionSection.chip")}</span>
        </span>
        <h2 className="max-w-shell font-heading leading-tight text-ink" style={{ fontSize: "clamp(28px, 4vw, 56px)" }}>
          <span data-text-id="components.Home.PrecisionSection.headingA" className="block">
            {t("components.Home.PrecisionSection.headingA")}
          </span>
          <span data-text-id="components.Home.PrecisionSection.headingB" className="text-gradient-head block">
            {t("components.Home.PrecisionSection.headingB")}
          </span>
        </h2>
        <p data-text-id="components.Home.PrecisionSection.paragraph" className="max-w-prose text-lavender">
          {t("components.Home.PrecisionSection.paragraph")}
        </p>
      </motion.div>

      <div className="relative hidden w-full text-ink sm:block" style={{ maxWidth: "82.292vw", height: "31.94vw" }}>
        {PILLARS.map(pillar => (
          <div
            key={pillar.id}
            className="absolute flex flex-col items-center"
            style={{ left: pillar.left, bottom: pillar.bottom }}
          >
            <span
              className="flex items-center gap-tight rounded-panel text-sm text-ink"
              style={{
                backgroundImage: "linear-gradient(135deg, #FFFFFF, rgba(255,255,255,0.6))",
                padding: "0.972vw 1.736vw",
              }}
            >
              <img src={images["logo"]} data-image-id="logo" alt="" aria-hidden="true" style={{ width: "1.111vw", minWidth: "14px" }} />
              <span data-text-id={pillar.labelKey}>{t(pillar.labelKey)}</span>
            </span>
            <div className="relative w-px gradient-rail" style={{ height: "14.24vw" }}>
              <div className="absolute flex flex-col items-start gap-1" style={{ top: "0.56vw", left: "1.94vw" }}>
                {pillar.itemKeys.map(key => (
                  <span key={key} data-text-id={key} className="whitespace-nowrap text-left text-xs text-slate">
                    {t(key)}
                  </span>
                ))}
              </div>
            </div>
          </div>
        ))}
      </div>

      <div className="flex w-full flex-col gap-block sm:hidden">
        {PILLARS.map((pillar, index) => {
          const right = index % 2 === 1;
          return (
            <div key={pillar.id} className={`flex flex-col ${right ? "items-end" : "items-start"}`}>
              <span
                className="flex items-center gap-tight rounded-panel px-stack py-tight text-sm text-ink"
                style={{ backgroundImage: "linear-gradient(135deg, #FFFFFF, rgba(255,255,255,0.6))" }}
              >
                <img src={images["logo"]} data-image-id="logo" alt="" aria-hidden="true" className="h-4 w-4" />
                <span data-text-id={pillar.labelKey}>{t(pillar.labelKey)}</span>
              </span>
              <div className={`flex gap-stack ${right ? "flex-row-reverse" : "flex-row"}`}>
                <div className="w-px gradient-rail" style={{ minHeight: "120px" }} />
                <div className={`flex flex-col gap-1 py-tight ${right ? "items-end" : "items-start"}`}>
                  {pillar.itemKeys.map(key => (
                    <span key={key} data-text-id={key} className="text-sm text-slate">
                      {t(key)}
                    </span>
                  ))}
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </section>
  );
}
