import SEOHead from "@/components/seo/SEOHead";
import { useLanguage } from "@/context/LanguageContext";
import ToolCard from "@/components/tools/ToolCard";

export default function IslamicTools() {
  const { t } = useLanguage();

  // 3D Islamic emoji, bundled locally at /public/icons/tools (Microsoft's
  // open-source Fluent Emoji 3D set — see that folder's README for
  // licensing) — one clear, literal match per tool rather than a generic
  // icon: an open book for reading, a mosque for prayer, a compass for
  // qibla direction, prayer beads for tasbih, a crescent moon for Ramadan.
  const tools = [
    {
      to: "/tools/quran",
      emoji: "/icons/tools/quran.png",
      gradientClassName: "gradient-brand",
      title: t("pages.tools.IslamicTools.quran.title"),
      description: t("pages.tools.IslamicTools.quran.description"),
    },
    {
      to: "/tools/prayer-times",
      emoji: "/icons/tools/prayer-times.png",
      gradientClassName: "gradient-head",
      title: t("pages.tools.IslamicTools.prayerTimes.title"),
      description: t("pages.tools.IslamicTools.prayerTimes.description"),
    },
    {
      to: "/tools/qibla",
      emoji: "/icons/tools/qibla.png",
      gradientClassName: "gradient-brand",
      title: t("pages.tools.IslamicTools.qibla.title"),
      description: t("pages.tools.IslamicTools.qibla.description"),
    },
    {
      to: "/tools/tasbih",
      emoji: "/icons/tools/tasbih.png",
      gradientClassName: "gradient-head",
      title: t("pages.tools.IslamicTools.tasbih.title"),
      description: t("pages.tools.IslamicTools.tasbih.description"),
    },
    {
      to: "/tools/ramadan",
      emoji: "/icons/tools/ramadan.png",
      gradientClassName: "gradient-brand",
      title: t("pages.tools.IslamicTools.ramadan.title"),
      description: t("pages.tools.IslamicTools.ramadan.description"),
    },
  ] as const;

  return (
    <>
      <SEOHead titleKey={t("pages.tools.IslamicTools.seo.title")} descriptionKey={t("pages.tools.IslamicTools.seo.description")} />
      <main className="pt-block">
        <section className="mx-auto max-w-shell px-gutter pb-block pt-section-spacing-mobile text-center md:px-gutter-lg md:pt-section-spacing">
          <span data-text-id="pages.tools.IslamicTools.eyebrow" className="text-gradient-head text-sm uppercase tracking-widest">
            {t("pages.tools.IslamicTools.eyebrow")}
          </span>
          <h1 data-text-id="pages.tools.IslamicTools.title" className="mt-2 font-heading text-3xl text-ink md:text-4xl">
            {t("pages.tools.IslamicTools.title")}
          </h1>
          <p data-text-id="pages.tools.IslamicTools.paragraph" className="mx-auto mt-2 max-w-prose text-ink/70">
            {t("pages.tools.IslamicTools.paragraph")}
          </p>
        </section>

        <section className="bg-background px-gutter pb-section-spacing-mobile md:px-gutter-lg md:pb-section-spacing">
          <div className="mx-auto grid max-w-shell grid-cols-1 gap-stack sm:grid-cols-2 lg:grid-cols-4">
            {tools.map(tool => (
              <ToolCard
                key={tool.to}
                to={tool.to}
                emoji={tool.emoji}
                gradientClassName={tool.gradientClassName}
                title={tool.title}
                description={tool.description}
              />
            ))}
          </div>
          <p className="mx-auto mt-block max-w-prose text-center text-xs text-slate">
            {t("pages.tools.IslamicTools.attribution")}
          </p>
        </section>
      </main>
    </>
  );
}
