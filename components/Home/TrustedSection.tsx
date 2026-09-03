import { motion } from "motion/react";
import { useLanguage } from "@/context/LanguageContext";
import ServiceCard from "@/components/Home/ServiceCard";
import images from "@/assets/images.json";

const CARDS = [
  {
    id: "materials",
    dots: 0,
    labelKey: "components.Home.TrustedSection.card1.label",
    titleKey: "components.Home.TrustedSection.card1.title",
    bulletKeys: [
      "components.Home.TrustedSection.card1.bullet1",
      "components.Home.TrustedSection.card1.bullet2",
    ],
  },
  {
    id: "quizzes",
    dots: 1,
    labelKey: "components.Home.TrustedSection.card2.label",
    titleKey: "components.Home.TrustedSection.card2.title",
    bulletKeys: [
      "components.Home.TrustedSection.card2.bullet1",
      "components.Home.TrustedSection.card2.bullet2",
    ],
  },
  {
    id: "discussion",
    dots: 2,
    labelKey: "components.Home.TrustedSection.card3.label",
    titleKey: "components.Home.TrustedSection.card3.title",
    bulletKeys: [
      "components.Home.TrustedSection.card3.bullet1",
      "components.Home.TrustedSection.card3.bullet2",
    ],
  },
  {
    id: "progress",
    dots: 3,
    labelKey: "components.Home.TrustedSection.card4.label",
    titleKey: "components.Home.TrustedSection.card4.title",
    bulletKeys: [
      "components.Home.TrustedSection.card4.bullet1",
      "components.Home.TrustedSection.card4.bullet2",
    ],
  },
] as const;

export default function TrustedSection() {
  const { t } = useLanguage();

  return (
    <section
      id="platform"
      className="relative flex flex-col items-center gap-block overflow-hidden px-gutter py-section-spacing-mobile md:px-gutter-lg md:py-section-spacing"
      style={{
        backgroundImage: `url(${images["trusted.background"]})`,
        backgroundSize: "cover",
        backgroundPosition: "center",
      }}
    >
      <motion.div
        initial={{ opacity: 0.001, y: 24 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true, amount: 0.3 }}
        transition={{ duration: 0.7, ease: [0.22, 1, 0.36, 1] }}
        className="flex max-w-shell flex-col items-center gap-stack text-center"
      >
        <h2
          className="font-heading leading-tight text-night-foreground"
          style={{ fontSize: "clamp(32px, 4vw, 56px)" }}
        >
          <span data-text-id="components.Home.TrustedSection.headingA">{t("components.Home.TrustedSection.headingA")}</span>
          <br />
          <span data-text-id="components.Home.TrustedSection.headingB" className="text-gradient-head">
            {t("components.Home.TrustedSection.headingB")}
          </span>
        </h2>
        <p data-text-id="components.Home.TrustedSection.paragraph" className="max-w-prose text-lilac">
          {t("components.Home.TrustedSection.paragraph")}
        </p>
      </motion.div>

      <div className="grid w-full max-w-shell grid-cols-1 gap-stack sm:grid-cols-2 lg:grid-cols-4">
        {CARDS.map(card => (
          <ServiceCard
            key={card.id}
            dots={card.dots}
            labelKey={card.labelKey}
            titleKey={card.titleKey}
            bulletKeys={card.bulletKeys}
          />
        ))}
      </div>
    </section>
  );
}
