import SEOHead from "@/components/seo/SEOHead";
import { useLanguage } from "@/context/LanguageContext";
import ToolCard from "@/components/tools/ToolCard";
import IslamicPatternBg from "@/components/tools/IslamicPatternBg";

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
    {
      to: "https://abuu20.github.io/pathway-to-arabic/",
      emoji: "/icons/tools/arabic-learning.png",
      gradientClassName: "gradient-head",
      title: "Learn Arabic",
      description: "A self-study pathway to classical and Quranic Arabic, from your first letters to reading unaided.",
    },
    {
      to: "https://abuu20.github.io/hadiths/",
      emoji: "/icons/tools/quran.png",
      gradientClassName: "gradient-brand",
      title: "Hadiths",
      description: "Search and read hadiths in multiple languages and grades, from all the major collections.",
    },
  ] as const;

  return (
    <>
      <SEOHead titleKey={t("pages.tools.IslamicTools.seo.title")} descriptionKey={t("pages.tools.IslamicTools.seo.description")} />
      <main className="pt-block">
        {/* Hero */}
        <section className="relative overflow-hidden">
          <IslamicPatternBg />
          <div className="relative mx-auto max-w-shell px-gutter pb-block pt-section-spacing-mobile text-center md:px-gutter-lg md:pt-section-spacing">
            <span
              data-text-id="pages.tools.IslamicTools.eyebrow"
              className="inline-flex items-center gap-2 rounded-pill border border-line bg-mist px-4 py-1.5 text-sm uppercase tracking-widest text-gradient-head"
            >
              {t("pages.tools.IslamicTools.eyebrow")}
            </span>
            <h1
              data-text-id="pages.tools.IslamicTools.title"
              className="mt-5 font-heading text-4xl leading-tight text-ink md:text-6xl"
            >
              {t("pages.tools.IslamicTools.title")}
            </h1>
            <p
              data-text-id="pages.tools.IslamicTools.paragraph"
              className="mx-auto mt-4 max-w-prose text-lg text-ink/70"
            >
              {t("pages.tools.IslamicTools.paragraph")}
            </p>

            <div className="mx-auto mt-8 flex max-w-xs flex-col gap-3 sm:max-w-none sm:flex-row sm:justify-center">
              <a
                href="#tools-grid"
                className="card-lift gradient-brand rounded-pill px-7 py-3 text-sm font-medium text-primary-foreground transition-transform duration-base hover:scale-hover active:scale-active"
              >
                Browse all tools
              </a>
              <a
                href="/tools"
                className="rounded-pill border border-line px-7 py-3 text-sm font-medium text-ink transition-colors duration-base hover:bg-mist"
              >
                Back to all categories
              </a>
            </div>
          </div>
        </section>

        {/* Tool grid */}
        <section id="tools-grid" className="scroll-mt-block bg-background px-gutter pb-section-spacing-mobile md:px-gutter-lg md:pb-section-spacing">
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
